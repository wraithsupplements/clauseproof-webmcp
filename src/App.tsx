import { useMemo, useRef, useState } from "react";
import { SeverityPill } from "./components/SeverityPill";
import { proofRoomStore, useProofCase } from "./domain/store";
import type { Finding } from "./domain/types";
import { readDocument } from "./document/readDocument";

function FindingCard({ finding }: { finding: Finding }) {
  return (
    <article className={`finding-card ${finding.status !== "open" ? "finding-closed" : ""}`}>
      <div className="finding-heading">
        <SeverityPill severity={finding.severity} />
        <span className="finding-status">{finding.status}</span>
      </div>
      <h3>{finding.title}</h3>
      <blockquote>{finding.clause}</blockquote>
      <p>{finding.explanation}</p>
      <div className="recommendation">
        <span>Recommended change</span>
        <p>{finding.recommendation}</p>
      </div>
      {finding.status === "open" && (
        <div className="finding-actions">
          <button onClick={() => proofRoomStore.setFindingStatus(finding.id, "resolved")}>Mark resolved</button>
          <button className="button-quiet" onClick={() => proofRoomStore.setFindingStatus(finding.id, "accepted")}>Accept risk</button>
        </div>
      )}
    </article>
  );
}

export default function App() {
  const currentCase = useProofCase();
  const fileInput = useRef<HTMLInputElement>(null);
  const [selectedFinding, setSelectedFinding] = useState<string | null>(currentCase.findings[0]?.id ?? null);
  const [uploadStatus, setUploadStatus] = useState("Drop a document or use the synthetic demonstration case.");
  const [webmcpStatus] = useState(() => typeof document.modelContext?.registerTool === "function" ? "available" : "browser fallback");
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [approvalNote, setApprovalNote] = useState("Reviewed the source clauses and recorded each material risk decision.");
  const [approvalConfirmation, setApprovalConfirmation] = useState("");
  const selected = currentCase.findings.find((finding) => finding.id === selectedFinding) ?? currentCase.findings[0];
  const openRisks = currentCase.findings.filter((finding) => finding.status === "open");
  const critical = openRisks.filter((finding) => finding.severity === "critical").length;
  const riskScore = useMemo(() => Math.max(0, 100 - currentCase.findings.reduce((total, finding) => {
    if (finding.status !== "open") return total;
    return total + ({ critical: 28, high: 18, medium: 10, low: 4 } as const)[finding.severity];
  }, 0)), [currentCase.findings]);

  async function chooseFile(file?: File) {
    if (!file) return;
    setUploadStatus(`Opening ${file.name} locally…`);
    try {
      const text = await readDocument(file, (message, percent) => setUploadStatus(`${message}${percent === undefined ? "" : ` · ${percent}%`}`));
      if (text.length < 40) throw new Error("The extracted document did not contain enough readable text.");
      proofRoomStore.replaceDocument(file.name, text);
      setSelectedFinding(null);
      setUploadStatus(`${file.name} analyzed locally. Original bytes were not sent anywhere.`);
    } catch (error) {
      setUploadStatus(error instanceof Error ? error.message : "The document could not be read.");
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">P</span><strong>ProofRoom</strong></div>
        <nav>
          <a className="nav-active" href="#case"><span>01</span>Current case</a>
          <a href="#evidence"><span>02</span>Evidence</a>
          <a href="#audit"><span>03</span>Audit trail</a>
        </nav>
        <div className="sidebar-case">
          <span>ACTIVE ROOM</span>
          <strong>{currentCase.id}</strong>
          <p>{currentCase.counterparty}</p>
        </div>
        <div className="agent-status">
          <i className={webmcpStatus === "available" ? "status-live" : ""} />
          <div><strong>Agent interface</strong><span>{webmcpStatus}</span></div>
        </div>
      </aside>

      <main>
        <header className="topbar">
          <div><span className="eyebrow">Decision room / {currentCase.id}</span><h1>Know before you sign.</h1></div>
          <div className="top-actions">
            <input ref={fileInput} type="file" accept=".txt,.md,.pdf,image/*" hidden onChange={(event) => void chooseFile(event.target.files?.[0])} />
            <button className="button-secondary" onClick={() => fileInput.current?.click()}>Replace document</button>
            {currentCase.status === "review" && <button className="button-secondary" onClick={() => setApprovalOpen(true)}>Approve decision</button>}
            <button
              className="button-primary"
              onClick={() => {
                try {
                  proofRoomStore.prepareSignaturePacket();
                } catch (error) {
                  setUploadStatus(error instanceof Error ? error.message : "Approval required.");
                }
              }}
            >Prepare signature</button>
          </div>
        </header>

        <section className="case-overview" id="case">
          <div className="case-title">
            <div><span className={`decision-status status-${currentCase.status}`}>{currentCase.status}</span><h2>{currentCase.title}</h2><p>{currentCase.documentName}</p></div>
            <div className="score-ring" style={{ "--score": `${riskScore * 3.6}deg` } as React.CSSProperties}><strong>{riskScore}</strong><span>readiness</span></div>
          </div>
          <p className="upload-status">{uploadStatus}</p>
          <div className="metrics">
            <article><span>Open risks</span><strong>{openRisks.length}</strong><small>{critical} critical</small></article>
            <article><span>Clauses extracted</span><strong>{currentCase.clauses.length}</strong><small>deterministic</small></article>
            <article><span>Evidence checks</span><strong>{currentCase.evidence.length}</strong><small>pending live search</small></article>
            <article><span>Human decision</span><strong>{currentCase.status === "review" ? "Required" : "Recorded"}</strong><small>never inferred</small></article>
          </div>
        </section>

        {approvalOpen && (
          <div className="modal-backdrop" role="presentation">
            <section className="approval-modal" role="dialog" aria-modal="true" aria-labelledby="approval-title">
              <button className="modal-close" aria-label="Close approval dialog" onClick={() => setApprovalOpen(false)}>×</button>
              <span className="eyebrow">Human authority required</span>
              <h2 id="approval-title">Approve this decision—not an invisible agent action.</h2>
              <p>Approval records your decision. It does not send a document, request a signature, or bind either party.</p>
              {critical > 0 && <div className="approval-warning"><strong>{critical} critical risk remains open.</strong><span>Resolve it or explicitly accept it before approval.</span></div>}
              <label>
                <span>Decision note</span>
                <textarea value={approvalNote} onChange={(event) => setApprovalNote(event.target.value)} />
              </label>
              <label>
                <span>Type <b>APPROVE {currentCase.id}</b></span>
                <input value={approvalConfirmation} onChange={(event) => setApprovalConfirmation(event.target.value)} autoComplete="off" />
              </label>
              <div className="modal-actions">
                <button className="button-quiet" onClick={() => setApprovalOpen(false)}>Cancel</button>
                <button
                  className="button-primary"
                  disabled={critical > 0 || approvalConfirmation !== `APPROVE ${currentCase.id}` || approvalNote.trim().length < 8}
                  onClick={() => {
                    try {
                      proofRoomStore.approve(approvalNote.trim(), approvalConfirmation);
                      setUploadStatus("Human approval recorded. Signature preparation is now available, but nothing has been sent or signed.");
                      setApprovalOpen(false);
                    } catch (error) {
                      setUploadStatus(error instanceof Error ? error.message : "Approval could not be recorded.");
                    }
                  }}
                >Record approval</button>
              </div>
            </section>
          </div>
        )}

        <section className="workspace-grid">
          <div className="panel risk-list">
            <div className="panel-heading"><div><span className="eyebrow">Review queue</span><h2>What needs a decision</h2></div><span>{openRisks.length} open</span></div>
            <div className="risk-rows">
              {currentCase.findings.map((finding) => (
                <button key={finding.id} className={selected?.id === finding.id ? "risk-row selected" : "risk-row"} onClick={() => setSelectedFinding(finding.id)}>
                  <SeverityPill severity={finding.severity} />
                  <span><strong>{finding.title}</strong><small>{finding.status}</small></span>
                  <b>→</b>
                </button>
              ))}
            </div>
          </div>
          <div className="panel finding-detail">
            {selected ? <FindingCard finding={selected} /> : <div className="empty-state">No findings are available.</div>}
          </div>
        </section>

        <section className="lower-grid">
          <div className="panel clauses-panel">
            <div className="panel-heading"><div><span className="eyebrow">Source map</span><h2>Extracted terms</h2></div></div>
            <div className="clause-grid">
              {currentCase.clauses.map((clause) => <article key={clause.id}><span>{clause.label}</span><strong>{clause.value}</strong><small>{Math.round(clause.confidence * 100)}% confidence</small></article>)}
            </div>
          </div>
          <div className="panel audit-panel" id="audit">
            <div className="panel-heading"><div><span className="eyebrow">Replayable proof</span><h2>Recent activity</h2></div></div>
            <ol>
              {currentCase.audit.slice(-5).reverse().map((entry) => <li key={entry.id}><i className={`audit-${entry.outcome}`} /><div><strong>{entry.action}</strong><p>{entry.detail}</p><span>{entry.actor} · {new Date(entry.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span></div></li>)}
            </ol>
          </div>
        </section>
      </main>
    </div>
  );
}
