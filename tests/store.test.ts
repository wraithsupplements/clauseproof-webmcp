import { beforeEach, describe, expect, it } from "vitest";
import { makeSampleCase } from "../src/domain/sample";
import { proofRoomStore } from "../src/domain/store";

describe("human approval and signature boundary", () => {
  beforeEach(() => proofRoomStore.reset(makeSampleCase()));

  it("blocks signature preparation before approval", () => {
    expect(() => proofRoomStore.prepareSignaturePacket()).toThrow(/Human approval/u);
    expect(proofRoomStore.getSnapshot().audit.at(-1)?.outcome).toBe("blocked");
  });

  it("blocks approval while a critical risk is open", () => {
    expect(() => proofRoomStore.approve("Reviewed by the document owner.", "APPROVE PR-260826-01")).toThrow(/critical finding/u);
  });

  it("records human acceptance before producing an unsent packet", () => {
    proofRoomStore.setFindingStatus("broad-exclusivity", "accepted", "human");
    const summary = proofRoomStore.approve("Reviewed and approved with accepted exclusivity risk.", "APPROVE PR-260826-01");
    expect(summary.status).toBe("approved");
    const packet = proofRoomStore.prepareSignaturePacket();
    expect(packet.status).toBe("signature-ready");
    expect(packet.sent).toBe(false);
    expect(packet.signed).toBe(false);
  });
});

