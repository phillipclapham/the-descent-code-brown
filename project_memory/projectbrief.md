# The Descent: Code Brown - Project Brief

## Core Concept

ASCII roguelike dungeon crawler with comedic twist: protagonist has urgent bathroom emergency and must fight through procedurally generated dungeon floors to reach the only working bathroom at the bottom.

**Genre:** Roguelike, ASCII, Comedy
**Platform:** Browser (HTML/Canvas + JavaScript)
**Development:** Solo (Phill + Claude/Claude Code)
**Purpose:** Zero-pressure fun project, cognitive architecture support

## The Hook

Serious roguelike mechanics meet absurd premise. Classic ASCII aesthetic (`@` for player, `#` for walls, `Z` for enemies) with escalating desperation meter adding unique pressure mechanic beyond traditional roguelike survival.

## Core Mechanics

### Desperation Meter
- Visual UI element that climbs over time
- Affects gameplay: movement speed decreases, damage output increases (RAGE)
- Creates time pressure without strict timer
- Core comedic tension engine

### Roguelike Fundamentals
- Procedurally generated dungeon floors
- Permadeath (comedic game over: "You didn't make it")
- Turn-based or real-time with pause
- ASCII rendering (no art assets needed)
- Items, weapons, enemies
- Descend through floors to reach bottom

### Victory Condition
Reach bottom floor, overcome final obstacle/boss, find the working bathroom. Victory screen in ASCII art glory.

## Technical Scope (100% Solo-able)

**What We CAN Build:**
- ✓ Procedural dungeon generation algorithms
- ✓ ASCII rendering via HTML Canvas or DOM
- ✓ Player movement and collision detection
- ✓ Combat systems (turn-based or real-time)
- ✓ Inventory management
- ✓ Enemy AI behaviors
- ✓ Desperation meter mechanics
- ✓ Item/weapon systems
- ✓ Permadeath and game state
- ✓ Keyboard controls
- ✓ Save/load systems
- ✓ Basic audio (Web Audio API bleeps)

**What We DON'T Need:**
- ✗ Pixel art (ASCII handles all visuals)
- ✗ Complex music (basic bleeps sufficient)
- ✗ Sprites or animations (character-based display)

## Feature Set

### Phase 1: Core Systems
- Player character (`@`) with keyboard movement
- Basic dungeon display (walls, floors, stairs)
- Desperation meter UI
- Simple collision detection
- Game loop structure

### Phase 2: Dungeon Generation
- Procedural floor generation (rooms + corridors)
- Stairs down between levels
- Item spawning
- Enemy placement
- Multiple floor variety

### Phase 3: Combat & Items
- Enemy types with basic AI
- Combat mechanics (melee/ranged)
- Weapon variety (plunger, toilet paper, etc.)
- Item pickups and inventory
- Health/damage systems

### Phase 4: Polish & Balance
- Game over screens (comedic)
- Victory sequence
- Difficulty balancing
- Sound effects (basic bleeps)
- Tutorial/help screen
- High score tracking

## Technical Architecture

**Core Technologies:**
- Vanilla JavaScript (or minimal framework)
- HTML5 Canvas for rendering
- Web Audio API for sound
- localStorage for save states

**Key Systems:**
- Game loop (update/render cycle)
- Entity-Component System (player, enemies, items)
- Dungeon generation algorithm (BSP or rooms+corridors)
- Input handling (keyboard)
- State management (game states, menus, etc.)
- Collision detection system

## Design Principles

### Gameplay
- Classic roguelike feel with comedic twist
- Fair but challenging (procedural RNG)
- Desperation adds unique pressure
- Short runs (15-30 min to bottom)
- Replayability through procedural generation

### Technical
- Keep it simple (vanilla JS preferred)
- Modular systems (easy to extend)
- Performance matters (smooth 60fps)
- Browser-based (no build tools required initially)

### Aesthetic
- Clean ASCII presentation
- Readable characters and symbols
- Clear UI/HUD
- Comedic tone in all text
- Victory worth the journey

## Success Criteria

**Minimum Viable Game:**
- 5-10 procedurally generated floors
- Player can move, fight, and pick up items
- Desperation meter affects gameplay
- Permadeath works correctly
- Victory condition achievable
- Runs in browser smoothly

**Polish Goals:**
- Sound effects enhance experience
- Balance feels fair but challenging
- Tutorial explains mechanics
- High score system adds replayability
- Code is clean and maintainable

## Strategic Context

**Role in Portfolio:**
- Demonstrates technical capability (algorithms, systems)
- Shows creative range (comedy + classic genre)
- Pure fun project (no commercial pressure)
- Cognitive architecture support (need multiple contexts)

**Not Part of Adaptive Human Brand:**
This is personal fun project, not commercial product. May release publicly for portfolio/fun but no monetization plans.

## Development Philosophy

**Session-Based:**
- 30-45 minute focused sessions
- Clear goals per session
- Sequential execution (finish before moving on)
- Organic growth (subsessions when momentum strong)

**Reality Over Plan:**
- Follow what works, not rigid plan
- Document actual approach taken
- Pivot when blocked, don't force

**Quality Through Simplicity:**
- Remove until it breaks
- Every feature must earn its keep
- Function drives form
- First principles over patterns

---

**Status:** Project initialized, ready for Phase 1 Session 1
**Next:** Build core game loop with player movement and basic display
