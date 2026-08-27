import { z } from "zod";
import { proofRoomStore } from "../domain/store";
import type { ModelContext, ToolDefinition } from "./types";

const resolutionInput = z.object({
  findingId: z.string().min(1),
  recommendation: z.string().min(12).max(600),
}).strict();

const findingStatusInput = z.object({
  findingId: z.string().min(1),
  status: z.enum(["accepted", "resolved"]),
}).strict();

const approvalInput = z.object({
  note: z.string().min(8).max(500),
  confirmationText: z.string(),
}).strict();

function parse<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) throw new Error(result.error.issues.map((issue) => issue.message).join("; "));
  return result.data;
}

export function proofRoomTools(): ToolDefinition[] {
  return [
    {
      name: "get_case_summary",
      description: "Read the current ProofRoom case status, open-risk counts, evidence count, and last auditable change.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
      execute: () => proofRoomStore.summary(),
    },
    {
      name: "list_open_risks",
      description: "List unresolved risks from the current document with the exact source clause and proposed resolution.",
      inputSchema: {
        type: "object",
        properties: {
          minimumSeverity: { type: "string", enum: ["critical", "high", "medium", "low"] },
        },
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
      execute: (input) => {
        const order = { critical: 4, high: 3, medium: 2, low: 1 } as const;
        const minimum = typeof input.minimumSeverity === "string" && input.minimumSeverity in order
          ? input.minimumSeverity as keyof typeof order
          : "low";
        return proofRoomStore.getSnapshot().findings.filter((finding) =>
          finding.status === "open" && order[finding.severity] >= order[minimum]);
      },
    },
    {
      name: "propose_risk_resolution",
      description: "Propose revised resolution language for one finding. This records a proposal only; it does not approve the case or alter the source document.",
      inputSchema: {
        type: "object",
        properties: {
          findingId: { type: "string", description: "Exact finding id from list_open_risks." },
          recommendation: { type: "string", minLength: 12, maxLength: 600 },
        },
        required: ["findingId", "recommendation"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
      execute: (input) => {
        const value = parse(resolutionInput, input);
        const finding = proofRoomStore.proposeResolution(value.findingId, value.recommendation);
        return { finding, effect: "proposal-recorded", sourceDocumentChanged: false, caseApproved: false };
      },
    },
    {
      name: "record_human_risk_decision",
      description: "Record that a human accepted or resolved one identified risk. This does not approve the entire case.",
      inputSchema: {
        type: "object",
        properties: {
          findingId: { type: "string" },
          status: { type: "string", enum: ["accepted", "resolved"] },
        },
        required: ["findingId", "status"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      execute: (input) => {
        const value = parse(findingStatusInput, input);
        proofRoomStore.setFindingStatus(value.findingId, value.status, "human");
        return { findingId: value.findingId, status: value.status, caseStatus: proofRoomStore.summary().status };
      },
    },
    {
      name: "approve_case_decision",
      description: "Approve the current case after human review. Requires exact visible confirmation text and refuses approval while a critical risk remains open.",
      inputSchema: {
        type: "object",
        properties: {
          note: { type: "string", minLength: 8, maxLength: 500 },
          confirmationText: { type: "string", description: "Must equal APPROVE followed by the visible case id." },
        },
        required: ["note", "confirmationText"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      execute: (input) => {
        const value = parse(approvalInput, input);
        return proofRoomStore.approve(value.note, value.confirmationText);
      },
    },
    {
      name: "prepare_signature_packet",
      description: "Prepare a signature packet only after explicit case approval. It never sends or signs the document and returns verification flags.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
      execute: () => proofRoomStore.prepareSignaturePacket(),
    },
  ];
}

export async function registerProofRoomTools(modelContext: ModelContext | undefined = document.modelContext) {
  if (!modelContext || typeof modelContext.registerTool !== "function") return { supported: false, registered: [] as string[] };
  const tools = proofRoomTools();
  await Promise.all(tools.map((tool) => modelContext.registerTool(tool)));
  return { supported: true, registered: tools.map((tool) => tool.name) };
}

