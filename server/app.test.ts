import { afterEach, describe, expect, it } from "bun:test";
import { HeadlessClient } from "./headless-client.js";
import { startAppServer } from "./index.js";
import type { AppServer } from "./index.js";
import type { Choice, Decision } from "../sim/protocol.js";
import { makeRng } from "../sim/rng.js";
import { generateLegalDeck } from "../sim/runner.js";
import type { PlayerId } from "../sim/types.js";

let app: AppServer | null = null;

async function boot(): Promise<AppServer> {
  app = await startAppServer({ port: 0 });
  return app;
}

afterEach(async () => {
  if (app) {
    await app.close();
    app = null;
  }
});

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

async function driveToEnd(client: HeadlessClient, timeoutMs = 8000): Promise<PlayerId | null> {
  for (let guard = 0; guard < 20_000; guard += 1) {
    const message = await client.next(m => m.type === "request" || m.type === "end", timeoutMs);
    if (message.type === "end") return message.winner;
    if (message.type !== "request") continue;
    const choice = message.request.view.choices[0];
    if (!choice) continue;
    client.decide(message.request.requestId, choiceToDecision(choice, message.request.view));
  }
  throw new Error("driveToEnd: guard limit reached");
}

describe("app server", () => {
  it("serves the bundled client and index shell", async () => {
    const a = await boot();
    const html = await fetch(`${a.url}/`).then(res => res.text());
    expect(html).toContain("Card Wars Showdown");
    const js = await fetch(`${a.url}/client.js`).then(res => res.text());
    expect(js.length).toBeGreaterThan(1000);
    // `sim/cli.ts` (the process/require consumer) must stay out of the bundle.
    expect(js).not.toContain("sim/cli");
  });

  it("plays a full game over /ws through the composed server", async () => {
    const a = await boot();
    const wsUrl = `${a.url.replace("http", "ws")}/ws`;
    const rng = makeRng(11);
    const p1 = await HeadlessClient.connect(wsUrl);
    const p2 = await HeadlessClient.connect(wsUrl);
    p1.ready(generateLegalDeck(rng));
    p2.ready(generateLegalDeck(rng));

    const [w1, w2] = await Promise.all([driveToEnd(p1), driveToEnd(p2)]);
    expect(w1).not.toBeNull();
    expect(w1).toBe(w2);
    expect(w1 === "p1" || w1 === "p2").toBe(true);
  });
});
