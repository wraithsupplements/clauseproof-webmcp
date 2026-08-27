import type { AuditEvent, EvidenceSource } from "../domain/types";

const apiBase = (import.meta.env.VITE_XANO_API_BASE as string | undefined)?.replace(/\/$/u, "") ?? "";

function sessionId() {
  if (typeof sessionStorage === "undefined") return "non-browser-session";
  const existing = sessionStorage.getItem("clauseproof-session-id");
  if (existing) return existing;
  const created = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `session-${Date.now()}`;
  sessionStorage.setItem("clauseproof-session-id", created);
  return created;
}

async function xanoRequest<T>(path: string, init?: RequestInit): Promise<T> {
  if (!apiBase) throw new Error("The live Xano backend is not configured in this deployment.");
  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Xano request failed (${response.status}): ${detail.slice(0, 240)}`);
  }
  return response.json() as Promise<T>;
}

export function isXanoConfigured() {
  return Boolean(apiBase);
}

export async function ensureDemoCase() {
  if (!apiBase) return { configured: false as const };
  const result = await xanoRequest<{ case_key: string; created: boolean; synthetic_only: true }>("/demo/bootstrap", {
    method: "POST",
    body: "{}",
  });
  return { configured: true as const, ...result };
}

export async function recordAuditReceipt(caseKey: string, event: AuditEvent) {
  if (!apiBase) return { recorded: false, reason: "not-configured" as const };
  return xanoRequest<{ receipt_id: number; recorded: true }>("/audit", {
    method: "POST",
    body: JSON.stringify({
      case_key: caseKey,
      session_id: sessionId(),
      actor: event.actor,
      action: event.action,
      outcome: event.outcome,
      detail: event.detail,
    }),
  });
}

type SerpResult = {
  receipt_id: number;
  checked_at: string | number;
  result: {
    organic_results?: Array<{
      title?: string;
      link?: string;
      source?: string;
      displayed_link?: string;
      snippet?: string;
    }>;
  };
};

export async function fetchCounterpartyEvidence(caseKey: string): Promise<{ receiptId: number; sources: EvidenceSource[] }> {
  const payload = await xanoRequest<SerpResult>(`/case/${encodeURIComponent(caseKey)}/counterparty-evidence`);
  const checkedAt = typeof payload.checked_at === "string"
    ? payload.checked_at
    : new Date(payload.checked_at).toISOString();
  const sources = (payload.result.organic_results ?? []).slice(0, 5).flatMap((result, index): EvidenceSource[] => {
    if (!result.title || !result.link) return [];
    return [{
      id: `serpapi-${payload.receipt_id}-${index + 1}`,
      title: result.title,
      url: result.link,
      publisher: result.source ?? result.displayed_link ?? "Web result",
      checkedAt,
      supports: result.snippet ?? "Live counterparty search result",
    }];
  });
  return { receiptId: payload.receipt_id, sources };
}
