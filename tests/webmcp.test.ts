import { beforeEach, describe, expect, it } from "vitest";
import { makeSampleCase } from "../src/domain/sample";
import { proofRoomStore } from "../src/domain/store";
import { registerProofRoomTools } from "../src/webmcp/register";
import type { ToolDefinition } from "../src/webmcp/types";

describe("WebMCP registration", () => {
  beforeEach(() => proofRoomStore.reset(makeSampleCase()));

  it("registers a narrow, inspectable tool surface", async () => {
    const registered: ToolDefinition[] = [];
    const result = await registerProofRoomTools({ registerTool: (tool) => { registered.push(tool); } });
    expect(result.supported).toBe(true);
    expect(result.registered).toEqual([
      "get_case_summary",
      "list_open_risks",
      "propose_risk_resolution",
      "record_human_risk_decision",
      "approve_case_decision",
      "prepare_signature_packet",
    ]);
    expect(registered.every((tool) => tool.inputSchema.additionalProperties === false)).toBe(true);
  });

  it("returns verifiable state and records proposals without approval", async () => {
    const registered = new Map<string, ToolDefinition>();
    await registerProofRoomTools({ registerTool: (tool) => { registered.set(tool.name, tool); } });
    const summary = await registered.get("get_case_summary")!.execute({}) as { openRiskCount: number };
    expect(summary.openRiskCount).toBeGreaterThan(0);
    const result = await registered.get("propose_risk_resolution")!.execute({
      findingId: "renewal-window",
      recommendation: "Require affirmative written renewal no earlier than 30 days before expiration.",
    }) as { caseApproved: boolean; sourceDocumentChanged: boolean };
    expect(result.caseApproved).toBe(false);
    expect(result.sourceDocumentChanged).toBe(false);
    expect(proofRoomStore.getSnapshot().audit.at(-1)?.outcome).toBe("proposed");
  });
});

