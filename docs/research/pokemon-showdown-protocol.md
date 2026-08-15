# Pokemon Showdown Protocol Seams (Research)

Research ticket: **"Investigate primary sources for Pokemon Showdown protocol seams"**

**Scope.** This document captures the seams worth copying or adapting from
Pokemon Showdown for this repo's battle engine/server boundary: simulator/server
split, player request shape, `/choose` grammar, hidden-information boundaries,
public pipe-log format and replay reconstruction, server-side relay/validation,
and battle room lifecycle.

**Primary sources**
- P1: `ARCHITECTURE.md` in `smogon/pokemon-showdown` at commit
  `b22742debfdce6e640193384f5731b9030f9cb6e`:
  https://github.com/smogon/pokemon-showdown/blob/b22742debfdce6e640193384f5731b9030f9cb6e/ARCHITECTURE.md
- P2: `sim/SIMULATOR.md`:
  https://github.com/smogon/pokemon-showdown/blob/b22742debfdce6e640193384f5731b9030f9cb6e/sim/SIMULATOR.md
- P3: `sim/SIM-PROTOCOL.md`:
  https://github.com/smogon/pokemon-showdown/blob/b22742debfdce6e640193384f5731b9030f9cb6e/sim/SIM-PROTOCOL.md
- P4: `PROTOCOL.md`:
  https://github.com/smogon/pokemon-showdown/blob/b22742debfdce6e640193384f5731b9030f9cb6e/PROTOCOL.md
- P5: `sim/side.ts`:
  https://github.com/smogon/pokemon-showdown/blob/b22742debfdce6e640193384f5731b9030f9cb6e/sim/side.ts
- P6: `sim/pokemon.ts`:
  https://github.com/smogon/pokemon-showdown/blob/b22742debfdce6e640193384f5731b9030f9cb6e/sim/pokemon.ts
- P7: `sim/battle.ts`:
  https://github.com/smogon/pokemon-showdown/blob/b22742debfdce6e640193384f5731b9030f9cb6e/sim/battle.ts
- P8: `server/room-battle.ts`:
  https://github.com/smogon/pokemon-showdown/blob/b22742debfdce6e640193384f5731b9030f9cb6e/server/room-battle.ts
- P9: `server/rooms.ts`:
  https://github.com/smogon/pokemon-showdown/blob/b22742debfdce6e640193384f5731b9030f9cb6e/server/rooms.ts
- P10: `logs/logging.md`:
  https://github.com/smogon/pokemon-showdown/blob/b22742debfdce6e640193384f5731b9030f9cb6e/logs/logging.md

---

## 1. Sim/server split

Pokemon Showdown explicitly splits the product into a **Game server**, a
**Client**, and a **Login server**. The Game server handles chat rooms,
matchmaking, and battle simulation; battle room support is in `Rooms`, while
the simulation code lives under `sim/`. (P1)

The simulator API itself is a stream boundary. `sim/SIMULATOR.md` describes
`BattleStream` as an `ObjectReadWriteStream`: callers write player choices as
strings and read protocol messages as strings. The standard input form uses
`>start`, `>player p1`, `>p1 CHOICE`, etc.; the docs warn that text after
`>p1`/`>p2`/`>p3`/`>p4` can be untrusted player input. (P2)

`server/room-battle.ts` is the bridge. A room constructs battle options, writes
`>start ...` into the stream, listens for stream chunks, relays public `update`
messages into the room log, relays `sideupdate` messages only to the matching
player, and handles `end` data. (P8)

### Engine implication

Keep battle simulation as an authoritative stream-like module with a small
input vocabulary:

- `start`/`player` setup messages.
- Player decision messages keyed by player slot.
- Public update chunks for everyone.
- Private side update chunks for one player.
- End chunks containing structured metadata.

Treat every player decision string as untrusted until the simulator parses and
accepts it.

---

## 2. Player request object shape

The player's decision prompt is a `|request|REQUEST` protocol line. The
documented request contains `active` information for active Pokemon, `side`
information for the player's whole team, and an optional `rqid` when a Pokemon
Showdown server sits in front of the simulator. Direct simulator use does not
include `rqid`. (P3)

The TypeScript source defines the request union in `sim/side.ts`:

- `MoveRequest`: `{ active, side, ally?, noCancel?, update? }`
- `SwitchRequest`: `{ forceSwitch, side, noCancel?, update? }`
- `TeamPreviewRequest`: `{ teamPreview: true, maxChosenTeamSize?, side,
  noCancel? }`
- `WaitRequest`: `{ wait: true, side, noCancel? }` (P5)

The side payload is `{ name, id, pokemon, noCancel? }`, where each Pokemon entry
contains its visible-to-owner switch/request data: `ident`, `details`,
`condition`, `active`, non-HP stats, move IDs, `baseAbility`, `item`,
`pokeball`, and generation-specific ability/tera/revival fields. (P5, P6)

The server wraps simulator requests with request IDs. In `server/room-battle.ts`,
when a `sideupdate` contains `|request|`, the room increments `this.rqid`,
parses the simulator JSON, sets `request.rqid`, stores a per-player request
record, and sends the augmented request to that player. (P8)

### Engine implication

Model requests as state snapshots, not commands:

- The simulator owns the actual request shape.
- The server may decorate the request with transport/session metadata such as
  `rqid`.
- Reconnect support should store the last request plus any submitted choice and
  resend both to the player, as Showdown does with `|request|...` and
  `|sentchoice|...` on reconnect. (P8)

---

## 3. `/choose` decision grammar

Client-to-server battle decisions go through `/choose CHOICE`; for move and
switch decisions, shorthand `/move ...` and `/switch ...` are also accepted by
chat command aliases. The simulator API equivalent is `>p1 CHOICE` or
`>p2 CHOICE`. (P3, P8)

The documented grammar centers on these choices:

- `team TEAMSPEC` during Team Preview.
- `default` to auto-select the first legal decision.
- `undo` to cancel a previous choice when allowed.
- In Singles, one `POKEMONCHOICE`.
- In Doubles/Triples, comma-delimited `POKEMONCHOICE` entries.
- `POKEMONCHOICE` can be `default`, `pass`, `move MOVESPEC`, a move with
  modifiers such as `mega`, `zmove`, `max`, or `terastalize`, or
  `switch SWITCHSPEC`. (P3)

The implementation mirrors that grammar in `Side#choose`: it special-cases
`team`, otherwise splits comma-delimited choices, extracts the first word as
choice type, and dispatches to `chooseMove`, `chooseSwitch`, `chooseShift`,
`chooseTeam`, or `choosePass`. Invalid grammar or illegal choices emit
`|error|[Invalid choice] ...`; choices that reveal fresh unavailability data
emit `[Unavailable choice]` followed by a refreshed request. (P3, P5)

`Battle#choose` delegates to `side.choose(input)`, reports incomplete choices,
and only continues the battle once all required choices are complete. When all
choices are done, it records canonicalized choices in `battle.inputLog` as
`>pN choice`. (P7)

### Engine implication

Use a human-readable decision grammar but canonicalize accepted decisions into
an input log. The parser should live at the simulator boundary, not in the UI,
because it must validate legality against authoritative hidden state.

---

## 4. Hidden information boundaries

Pokemon Showdown has three important visibility layers:

1. **Public room log**: simulator `update` chunks are added to the battle room
   and sent to spectators/players. These are newline-and-pipe-delimited protocol
   lines documented in `SIM-PROTOCOL.md`. (P3, P8)
2. **Player-only side updates**: simulator `sideupdate` chunks carry
   player-specific request state and errors. The server routes each `sideupdate`
   by slot and sends it only to the relevant player. (P2, P8)
3. **Split messages inside public updates**: `sim/SIMULATOR.md` documents
   `|split|PLAYERID`, which contains a secret branch for a specific player or
   omniscient observer and a public branch suitable for opponents, teammates,
   and spectators. (P2)

The public protocol also deliberately hides or coarsens data. Team Preview
`|poke|` reveals a Pokemon's visible details and item presence, but hides
forme/shiny data where the game would hide it. Switch and damage messages show
exact current/max HP only to the Pokemon's owner; opponents see a percentage or
coarser fraction depending on rules. (P3)

The replay uploader uses `room.getLog(hideDetails ? 0 : -1)`. The code hides
full details for most unfinished battles, allows full details for custom games,
and reveals random-team details after battle end. (P9)

### Engine implication

Do not maintain "one log with redactions applied later" unless the log format
can encode visibility. Emit separate channels:

- Public events safe for spectators.
- Per-player private request/update events.
- Optional split events for "same event, different detail" cases.

Replay export must choose a visibility level intentionally.

---

## 5. Public `|` log format and replay reconstruction

The public battle log is a text protocol. `SIM-PROTOCOL.md` states it is
newline-and-pipe-delimited. Most lines begin with a command type such as
`|player|`, `|teamsize|`, `|gametype|`, `|tier|`, `|rule|`, `|start|`,
`|turn|`, `|move|`, `|switch|`, `|-damage|`, `|-status|`, `|win|`, and
`|tie|`. (P3)

The general server protocol uses the same room envelope: server-to-client
messages can be prefixed by `>ROOMID`, and individual room messages are
newline-separated `|TYPE|DATA` records. The protocol cautions that chat message
payloads may themselves contain `|`, so parsers cannot blindly split all fields
without considering each command's grammar. (P4)

Showdown's persistent battle log data combines structured end metadata with
the replay log. On battle end, `server/room-battle.ts` parses the simulator's
`end` JSON, stores score/input-log data, and later writes a `.log.json` file
whose `log` field is `room.getLog(-1).split('\n')`, i.e. the replay log with
exact damage. (P8)

Replay upload sends the selected log, players, format, rating/privacy metadata,
and optionally the input log either to the direct replay database or through
the login server. (P9)

### Engine implication

Make the public log complete enough to reconstruct the viewed game, but keep
the input log as the authoritative deterministic record:

- Public/replay log: "what the viewer saw."
- Input log: setup plus accepted choices, suitable for deterministic replay,
  debugging, or reconstruction with simulator code.
- End metadata: winner, score, turn count, format, room ID, ratings, timestamp.

---

## 6. Server validation and relay

The server performs session/timing validation before forwarding a choice:

- Rejects choices while the battle is frozen.
- Maps the user to a battle player slot.
- Splits `/choose` payload as `choice|rqid`.
- Rejects when there is no active request.
- Rejects late or stale decisions when all players are already waiting or when
  the supplied `rqid` does not match the stored request.
- Marks the player as waiting, stores the submitted choice, and writes
  `>pN choice` to the simulator stream. (P8)

The simulator then performs game legality validation. `Side#chooseMove`,
`chooseSwitch`, `chooseTeam`, and related helpers validate switch slots,
trapping, disabled moves, targets, one-per-turn mechanics such as Mega/Z/Dynamax
/Terastallize, and incomplete multi-Pokemon choices. Invalid choices are
reported back through side updates rather than trusted because the server
forwarded them. (P5, P7)

Undo follows the same server guardrails: the user must have a waiting choice,
the request must not be stale, and the battle must not have advanced. The server
then writes `>pN undo`. (P8)

### Engine implication

Split validation into two layers:

- **Server/session validation**: "Is this user allowed to submit this decision
  for this current request?"
- **Simulator/rules validation**: "Is this decision legal in the current hidden
  game state?"

`rqid` is a useful anti-stale-choice seam and should be server-owned.

---

## 7. Battle room lifecycle

Room creation lives in `Rooms.createBattle`: it validates player count, prevents
self-battles, cancels ladder searches, rejects new battles during lockdown,
builds a room ID/title, creates a game room, constructs `RoomBattle` or
`BestOfGame`, applies privacy settings, and joins players into the room. (P9)

`RoomBattle` construction writes `>start` unless replay/import `inputLog` is
provided, creates player slots, attaches a timer, starts listening to the
simulator, and calls `start()`. Delayed-start and multi-player invite cases
display invite UI until all slots are filled; once all players join, the room
runs `onCreateBattleRoom` handlers and marks the battle started. (P8)

During play, `checkActive()` updates the global battle count only when the
battle has started, has not ended, and every player slot is active. On disconnect
or leave, active state/timer handling updates and the player receives
`|request|null`. (P8)

On end, the room clears player requests, ends the timer, updates ladder/logging
as appropriate, removes the battle from users' game lists, optionally reuploads
saved/autosaved replays, and applies hidden replay restrictions if needed. (P8)

`logs/logging.md` documents the persistence policy: rated battles are logged by
default; unrated battle logs require `logchallenges`; rated logs cannot be
disabled by config. (P10)

### Engine implication

A battle room should own:

- User/session membership and reconnect behavior.
- Timer/activity state.
- Privacy/replay policy.
- Relay between users and simulator.
- Persistence/upload side effects.

The simulator should own:

- Deterministic rules execution.
- Choice request generation.
- Choice legality.
- Public/private protocol messages.
- End-state metadata.

---

## 8. Design checklist for Card Wars Showdown

- Implement a small simulator stream/interface before adding web transport.
- Define `publicUpdate`, `sideUpdate`, and `end` message categories explicitly.
- Give each player request a server-owned monotonically increasing `rqid`.
- Store the last request and submitted choice for reconnects.
- Parse `/choose`-style commands in the engine boundary and canonicalize them.
- Keep session validation in the room/server layer and rules validation in the
  simulator.
- Treat public logs and private request data as different artifacts.
- Persist both replay/viewer logs and deterministic input logs.
