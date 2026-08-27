import { describe, expect, it } from "vitest";
import { extractClauses, generateFindings } from "../src/domain/analyze";
import { sampleDocument } from "../src/domain/sample";

describe("deterministic document analysis", () => {
  it("extracts material agreement clauses", () => {
    const clauses = extractClauses(sampleDocument);
    expect(clauses.map((clause) => clause.id)).toEqual(expect.arrayContaining([
      "term", "renewal", "payment", "termination", "liability", "exclusivity", "law",
    ]));
  });

  it("opens critical and high risks from exact source language", () => {
    const findings = generateFindings(sampleDocument);
    expect(findings.some((finding) => finding.severity === "critical" && finding.id === "broad-exclusivity")).toBe(true);
    expect(findings.some((finding) => finding.severity === "high" && finding.id === "renewal-window")).toBe(true);
    expect(findings.every((finding) => finding.clause.length > 0)).toBe(true);
  });
});

