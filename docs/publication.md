# ClauseProof publication copy

This file is the source of record for the public video and both Devpost entries.
Do not publish or submit until the final URLs and form readback match this copy.

## YouTube

**Title**

ClauseProof — WebMCP + Xano + SerpApi Contract Decision Room

**Description**

ClauseProof turns a high-stakes agreement into a source-grounded, human-approved decision room that a person and an AI agent can safely operate together.

The browser reads documents locally, preserves the exact governing clause beside each finding, exposes six narrow WebMCP tools over the product's real state, and keeps analysis, proposal, human approval, signature preparation, sending, and signing as separate verifiable states.

Xano provides the durable case and audit-receipt backend. SerpApi runs one bounded server-side counterparty query without exposing its credential to the browser. The demonstration agreement and counterparty are synthetic.

Live app: https://clauseproof-webmcp.netlify.app
Public MIT source: https://github.com/wraithsupplements/clauseproof-webmcp

Built for the OpenAI WebMCP Challenge and the DevNetwork API + Cloud + AI Hackathon 2026 Xano and SerpApi tracks.

## OpenAI WebMCP Challenge

**One-line pitch**

ClauseProof is a source-grounded contract decision room where people and agents can analyze and propose together without collapsing human approval into AI output.

**Description**

ClauseProof is a strong fit for WebMCP because contract work is already a shared browser workflow, but generic agents cannot safely infer authority from fluent language. The live page exposes six narrow tools over the same case state the human sees: read the case, list open risks, propose a resolution, record a human risk decision, approve after the explicit gate passes, and prepare an unsigned signature packet.

This creates a better experience than copying clauses into a separate chatbot. Every finding keeps the exact source clause beside the explanation, agent proposals remain proposals, case approval requires visible case-specific confirmation, and signature preparation returns an explicit receipt with `sent: false` and `signed: false`.

WebMCP is implemented with `document.modelContext.registerTool`. Each tool has a closed input schema, explicit effect language, and a structured result describing what changed. The WebMCP layer calls the product's real state transitions instead of maintaining an agent-only shadow workflow.

## DevNetwork Xano track

**One-line pitch**

ClauseProof replaces opaque contract-review and approval software with an AI-ready decision room whose authority boundaries and receipts are visible by design.

**Build story**

The software being replaced is the fragmented contract-review stack: one tool summarizes, another tracks approvals, and an e-sign tool makes preparation look dangerously close to sending. ClauseProof combines exact-source findings, risk decisions, explicit case approval, bounded external evidence, and an unsigned-packet receipt in one coherent workflow.

Xano was chosen because the backend needed more than storage. It owns the durable synthetic case, audit events, evidence receipts, an idempotent bootstrap, health and case APIs, the server-side SerpApi call, and the non-action receipt contract. The checked-in XanoScript contains three data models and five deployed endpoints. A workflow contract test is also checked in and parser-validated; Xano's Free Plan does not live-deploy workflow tests.

The project used OpenAI Codex, ChatGPT's WebMCP-capable in-app browser, React, TypeScript, Vite, Xano, SerpApi, PDF.js, Tesseract.js, Zod, Vitest, and Netlify. The first source commit through the reproducible release-video commit spans about ninety minutes of focused build time. Without AI and Xano, designing and implementing the shared tool schemas, backend models, server-side evidence route, deployment, terminal receipts, and submission artifacts would have taken significantly longer and required repeated manual translation between frontend and backend contracts.

## DevNetwork SerpApi track

**One-line pitch**

ClauseProof adds bounded, live counterparty evidence to contract review while keeping the SerpApi credential server-side and tying results to a durable receipt.

**Integration story**

Static contract analysis cannot reveal current counterparty signals. ClauseProof therefore runs one fixed, reviewable query through Xano's server-side SerpApi endpoint and converts the structured organic results into visible evidence cards. The live proof returned nine organic results and evidence receipt 1 for the synthetic Northstar Components case.

SerpApi improves the AI experience because the human and agent can reason from the same current source set instead of relying on model memory or an untraceable browser search. The browser receives only the bounded result fields and the receipt identifier; it never receives the SerpApi key.

## Shared links and representations

- Live app: https://clauseproof-webmcp.netlify.app
- Public source: https://github.com/wraithsupplements/clauseproof-webmcp
- License: MIT
- Video: https://youtu.be/cs7cA7nX_8g
- Entrant: Cody Peacock, individual
- Data: synthetic demonstration agreement and counterparty
- Xano live state: three tables and five endpoints
- Xano checked-in state: workflow test included and parser-validated, not live-deployed on Free Plan
- SerpApi live proof: nine organic results, evidence receipt 1
- Signature state: prepared receipt only; not sent and not signed

## Submission receipts

- YouTube: public video https://youtu.be/cs7cA7nX_8g (`Video published`, August 27, 2026)
- OpenAI WebMCP Challenge: submission `1156458`, public project https://devpost.com/software/clauseproof (`Project submitted!`)
- DevNetwork Xano and SerpApi tracks: pending registration and terminal submission receipt
