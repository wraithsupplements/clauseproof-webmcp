# ProofRoom

ProofRoom turns high-stakes document packets into evidence-backed, human-approved decisions. A person and an AI agent work in the same live room: the interface shows exact source clauses and risks while WebMCP tools let the agent inspect, propose, and prepare reversible work without silently approving or signing anything.

Built from scratch during the OpenAI WebMCP Challenge submission period beginning August 25, 2026.

## Core workflow

1. Read text PDFs locally through their text layer; use local OCR only for image documents.
2. Extract material clauses with deterministic rules and preserve the exact source language.
3. Surface risks and proposed changes in a human review queue.
4. Let an agent inspect risks and propose resolutions through WebMCP.
5. Require an explicit human decision before approval.
6. Refuse to prepare a signature packet until the approval gate passes.
7. Record every completed, proposed, or blocked action in a replayable audit trail.

The included demonstration document is synthetic. Do not upload confidential material to a public deployment.

## WebMCP tools

| Tool | Effect |
| --- | --- |
| `get_case_summary` | Read current status and proof counts. |
| `list_open_risks` | Read unresolved findings with source clauses. |
| `propose_risk_resolution` | Record a proposal without changing the source document. |
| `record_human_risk_decision` | Record an explicit accepted/resolved decision. |
| `approve_case_decision` | Approve only with exact confirmation and no open critical risk. |
| `prepare_signature_packet` | Prepare an unsent, unsigned packet only after approval. |

Every tool uses a closed input schema. Write tools describe their side effects and return enough state to verify what happened.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:4173`. Site tools require a WebMCP-capable browser; the human interface remains functional without WebMCP.

## Verify

```bash
npm test
npm run typecheck
npm run build
```

## Sponsor integrations

The deterministic core is intentionally vendor-neutral. Server-side adapters will connect:

- Xano for case state, workflows, and audit records.
- SerpApi for live counterparty and claim verification.
- Nutrient DWS for deterministic document processing and human review.
- Doctavian for structured decision-document generation.
- Foxit PDF Services and eSign for reversible PDF work and the human signature handoff.

Credentials must remain server-side and are never committed or returned through WebMCP.

## License

[MIT](LICENSE)
