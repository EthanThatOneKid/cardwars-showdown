import type { Decision, PlayerView, PublicCard, Request } from "../sim/protocol.js";
import { makeRng } from "../sim/rng.js";
import { generateLegalDeck } from "../sim/runner.js";
import type { BattleLogEntry, DeckList, Faction, PlayerId } from "../sim/types.js";
import { decodeWire, encodeWire } from "../sim/wire.js";
import type { WireMessage } from "../sim/wire.js";

const WS_PATH = "/ws";

const FACTION_LABELS: Record<Faction, string> = {
  "cornfield": "Cornfield",
  "blue-plains": "Blue Plains",
  "useless-swamp": "Useless Swamp",
  "sandy-lands": "Sandy Lands",
  "nice-lands": "Nice Lands",
  "rainbow": "Rainbow",
};

function $(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element #${id}`);
  return el;
}

let socket: WebSocket | null = null;
let pendingDeck: DeckList | null = null;
let myPlayer: PlayerId | null = null;
let currentRequest: Request | null = null;
let selectedHandIndex: number | null = null;
let lastSent: { requestId: number; decision: Decision } | null = null;
let winner: PlayerId | null = null;
let gameOver = false;
let pendingResyncLog = false;

// ── deck submission ────────────────────────────────────────────────────────

function parseDeck(): DeckList {
  const raw = ($("deck-input") as HTMLTextAreaElement).value;
  const cards = raw.split(/[\s,]+/).map(s => s.trim()).filter(Boolean);
  return { name: "pasted", cards };
}

function connect(): void {
  const proto = location.protocol === "https:" ? "wss" : "ws";
  socket = new WebSocket(`${proto}://${location.host}${WS_PATH}`);
  socket.onopen = () => {
    if (pendingDeck) {
      socket!.send(encodeWire({ type: "ready", deck: pendingDeck }));
      pendingDeck = null;
      setStatus("Waiting for opponent…");
    } else {
      pendingResyncLog = true;
      setStatus("Reconnected — waiting for resync…");
    }
  };
  socket.onmessage = event => handleMessage(decodeWire(String(event.data)));
  socket.onclose = () => {
    if (!gameOver) {
      setStatus("Connection lost — reconnecting…");
      setTimeout(connect, 1000);
    }
  };
  socket.onerror = () => { /* handled via onclose */ };
}

function join(): void {
  const deck = parseDeck();
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    pendingDeck = deck;
    connect();
  } else {
    socket.send(encodeWire({ type: "ready", deck }));
    setStatus("Waiting for opponent…");
  }
}

function generateDeck(): void {
  const deck = generateLegalDeck(makeRng(Math.floor(Math.random() * 0xffffffff)));
  ($("deck-input") as HTMLTextAreaElement).value = deck.cards.join(", ");
  ($("deck-errors")).textContent = "";
}

// ── message handling ───────────────────────────────────────────────────────

function handleMessage(message: WireMessage): void {
  switch (message.type) {
    case "error": {
      if (message.code === "invalid-deck") {
        ($("deck-errors")).textContent = (message.issues ?? [])
          .map(issue => `- ${issue.message}`)
          .join("\n");
      } else if (message.code !== "stale-request") {
        setStatus(message.message);
      }
      break;
    }
    case "log": {
      if (pendingResyncLog) {
        // Resync log is the full cumulative log: rebuild the pane, don't append.
        pendingResyncLog = false;
        ($("log")).textContent = "";
      }
      for (const entry of message.entries) appendLog(entry);
      break;
    }
    case "request": {
      myPlayer = message.request.player;
      currentRequest = message.request;
      selectedHandIndex = null;
      if (lastSent && lastSent.requestId === message.request.requestId) {
        // The server is still waiting on this decision (we dropped mid-send):
        // re-issue it once. If it was already applied, the resync requestId
        // differs and we simply render the fresh state instead.
        const { decision } = lastSent;
        lastSent = null;
        socket?.send(encodeWire({ type: "decision", requestId: message.request.requestId, decision }));
        return;
      }
      lastSent = null;
      showBattle();
      render();
      break;
    }
    case "end": {
      gameOver = true;
      winner = message.winner;
      showGameOver();
      break;
    }
    default:
      break; // server → client only; ignore ready/decision echoes
  }
}

function sendDecision(requestId: number, decision: Decision): void {
  lastSent = { requestId, decision };
  socket?.send(encodeWire({ type: "decision", requestId, decision }));
}

// ── rendering ──────────────────────────────────────────────────────────────

interface BoardModel {
  playableLanes: Map<number, Set<number>>;
  spellHand: Set<number>;
  floopLanes: Set<number>;
  fightLanes: Set<number>;
  canDrawAction: boolean;
  canEndTurn: boolean;
  mulligan: boolean;
}

function buildModel(view: PlayerView): BoardModel {
  const model: BoardModel = {
    playableLanes: new Map(),
    spellHand: new Set(),
    floopLanes: new Set(),
    fightLanes: new Set(),
    canDrawAction: false,
    canEndTurn: false,
    mulligan: false,
  };
  for (const choice of view.choices) {
    switch (choice.type) {
      case "mulligan": model.mulligan = true; break;
      case "playCard": {
        const lanes = model.playableLanes.get(choice.handIndex) ?? new Set<number>();
        lanes.add(choice.lane);
        model.playableLanes.set(choice.handIndex, lanes);
        if (view.hand[choice.handIndex]?.type === "spell") model.spellHand.add(choice.handIndex);
        break;
      }
      case "floop": model.floopLanes.add(choice.lane); break;
      case "fight": model.fightLanes.add(choice.lane); break;
      case "drawAction": model.canDrawAction = true; break;
      case "endTurn": model.canEndTurn = true; break;
    }
  }
  return model;
}

function cardHtml(card: PublicCard | null, opts: { faceDown?: boolean; playable?: boolean; selected?: boolean; fightable?: boolean; dataAttrs?: string } = {}): string {
  if (!card) return "";
  const classes = ["card"];
  if (card.unsupported) classes.push("unsupported");
  if (opts.playable) classes.push("playable");
  if (opts.selected) classes.push("selected");
  if (opts.fightable) classes.push("fightable");
  if (opts.faceDown) {
    classes.push("face-down");
    return `<div class="${classes.join(" ")}" ${opts.dataAttrs ?? ""}>Card Wars</div>`;
  }
  const stats = card.type === "creature" ? `${card.atk}/${card.def}` : card.type === "building" ? "building" : "spell";
  const badge = card.unsupported ? '<span class="badge"> ⚠</span>' : "";
  const exhausted = card.exhausted ? " (exhausted)" : card.flooped ? " (flooped)" : "";
  return `<div class="${classes.join(" ")}" ${opts.dataAttrs ?? ""}>
    <div class="name">${card.name}${badge}</div>
    <div class="meta">${FACTION_LABELS[card.faction]} · ${stats} · ${card.actionCost}${card.actionCost === 1 ? " action" : " actions"}${exhausted}</div>
    ${card.damage > 0 ? `<div class="meta" style="color:var(--danger)">${card.damage} damage</div>` : ""}
    ${card.text ? `<div class="meta">${card.text}</div>` : ""}
  </div>`;
}

function laneHtml(laneIndex: number, lane: { landscape: { faction: Faction; faceDown: boolean }; creature: PublicCard | null; building: PublicCard | null }, model: BoardModel): string {
  const selectable = selectedHandIndex !== null && (model.playableLanes.get(selectedHandIndex)?.has(laneIndex) ?? false);
  const fightable = model.fightLanes.has(laneIndex);
  const creature = cardHtml(lane.creature, {
    fightable,
    dataAttrs: fightable ? `data-action="fight" data-lane="${laneIndex}"` : "",
  });
  const building = lane.building
    ? `<div class="card" style="opacity:.85">${cardHtml(lane.building)}</div>`
    : "";
  const floop = model.floopLanes.has(laneIndex)
    ? `<button class="floop-btn" data-action="floop" data-lane="${laneIndex}">Floop</button>`
    : "";
  const landscape = lane.landscape.faceDown ? "Face-down" : FACTION_LABELS[lane.landscape.faction];
  return `<div class="lane ${selectable ? "selectable" : ""}" data-action="${selectable ? "play-here" : ""}" data-lane="${laneIndex}">
    <div class="landscape">${landscape}</div>
    ${creature}
    ${building}
    ${floop}
  </div>`;
}

function render(): void {
  if (!currentRequest) return;
  const view = currentRequest.view;
  const model = buildModel(view);
  const mine = view.player === myPlayer;

  ($("phase")).textContent = `${view.phase} phase`;
  ($("turn")).textContent = `Turn ${view.turn}`;
  ($("my-hp")).textContent = `${view.hp}`;
  ($("my-deck")).textContent = `${view.deckCount}`;
  ($("my-discard")).textContent = `${view.discardCount}`;
  ($("my-actions")).textContent = `${view.resources}`;
  ($("opp-hp")).textContent = `${view.opponentHp}`;
  ($("opp-deck")).textContent = `${view.opponentDeckCount}`;
  ($("opp-discard")).textContent = `${view.opponentDiscardCount}`;

  const oppHand = Array.from({ length: view.opponentHandCount }, () =>
    `<div class="card face-down">Card Wars</div>`,
  ).join("") || '<span class="info">(no cards)</span>';
  ($("opp-hand")).innerHTML = oppHand;

  ($("opp-lanes")).innerHTML = view.opponentLanes
    .map((lane, i) => {
      const creature = cardHtml(lane.creature);
      const building = lane.building ? cardHtml(lane.building) : "";
      const landscape = lane.landscape.faceDown ? "Face-down" : FACTION_LABELS[lane.landscape.faction];
      return `<div class="lane">
        <div class="landscape">${landscape}</div>
        ${creature}
        ${building}
      </div>`;
    })
    .join("");

  ($("my-lanes")).innerHTML = view.lanes.map((lane, i) => laneHtml(i, lane, model)).join("");

  ($("my-hand")).innerHTML = view.hand
    .map((card, i) => {
      if (model.spellHand.has(i)) {
        return cardHtml(card, { playable: true, dataAttrs: `data-action="play-spell" data-hand-index="${i}"` });
      }
      const playable = model.playableLanes.has(i);
      return cardHtml(card, {
        playable,
        selected: selectedHandIndex === i,
        dataAttrs: playable ? `data-action="select-card" data-hand-index="${i}"` : "",
      });
    })
    .join("") || '<span class="info">(hand empty)</span>';

  ($("draw-action")).hidden = !model.canDrawAction;
  ($("end-turn")).hidden = !model.canEndTurn;
  ($("mulligan-bar")).hidden = !model.mulligan;
  ($("status")).textContent = mine ? "Your move" : `Waiting for ${view.activePlayer}…`;
}

function appendLog(entry: BattleLogEntry): void {
  const log = $("log");
  const div = document.createElement("div");
  div.className = `entry ${entry.actor === "system" ? "system" : ""}`;
  div.textContent = entry.actor === "system" ? entry.message : `[T${entry.turn}] ${entry.actor}: ${entry.message}`;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}

// ── screens ────────────────────────────────────────────────────────────────

function showBattle(): void {
  ($("deck-screen")).hidden = true;
  ($("battle-screen")).hidden = false;
  ($("game-over")).hidden = true;
}

function showGameOver(): void {
  ($("battle-screen")).hidden = false;
  ($("mulligan-bar")).hidden = true;
  ($("game-over")).hidden = false;
  const text = $("game-over-text");
  if (winner) {
    text.textContent = winner === myPlayer ? "You win! 🎉" : `${winner} wins.`;
  } else {
    text.textContent = "Draw — turn limit reached.";
    text.className = "draw-state";
  }
}

function setStatus(message: string): void {
  ($("status")).textContent = message;
  const deckStatus = document.getElementById("deck-status");
  if (deckStatus) deckStatus.textContent = message;
}

// ── controls (event delegation) ────────────────────────────────────────────

document.addEventListener("click", event => {
  const target = (event.target as HTMLElement).closest<HTMLElement>("[data-action]");
  if (!target || !currentRequest) return;
  const requestId = currentRequest.requestId;
  const action = target.dataset.action;
  const lane = Number(target.dataset.lane);
  const handIndex = Number(target.dataset.handIndex);

  switch (action) {
    case "play-spell":
      sendDecision(requestId, { kind: "playCard", handIndex, lane: 0 });
      break;
    case "select-card":
      selectedHandIndex = selectedHandIndex === handIndex ? null : handIndex;
      render();
      break;
    case "play-here":
      if (selectedHandIndex !== null) {
        sendDecision(requestId, { kind: "playCard", handIndex: selectedHandIndex, lane });
        selectedHandIndex = null;
      }
      break;
    case "floop":
      sendDecision(requestId, { kind: "floop", lane });
      break;
    case "fight":
      sendDecision(requestId, { kind: "fight", lane });
      break;
  }
});

($("join-btn")).addEventListener("click", join);
($("generate-btn")).addEventListener("click", generateDeck);
($("end-turn")).addEventListener("click", () => {
  if (currentRequest) sendDecision(currentRequest.requestId, { kind: "endTurn" });
});
($("draw-action")).addEventListener("click", () => {
  if (currentRequest) sendDecision(currentRequest.requestId, { kind: "drawAction" });
});
($("mulligan-yes")).addEventListener("click", () => {
  if (currentRequest) sendDecision(currentRequest.requestId, { kind: "mulligan", mulligan: true });
});
($("mulligan-no")).addEventListener("click", () => {
  if (currentRequest) sendDecision(currentRequest.requestId, { kind: "mulligan", mulligan: false });
});
($("play-again")).addEventListener("click", () => {
  location.reload();
});
