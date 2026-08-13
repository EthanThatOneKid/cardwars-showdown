# Deck Construction & Legality — Official Card Wars Rules (Research)

Research ticket: **"Pin the official deck-construction and legality rules"**
Scope: Cryptozoic *Adventure Time Card Wars* (2012/2013 base line; the physical
2-player TCG released February 2014). This document pins the *official* rules and
explicitly separates what the rules do **not** specify. It is the input to the
engine's deck-validation decision ticket.

Primary sources:
- Official rulebook PDF (Finn vs. Jake starter): `upload.snakesandlattes.com/rules/a/AdventureTimeCardWarsFinnvsJake.pdf` ("If you own additional cards, you can even customize your decks!")
- Archive.org scan: *Adventure Time Card Wars Collector's Pack with Official Deck List* — `archive.org/details/adventure-time-card-wars-ruleset`
- Card Wars fandom wiki: `cardwars.fandom.com/wiki/Landscapes_and_Factions`, `cardwars.fandom.com/wiki/Rainbow`
- BoardGameGeek forum threads (secondary, confirmation only)

---

## 1. Deck size

**A legal constructed deck is NOT required to be exactly 40 cards. 40 is the
*minimum*; there is no maximum.**

Verbatim from the official rulebook, section **"CUSTOMIZE YOUR DECK"**:

> "Be on the lookout for other Card Wars 2-player starter sets and add-on packs.
> Card Wars features three other Landscape types that don’t appear in this starter
> set. **The minimum deck size is 40 cards, but feel free to go over that if you
> want to.** The maximum number of a particular card that you can put into your
> deck is three. So you can’t have more than three copies of The Pig in your deck."

Deck size in the starter sets is exactly 40 cards, and this is the recommended /
default size, but it is explicitly only a **minimum**:

> "Accompanying this rulebook are two decks of 40 cards. In this 2-player game,
> each player takes command of one of the two decks."

The mulligan rules also treat 40 as the standard deck:

> "Taking a mulligan means you put your starting five cards back on top of your
> deck, reshuffle all 40 cards together, and then draw a new hand of five cards."

### Engine-implied legality
- **Minimum**: 40 cards.
- **Maximum**: none specified (unbounded). A deck > 40 is legal.
- A deck of exactly 40 is the default/pre-constructed form.

---

## 2. Copy limits

**The official maximum is 3 copies of any single named card per deck.** This is
stated explicitly in the rulebook (see the verbatim quote in §1):

> "The maximum number of a particular card that you can put into your deck is
> three. So you can’t have more than three copies of The Pig in your deck."

This is **3, not 4**. Confirmed independently by the 2025 Cryptozoic Kickstarter
FAQ ("the most you can have of any card in your deck is 3 copies") and by
BoardGameGeek posts quoting the design team.

- The rule is by card **name** ("a particular card … The Pig").
- **What is NOT specified**: the rulebook gives no explicit exception clause for
  any card (later sets mention a "horde" ability allowing 5 copies, but that is
  post-base-line expansion design talk from a BGG designer post, not in the
  base rulebook; treat it as out of scope unless the engine opts to implement it).

---

## 3. Faction / Landscape distribution

### 3a. The core rule (from the fandom wiki, verbatim)

> "Each player starts with 4 preselected landscape cards, one for each lane on the
> board. **The number of each landscape the player has is determined by how many
> cards the player has per faction.** Landscape cards can only be placed at the
> start of a match and cannot be changed during the match."

> "If your deck consists of more than one faction, it is important to place your
> landscape cards strategically to bring out the best in your creature's floop
> effects."

### 3b. How a deck's faction mix maps to the 4 Landscape tiles at setup

The 4 Landscape tiles are **selected by the player at setup**, one per Lane, and
the count of each Landscape type is derived from the count of that faction's cards
in the deck. Landscape tiles are locked in at the start of the match:

> "Landscape cards can only be placed at the start of a match and cannot be
> changed during the match." (wiki)

The rulebook's **"CUSTOMIZE YOUR DECK"** section explains the functional
consequence of how many of each Landscape you run:

> "Best of all, you can customize your deck! You don’t have to play with four
> matching Landscapes. You could even have a deck that uses a Cornfield,
> NiceLands, SandyLands, and Blue Plains. Just remember that in order to play a
> Creature, Spell, or Building that costs 2 Actions, you have to have 2 Landscapes
> of that type in play. Note that you can still play two Cornfield Creatures with
> a 1 Action cost in the same turn, even if you only have 1 Cornfield in play. If
> you are using four different types of Landscapes, all of your cards should cost
> 1 or less Action to play. However, Rainbow cards that cost 2 Actions may still
> be played, as they don’t require a specific Landscape. You can use a mix of
> Landscapes to play Rainbow cards that cost 2 Actions."

The number-of-Landscapes-of-a-type-to-play-a-card mechanic is spelled out in the
rulebook's "Creatures" section:

> "The number in the upper left is the Action Cost to play the card and also
> determines the **number of Landscapes of that type you need to control to be
> able to play it**."

So a card's **Action cost = how many Landscapes of its faction you must control**:
- A cost-1 Cornfield card needs **1** Cornfield Landscape controlled.
- A cost-2 Cornfield card needs **2** Cornfield Landscapes controlled.
- Rainbow cards need no specific Landscape (see §4).

### 3c. Multi-faction decks

Explicitly legal and encouraged. The rulebook literally gives the example of a
deck using Cornfield, NiceLands, SandyLands, and Blue Plains. A multi-faction
deck places 4 Landscape tiles drawn from its faction mix; the trade-off is that
splitting Landscapes means you will generally lack the 2-of-a-type needed for
cost-2 faction cards, so multi-faction decks are pushed toward cost-1-or-less
cards.

### 3d. All-Rainbow decks

The wiki (Landscapes and Factions, "Rainbow" section) states:

> "If a deck only consists of Rainbow Cards, the landscapes will automatically
> become Nice Lands."

So an all-Rainbow deck does **not** get to choose its Landscapes — they are
**automatically** all **Nice Lands** (4 Nice Lands tiles).

### 3e. Mono-faction decks

Yes, a deck can be mono-faction (and this is the standard starter form — Jake's
deck is 4 Cornfields, Finn's is 4 Blue Plains, etc.):

> "Four Cornfields Landscapes go with Jake’s deck, while the four Blue Plains
> Landscapes are associated with Finn’s deck. BMO’s deck uses the Useless Swamp
> Landscapes, while Lady Rainicorn’s deck uses the SandyLand Landscapes."
> (rulebook, "1. Choose a deck")

A mono-faction deck runs 4 Landscapes of that one faction.

### 3f. What is NOT specified about the mapping

- The rulebook does **not** give a precise numeric formula mapping "X cards of
  faction F" to "N Landscape tiles of F" beyond the qualitative wiki statement
  ("determined by how many cards the player has per faction") and the 1-or-2
  cost/landscape requirement.
- The **all-Rainbow → Nice Lands** rule is on the wiki and appears to describe the
  **app**, not the physical rulebook. The physical rulebook does **not** state the
  Nice Lands fallback. This is a genuine ambiguity for the engine: the wiki rule
  is unambiguous about intent, but it is not in the physical rulebook.
- The mapping for a *partially*-Rainbow deck (Rainbow + one or more factions) is
  **not** specified anywhere. The wiki only covers the all-Rainbow case. The
  physical rules give no rule for how Rainbow cards factor into Landscape counts.

---

## 4. Rainbow handling

Verbatim from the rulebook, **"Rainbow Cards"**:

> "The above Spell is a Rainbow card. The symbol in the upper right corner and the
> text on the bar under its art let you know that. **Rainbow cards may be played
> using any type of Landscape or combination of Landscapes, except for face-down
> Landscapes (as they have no type).** Creatures, Buildings, and Spells with an
> Action cost of 0 are always Rainbow cards. They may only be played during your
> own turn (even after spending your 2 Actions), but require no Landscape types to
> play. They may even be played if all of your Landscapes are face down."

And from the "CUSTOMIZE YOUR DECK" section:

> "However, Rainbow cards that cost 2 Actions may still be played, as they don’t
> require a specific Landscape. You can use a mix of Landscapes to play Rainbow
> cards that cost 2 Actions."

And from the specific-cards section:

> "Remember that Rainbow Creatures do not count as Cornfield, Useless Swamp,
> SandyLands, or Blue Plains Creatures."

Wiki (Rainbow page) corroboration:

> "The Rainbow faction is very well balanced. They can be used on any landscape…
> All spells and Buildings are Rainbow Cards."

### Key facts
- Rainbow cards play on **any** Landscape type or combination (never on a
  face-down Landscape, which has no type).
- **Cost-0 cards are always Rainbow** and require no Landscape type at all.
- Rainbow **creatures are not** Cornfield / Useless Swamp / SandyLands / Blue
  Plains creatures — i.e., Rainbow cards are their own faction and do **not** count
  toward a specific faction's card count for faction-distribution purposes.
- All Spells and Buildings are Rainbow (per wiki); Rainbow creatures are a subset.
- **What is NOT specified**: how Rainbow cards factor into the 4-Landscape
  distribution for a deck that is not all-Rainbow (see §3f). The wiki rule
  ("all-Rainbow → Nice Lands") is the only Rainbow-specific Landscape rule, and it
  only covers the all-Rainbow case.

---

## 5. Tournament / constructed legality

The official **physical rulebook is silent on tournament / constructed play**. It
contains:
- No tournament section.
- No "constructed" definition.
- No banned / restricted list.
- No official organized-play / tournament circuit rules.

Relevant facts from secondary/official-adjacent sources (for context only, NOT
part of the base-line physical ruleset):

- The **mobile app** has a "Deck Wars" PvP ladder mode (cardwars.fandom.com/wiki/Deck_Wars)
  with its own rules (trophy streaks, ~2-week seasons, Black/Gold card prizes).
  This is the *app*, not the physical game.
- The physical **Doubles Tournament** (2016) is a 2v2 product with its own
  team rules (per BGG); it is a separate product, not a "constructed legality"
  framework, and it's beyond the 2012/2013 base line.
- The 2025 Cryptozoic Kickstarter FAQ confirms the deck-construction convention
  for custom decks: "If you’re creating custom Card Wars decks, the most you can
  have of any card in your deck is 3 copies." — consistent with the base rulebook.

**Conclusion: there is no official banned/restricted list and no official
tournament legality framework in the official materials.** Deck legality for the
base line reduces to the §1–§4 constraints (minimum 40, max 3 copies by name,
faction/landscape distribution, Rainbow rules). The engine must not invent a
ban list or a tournament framework; if asked about one, it must say so explicitly.

---

## 6. What the rules do NOT specify

1. **Exact numeric faction→Landscape mapping.** The rulebook never gives a formula
   like "n cards of faction F ⇒ m Landscape tiles of F." Only the qualitative wiki
   statement ("determined by how many cards the player has per faction") and the
   1-or-2 cost/landscape requirement exist. (Note: the wiki's all-Rainbow →
   Nice-Lands rule appears to be from the app, not the physical rulebook.)
2. **Maximum deck size.** Only a minimum (40) is specified; there is no stated cap.
3. **Whether "copies" counts alternate arts / gold variants.** The rule is "a
   particular card" (by name); nothing specifies how distinct printings or variants
   of the same card are treated.
4. **Partial-Rainbow deck Landscape distribution.** How Rainbow cards count toward
   the 4 Landscape tiles when a deck mixes Rainbow with one or more factions is
   unspecified. Only the all-Rainbow case has a stated answer (auto Nice Lands),
   and that only on the wiki.
5. **How Landscapes are actually selected/chosen** at setup when a deck has
   multiple factions — the player picks, but the constraints on the choice (must
   it exactly mirror card counts? may the player deviate?) are not formalized.
6. **Tournament / constructed legality, ban list, restricted list, official
   tournament rules.** Entirely absent from the official materials (§5).
7. **Sideboards / card swaps between games.** Not mentioned.
8. **Deck legality for the all-Rainbow Nice-Lands fallback in the physical
   game.** The rulebook itself does not state it (see §3f/§4).
9. **Starting-5 mulligan interactions with oversized (>40) decks.** The rulebook's
   mulligan text says "reshuffle all 40 cards," implying the standard 40-card deck;
   behavior for larger decks is not specified.

---

## Sources

**Primary — official rulebook:**
- Official rulebook PDF (Finn vs. Jake starter), §"CUSTOMIZE YOUR DECK", §"Rainbow
  Cards", §"1. Choose a deck", §"Creatures":
  `https://upload.snakesandlattes.com/rules/a/AdventureTimeCardWarsFinnvsJake.pdf`
  (downloaded and text-extracted for this research; verbatim quotes above)

**Primary — archive.org scan:**
- *Adventure Time Card Wars Collector's Pack with Official Deck List* (rulebook
  + deck list), Cryptozoic, 2013:
  `https://archive.org/details/adventure-time-card-wars-ruleset`
  - Full text: `https://archive.org/download/adventure-time-card-wars-ruleset/Adventure%20Time%20Card%20Wars%20Ruleset_djvu.txt`
  - Text PDF: `https://archive.org/download/adventure-time-card-wars-ruleset/Adventure%20Time%20Card%20Wars%20Ruleset_text.pdf`

**Primary — fandom wiki:**
- "Landscapes and Factions":
  `https://cardwars.fandom.com/wiki/Landscapes_and_Factions`
- "Rainbow": `https://cardwars.fandom.com/wiki/Rainbow`
- "Deck Wars" (app ladder mode, context only):
  `https://cardwars.fandom.com/wiki/Deck_Wars`

**Secondary — confirmation only:**
- BoardGameGeek thread "Multiple Copies of the game?" (designer-confirmed 3-copy
  limit):
  `https://boardgamegeek.com/thread/986066/multiple-copies-of-the-game`
- Reddit r/CardWars "Is there any deck building rules in CW?" (confirms 40-min,
  no max, 3-copy-by-name):
  `https://www.reddit.com/r/CardWars/comments/28r4t2/is_there_any_deck_building_rules_in_cw/`
- Cryptozoic 2025 Kickstarter FAQ (confirms 3-copy limit for custom decks):
  `https://www.kickstarter.com/projects/cze/adventure-time-card-wars-2025/faqs`
- BGG entry for Doubles Tournament (2016, 2v2 product, context only):
  `https://boardgamegeek.com/boardgame/199007/adventure-time-card-wars-doubles-tournament`
