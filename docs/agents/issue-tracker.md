# Issue tracker

This repo's work is tracked in **GitHub Issues** on
`EthanThatOneKid/cardwars-showdown`, driven through the `gh` CLI.

## Wayfinding operations

The wayfinder skill uses this repo's issue tracker to run "maps" — a planning
effort for a destination too big for one session.

### Labels

- `wayfinder:map` — the effort's map issue (one per effort).
- `wayfinder:ticket` — every decision ticket in a map.
- `wayfinder:research` / `wayfinder:prototype` / `wayfinder:grilling` /
  `wayfinder:task` — the ticket's type (every ticket carries one).

### Finding things

- Map: `gh issue list --label wayfinder:map --state open`
- Open tickets: `gh issue list --label wayfinder:ticket --state open`
- A ticket's full question: `gh issue view <n>`

### Ticket bodies

Every ticket body starts with a `## Question` section. Blocking edges are
declared in the body:

```markdown
## Blocked by

- #<blocking issue number>
```

GitHub has no native issue-to-issue dependency graph, so this cross-reference
convention is the mechanism: it renders as a linked reference and lets the
frontier be computed from bodies. A ticket is **unblocked** when every issue
it lists under `## Blocked by` is closed; the **frontier** is the open,
unblocked, unclaimed tickets.

### Claiming a ticket

Assign the issue to yourself **before** working it, so concurrent sessions
skip it:

```powershell
gh issue edit <n> --add-assignee "@me"
```

An open, unassigned ticket is unclaimed.

### Resolving a ticket

1. Post the answer as a **resolution comment** on the issue.
2. Close the issue.
3. Append one line to the map's `## Decisions so far` — the ticket title
   (linked) plus a one-line gist of the answer.

### Research captures

Research tickets are resolved by a background `/research` subagent that
captures findings on a throwaway branch named `research/<slug>` and commits a
Markdown file under `docs/research/`. The ticket's resolution comment points
at the file, branch, and commit.