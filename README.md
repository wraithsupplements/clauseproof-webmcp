# ClauseProof

ClauseProof turns high-stakes document packets into evidence-backed, human-approved decisions. A person and an AI agent work in the same live room: the interface shows exact source clauses and risks while WebMCP tools let the agent inspect, propose, and prepare reversible work without silently approving or signing anything.

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
./tools/validate_xano.sh
```

The checked-in Xano source is under `xano/`. It contains three tables, an idempotent synthetic-case bootstrap, three functional endpoints plus health, and a workflow contract test. `validate_xano.sh` installs Xano's pinned parser into a disposable temporary directory, validates every `.xs` file, and removes the parser again so its dependency advisories never enter the app lockfile. Before any live Xano push, preview it:

```bash
npx --yes @xano/cli@1.2.0 workspace push --directory ./xano --dry-run
```

Do not use destructive Xano flags for this project. A normal schema/API push must remain transactional and additive.

## Live integrations

- **Xano** owns durable synthetic case state, bounded audit receipts, and evidence receipts. Uploaded document bytes and extracted text stay in the browser.
- **SerpApi** is called server-side by Xano for a fixed, bounded counterparty evidence query. The browser receives structured results, never the API key.
- **OpenAI WebMCP** exposes the visible case workflow as six narrow site tools on the same page and session.

Set the deployed frontend's `VITE_XANO_API_BASE` to the Xano API group URL ending in `/api:clauseproof-api-2026`.

Additional document-generation or e-sign providers are deliberately not claimed until their live API calls and receipts are proven.

## Privacy and action boundary

The public demo uses a synthetic agreement. Credentials remain server-side and are never committed or returned through WebMCP. ClauseProof can prepare a local signature packet receipt only after exact human approval; it does not send a signature request or sign a document.

## License

[MIT](LICENSE)
