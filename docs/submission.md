# ClauseProof submission draft

## Identity

- **Name:** ClauseProof
- **Tagline:** Know before you sign.
- **One sentence:** ClauseProof turns a high-stakes agreement into a source-grounded, human-approved decision room that an AI agent can safely operate through WebMCP.
- **License:** MIT
- **Live app:** `https://clauseproof-webmcp.netlify.app`
- **Repository:** `https://github.com/wraithsupplements/clauseproof-webmcp`
- **Video:** validated local release artifact; public YouTube URL pending

## What it does

ClauseProof reads text PDFs locally and uses local OCR for image documents. Deterministic extraction keeps exact clause language beside every finding. A human can resolve or explicitly accept risks, record an approval with exact visible confirmation, and prepare an unsent signature-packet receipt. The app never treats an agent proposal as human approval and never claims a signature was sent or signed.

On a WebMCP-capable browser, the same page exposes six narrow tools so an agent can inspect the visible case, list open risks, propose revised language, record an explicit human risk decision, approve only after the safety gate passes, and prepare a verified unsigned packet.

## How WebMCP is used

ClauseProof registers six tools with `document.modelContext.registerTool`:

1. `get_case_summary`
2. `list_open_risks`
3. `propose_risk_resolution`
4. `record_human_risk_decision`
5. `approve_case_decision`
6. `prepare_signature_packet`

Every tool has a closed JSON schema, explicit side-effect language, and a result that says what changed. Signature preparation is blocked until the human approval contract is satisfied, and its receipt always returns `sent: false` and `signed: false`.

## Sponsor integrations

### Xano

Xano is the durable backend, not a badge. The checked-in XanoScript defines the case, audit-event, and evidence-receipt data models; an idempotent synthetic-case bootstrap; bounded case and audit APIs; and a workflow contract test. The three tables and five endpoints are deployed on Xano's free plan. The workflow test is checked in and parser-validated but is not live-deployed because workflow tests are unavailable on that plan. Uploaded document bytes and extracted text remain in the browser. The repository includes a disposable official-parser validation command, and every Xano file must pass before a dry-run or live push.

### SerpApi

ClauseProof calls SerpApi server-side through Xano for one fixed counterparty evidence query. The API key never reaches the browser. Structured organic results are converted into visible source cards and tied to a durable evidence receipt.

## Built with

OpenAI WebMCP, React, TypeScript, Vite, Xano, SerpApi, PDF.js, Tesseract.js, Zod, Vitest, and Netlify.

## How we built it

The core workflow is deterministic: local document reading, clause extraction, risk rules, human gates, and audit receipts. WebMCP exposes that same state instead of creating an agent-only shadow workflow. Xano stores only synthetic case metadata and bounded receipts. SerpApi adds live structured evidence without exposing credentials.

## Challenges

The hardest part was making agent actions useful without letting fluent language become authority. ClauseProof separates proposals, human risk decisions, case approval, signature preparation, sending, and signing into distinct states with verifiable receipts.

## Accomplishments

- One shared human-and-agent workflow instead of a separate chatbot.
- Exact-source findings and deterministic extraction.
- Explicit approval and signature boundaries.
- Local OCR that keeps uploaded bytes out of the public backend.
- Checked-in, officially parsed Xano backend source.
- Live structured SerpApi evidence through a server-side route.
- A live Xano release receipt covering health, idempotent bootstrap, case readback, audit append, and nine SerpApi organic results.

## What we learned

Agent interfaces are strongest when they expose the product's real workflow, preserve visible state, and make side effects independently verifiable. A small tool surface with hard authority boundaries is more useful than broad autonomous access.

## What's next

Add authenticated private rooms, versioned redlines, provider-backed PDF generation, and a human-controlled e-sign handoff. Those providers are not claimed in this submission until their live calls and terminal receipts are proven.

## Final receipt checklist

- [x] Public app returns HTTP 200 without Netlify login.
- [ ] HTTPS browser registers all six WebMCP tools.
- [x] Xano health, bootstrap, audit, case, and SerpApi evidence endpoints return live receipts.
- [x] Public GitHub repository has the MIT license, source, setup instructions, and submission-window history.
- [x] Local video artifact is 110.625 seconds, 1920x1080 H.264, with AAC audio.
- [ ] Public YouTube video is under three minutes, has audio, and demonstrates the live app.
- [ ] OpenAI WebMCP Challenge submission receipt captured.
- [ ] DevNetwork API/Cloud/AI submission receipt captured for Xano and SerpApi tracks only.
