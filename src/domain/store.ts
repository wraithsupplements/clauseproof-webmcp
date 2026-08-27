import { useSyncExternalStore } from "react";
import { extractClauses, generateFindings } from "./analyze";
import { makeSampleCase } from "./sample";
import { recordAuditReceipt } from "../integrations/xano";
import type { AuditEvent, CaseSummary, EvidenceSource, Finding, ProofCase } from "./types";

type Listener = () => void;

function eventId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `event-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function audit(action: string, actor: AuditEvent["actor"], outcome: AuditEvent["outcome"], detail: string): AuditEvent {
  return { id: eventId(), at: new Date().toISOString(), action, actor, outcome, detail };
}

class ClauseProofStore {
  private current: ProofCase = makeSampleCase();
  private listeners = new Set<Listener>();

  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = () => this.current;

  private set(next: ProofCase) {
    const previousEventId = this.current.audit.at(-1)?.id;
    this.current = next;
    this.listeners.forEach((listener) => listener());
    const latest = next.audit.at(-1);
    if (latest && latest.id !== previousEventId) {
      void recordAuditReceipt(next.id, latest).catch(() => undefined);
    }
  }

  reset(next = makeSampleCase()) {
    this.set(next);
  }

  summary(): CaseSummary {
    const open = this.current.findings.filter((finding) => finding.status === "open");
    return {
      id: this.current.id,
      title: this.current.title,
      counterparty: this.current.counterparty,
      status: this.current.status,
      openRiskCount: open.length,
      criticalRiskCount: open.filter((finding) => finding.severity === "critical").length,
      evidenceCount: this.current.evidence.length,
      lastAuditEvent: this.current.audit.at(-1) ?? null,
    };
  }

  replaceDocument(name: string, text: string) {
    const clauses = extractClauses(text);
    const findings = generateFindings(text, clauses);
    this.set({
      ...this.current,
      documentName: name,
      documentText: text,
      clauses,
      findings,
      status: "review",
      approvalNote: null,
      signaturePacketId: null,
      updatedAt: new Date().toISOString(),
      audit: [...this.current.audit, audit(
        "document.analyzed",
        "system",
        "completed",
        `Extracted ${clauses.length} clauses and opened ${findings.length} findings from ${name}.`,
      )],
    });
  }

  proposeResolution(findingId: string, recommendation: string) {
    const target = this.current.findings.find((finding) => finding.id === findingId);
    if (!target) throw new Error(`Finding ${findingId} does not exist.`);
    const findings = this.current.findings.map((finding): Finding => finding.id === findingId
      ? { ...finding, recommendation }
      : finding);
    this.set({
      ...this.current,
      findings,
      updatedAt: new Date().toISOString(),
      audit: [...this.current.audit, audit(
        "finding.resolution_proposed",
        "agent",
        "proposed",
        `${target.title}: ${recommendation}`,
      )],
    });
    return findings.find((finding) => finding.id === findingId)!;
  }

  setFindingStatus(findingId: string, status: Finding["status"], actor: AuditEvent["actor"] = "human") {
    const target = this.current.findings.find((finding) => finding.id === findingId);
    if (!target) throw new Error(`Finding ${findingId} does not exist.`);
    this.set({
      ...this.current,
      findings: this.current.findings.map((finding) => finding.id === findingId ? { ...finding, status } : finding),
      updatedAt: new Date().toISOString(),
      audit: [...this.current.audit, audit(
        "finding.status_changed",
        actor,
        "completed",
        `${target.title} marked ${status}.`,
      )],
    });
  }

  addEvidence(sources: EvidenceSource[], receiptId: number) {
    if (sources.length === 0) throw new Error("The live search returned no usable evidence sources.");
    const existing = new Set(this.current.evidence.map((source) => source.url));
    const additions = sources.filter((source) => !existing.has(source.url));
    this.set({
      ...this.current,
      evidence: [...this.current.evidence, ...additions],
      updatedAt: new Date().toISOString(),
      audit: [...this.current.audit, audit(
        "evidence.counterparty_checked",
        "integration",
        "completed",
        `SerpApi receipt ${receiptId} added ${additions.length} new source${additions.length === 1 ? "" : "s"}.`,
      )],
    });
  }

  approve(note: string, confirmationText: string) {
    const expected = `APPROVE ${this.current.id}`;
    if (confirmationText !== expected) {
      this.set({
        ...this.current,
        audit: [...this.current.audit, audit(
          "case.approval",
          "agent",
          "blocked",
          `Approval requires the exact confirmation text: ${expected}`,
        )],
      });
      throw new Error(`Approval requires exact confirmation text: ${expected}`);
    }
    const blocking = this.current.findings.filter((finding) => finding.status === "open" && finding.severity === "critical");
    if (blocking.length > 0) throw new Error(`Resolve or explicitly accept ${blocking.length} critical finding before approval.`);
    this.set({
      ...this.current,
      status: "approved",
      approvalNote: note,
      updatedAt: new Date().toISOString(),
      audit: [...this.current.audit, audit("case.approved", "human", "completed", note)],
    });
    return this.summary();
  }

  prepareSignaturePacket() {
    if (this.current.status !== "approved") {
      this.set({
        ...this.current,
        audit: [...this.current.audit, audit(
          "signature.packet_requested",
          "agent",
          "blocked",
          "A human approval is required before preparing a signature packet.",
        )],
      });
      throw new Error("Human approval is required before preparing a signature packet.");
    }
    const packetId = `packet-${this.current.id.toLowerCase()}-${Date.now()}`;
    this.set({
      ...this.current,
      status: "signature-ready",
      signaturePacketId: packetId,
      updatedAt: new Date().toISOString(),
      audit: [...this.current.audit, audit(
        "signature.packet_prepared",
        "integration",
        "completed",
        `Prepared ${packetId}; no signature was sent and no document was signed.`,
      )],
    });
    return { packetId, status: "signature-ready" as const, sent: false, signed: false };
  }
}

export const clauseProofStore = new ClauseProofStore();

export function useProofCase() {
  return useSyncExternalStore(clauseProofStore.subscribe, clauseProofStore.getSnapshot);
}
