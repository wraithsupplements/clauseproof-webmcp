import type { Severity } from "../domain/types";

export function SeverityPill({ severity }: { severity: Severity }) {
  return <span className={`severity severity-${severity}`}>{severity}</span>;
}

