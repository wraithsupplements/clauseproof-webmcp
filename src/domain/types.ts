export type Severity = "critical" | "high" | "medium" | "low";
export type FindingStatus = "open" | "accepted" | "resolved";
export type DecisionStatus = "review" | "approved" | "signature-ready" | "signed";

export type EvidenceSource = {
  id: string;
  title: string;
  url: string;
  publisher: string;
  checkedAt: string;
  supports: string;
};

export type Finding = {
  id: string;
  severity: Severity;
  title: string;
  clause: string;
  explanation: string;
  recommendation: string;
  evidenceIds: string[];
  status: FindingStatus;
};

export type Clause = {
  id: string;
  label: string;
  value: string;
  sourceText: string;
  confidence: number;
};

export type AuditEvent = {
  id: string;
  at: string;
  actor: "human" | "agent" | "system" | "integration";
  action: string;
  outcome: "completed" | "blocked" | "proposed";
  detail: string;
};

export type ProofCase = {
  id: string;
  title: string;
  counterparty: string;
  owner: string;
  documentName: string;
  documentText: string;
  updatedAt: string;
  status: DecisionStatus;
  clauses: Clause[];
  findings: Finding[];
  evidence: EvidenceSource[];
  audit: AuditEvent[];
  approvalNote: string | null;
  signaturePacketId: string | null;
};

export type CaseSummary = {
  id: string;
  title: string;
  counterparty: string;
  status: DecisionStatus;
  openRiskCount: number;
  criticalRiskCount: number;
  evidenceCount: number;
  lastAuditEvent: AuditEvent | null;
};

