import type { Decision, Request } from "../sim/protocol.js";
import type { DeckList, PlayerId } from "../sim/types.js";
import { decodeWire, encodeWire } from "../sim/wire.js";
import type { WireMessage } from "../sim/wire.js";

/** A minimal scripted WebSocket client for driving the relay in tests. It
 * buffers incoming wire messages and resolves `next()` calls against them,
 * which is all the integration tests need to play a full game headlessly. */
export class HeadlessClient {
  readonly ws: WebSocket;
  player: PlayerId | null = null;
  private inbox: WireMessage[] = [];
  private listeners: ((message: WireMessage) => void)[] = [];

  private constructor(url: string) {
    this.ws = new WebSocket(url);
    this.ws.onmessage = (event: MessageEvent) => {
      const message = decodeWire(String(event.data));
      if (message.type === "request") this.player = message.request.player;
      this.inbox.push(message);
      for (const listener of [...this.listeners]) listener(message);
    };
  }

  static connect(url: string): Promise<HeadlessClient> {
    return new Promise((resolve, reject) => {
      const client = new HeadlessClient(url);
      client.ws.onopen = () => resolve(client);
      client.ws.onerror = () => reject(new Error("HeadlessClient: failed to connect"));
    });
  }

  send(message: WireMessage): void {
    this.ws.send(encodeWire(message));
  }

  ready(deck: DeckList): void {
    this.send({ type: "ready", deck });
  }

  decide(requestId: number, decision: Decision): void {
    this.send({ type: "decision", requestId, decision });
  }

  /** Wait for the next buffered-or-future message matching `predicate`. */
  next(predicate: (message: WireMessage) => boolean, timeoutMs = 5000): Promise<WireMessage> {
    const index = this.inbox.findIndex(predicate);
    if (index >= 0) {
      const message = this.inbox[index];
      this.inbox.splice(index, 1);
      return Promise.resolve(message);
    }
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.listeners = this.listeners.filter(l => l !== onMessage);
        reject(new Error("HeadlessClient: timed out waiting for message"));
      }, timeoutMs);
      const onMessage = (message: WireMessage): void => {
        if (!predicate(message)) return;
        clearTimeout(timer);
        this.listeners = this.listeners.filter(l => l !== onMessage);
        const idx = this.inbox.indexOf(message);
        if (idx >= 0) this.inbox.splice(idx, 1);
        resolve(message);
      };
      this.listeners.push(onMessage);
    });
  }

  waitForRequest(predicate?: (request: Request) => boolean, timeoutMs = 5000): Promise<Request> {
    return this.next(
      message => message.type === "request" && (!predicate || predicate(message.request)),
      timeoutMs,
    ).then(message => (message as Extract<WireMessage, { type: "request" }>).request);
  }

  waitForEnd(timeoutMs = 5000): Promise<PlayerId | null> {
    return this.next(message => message.type === "end", timeoutMs).then(
      message => (message as Extract<WireMessage, { type: "end" }>).winner,
    );
  }

  close(): void {
    this.ws.close();
  }
}
