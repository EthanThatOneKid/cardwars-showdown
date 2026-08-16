import { serve } from "bun";
import type { Server, WebSocketHandler } from "bun";
import { Relay } from "./relay.js";

const WS_PATH = "/ws";

export interface AppServerOptions {
  port?: number;
  hostname?: string;
}

export interface AppServer {
  server: Server<undefined>;
  relay: Relay;
  port: number;
  url: string;
  close(): Promise<void>;
}

/** Bundle the client TS and serve it alongside the battle relay on one Bun
 * server. `sim/cli.ts` is never imported, so `process`/`require` stays out of
 * the browser bundle (the rest of `sim/` is I/O-free). */
export async function startAppServer(options: AppServerOptions = {}): Promise<AppServer> {
  const hostname = options.hostname ?? "localhost";
  const port = options.port ?? 8000;

  const build = await Bun.build({
    entrypoints: ["./client/main.ts"],
    target: "browser",
  });
  if (!build.success) {
    const messages = build.logs.map(log => String(log)).join("\n");
    throw new Error(`Client bundle failed:\n${messages}`);
  }

  const clientJs = await build.outputs[0].text();
  const indexHtml = await Bun.file("./client/index.html").text();
  const relay = new Relay();

  const server = serve({
    port,
    hostname,
    fetch(req, srv) {
      const url = new URL(req.url);
      if (url.pathname === WS_PATH) {
        if (srv.upgrade(req)) return;
        return new Response("WebSocket upgrade failed", { status: 400 });
      }
      if (url.pathname === "/" || url.pathname === "/index.html") {
        return new Response(indexHtml, {
          headers: { "content-type": "text/html; charset=utf-8" },
        });
      }
      if (url.pathname === "/client.js") {
        return new Response(clientJs, {
          headers: { "content-type": "text/javascript" },
        });
      }
      return new Response("Not Found", { status: 404 });
    },
    websocket: {
      open: ws => relay.onOpen(ws),
      message: (ws, message) => relay.onMessage(ws, String(message)),
      close: ws => relay.onClose(ws),
    } satisfies WebSocketHandler<undefined>,
  });

  return {
    server,
    relay,
    port: server.port ?? port,
    url: `http://${hostname}:${server.port ?? port}`,
    close: () => server.stop(true),
  };
}

if (import.meta.main) {
  const app = await startAppServer({ port: Number(process.env.PORT ?? 8000) });
  console.log(`Card Wars Showdown → ${app.url}`);
  console.log("Open two browser tabs to play a singles match.");
}
