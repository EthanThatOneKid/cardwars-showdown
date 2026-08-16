import { afterEach, describe, expect, it } from "bun:test";
import { HeadlessClient } from "./headless-client.js";
import { startRelayServer } from "./relay.js";
import type { RelayServerHandle } from "./relay.js";
import type { Choice, Decision } from "../sim/protocol.js";
import { makeRng } from "../sim/rng.js";
import { generateLegalDeck } from "../sim/runner.js";
import type { DeckList, PlayerId } from "../sim/types.js";

let handle: RelayServerHandle | null = null;

async function boot(): Promise<RelayServerHandle> {
  handle = startRelayServer({ port: 0 });
  return handle;
}

afterEach(async () => {
  if (handle) {
    await handle.close();
    handle = null;
  }
});

function legalDecks(seed: number): { p1: DeckList; p2: DeckList } {
  const rng = makeRng(seed);
  return { p1: generateLegalDeck(rng), p2: generateLegalDeck(rng) };
}

function choiceToDecision(choice: Choice, view: { canMulligan: boolean }): Decision {
  switch (choice.type) {
    case "mulligan": return { kind: "mulligan", mulligan: view.canMulligan };
    case "playCard": return { kind: "playCard", handIndex: choice.handIndex, lane: choice.lane };
    case "floop": return { kind: "floop", lane: choice.lane };
    case "fight": return { kind: "fight", lane: choice.lane };
    case "drawAction": return { kind: "drawAction" };
    case "endTurn": return { kind: "endTurn" };
  }
}

/** Drive a client through an entire game by always taking the first legal
 * choice, until the `end` envelope arrives. Mirrors the seam's `playFullGame`
 * helper, but over a real WebSocket. */
async function driveToEnd(client: HeadlessClient, timeoutMs = 8000): Promise<PlayerId | null> {
  for (let guard = 0; guard < 20_000; guard += 1) {
    const message = await client.next(m => m.type === "request" || m.type === "end", timeoutMs);
    if (message.type === "end") return message.winner;
    if (message.type !== "request") continue;
    const request = message.request;
    const choice = request.view.choices[0];
    if (!choice) continue;
    client.decide(request.requestId, choiceToDecision(choice, request.view));
  }
  throw new Error("driveToEnd: guard limit reached");
}

async function waitUntil(predicate: () => boolean, timeoutMs = 5000): Promise<void> {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > timeoutMs) throw new Error("waitUntil timed out");
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}

describe("server relay", () => {
  it("boots and pairs first/second connections as p1/p2", async () => {
    const h = await boot();
    const p1 = await HeadlessClient.connect(h.url);
    const p2 = await HeadlessClient.connect(h.url);
    const decks = legalDecks(1);
    p1.ready(decks.p1);
    p2.ready(decks.p2);

    const p1req = await p1.waitForRequest();
    const p2req = await p2.waitForRequest();
    expect(p1req.view.player).toBe("p1");
    expect(p2req.view.player).toBe("p2");
    expect(p1req.view.choices.some(c => c.type === "mulligan")).toBe(true);
    expect(p2req.view.choices.some(c => c.type === "mulligan")).toBe(true);
  });

  it("rejects an invalid deck with the issues attached", async () => {
    const h = await boot();
    const client = await HeadlessClient.connect(h.url);
    client.ready({ name: "bad", cards: ["cow", "cow", "cow", "cow"] });

    const error = await client.next(m => m.type === "error");
    expect(error.type).toBe("error");
    if (error.type === "error") {
      expect(error.code).toBe("invalid-deck");
      expect(error.issues).toBeDefined();
      expect(error.issues!.some(i => i.code === "too-many-copies")).toBe(true);
      expect(error.issues!.some(i => i.code === "too-small")).toBe(true);
    }
  });

  it("plays a full game between two headless clients and broadcasts one winner", async () => {
    handle = startRelayServer({ port: 0, seed: 1 });
    const h = handle;
    const decks = legalDecks(1);
    const p1 = await HeadlessClient.connect(h.url);
    const p2 = await HeadlessClient.connect(h.url);
    p1.ready(decks.p1);
    p2.ready(decks.p2);

    const [w1, w2] = await Promise.all([driveToEnd(p1), driveToEnd(p2)]);
    expect(w1).not.toBeNull();
    expect(w1).toBe(w2);
    expect(w1 === "p1" || w1 === "p2").toBe(true);
  });

  it("rejects a stale requestId with the stale-request code", async () => {
    const h = await boot();
    const decks = legalDecks(2);
    const p1 = await HeadlessClient.connect(h.url);
    const p2 = await HeadlessClient.connect(h.url);
    p1.ready(decks.p1);
    p2.ready(decks.p2);

    const p1req = await p1.waitForRequest(r => r.view.choices.some(c => c.type === "mulligan"));
    p1.decide(p1req.requestId + 7, { kind: "mulligan", mulligan: false });

    const error = await p1.next(m => m.type === "error");
    expect(error.type).toBe("error");
    if (error.type === "error") {
      expect(error.code).toBe("stale-request");
    }
  });

  it("resyncs a reconnecting player with the full log then their last request", async () => {
    const h = await boot();
    const decks = legalDecks(3);
    const p1 = await HeadlessClient.connect(h.url);
    const p2 = await HeadlessClient.connect(h.url);
    p1.ready(decks.p1);
    p2.ready(decks.p2);

    const p1mull = await p1.waitForRequest(r => r.view.choices.some(c => c.type === "mulligan"));
    const p2mull = await p2.waitForRequest(r => r.view.choices.some(c => c.type === "mulligan"));
    p1.decide(p1mull.requestId, { kind: "mulligan", mulligan: p1mull.view.canMulligan });
    p2.decide(p2mull.requestId, { kind: "mulligan", mulligan: p2mull.view.canMulligan });

    const p1req = await p1.waitForRequest();
    const lastRequestId = p1req.requestId;

    p1.close();
    await waitUntil(() => h.relay.disconnectedPlayer() === "p1");

    const p1b = await HeadlessClient.connect(h.url);
    const logMessage = await p1b.next(m => m.type === "log");
    const requestMessage = await p1b.next(m => m.type === "request");

    expect(logMessage.type).toBe("log");
    expect(requestMessage.type).toBe("request");
    if (requestMessage.type === "request") {
      expect(requestMessage.request.player).toBe("p1");
      expect(requestMessage.request.requestId).toBe(lastRequestId);
    }
    expect(p1b.player).toBe("p1");
  });

  it("grants win by abandonment after the grace window expires", async () => {
    const h = await bootWithGrace(50);
    const decks = legalDecks(4);
    const p1 = await HeadlessClient.connect(h.url);
    const p2 = await HeadlessClient.connect(h.url);
    p1.ready(decks.p1);
    p2.ready(decks.p2);

    const p1mull = await p1.waitForRequest(r => r.view.choices.some(c => c.type === "mulligan"));
    const p2mull = await p2.waitForRequest(r => r.view.choices.some(c => c.type === "mulligan"));
    p1.decide(p1mull.requestId, { kind: "mulligan", mulligan: p1mull.view.canMulligan });
    p2.decide(p2mull.requestId, { kind: "mulligan", mulligan: p2mull.view.canMulligan });

    // Drain p1's post-mulligan request so we only watch for the end envelope.
    await p1.waitForRequest();

    p1.close();
    const winner = await p2.waitForEnd(2000);
    expect(winner).toBe("p2");
  });
});

/** Boot with a short reconnect grace so the abandonment test stays fast. */
async function bootWithGrace(reconnectGraceMs: number): Promise<RelayServerHandle> {
  handle = startRelayServer({ port: 0, reconnectGraceMs });
  return handle;
}
