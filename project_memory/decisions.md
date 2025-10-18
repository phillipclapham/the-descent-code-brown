# Technical Decisions

**Purpose:** Document architectural and design decisions with rationale. Prevents "why did we do this?" questions and preserves learning.

---

## Session 1: Core Game Loop & Player Movement

**Date:** 2025-10-18
**Status:** Complete

### Architecture Decisions

**Decision: ES6 Module Architecture**
- **What:** Separate files for renderer, player, input, game logic
- **Why:**
  - Clean separation of concerns
  - Easier to test and extend
  - Follows single responsibility principle
  - No need for bundler yet (browser-native modules)
- **Trade-offs:** Requires HTTP server for testing (CORS), but acceptable for development

**Decision: Grid-Based Movement System**
- **What:** 40x30 tile grid with 20px tiles, position stored as integers
- **Why:**
  - Natural fit for ASCII roguelike tradition
  - Simplifies collision detection
  - Makes dungeon generation cleaner (Phase 2)
  - Easier to implement turn-based mechanics if needed
  - Can add smooth interpolation later in polish phase
- **Alternative Considered:** Pixel-perfect movement
- **Why Not:** More complex collision, doesn't fit roguelike feel, harder dungeon gen

**Decision: Real-Time Game Loop**
- **What:** Continuous requestAnimationFrame loop with delta time
- **Why:**
  - Easier to test and debug initially (see movement immediately)
  - Desperation meter needs real-time updates anyway
  - Can layer turn-based combat on top in Phase 3
  - Modern roguelike hybrid approach works well
- **Alternative Considered:** Traditional wait-for-input turn-based
- **Why Not:** Can still pivot to this later; real-time gives more options

### Visual & UX Decisions

**Decision: Canvas Size 800x600, 20px Tiles**
- **What:** 40x30 grid of 20x20 pixel tiles
- **Why:**
  - Good balance of screen real estate and readability
  - 20px tiles fit 16px font comfortably
  - 40x30 gives enough space for dungeons without overwhelming
  - Standard 4:3-ish aspect ratio fits most screens
- **Trade-offs:** Not responsive, but acceptable for desktop game

**Decision: Visual Aesthetic - Black Background, Monospace Font**
- **What:** Black canvas, white/colored text, Courier New monospace
- **Why:**
  - Classic terminal aesthetic (fits roguelike genre)
  - High contrast for readability
  - No art assets needed
  - Nostalgic and appropriate for comedy tone
- **Colors Chosen:**
  - Player: Cyan (#00ffff) - stands out, classic terminal color
  - Floor: Dark gray (#333333) - visible but not distracting
  - UI/Debug: Green (#00ff00) - terminal aesthetic

**Decision: Movement Delay 200ms**
- **What:** 200 milliseconds between grid moves
- **Why:**
  - Feels responsive but not frantic
  - Prevents accidental double-moves
  - Can be tuned in balance phase
  - Good starting point for player feedback
- **Can Adjust:** If feels sluggish/fast, easy parameter to tune

### Input & Controls

**Decision: Arrow Keys Only (Initial)**
- **What:** Arrow keys for movement, nothing else yet
- **Why:**
  - Universal, no learning curve
  - Keep Session 1 scope tight
  - Easy to add WASD/numpad later
  - Prevents page scrolling (good UX)
- **Future:** Add WASD, numpad in Session 2 or when needed

**Decision: Hold-to-Move Input Handling**
- **What:** Continuous movement while key held
- **Why:**
  - Feels natural for exploration
  - Better UX than tap-per-tile
  - Movement delay prevents runaway movement
- **Trade-offs:** Less "tactical" than press-per-move, but fits real-time loop

### Technical Implementation

**Decision: Renderer Abstraction Layer**
- **What:** Separate Renderer class with grid-to-pixel conversion
- **Why:**
  - Encapsulates all canvas operations
  - Easy to swap rendering approach later
  - Clean API for game objects
  - Testable in isolation
- **Methods:** drawChar(), drawRect(), drawText(), gridToPixel()

**Decision: Player Entity Pattern**
- **What:** Player class with position, movement, collision
- **Why:**
  - Can extend with health, inventory, stats in future sessions
  - Separates player logic from game loop
  - Follows entity pattern (will apply to enemies, items)
- **Future:** May evolve into entity-component system if needed

**Decision: Input Handler Separation**
- **What:** Dedicated InputHandler class
- **Why:**
  - Separates input from game logic
  - Easy to add new controls
  - Can add input remapping later
  - Clean API: getMovementDirection()
- **Future:** May add action queuing for turn-based mode

### Code Quality Decisions

**Decision: Debug Info Overlay**
- **What:** Position display in top-left corner
- **Why:**
  - Essential for development and testing
  - Helps verify collision working
  - Can expand with more debug info
  - Easy to toggle off later
- **Future:** Add debug toggle key (maybe F3 like Minecraft)

**Decision: Console Logging**
- **What:** Log initialization and key events
- **Why:**
  - Helpful for debugging
  - Confirms systems loading
  - Can remove or gate behind debug flag later
- **Keep Clean:** Remove spam logs, keep meaningful ones

---

## Decisions Deferred to Later Sessions

**Combat Style: Turn-Based vs Real-Time**
- **When to Decide:** Session 7 (Combat implementation)
- **Current Thinking:** Hybrid - real-time movement, paused-when-acting combat
- **Why Deferred:** Don't need to commit yet, game loop supports both

**Desperation Meter Speed**
- **When to Decide:** Session 2 (when implementing)
- **Current Thinking:** Start slow, can tune in Session 11 (balance)
- **Why Deferred:** Need to feel it in-game before deciding

**Entity-Component System**
- **When to Decide:** Session 7-9 (when enemy/item complexity grows)
- **Current Thinking:** May not need it for small scope
- **Why Deferred:** Don't over-engineer, add if needed

---

## Principles Applied

**Session 1 decisions followed these principles:**
1. **Simplicity First** - Chose simplest approach that works
2. **Defer Complexity** - No ECS, no bundler, no frameworks
3. **Enable Future** - Decisions don't lock us into corners
4. **Genre-Appropriate** - Grid-based, ASCII, roguelike feel
5. **Quality Over Speed** - Clean modules, clear separation
6. **Test Early** - Debug info, browser testing, verify assumptions

---

## Phase Planning: Phase 2 Before Phase 3

**Date:** 2025-10-18
**Status:** Decided

### Decision: Execute Phase 2 (Dungeon Generation) Before Phase 3 (Combat & Items)

**Context:**
- Phase 1 completion report recommended "Jump to Phase 3"
- Initial thinking: current generation "good enough", combat more impactful
- User disagreed: "Phase 2 work is essential to outputting a high-quality, polished game"

**Decision Made:** **Phase 2 First** (5 sessions: 4-8)

**Rationale:**
1. **Foundation Matters** - Dungeon generation IS the stage for combat/items
   - Great generation makes combat SHINE
   - Poor generation makes even great combat feel flat
   - Room variety, corridors, features create tactical depth

2. **Love Letter to Roguelikes** - This game honors the genre
   - Classic roguelikes (NetHack, DCSS, Brogue) excel at generation
   - Replayability comes from procedural variety
   - Exploration must be rewarding BEFORE adding combat

3. **Technical Leverage** - Phase 2 work serves Phase 3
   - Special rooms (vaults, arenas, shrines) = strategic item/enemy placement
   - Doors and keys = progression gates and tactical chokepoints
   - Pillars and features = combat cover and positioning
   - Floor themes = enemy variety and environmental storytelling

4. **Quality Over Speed** - Better to build right than build fast
   - Mediocre generation + enemies = forgettable game
   - Excellent generation + enemies = memorable classic
   - Can't easily retrofit good generation after combat exists

**Why This is Critical:**
This is a **zero-pressure fun project**. The goal is to make the BEST possible roguelike we can, not to rush to "playable." If we're going to spend time on this, it should be something we're PROUD to play and share.

**Alternative Rejected:** Jump to Phase 3
- **Why Not:** Would create technical debt (retrofitting generation later)
- **Impact:** Game would feel "good enough" rather than "excellent"
- **Missed Opportunity:** Lose chance to make generation truly special

**Commit to Excellence:** Phase 2 is NOT optional polish - it's essential infrastructure.

---

## Session 8: Game Identity & Mechanics Design

**Date:** 2025-10-18
**Status:** Planned (part of Phase 2)

### Decision: Add Session 8 as Design/Planning Session

**What:** Dedicated session for game identity, mechanics design, and Phase 2/3 bridge

**Why Session 8 Matters:**

1. **Beyond the Joke** - Ensure game has unique identity
   - "Roguelike with toilet joke" is not enough
   - Need signature mechanics that make THIS game special
   - Desperation must be MECHANICAL, not just flavor

2. **Design Before Implementation** - Think through combat/items BEFORE coding
   - Desperation thresholds and effects (movement, combat, visuals)
   - Enemy concepts (5-7 types, thematically coherent)
   - Item concepts (weapons, consumables, equipment)
   - Unique mechanics (Clench? Desperation moves? Environmental interaction?)
   - Win condition design (victory sequence, scoring)

3. **Phase 2 ↔ Phase 3 Bridge** - Ensure generation serves gameplay
   - Do room types support our mechanics? (arenas for combat, vaults for loot)
   - Do features provide tactical depth? (pillars = cover, doors = chokepoints)
   - Are we missing anything for Phase 3?

4. **Create GAME_DESIGN.md** - Bible for Phase 3 implementation
   - Narrative framework (what is this place? why 10 floors?)
   - Complete enemy/item lists (no more "we'll figure it out later")
   - Mechanics specifications (formulas, thresholds, effects)
   - Thematic guidelines (comedy must be consistent)

**Session Format:**
- 50% discussion/design thinking
- 25% documentation (GAME_DESIGN.md creation)
- 25% lightweight prototyping (test 1-2 mechanics if time)

**Success Criteria:**
- Team (Phill + Claude) aligned on game vision
- Excited to build Phase 3 (know EXACTLY what to build)
- GAME_DESIGN.md serves as complete specification

**Why This Session is NOT Optional:**
Without Session 8, Phase 3 becomes "add some enemies and items" with no clear vision. WITH Session 8, Phase 3 becomes "implement the unique game we designed."

Session 8 ensures this game is **ours** - not just another roguelike.

---

## Phase 2 Architecture: Expanded Tile System

**Date:** 2025-10-18
**Status:** Planned

### Decision: Expand from 5 Tile Types to 15

**Current (Phase 1):** 5 tile types (floor, wall, stairs, stairs_up, toilet)

**After Phase 2:** 15 tile types

**New Tiles:**
- Session 4: TILE_PILLAR, TILE_FEATURE (architectural features)
- Session 5: (Optional) TILE_CORRIDOR (visual distinction)
- Session 6: TILE_DOOR_OPEN, TILE_DOOR_CLOSED, TILE_DOOR_LOCKED, TILE_KEY
- Session 7: TILE_WATER, TILE_CHASM, TILE_TRAP (environmental hazards)

**Why Expand:**
1. **Gameplay Depth** - More tile types = more interactions
   - Doors = chokepoints, keys = progression gates
   - Pillars = tactical cover, hazards = environmental danger
2. **Visual Variety** - 15 distinct ASCII chars create rich environments
3. **Tactical Complexity** - Combat (Phase 3) uses these tiles strategically
4. **Roguelike Standard** - Classic roguelikes have rich tile vocabularies

**Architecture Impact:**
- TileMap class: Update getTileChar/Color for new types
- isWalkable() method: Handle doors (closed blocks, open doesn't)
- Renderer: Theme-based color variations for walls/features
- Generation: New placement algorithms for doors, keys, hazards

**Performance Considerations:**
- 15 tile types = negligible memory impact
- Switch statements in hot paths (getTile, isWalkable) - still O(1)
- Generation complexity increases but stays <200ms per floor

**Alternative Rejected:** Keep minimal tile set
- **Why Not:** Limits gameplay depth, reduces visual interest
- **Trade-off:** More types = slightly more code complexity (acceptable)

**Principle Applied:** Add tiles that serve gameplay, not just decoration

---

**Next Decision Point:** Session 4 - Room shape generation algorithms
