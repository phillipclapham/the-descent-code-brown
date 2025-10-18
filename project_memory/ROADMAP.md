# Project Roadmap

**Project:** The Descent: Code Brown  
**Type:** ASCII Roguelike  
**Timeline:** Organic (no deadline pressure)  
**Last Updated:** 2025-10-18

---

## Vision

Classic ASCII roguelike mechanics with comedic desperation twist. Player must descend through procedurally generated dungeon floors to reach the only working bathroom at the bottom, all while desperation meter climbs.

**Core Loop:** Explore → Fight → Loot → Descend → Survive → Victory (finally poop!)

---

## Phase 1: Core Systems (Sessions 1-3)

**Goal:** Get basic playable game running

### Session 1: Game Loop & Player Movement ⏳
- Basic HTML + Canvas setup
- Game loop with update/render cycle
- Player character (@) with keyboard controls
- Simple boundary collision

### Session 2: Desperation Meter & Collision
- Implement desperation meter UI
- Time-based increase mechanic
- Visual representation (bar or percentage)
- Enhanced collision detection system

### Session 3: Basic Dungeon & Stairs
- Simple dungeon layout (walls #, floors .)
- Stairs down (>) to next level
- Multi-floor structure
- Level transition logic

**Phase Success Criteria:**
- Player can move around a simple dungeon
- Desperation meter visible and increasing
- Can descend between floors via stairs
- Game loop stable and smooth

---

## Phase 2: Dungeon Generation & Game Identity (Sessions 4-8) ⏳

**Goal:** Build generation worthy of roguelike legends AND define game identity

**Philosophy:** Love letter to the genre - get the foundation RIGHT before adding combat

### Session 4: Room Variety & Architectural Features
- 6 room shapes (rectangular, circular, cross, L, T, diamond)
- Room categorization (closet → small → normal → large → grand)
- Pillars in large rooms (tactical cover)
- Center features (fountains, altars)
- New tiles: TILE_PILLAR, TILE_FEATURE
- Distribution: 1 grand, 2-3 large, 3-5 normal per floor

### Session 5: Corridor Sophistication & Connectivity
- Winding multi-segment corridors (not just L-shapes)
- Nearest neighbor connections (not sequential)
- Loops and alternate routes (25% secondary connections)
- Dead-end alcoves for items
- T-intersections, hallway rooms
- Connectivity validation (flood-fill)

### Session 6: Doors, Keys & Special Rooms
- Door types: open, closed, locked
- Key system (pickup, unlock doors)
- Special rooms: treasure vault (locked), shrine, arena, library, trap
- Door placement at room entrances
- 1-2 special rooms per floor
- New tiles: TILE_DOOR_*, TILE_KEY

### Session 7: Thematic Depth & Polish
- 4 floor themes: Office (10-8) → Maintenance (7-5) → Sewers (4-2) → Throne Room (1)
- Theme affects: wall colors, features, room density
- Vault system: 10+ hand-crafted room templates
- Environmental hazards: water, chasms, traps
- Generation quality metrics and validation
- New tiles: TILE_WATER, TILE_CHASM, TILE_TRAP

### Session 8: Game Identity & Mechanics Design ⭐ CRITICAL
- **Design session** (50% discussion, 25% docs, 25% prototype)
- Desperation mechanics deep dive (thresholds, effects on movement/combat)
- Enemy concepts (5-7 types, thematically coherent)
- Item concepts (10-15 items categorized: weapons, consumables, equipment)
- Unique mechanics (Clench, desperation moves, environmental interaction)
- Win condition design (victory sequence, scoring)
- Create GAME_DESIGN.md as Phase 3 bible
- Bridge to Phase 3: ensure generation serves gameplay

**Phase Success Criteria:**
- 6+ room shapes, 5 room sizes, 5+ special room types
- Organic corridors with loops and variety
- Doors and keys working (progression gates)
- 10+ vault templates spawning
- 4 thematic floor tiers visually distinct
- Game identity clearly documented
- Desperation mechanics designed
- Enemy/item concepts finalized
- Ready for Phase 3 with clear vision

---

## Phase 3: Combat & Items (Sessions 9-12)

**Goal:** Fighting and inventory systems that leverage Phase 2 foundation

**Note:** Phase 3 will use all Phase 2 work (room types, features, doors, themes)

### Session 9: Combat Mechanics & Basic Enemy
- Combat system (turn-based or real-time - decided in Phase 2 Session 8)
- Basic enemy type (thematically appropriate from GAME_DESIGN.md)
- Health system for player and enemies
- Attack/damage mechanics
- Desperation effects on combat (rage mode from Session 8 design)

### Session 10: Weapon Variety & Inventory
- Multiple weapon types (plunger, wrench, TP launcher - from Session 8 design)
- Inventory system (ASCII display)
- Pickup and equip mechanics
- Weapon stats and differences
- Items spawn in appropriate rooms (vaults, special rooms)

### Session 11: Enemy Types & AI
- Multiple enemy types (from GAME_DESIGN.md concepts)
- Tactical AI (use pillars for cover, doorways as chokepoints)
- Enemy spawning in appropriate rooms (arenas, trap rooms)
- Difficulty scaling with depth and floor themes

### Session 12: Unique Mechanics & Items
- Implement signature mechanics (Clench, desperation moves, etc. from Session 8)
- Item effects (antacids, coffee, consumables from Session 8 design)
- Environmental interactions (water slows, traps damage, chasms block)
- Desperation threshold effects fully implemented

**Phase Success Criteria:**
- Combat feels satisfying and uses tactical features
- Multiple weapons with distinct feel (thematically coherent)
- Enemies have varied behaviors and fit themes
- Player can manage inventory
- Difficulty increases as you descend
- Unique mechanics make game memorable
- Desperation affects gameplay meaningfully

---

## Phase 4: Polish & Balance (Sessions 13-15)

**Goal:** Complete, polished, playable game

### Session 13: Game Over & Victory Screens
- Comedic game over ("You didn't make it...")
- Victory screen (ASCII art bathroom, from Session 8 design)
- Victory sequence (stats, scoring from Session 8 formula)
- Sound effects (basic Web Audio bleeps)
- Screen transitions and polish

### Session 14: Balance & Difficulty
- Tune enemy health/damage
- Adjust item spawn rates
- Balance desperation meter rate and threshold effects
- Test full playthrough (10 floors start to finish)
- Difficulty curve feels fair but challenging

### Session 15: Tutorial & Final Polish
- Tutorial/help screen (controls, mechanics, desperation system)
- High score tracking (localStorage, scoring formula from Session 8)
- Code cleanup and documentation
- Final bug fixes
- Public README with game description
- Deployment preparation

**Phase Success Criteria:**
- Game is completable (beatable but challenging)
- Difficulty feels fair but challenging
- All screens look good (game over, victory, tutorial)
- Scoring system works and feels rewarding
- Code is clean and maintainable
- Ready to share publicly
- Players understand mechanics (tutorial effective)

---

## Future Enhancements (Post-Launch)

**If momentum continues:**
- More enemy types
- Boss fight at bottom floor
- Power-ups and special items
- Multiple character classes
- Achievements system
- Leaderboard (online)
- Different dungeon themes
- New game+ mode

**Strategic Note:**
This is a zero-pressure fun project. If it's not fun anymore, pause or pivot. No obligation to complete all phases. The goal is enjoyment and cognitive architecture support (having multiple contexts available).

---

## Technical Debt Tracking

*Document any shortcuts or "fix later" items here*

None yet - starting fresh!

---

## Design Decisions

*Major architectural or gameplay decisions will be documented here as they arise*

**Pending Decisions:**
- Turn-based vs real-time combat?
- Grid-based vs pixel-perfect movement?
- Permadeath harshness (lose everything or keep some progress)?
- Desperation meter: how fast should it increase?

---

## Success Metrics

**Minimum Viable Game:**
- 5-10 floors deep
- 3+ enemy types
- 3+ weapon types
- Desperation meter affects gameplay
- Completable end-to-end
- Runs smoothly in browser

**Stretch Goals:**
- 10+ floors
- Boss fight
- Multiple playthroughs feel fresh
- Friends enjoy playing it
- Code quality high enough to share

---

**Remember:** This is for FUN. If a phase isn't enjoyable, skip it or pivot. The process is more important than the outcome.
