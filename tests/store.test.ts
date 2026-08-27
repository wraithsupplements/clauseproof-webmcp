import { beforeEach, describe, expect, it } from "vitest";
import { makeSampleCase } from "../src/domain/sample";
import { clauseProofStore } from "../src/domain/store";

describe("human approval and signature boundary", () => {
  beforeEach(() => clauseProofStore.reset(makeSampleCase()));

  it("blocks signature preparation before approval", () => {
    expect(() => clauseProofStore.prepareSignaturePacket()).toThrow(/Human approval/u);
    expect(clauseProofStore.getSnapshot().audit.at(-1)?.outcome).toBe("blocked");
  });

  it("blocks approval while a critical risk is open", () => {
    expect(() => clauseProofStore.approve("Reviewed by the document owner.", "APPROVE PR-260826-01")).toThrow(/critical finding/u);
  });

  it("records human acceptance before producing an unsent packet", () => {
    clauseProofStore.setFindingStatus("broad-exclusivity", "accepted", "human");
    const summary = clauseProofStore.approve("Reviewed and approved with accepted exclusivity risk.", "APPROVE PR-260826-01");
    expect(summary.status).toBe("approved");
    const packet = clauseProofStore.prepareSignaturePacket();
    expect(packet.status).toBe("signature-ready");
    expect(packet.sent).toBe(false);
    expect(packet.signed).toBe(false);
  });
});
