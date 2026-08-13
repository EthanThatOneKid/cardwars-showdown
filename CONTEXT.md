# Card Wars domain glossary

Terms as used by the official Cryptozoic Adventure Time Card Wars ruleset
(2012/2013 base line) and this engine.

- **Hero**: a player. Each Hero has **Hit Points**, starting at 25; reduce an
  opponent's Hit Points to 0 to win. ("Florp" is the fan/app variant term for
  the same track — never used for this engine's official rules.)
- **Lane**: one of the four columns on a player's side of the board, built
  from two paired **Landscape** tiles. A Lane can hold a **Creature** and a
  **Building**.
- **Landscape**: the tile under a Lane giving it a **faction** type. Four per
  player, one per Lane, chosen at setup from the deck's faction mix.
- **Faction**: a card type-grouping tied to a Landscape — Cornfield, Blue
  Plains, Useless Swamp, Sandy Lands, Nice Lands — plus the **Rainbow** side
  faction, whose cards may be played on any Landscape.
- **Creature**: a card played on a Lane; has ATK and DEF; when Ready, must
  **Fight** at the end of its owner's turn.
- **Building**: a card played below a Lane; may carry abilities.
- **Spell**: a card cast from hand that never enters play.
- **Action**: the generic resource spent to play cards; each Hero receives 2
  per turn.
- **ATK / DEF**: a Creature's attack and defense values. When damage on a
  Creature is **equal to or greater than its DEF**, it is destroyed.
- **Floop**: an ability a card can use by exhausting itself instead of
  Fighting that turn.
- **Fight**: the end-of-turn combat phase. Every Ready Creature must Fight:
  if the opposing Lane holds a Creature, both deal their ATK simultaneously;
  if it is empty, the attacking Creature deals its ATK to the opposing
  Hero's Hit Points.
- **Rainbow**: the side faction; Rainbow cards play on any Landscape.
- **Unsupported**: an official interaction this engine does not yet
  implement. The engine must always say so explicitly rather than guess.