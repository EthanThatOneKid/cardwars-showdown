import type { Decision, Request } from "./protocol.js";
import type { BattleLogEntry, DeckList, PlayerId } from "./types.js";
import type { DeckIssue } from "./validate.js";

/** Machine-readable error codes. Clients and tests match on `code`, never on
 * message text (per the #42 relay contract). */
export type WireErrorCode =
  | "invalid-deck"
  | "stale-request"
  | "invalid-decision"
  | "room-full"
  | "malformed";

/** The single JSON envelope exchanged over the WebSocket. `request`/`log`/`end`
 * flow server → client; `ready`/`decision` flow client → server; `error` flows
 * server → client. Discriminated on `type` so it is type-safe end-to-end. */
export type WireMessage =
  | { type: "ready"; deck: DeckList }
  | { type: "request"; request: Request }
  | { type: "log"; entries: BattleLogEntry[] }
  | { type: "decision"; requestId: number; decision: Decision }
  | { type: "end"; winner: PlayerId | null }
  | { type: "error"; code: WireErrorCode; message: string; issues?: DeckIssue[] };

/** Serialize a wire message to the transport string. JSON is the only encoding
 * in v1; keeping the shape here (rather than ad-hoc JSON.stringify call sites)
 * is what makes the envelope a shared, I/O-free contract. */
export function encodeWire(message: WireMessage): string {
  return JSON.stringify(message);
}

/** Parse a transport string into a wire message. Throws on malformed JSON so
 * callers can map it to an `error` envelope with code `malformed`. */
export function decodeWire(data: string): WireMessage {
  return JSON.parse(data) as WireMessage;
}
