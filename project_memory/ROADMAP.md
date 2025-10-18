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

## Phase 2: Dungeon Generation (Sessions 4-6)

**Goal:** Procedural dungeon generation with variety

### Session 4: Procedural Room Generation
- Room generation algorithm (random sizes)
- Place rooms without overlap
- Create initial floor layouts
- Render rooms as distinct spaces

### Session 5: Corridor Connections & Variety
- Connect rooms with corridors
- Ensure all rooms accessible
- Add variety (room shapes, sizes)
- Place stairs intelligently

### Session 6: Item & Enemy Placement
- Spawn items in rooms
- Place enemies strategically
- Balance density across floors
- Test procedural variety

**Phase Success Criteria:**
- Each playthrough has different dungeon layout
- Rooms connected properly
- Items and enemies spawn reasonably
- Multiple floors feel distinct

---

## Phase 3: Combat & Items (Sessions 7-9)

**Goal:** Fighting and inventory systems

### Session 7: Combat Mechanics & Basic Enemy
- Combat system (turn-based or real-time)
- Basic enemy type (Z - zombie?)
- Health system for player and enemies
- Attack/damage mechanics

### Session 8: Weapon Variety & Inventory
- Multiple weapon types (plunger, toilet paper, etc.)
- Inventory system
- Pickup and equip mechanics
- Weapon stats and differences

### Session 9: Enemy Types & AI
- Multiple enemy types with distinct behaviors
- Basic AI (chase, patrol, ranged)
- Enemy spawning across floors
- Difficulty scaling with depth

**Phase Success Criteria:**
- Combat feels satisfying
- Multiple weapons with distinct feel
- Enemies have varied behaviors
- Player can manage inventory
- Difficulty increases as you descend

---

## Phase 4: Polish & Balance (Sessions 10-12)

**Goal:** Complete, polished, playable game

### Session 10: Game Over & Victory Screens
- Comedic game over ("You didn't make it")
- Victory screen (ASCII art bathroom)
- Sound effects (basic Web Audio bleeps)
- Screen transitions

### Session 11: Balance & Difficulty
- Tune enemy health/damage
- Adjust item spawn rates
- Balance desperation meter rate
- Test full playthrough

### Session 12: Tutorial & Final Polish
- Tutorial/help screen
- High score tracking (localStorage)
- Code cleanup
- Final bug fixes
- Public README

**Phase Success Criteria:**
- Game is completable
- Difficulty feels fair but challenging
- All screens look good
- Code is clean and maintainable
- Ready to share publicly

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
