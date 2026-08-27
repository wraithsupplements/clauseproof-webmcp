import type { Clause, Finding } from "./types";

type Rule = {
  id: string;
  label: string;
  pattern: RegExp;
  normalize: (match: RegExpMatchArray) => string;
};

const clauseRules: Rule[] = [
  {
    id: "term",
    label: "Initial term",
    pattern: /(?:initial\s+)?term[^.\n]{0,40}?(\d+)\s*(month|year)s?/iu,
    normalize: (match) => `${match[1]} ${match[2]}${match[1] === "1" ? "" : "s"}`,
  },
  {
    id: "renewal",
    label: "Renewal",
    pattern: /(automatically renews?|auto-renew(?:al)?)[^.\n]{0,100}/iu,
    normalize: (match) => match[0].trim(),
  },
  {
    id: "payment",
    label: "Payment terms",
    pattern: /(?:payment|invoice)[^.\n]{0,70}?(?:net\s*)?(\d{1,3})\s*days?/iu,
    normalize: (match) => `Net ${match[1]}`,
  },
  {
    id: "termination",
    label: "Termination notice",
    pattern: /(?:terminate|termination)[^.\n]{0,90}?(\d{1,3})\s*days?[^.\n]*/iu,
    normalize: (match) => match[0].trim(),
  },
  {
    id: "liability",
    label: "Liability cap",
    pattern: /(?:liability|liable)[^.\n]{0,120}?(?:fees paid|\$[\d,]+|twelve months|12 months)[^.\n]*/iu,
    normalize: (match) => match[0].trim(),
  },
  {
    id: "exclusivity",
    label: "Exclusivity",
    pattern: /(?:exclusive|exclusivity)[^.\n]{0,120}/iu,
    normalize: (match) => match[0].trim(),
  },
  {
    id: "law",
    label: "Governing law",
    pattern: /governed by the laws? of\s+([A-Za-z ]{2,40})/iu,
    normalize: (match) => match[1].trim(),
  },
];

function compact(value: string) {
  return value.replace(/\s+/gu, " ").trim();
}

export function extractClauses(text: string): Clause[] {
  const normalized = compact(text);
  return clauseRules.flatMap((rule) => {
    const match = normalized.match(rule.pattern);
    if (!match) return [];
    return [{
      id: rule.id,
      label: rule.label,
      value: rule.normalize(match),
      sourceText: compact(match[0]),
      confidence: 0.94,
    }];
  });
}

export function generateFindings(text: string, clauses = extractClauses(text)): Finding[] {
  const normalized = compact(text);
  const findings: Finding[] = [];
  const renewal = clauses.find((clause) => clause.id === "renewal");
  const exclusivity = clauses.find((clause) => clause.id === "exclusivity");
  const termination = clauses.find((clause) => clause.id === "termination");
  const liability = clauses.find((clause) => clause.id === "liability");

  if (renewal && /unless[^.]{0,50}(?:60|90)\s*days?/iu.test(normalized)) {
    findings.push({
      id: "renewal-window",
      severity: "high",
      title: "Long cancellation window can lock in another term",
      clause: renewal.sourceText,
      explanation: "The agreement renews automatically and requires unusually early notice to prevent renewal.",
      recommendation: "Replace automatic renewal with a written opt-in, or shorten the non-renewal window to 30 days.",
      evidenceIds: [],
      status: "open",
    });
  }

  if (exclusivity) {
    findings.push({
      id: "broad-exclusivity",
      severity: "critical",
      title: "Exclusivity is broader than the defined deliverables",
      clause: exclusivity.sourceText,
      explanation: "The restriction could prevent the buyer from using alternative providers even when performance or coverage is inadequate.",
      recommendation: "Limit exclusivity to named services, named geography, and periods where service levels are met.",
      evidenceIds: [],
      status: "open",
    });
  }

  if (!termination || !/for convenience/iu.test(normalized)) {
    findings.push({
      id: "no-convenience-termination",
      severity: "high",
      title: "No clear termination-for-convenience right",
      clause: termination?.sourceText ?? "No termination-for-convenience clause detected.",
      explanation: "The buyer may remain committed even when priorities change or the relationship stops creating value.",
      recommendation: "Add termination for convenience on 30 days' written notice with payment only for accepted work.",
      evidenceIds: [],
      status: "open",
    });
  }

  if (liability && /fees paid|twelve months|12 months/iu.test(liability.value)) {
    findings.push({
      id: "one-sided-liability",
      severity: "medium",
      title: "Liability cap may not cover data or confidentiality losses",
      clause: liability.sourceText,
      explanation: "A fees-paid cap can be materially smaller than losses caused by confidentiality, security, or IP failures.",
      recommendation: "Create carve-outs for confidentiality, data protection, infringement, fraud, and willful misconduct.",
      evidenceIds: [],
      status: "open",
    });
  }

  if (!/data (?:protection|processing)|security incident|breach notification/iu.test(normalized)) {
    findings.push({
      id: "missing-data-terms",
      severity: "medium",
      title: "No operational data-protection terms detected",
      clause: "No data-protection or incident-notification language detected.",
      explanation: "The document does not define safeguards, breach notification timing, deletion, or return of data.",
      recommendation: "Add a security exhibit covering safeguards, notification, subprocessors, retention, and deletion.",
      evidenceIds: [],
      status: "open",
    });
  }

  return findings;
}

