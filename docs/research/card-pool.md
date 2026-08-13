# Card Wars — Six-Faction Base Card Pool Inventory

Research ticket: "Inventory the six-faction base card pool."

**Scope.** The official Cryptozoic *Adventure Time Card Wars* base product line —
the six original packs that the 10th-anniversary **Ultimate Collection** brings
together:

| Pack | Decks / factions introduced |
|------|------------------------------|
| CP1 — Finn vs Jake | Finn (Blue Plains), Jake (Cornfield) |
| CP2 — BMO vs Lady Rainicorn | BMO (Useless Swamp), Lady Rainicorn (SandyLands) |
| CP3 — Princess Bubblegum vs LSP | Princess Bubblegum (NiceLands), LSP (Blue Plains + Useless Swamp "Totally Rad" dual deck) |

The **Rainbow** side faction is shared across all three packs (cards playable on
any Landscape). Excluded per ticket: **For the Glory!** booster content, IcyLands
(CP4), 2v2 Doubles Tournament, Hero Packs, Kickstarter/promo cards.

**Totals.** 134 unique cards in the base line. Per-faction (unique card count):

| Faction | Unique cards |
|---------|--------------|
| Blue Plains | 25 |
| Cornfield | 15 |
| Useless Swamp | 29 |
| SandyLands | 14 |
| NiceLands | 19 |
| Rainbow | 32 |

(Counts are distinct card *names* per faction; Rainbow is a side faction whose
cards also appear across decks.)

> **Data provenance note.** Card stats and official text below were cross-checked
> across three sources: (1) the physical TCG wiki (cardwarstcg.fandom.com) card
> pages — confirmed verbatim for representative/complex cards (Cool Dog, Husker
> Knight, The Pig, and others); (2) the card-wars-discord-bot `cards.csv`
> (a fan-maintained, deck-accurate database keyed to the physical Collector's Pack
> deck lists); (3) the archive.org official rulebook scan (deck lists + "Specific
> Card" rulings). The other fandom wiki (cardwars.fandom.com) reflects the *mobile
> app* variant with different stat scales ("Magic Cost", star rarities) and is NOT
> the physical-TCG source; it was used only for card-name discovery.

---

## Conventions / glossary notes (from the official rulebook)

- **Action cost**: number in upper-left of the card; paid with the 2 generic
  Actions per turn.
- **Landscape cost**: number of controlled Landscapes of the required type to
  play the card. For Rainbow/0-cost cards there is no Landscape requirement.
- **ATK / DEF**: creature combat values. A card with `X` ATK/DEF (e.g. Husker
  Knight) has a variable stat defined by its own ability; the base printed value
  is `X`.
- **FLOOP**: exhaust the card (turn sideways) to use the ability instead of
  Fighting that turn.
- **Fight**: every Ready Creature must Fight at end of turn; simultaneous damage
  against the opposing Creature in the Lane, or direct damage to the opposing
  Hero if the Lane is empty.
- **"in this Lane"**: the Lane the card occupies (its own side).
- **Rainbow / 0-cost rule**: cards with Action cost 0 are always Rainbow and
  playable on any Landscape (including while all your Landscapes are face-down).
- **Replacing**: you may replace a *Ready* Creature you control with a new one;
  the replaced Creature goes to its owner's discard pile (with all its damage
  removed). Cannot replace a Flooped Creature.

---

## Blue Plains (25 cards)

*Hero: Finn. Deck: Finn's Blue Plains Deck (CP1) + LSP's Totally Rad deck (CP3) shared Blue Plains cards.*

### Creatures

| Name | Cost | ATK/DEF | Ability |
|------|------|---------|---------|
| Ancient Scholar | 1 | 1/7 | FLOOP >>> Return a random Rainbow card from your Discard Pile to your Hand. If you Control a Building in this Lane, gain 1 Action. |
| Blueberry Djini | 1 | 2/6 | When Blueberry Djini enters play, if it replaced a Creature, draw two cards. |
| Brain Gooey | 1 | 1/7 | When Brain Gooey enters play, if it replaced a Creature, it has +2 ATK this turn. |
| Cool Dog | 2 | 2/7 | Your Creatures on adjacent Lanes may not be Attacked. *(continuous)* |
| Dragon Claw | 1 | 1/8 | FLOOP >>> Move a Creature you control to an empty Lane. |
| Embarrassing Bard | 2 | 1/5 | FLOOP >>> Draw a card for each Flooped Creature you control (including this one). |
| Future Scholar | 2 | 2/8 | When Future Scholar enters play, if it replaced a Creature, gain 1 Action. |
| Grape Djini | 1 | 1/6 | When Grape Djini enters play, if it replaced a Creature, you may put a card from your discard pile on top of your deck. |
| Headphone Jerk | 2 | 2/7 | When Headphone Jerk enters play, if it replaced a Creature, deal 3 Damage to another Creature in this Lane. |
| Heavenly Gazer | 1 | 2/5 | FLOOP >>> Put a Spell from your discard pile on top of your deck. |
| Psionic Architect | 1 | 2/6 | When Psionic Architect enters play, you may ready a Flooped Creature you control. |
| Punk Cat | 1 | 2/6 | Each Creature that changed Lanes this turn has +2 ATK this turn. *(continuous)* |
| Struzann Jinn | 2 | 1/11 | +2 ATK for each Flooped Creature you control. *(continuous)* |
| Travelin' Skeleton | 1 | 0/8 | FLOOP >>> Travelin' Skeleton and another Creature you control change Lanes with each other. |
| Uni-Knight | 1 | 3/4 | Pay 1 Action >>> Target Creature in this Lane has -10 ATK this turn. |
| Woadic Chief | 2 | 2/10 | Woadic Chief has +2 ATK this turn for each Spell you have played this turn. *(this-turn)* |
| Woadic Marauder | 2 | 3/9 | When Woadic Marauder changes Lanes during a turn, draw a card. |
| X-Large Spirit Soldier | 1 | 1/9 | Each adjacent Creature has +1 ATK. *(continuous)* |

### Buildings

| Name | Cost | Ability |
|------|------|---------|
| Pyramidia | 1 | FLOOP >>> If you control a Creature in this Lane, gain 1 Action. Use it only to play a Creature into this Lane. |
| Schoolhouse | 1 | FLOOP >>> Your Creature in this Lane loses all abilities and gains the FLOOP ability of a random Creature (with a FLOOP ability) in your discard pile until end of turn. |
| Woad Mobile Home | 1 | FLOOP >>> Move a Creature in an empty adjacent Lane to this Lane (if empty). |

### Spells

| Name | Cost | Text |
|------|------|------|
| Gnome Snot | 1 | Draw 3 cards. |
| Pants of Awesome | 1 | Move target Creature you control to an empty Blue Plains Landscape you control, and then draw a card. |
| Strength Crystal | 2 | Target player draws five cards. |
| Subliminal Strength | 1 | Target Creature you control has +2 ATK this turn for each Spell you played this turn (including this one). |

---

## Cornfield (15 cards)

*Hero: Jake. Deck: Jake's Cornfield Deck (CP1).*

### Creatures

| Name | Cost | ATK/DEF | Ability |
|------|------|---------|---------|
| Archer Dan | 2 | 2/6 | FLOOP >>> Destroy target Building in Archer Dan's Lane. |
| Corn Dog | 1 | 0/12 | Corn Dog has +1 DEF for each Cornfield Landscape you control. If you control 3 or fewer Cornfield Landscapes, Corn Dog has +1 ATK. *(continuous)* |
| Corn Lord | 1 | 0/7 | Corn Lord has +1 ATK for each other Cornfield Creature you control. *(continuous)* |
| Corn Ronin | 1 | 1/6 | +1 ATK for each adjacent Cornfield Landscape. *(continuous)* |
| Cornataur | 2 | 2/10 | When Cornataur enters play, deal 1 Damage to your opponent for each Cornfield Landscape you control. |
| Field Reaper | 2 | 1/4 | **Additional Cost: Discard a card.** When Field Reaper enters play, move target Creature in this Lane to an adjacent empty Lane on your side. |
| Field Stalker | 1 | 1/10 | At the start of your turn, each player draws a card. *(continuous)* |
| Husker Knight | 2 | X/X | Husker Knight has +1 ATK and +2 DEF for each Cornfield Landscape you control. *(continuous; base printed ATK/DEF are X)* |
| Husker Worm | 1 | 5/4 | When Husker Worm enters play, flip a Cornfield Landscape you control face down. |
| Legion of Earlings | 2 | 2/8 | When Legion of Earlings enters play, you may return target Creature in this Lane to its owner's hand. |
| Patchy the Pumpkin | 1 | 0/5 | FLOOP >>> Deal 1 Damage to target Creature. Do this once for each Cornfield Landscape you control. (May only target each Creature once.) |
| Travelin' Farmer | 2 | 2/12 | When Travelin' Farmer leaves play, deal 1 Damage to your opponent for each card in his hand. |
| Wall of Ears | 1 | 2/4 | +1 DEF for each Cornfield Landscape in play (counting all players). *(continuous)* |

### Buildings

| Name | Cost | Ability |
|------|------|---------|
| Silo of Truth | 1 | Pay 2 Actions >>> Steal a random card from your opponent and play it at no cost. |

### Spells

| Name | Cost | Text |
|------|------|------|
| Field of Nightmares | 1 | Deal 1 Damage to your opponent for each card in his hand. |

---

## Useless Swamp (29 cards)

*Heroes: BMO (CP2 mono) and LSP (CP3 dual deck, shares with Blue Plains).*

### Creatures

| Name | Cost | ATK/DEF | Ability |
|------|------|---------|---------|
| Chest Burster | 1 | 1/10 | At the start of your turn, deal 3 Damage to each opponent who has no cards in hand. *(continuous)* |
| Dark Angel | 1 | 0/5 | +1 ATK for every 5 cards in your discard pile. *(continuous)* |
| Dr. Death | 2 | 1/7 | Destroy a Creature you control and FLOOP >>> Destroy target opposing Creature in this Lane. |
| Dragon Foot | 1 | 1/5 | Discard a card >>> Dragon Foot has +1 ATK this turn. (Use up to five times during each of your turns.) |
| Extraordinary Spider | 1 | 1/7 | At the start of your turn, deal 1 Damage to target opponent for every 5 cards in your discard pile. *(continuous)* |
| Fatapillar | 2 | 0/3 | +2 ATK for every 5 cards in your discard pile. *(continuous)* |
| Gray Eyebat | 1 | 2/7 | Pay 1 Action >>> Return a random Useless Swamp Creature from your discard pile to your hand. |
| Green Mermaid | 1 | 1/9 | Destroy Green Mermaid >>> Deal 1 Damage to each opposing Creature. |
| Green Merman | 2 | 0/6 | FLOOP >>> Put the top card of your deck into your discard pile. Deal Damage to each opposing Creature equal to the discarded card's Action Cost. |
| Herculeye | 2 | 1/6 | Discard a card >>> Herculeye has +4 ATK this turn. (Use only once during each of your turns.) |
| Hot Eyebat | 1 | 4/4 | Play Hot Eyebat only if you have 10 or more cards in your discard pile. *(continuous)* |
| Immortal Maize Walker | 2 | 2/8 | While Immortal Maize Walker is on a Cornfield Landscape, it deals triple Damage. *(continuous)* |
| Infinite Figure | 1 | 1/6 | Discard a card >>> Deal 1 Damage to another Creature in this Lane. (Use any number of times during each of your turns.) |
| Mace Stump | 1 | 3/3 | Destroy Mace Stump >>> Target opponent discards a card for every 5 cards in your discard pile. |
| Mouthball | 1 | 2/4 | +2 DEF for every 5 cards in your discard pile. *(continuous)* |
| Pink Merwitch | 2 | 2/8 | Discard a card >>> Deal 1 Damage to each opposing Creature. (Use only once during each of your turns.) |
| Red Eyeling | 1 | 2/6 | FLOOP >>> Return a card with cost 0 from your discard pile to your hand. |
| Skeletal Hand | 2 | 3/6 | FLOOP >>> Discard the top 3 cards of your deck. For each Spell discarded this way, target player discards a card. |
| Squatting Bald Man | 1 | 2/7 | Discard a card >>> Heal 1 Damage from Squatting Bald Man. (Use any number of times during each of your turns.) |
| Steakchop | 1 | 4/4 | At the start of your turn, discard 2 cards or destroy Steakchop. (Discard after your free draw.) *(continuous)* |
| Teeth Leaf | 2 | 3/10 | If you have 10 or more cards in your discard pile, pay 2 fewer Actions to play Teeth Leaf. *(continuous)* |
| Tree of Undeath | 2 | 2/6 | FLOOP >>> Return a random Creature from your discard pile to your hand. |

### Buildings

| Name | Cost | Ability |
|------|------|---------|
| Mausoleum | 1 | Your Creature in this Lane has +1 DEF for every 5 cards in your discard pile. |
| Night Tower | 1 | FLOOP >>> If your opponent has no Creature in this Lane they discard a card. |
| Palace of Bone | 1 | Opposing Creatures in this Lane don't trigger entering or leaving play effects. |
| Spirit Tower | 2 | Pay 1 Action and FLOOP >>> If you control no Creatures in this Lane, move target Creature in this Lane to your side and ready it. At end of turn, return it to its owner's side. |

### Spells

| Name | Cost | Text |
|------|------|------|
| Abraca Amadeus | 1 | Target opponent discards a card from his hand for every 5 cards in your discard pile. |
| Magic Ring Ding | 2 | Each of your Creatures has +1 ATK this turn for every 5 cards in your discard pile. |
| Toilet of Doom | 1 | Target Creature you control has +1 ATK this turn for every 5 cards in your discard pile. |

---

## SandyLands (14 cards)

*Hero: Lady Rainicorn. Deck: Lady Rainicorn's SandyLands Deck (CP2).*

### Creatures

| Name | Cost | ATK/DEF | Ability |
|------|------|---------|---------|
| Beach Mummy | 1 | 1/6 | FLOOP >>> Return a Creature in an adjacent Lane to its owner's hand. |
| Fummy | 1 | 2/7 | FLOOP >>> Gain 1 Action this turn. |
| Green Cactiball | 1 | 0/4 | +2 ATK for each Green Cactiball you control. *(continuous)* |
| Lost Golem | 3 | 5/6 | Lost Golem costs 1 less to play for each other Creature you have played this turn. *(continuous)* |
| Sand Eyebat | 2 | 1/10 | When another Creature enters play under your control, Sand Eyebat gains 1 DEF. |
| Sand Knights | 1 | 1/8 | +2 ATK if you control a Blue Plains Landscape. *(continuous)* |
| SandWitch | 1 | 0/12 | When SandWitch or another Creature enters play under your control, deal 1 Damage to your opponent. *(continuous)* |
| Sandhorn Devil | 1 | 3/6 | When Sandhorn Devil enters play, deal 1 Damage to each Creature in play (including each of your Creatures). |
| Sandsnake | 1 | 0/9 | When Sandsnake enters play, deal 4 Damage to target opposing Creature in this Lane. |
| Shark | 2 | 2/10 | When a SandyLands Creature enters play during your turn (including Shark), it has +1 ATK this turn. *(continuous)* |
| The Mariachi | 2 | 2/9 | FLOOP >>> Deal 1 Damage to target Creature for each Creature that entered play this turn. |
| Wall of Sand | 2 | 1/12 | If one or more other SandyLands Creatures enter play during your turn, Wall of Sand has +2 ATK this turn. *(continuous)* |

### Buildings

| Name | Cost | Ability |
|------|------|---------|
| Sand Sphinx | 1 | FLOOP >>> Return a Creature you control in this Lane to its owner's hand. |

### Spells

| Name | Cost | Text |
|------|------|------|
| Tome of Ankhs | 1 | Draw a card for each of your empty Lanes. |

---

## NiceLands (19 cards)

*Hero: Princess Bubblegum. Deck: Princess Bubblegum's NiceLands Deck (CP3).*

### Creatures

| Name | Cost | ATK/DEF | Ability |
|------|------|---------|---------|
| Albino Eyebat | 1 | 2/7 | While Albino Eyebat has exactly 2 Damage on it, it has +2 ATK. *(continuous)* |
| Angel of Chocolate | 2 | 3/7 | Pay 1 Action >>> Heal all Damage from Angel of Chocolate. |
| Angel of Vanilla | 1 | 2/6 | Pay 1 Action >>> Heal all Damage from Angel of Vanilla. |
| Apple Pieclops | 2 | 1/7 | At the start of your turn, you may heal or deal 1 Damage to each Creature you control. (Choose for each Creature.) |
| Cotton Eyebat | 1 | 1/8 | While Cotton Eyebat has exactly 4 Damage on it, it has +4 ATK. *(continuous)* |
| Cutie | 1 | 0/6 | FLOOP >>> You heal 1 Hit Point. (Can't go over 25.) |
| Fairy Shepard | 2 | 2/9 | Each Adjacent NiceLands Creature has +2 DEF. *(continuous)* |
| Ms. Fluff | 2 | 2/10 | While Ms. Fluff has exactly 7 Damage on it, it has +7 ATK. *(continuous)* |
| Niceasaurus Rex | 1 | 2/7 | At the start of your turn, if Niceasaurus Rex has Damage on it, draw a card. *(continuous)* |
| Pieclops | 1 | 2/7 | When Pieclops enters play, heal 1 Damage from each adjacent Creature. |
| Rainbow Eyebat | 1 | 1/4 | At the start of your turn, you heal 1 Hit Point for each different Landscape type you control. (Can't go over 25.) *(continuous)* |
| Snakemint | 1 | 1/7 | When Snakemint deals Damage to an opposing player, you heal that many Hit Points. (Can't go over 25.) |
| Wall of Chocolate | 2 | 1/9 | While Wall of Chocolate has no Damage on it, it has +3 ATK. *(continuous)* |

### Buildings

| Name | Cost | Ability |
|------|------|---------|
| Cave of Solitude | 2 | Discard a card >>> Your Creature in this Lane can't be targeted or attacked until the start of your next turn. |
| Windmill of Health | 1 | While your Creature in this Lane has no Damage on it, it has +2 ATK. |

### Spells

| Name | Cost | Text |
|------|------|------|
| Blue Candy | 1 | Heal up to 3 Damage from target Creature you control. |
| Falling Star | 2 | Creatures you control take no Damage from opposing Creatures this turn. |
| Piestorm | 1 | Each of your Creatures with no Damage has +2 ATK this turn. |
| Ring of Fluffy | 2 | Target Creature you control has +X ATK this turn, where X is the amount of Damage on it. |

---

## Rainbow (32 cards)

*Side faction; playable on any Landscape. Appears across all base packs.*

### Creatures

| Name | Cost | ATK/DEF | Ability |
|------|------|---------|---------|
| Angel Heart | 0 | 0/7 | While Angel Heart has exactly 3 Damage on it, it has +3 ATK. *(continuous)* |
| Big Foot | 0 | 1/4 | FLOOP >>> Flip target face-down Landscape you control face up. |
| Blonde MerWitch | 2 | 3/9 | *(flavor text; no ability)* — "The seas are her cauldron, and her ingredients are anything that sinks." |
| Cow | 0 | 1/5 | *(flavor text; no ability)* — "Moo." |
| Dogboy | 0 | 0/5 | Discard a card >>> Dogboy has +2 ATK this turn. (Use only once during each of your turns.) |
| Drooling Dude | 2 | 3/9 | *(flavor text; no ability)* |
| Evil Eye | 0 | 1/5 | *(flavor text; no ability)* |
| Goat | 0 | 1/4 | When Goat enters play, if it replaced a Creature, draw a card. |
| Ms. Mummy | 0 | 1/4 | At the start of your turn, you may return Ms. Mummy to its owner's hand. If you do, target SandyLands Creature you control gains 1 DEF. |
| Nice Ice Baby | 0 | 1/2 | +3 ATK while your opponent does not control a Creature in this Lane. *(continuous)* |
| Peach Djinni | 0 | 0/6 | When a SandyLands Creature enters play under your control, Peach Djinni has +1 ATK this turn. |
| Phyllis | 1 | 2/7 | *(flavor text; no ability)* |
| Sand Angel | 0 | 1/5 | *(flavor text; no ability)* |
| The Pig | 1 | 1/4 | FLOOP >>> Flip target Cornfield Landscape in this Lane face down. |
| Wandering Bald Man | 0 | 0/10 | At the start of your turn, put the top card of your deck into your discard pile. *(continuous)* |

### Buildings

| Name | Cost | Ability |
|------|------|---------|
| Blood Fortress | 1 | Your Creature in this Lane has +1 ATK. |
| Celestial Castle | 1 | Your Creature in this Lane has +3 DEF. |

### Spells

| Name | Cost | Text |
|------|------|------|
| Bone Wand | 0 | Play only if you control a Useless Swamp Creature. Target opponent discards a card from his hand. |
| Brief Power | 0 | Target Useless Swamp Creature you control has +2 ATK this turn. |
| Cerebral Bloodstorm | 1 | Deal 1 Damage to each opposing Creature. |
| Corn Scepter | 1 | Deal 1 Damage to target Creature for each Cornfield Landscape you control. |
| Cross Pollination | 2 | Each of your Cornfield Creatures has +1 ATK this turn for each different Landscape type you control. |
| Green Candy | 0 | Heal or deal 1 Damage to target Creature. |
| Ogre Gas | 0 | Reveal the top 3 cards of your deck. Put one of them on the bottom of your deck and discard the rest. |
| Reclaim Landscape | 0 | You may flip one of your Landscapes face up, and you may move one of your Buildings to one of your Lanes without one. |
| Snake Eye Ring | 0 | Return a random Useless Swamp Creature from your discard pile to your hand. |
| Teleport | 0 | Move one of your Creatures to one of your empty Lanes. |
| Unempty Coffin | 0 | Reduce the cost of the next Creature you play this turn by 2 Actions. |
| Volcano | 1 | Destroy target Building. You may deal 3 Damage to a Creature in that Lane. Flip your Landscape in that Lane face down. |
| Woad Blood | 0 | Each Creature that changed Lanes this turn has +2 ATK this turn. |
| Woad Talisman | 0 | Target Blue Plains Creature you control has +2 ATK this turn. |
| ZaZo's Magic Seeds | 0 | Target SandyLands Creature has +2 ATK this turn for each Creature that entered play into an adjacent Lane this turn. |

---

## Cards flagged for adjudication

The following cards reference mechanics or interactions that are **outside the
base rulebook** and must be adjudicated before the engine implements them. The
engine must say "unsupported" for these rather than guess.

1. **Uni-Knight** — "Target Creature in this Lane has **-10 ATK** this turn."
   Negative ATK is not covered by the base rulebook. Needs a ruling: can a
   Creature's ATK go below 0? What does a 0-or-negative-ATK Creature deal in a
   Fight?
2. **Field Reaper** — requires an **Additional Cost (discard a card)** to play.
   Base rulebook only describes Action costs; the "Additional Cost" mechanic
   needs a defined ordering (when the discard happens, what happens if you
   cannot pay).
3. **Husker Knight** — printed ATK/DEF are **X/X** (variable stat set by its
   ability). The card's base stat line is not a number; engine schema must
   represent variable-stat Creatures.
4. **Ring of Fluffy** — "has **+X ATK** this turn, where X is the amount of
   Damage on it." Damage-on-Creature is already tracked, so this is implementable,
   but the "X = damage on it" phrasing should be pinned to a Damage value read at
   resolution time.
5. **Field Stalker** — "At the start of your turn, **each player** draws a card."
   It affects the opponent too. Clarify whether this happens on every start of
   turn (yours) and whether the opponent's draw is mandatory.
6. **Nice Ice Baby** — "+3 ATK while your opponent does not control a Creature in
   this Lane." Rulebook's Specific-Card note clarifies the bonus applies only when
   attacking directly (empty Lane). Engine must encode the "direct attack only"
   restriction (not vs. a Creature).
7. **Sandhorn Devil** — "deal 1 Damage to **each Creature in play** (including
   each of your Creatures)." Global self-damage; confirm order and that it hits
   all Creatures on both sides simultaneously.
8. **Palace of Bone** — "Opposing Creatures in this Lane **don't trigger entering
   or leaving play effects**." Suppresses a whole class of triggered abilities;
   engine needs a suppression flag on entering/leaving triggers.
9. **Dr. Death** — "Destroy a Creature you control **and** FLOOP >>> ..." — a
   card that requires destroying your own Creature as a cost in addition to
   Flooping. Ordering and "can you target yourself with the destroy" need a ruling.
10. **Green Merman** — FLOOP puts the top card of your deck into your discard
    pile and deals damage **equal to that discarded card's Action cost**. Requires
    reading a card's cost after it has moved to the discard pile; confirm the card
    is revealed while resolving.

## Cards whose full official text needs verification

The card names, factions, costs, and ATK/DEF in this inventory were verified
against the physical TCG wiki and rulebook. The following are the cards I have
full text for but where **verbatim official wording** (exact punctuation / target
restrictions) should be re-confirmed against card scans before encoding — mostly
the longer or conditional-worded abilities:

- Ancient Scholar (multi-clause FLOOP with conditional "if you control a
  Building... gain 1 Action")
- Schoolhouse (long "loses all abilities and gains the FLOOP ability of a random
  Creature in your discard pile" — heavily conditional)
- Field Reaper, Field Stalker (see adjudication)
- Husker Knight (X/X variable stat)
- Spirit Tower (long conditional FLOOP with "At end of turn, return it to its
  owner's side")
- Green Merman, The Mariachi, Patchy the Pumpkin, Dr. Death, Silo of Truth,
  Sand Sphinx, Cave of Solitude, Pyramidia (conditional clause wording)
- All "flavor-text-only" Rainbow Creatures (Blonde MerWitch, Cow, Drooling Dude,
  Evil Eye, Phyllis, Sand Angel) — confirm each has **no** game ability (they
  appear to be pure flavor with no Floop).

> **Full text availability.** The complete official text for every card above is
> available on cardwarstcg.fandom.com per-card pages and in the card image scans
> hosted on Fandom. Because the pool is 134 cards and every name/stat is captured
> here, full verbatim transcription of every card can be pulled from those pages
> in a follow-up pass; the representative/complex cards (Cool Dog, Husker Knight,
> The Pig) have already been confirmed verbatim.

---

## Sources

- Adventure Time Card Wars TCG Wiki (physical TCG) — set lists and card pages:
  - https://cardwarstcg.fandom.com/wiki/Finn_vs_Jake_Collector%27s_Pack
  - https://cardwarstcg.fandom.com/wiki/BMO_vs_Lady_Rainicorn_Collector%27s_Pack
  - Per-card pages (e.g. Cool Dog, Husker Knight, The Pig): https://cardwarstcg.fandom.com/wiki/Cool_Dog
- Archive.org official rulebook scan "Adventure Time Card Wars Collector's Pack
  with Official Deck List" (2013):
  - https://archive.org/details/adventure-time-card-wars-ruleset
  - Full text: https://archive.org/stream/adventure-time-card-wars-ruleset/Adventure%20Time%20Card%20Wars%20Ruleset_djvu.txt
- Official rulebook PDF (Finn vs Jake):
  - https://upload.snakesandlattes.com/rules/a/AdventureTimeCardWarsFinnvsJake.pdf
- card-wars-discord-bot `cards.csv` (deck-accurate fan database; primary machine
  source for per-deck card lists and stats):
  - https://github.com/641i130/card-wars-discord-bot/blob/master/cards.csv
- Card Wars fandom wiki (mobile-app variant — used only for name discovery, NOT
  for physical-TCG stats):
  - https://cardwars.fandom.com/wiki/Blue_Plains , /wiki/Corn_Fields ,
    /wiki/Landscapes_and_Factions
- Cryptozoic — Ultimate Collection product / announcement (confirms the six
  original packs in scope):
  - https://cryptozoic.com/products/adventure-time-card-wars-ultimate-collection
  - https://www.kickstarter.com/projects/cze/adventure-time-card-wars-10th-anniversary
- BoardGameGeek — set entries:
  - https://boardgamegeek.com/boardgame/144728/adventure-time-card-wars-finn-vs-jake
  - https://boardgamegeek.com/filepage/106555/princess-bubblegum-vs-lumpy-space-princess-card-li
