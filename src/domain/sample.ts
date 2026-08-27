import { extractClauses, generateFindings } from "./analyze";
import type { ProofCase } from "./types";

export const sampleDocument = `
SERVICES AGREEMENT

This Services Agreement is entered into between Atlas Robotics LLC (Customer) and Northstar Components Inc. (Provider).

1. TERM. The initial term is 24 months. This Agreement automatically renews for successive 12 month periods unless Customer gives written notice at least 90 days before the current term ends.

2. SERVICES AND EXCLUSIVITY. Provider will supply the components listed in Exhibit A. Customer grants Provider exclusive status for all automation components purchased in North America during the term.

3. FEES. Provider will invoice monthly. Payment is due within Net 15 days. Late balances accrue interest at 1.5% per month.

4. TERMINATION. Either party may terminate for material breach if the breach remains uncured for 45 days after written notice.

5. LIABILITY. Provider's total liability will not exceed the fees paid during the twelve months preceding the claim.

6. GOVERNING LAW. This Agreement is governed by the laws of Delaware.
`;

export function makeSampleCase(now = new Date("2026-08-26T16:00:00.000Z")): ProofCase {
  const clauses = extractClauses(sampleDocument);
  const findings = generateFindings(sampleDocument, clauses);
  return {
    id: "PR-260826-01",
    title: "Northstar supply agreement",
    counterparty: "Northstar Components",
    owner: "Cody Peacock",
    documentName: "Northstar_Services_Agreement.pdf",
    documentText: sampleDocument.trim(),
    updatedAt: now.toISOString(),
    status: "review",
    clauses,
    findings,
    evidence: [],
    audit: [{
      id: "audit-created",
      at: now.toISOString(),
      actor: "system",
      action: "case.created",
      outcome: "completed",
      detail: `Parsed ${clauses.length} clauses and opened ${findings.length} findings from a synthetic document.`,
    }],
    approvalNote: null,
    signaturePacketId: null,
  };
}

