# Phase 2: Dungeon Generation & Game Identity

**Status:** Planned, ready to execute
**Sessions:** 4-8 (5 sessions total)
**Estimated Duration:** 6-7 hours
**Last Updated:** 2025-10-18

---

## Overview

**Phase Goal:** Build a dungeon generation system worthy of classic roguelikes AND establish the game's unique identity.

**Why This Phase Matters:**

This game is a **love letter to the roguelike genre**. Phase 2 ensures we get the foundation RIGHT before adding combat and items in Phase 3. Great dungeon generation makes exploration meaningful, replayability high, and combat tactical.

**Critical Insight:** Phase 2 is NOT optional polish—it's essential infrastructure. Room variety, organic corridors, doors, keys, and special rooms create the CONTEXT that makes Phase 3 combat/items SHINE.

**Philosophy:** Better to have excellent generation with no enemies than mediocre generation with enemies. The dungeons are the STAGE—make them worthy of the performance.

---

## Phase Structure

**Sessions 4-7:** Technical Excellence (Dungeon Generation)
**Session 8:** Creative Excellence (Game Identity & Mechanics Design)

**Session 8 is CRITICAL:** It bridges technical work to Phase 3 by ensuring we know EXACTLY what makes this game unique beyond "roguelike with toilet joke."

---

## Session 4: Room Variety & Architectural Features

**Goal:** Make every room feel unique and interesting
**Duration:** 45-60 minutes
**Status:** Ready to execute

### Deliverables

#### 1. Room Shape Generator
Expand beyond rectangular rooms to create visual variety:
- **Rectangular** (current + size variations)
- **Circular/Oval** (approximated with ASCII grid)
- **Cross-shaped** (+ pattern)
- **L-shaped**
- **T-shaped**
- **Diamond/Octagonal**

**Implementation Notes:**
- Shape generation uses template patterns or algorithms
- All shapes must validate (no impossible placements)
- Fallback to rectangular if shape fails (no generation errors)

#### 2. Room Categorization System
Rooms categorized by size and purpose:

**Room Types:**
- `ROOM_TYPE.CLOSET` - 3x3 to 4x4 (tight spaces, secrets)
- `ROOM_TYPE.SMALL` - 5x5 to 7x7 (standard encounters)
- `ROOM_TYPE.NORMAL` - 8x8 to 10x10 (main rooms)
- `ROOM_TYPE.LARGE` - 11x11 to 13x13 (important encounters)
- `ROOM_TYPE.GRAND` - 14x14 to 16x16 (boss arenas, treasure halls)

**Distribution Rules per Floor:**
- 1 grand hall (centerpiece room)
- 2-3 large rooms (important areas)
- 3-5 normal rooms (standard exploration)
- 1-2 small rooms (variety)
- 0-1 closet (secrets, hidden items)

#### 3. Architectural Features
Add depth and tactical interest within rooms:

**Pillars:**
- Placed in LARGE and GRAND rooms
- Symmetric patterns (4-corner, center cluster, colonnade)
- Block movement, provide cover (tactical for Phase 3 combat)
- Tile type: `TILE_PILLAR` - `O` in gray

**Alcoves:**
- Small indentations in room walls (2-3 per large room)
- Future use: item spawns, secrets, ambush points

**Center Features:**
- Fountains, statues, altars (decorative for now)
- Tile type: `TILE_FEATURE` - `*` in blue
- Prepare for Phase 3 interaction (buff points, lore)

**Symmetry Options:**
- Symmetric rooms (formal, organized feel)
- Asymmetric rooms (organic, chaotic feel)
- Mix based on floor theme

#### 4. New Tile Types

```javascript
// Add to tile-map.js
export const TILE_PILLAR = 5;   // 'O' gray - blocks movement
export const TILE_FEATURE = 6;  // '*' blue - decorative/interactive
```

### Technical Changes

**Files to Modify:**
- `src/tile-map.js` - Add new tile types, update getTileChar/Color
- `src/dungeon-generator.js` - Major refactoring for shape-based generation

**Files to Create:**
- `src/room-shapes.js` - Room shape generation utilities

**New Data Structure:**
```javascript
// Room object now includes:
{
  x: number,
  y: number,
  width: number,
  height: number,
  shape: string,        // NEW: 'rectangular', 'circular', 'cross', etc.
  type: string,         // NEW: 'SMALL', 'NORMAL', 'LARGE', 'GRAND', 'CLOSET'
  features: []          // NEW: array of placed features/pillars
}
```

**Refactored Methods:**
- `carveRoom()` → `carveRoomByShape(room)`
- Add `generateRoomShape()` - returns shape type based on room size
- Add `placeArchitecturalFeatures(room)` - adds pillars, features
- Add `validateRoomShape(room, shape)` - ensures shape fits

### Success Criteria

- ✅ 6 distinct room shapes generating correctly
- ✅ Rooms categorized by size (closet → grand)
- ✅ Proper distribution (1 grand, 2-3 large, etc. per floor)
- ✅ Pillars generate in large/grand rooms (symmetric patterns)
- ✅ Features placed in room centers
- ✅ Each floor visually distinct from last
- ✅ Zero generation failures (100% success rate)
- ✅ Performance acceptable (<100ms per floor)

### Testing Checklist

- [ ] Generate 50 floors, verify all shapes appear
- [ ] Check room distribution matches rules
- [ ] Verify pillars block movement
- [ ] Ensure features render correctly
- [ ] Test edge cases (tiny maps, max room counts)
- [ ] Playtest: "Does each room feel unique?"

---

## Session 5: Corridor Sophistication & Connectivity

**Goal:** Replace L-shaped corridors with organic, winding passages
**Duration:** 45-60 minutes
**Status:** Pending (after Session 4)

### Deliverables

#### 1. Advanced Corridor Algorithms

**Replace Simple L-Shapes with:**
- **Winding corridors** - Multi-segment paths, not just 2-segment
- **Width variation** - Narrow (1-tile), standard (1-tile), wide (2-3 tile) passages
- **Smart pathfinding** - A* or weighted random walk between rooms
- **Room avoidance** - Corridors don't cut through existing rooms

**Implementation Options:**
- **Option A:** A* pathfinding with corridor cost heuristic
- **Option B:** Drunk walk with target bias (simpler, organic feel)
- **Option C:** Hybrid - A* for main path, add decorative curves

**Recommended:** Option B (drunk walk) for speed and organic feel, fallback to straight line if fails

#### 2. Corridor Features

**Add Visual/Tactical Interest:**
- **T-intersections** - 3+ corridors meeting at one point
- **Dead-end alcoves** - Short corridors to nowhere (item spawns, ambushes)
- **Hallway rooms** - Widen corridor to 3x5 room occasionally
- **Corner pillars** - Place pillar at T-intersections (visual landmark)

#### 3. Connection Improvements

**Current Problem:** Rooms connect sequentially (room 1→2→3→4)
**Issues:** Linear, predictable, no alternate routes

**New Approach:**
1. **Nearest neighbor connections** - Connect each room to 1-2 nearest rooms
2. **Connectivity graph** - Build graph, verify all rooms reachable
3. **Loop creation** - Add 25% secondary connections for alternate paths
4. **Flood-fill validation** - Ensure all floor tiles reachable from start position

**Algorithm:**
```
1. Generate all rooms
2. Build distance matrix (room center to room center)
3. For each room:
   - Connect to nearest unconnected room
   - 25% chance: connect to 2nd nearest for loop
4. Validate connectivity (graph traversal)
5. If disconnected rooms exist, force connect to main graph
```

#### 4. New Tile Types (Optional)

```javascript
// Optional: Distinguish corridors from room floors
export const TILE_CORRIDOR = 7;  // '·' dark gray
```

**Trade-off:** Visual distinction vs added complexity. Decide during implementation.

### Technical Changes

**Files to Modify:**
- `src/dungeon-generator.js` - Replace `connectRooms()` method

**Methods to Add:**
- `buildConnectionGraph()` - Creates room connectivity graph
- `findPathBetweenRooms(room1, room2)` - Pathfinding algorithm
- `carveWindingCorridor(path, width)` - Carves multi-segment path
- `validateConnectivity()` - Flood-fill to verify all rooms reachable
- `addSecondaryConnections()` - Creates loops

**New Data Structures:**
```javascript
// Connection graph
{
  rooms: [room1, room2, ...],
  connections: [[room1, room2], [room2, room3], ...],
  distanceMatrix: [[0, dist12, ...], ...]
}
```

### Success Criteria

- ✅ Corridors feel organic, not mechanical L-shapes
- ✅ All rooms guaranteed connected (100% connectivity)
- ✅ Visual variety in corridor widths and paths
- ✅ Occasional loops provide alternate routes
- ✅ Dead ends exist for item placement
- ✅ T-intersections create navigation interest
- ✅ Performance acceptable (<200ms generation per floor)
- ✅ Zero unreachable rooms

### Testing Checklist

- [ ] Generate 100 floors, verify 100% connectivity
- [ ] Measure corridor variety (not all L-shapes)
- [ ] Find loops (alternate paths between areas)
- [ ] Verify dead ends spawn (for item placement)
- [ ] Performance test (generation time <200ms)
- [ ] Playtest: "Do corridors feel natural?"

---

## Session 6: Doors, Keys & Special Rooms

**Goal:** Add doors and special room types that make exploration exciting
**Duration:** 45-60 minutes
**Status:** Pending (after Session 5)

### Deliverables

#### 1. Door System

**Three Door Types:**
```javascript
// New tile types
export const TILE_DOOR_OPEN = 8;     // '+' brown - walkable
export const TILE_DOOR_CLOSED = 9;   // '+' brown - blocks until opened
export const TILE_DOOR_LOCKED = 10;  // '+' red - requires key
```

**Door Placement:**
- Doors placed at **room entrances** (where corridor meets room)
- Detection: Find tiles where corridor (1-tile wide) meets room edge
- Frequency: 50% of room entrances have closed doors
- Special rooms: 100% have doors (often locked)

**Door Interaction:**
- Closed door: Walk into to open (becomes TILE_DOOR_OPEN)
- Open door: Walkable like floor
- Locked door: Requires key, shows message if no key

#### 2. Key System

**Simple Key Implementation:**
```javascript
// New tile type
export const TILE_KEY = 11;  // 'k' yellow - pickup item

// Player property
player.keysCollected = 0;  // Integer count
```

**Key Mechanics:**
- Keys spawn in normal/large rooms (guaranteed before locked doors)
- Pickup: Walk over key, increment `player.keysCollected`
- Usage: Locked door consumes 1 key, becomes TILE_DOOR_OPEN
- Visual: Key count displayed in UI

**Generation Order:**
1. Generate rooms and corridors
2. Identify special rooms needing locks
3. Place keys in earlier rooms (pathfinding ensures findable)
4. Place locked doors on special room entrances

#### 3. Special Room Types

**Room Specializations:**

**Treasure Vault:**
- Size: LARGE or GRAND
- Door: LOCKED (requires key)
- Contents: High-value item spawns (Phase 3)
- Features: Pillars, center feature (chest/pile)
- Frequency: 1 per floor, deeper floors = better loot

**Shrine:**
- Size: NORMAL or LARGE
- Door: Open or closed (not locked)
- Contents: Central altar feature
- Effect: Desperation reduction or stat buff (Phase 3)
- Frequency: 0-1 per floor

**Arena:**
- Size: GRAND
- Door: Closed
- Contents: Empty large space
- Purpose: Multi-enemy combat encounter (Phase 3)
- Features: Pillars for cover
- Frequency: 1 per 2-3 floors

**Library:**
- Size: NORMAL or LARGE
- Door: Closed
- Contents: Many features (bookshelves, decorative)
- Purpose: Environmental storytelling, lore
- Frequency: 1 per 3-4 floors

**Trap Room:**
- Size: SMALL or NORMAL
- Door: Closed
- Contents: Narrow corridors, hazards
- Purpose: Skill testing, danger
- Frequency: 1 per 2-3 floors (deeper floors)

#### 4. Room Metadata Extension

```javascript
// Enhanced room object
{
  x, y, width, height, shape, type,
  specialType: string,      // NEW: 'vault', 'shrine', 'arena', 'library', 'trap', null
  hasLockedDoor: boolean,   // NEW: true if entrance locked
  doorPositions: [{x, y}],  // NEW: where doors placed
  keyRequired: boolean      // NEW: tied to hasLockedDoor
}
```

**Special Room Distribution:**
- 1-2 special rooms per floor
- Deeper floors = higher chance of special rooms
- Vaults more common on deeper floors
- Shrines more common on upper floors

### Technical Changes

**Files to Modify:**
- `src/tile-map.js` - Add door and key tile types
- `src/player.js` - Add `keysCollected` property, door interaction
- `src/dungeon-generator.js` - Door placement, special room generation
- `src/game.js` - Handle player-door interaction in game loop

**Files to Create:**
- `src/door-system.js` - Door interaction logic (optional, or inline in player.js)

**New Methods:**
- `placeDoors(room, corridors)` - Find room entrances, place doors
- `generateSpecialRoom(type)` - Fills room based on special type
- `tryOpenDoor(x, y)` - Player interaction with door
- `findRoomEntrances(room)` - Detects corridor-to-room transitions

### Success Criteria

- ✅ Doors generate at room entrances
- ✅ Closed doors open when player walks into them
- ✅ Locked doors require keys (show message if no key)
- ✅ Keys spawn before locked doors (generation order correct)
- ✅ Player can collect keys (count displayed in UI)
- ✅ 2-3 special room types spawning per floor
- ✅ Treasure vaults are locked and rare
- ✅ Special rooms visually distinct from normal rooms
- ✅ No progression blockers (can't get locked out)

### Testing Checklist

- [ ] Walk through 20 floors, verify all doors interact correctly
- [ ] Test locked door without key (shows message)
- [ ] Test locked door with key (opens, consumes key)
- [ ] Verify keys spawn before locked doors
- [ ] Check special room distribution
- [ ] Ensure vaults always locked
- [ ] Playtest: "Are special rooms exciting to find?"

---

## Session 7: Thematic Depth & Polish

**Goal:** Make each floor memorable through theming and advanced features
**Duration:** 60 minutes
**Status:** Pending (after Session 6)

**Note:** This session is NOT OPTIONAL. Thematic depth is essential for a love letter to roguelikes.

### Deliverables

#### 1. Floor Theming System

**Four Thematic Zones:**

**Zone 1: Upper Levels (Floors 10-8) - "The Office"**
- **Aesthetic:** Clean, organized, fluorescent
- **Wall color:** Light gray (#aaaaaa)
- **Feature types:** Desks, water coolers, cubicles
- **Room density:** Higher (more rooms, smaller)
- **Mood:** Orderly, corporate, slightly sterile

**Zone 2: Mid Levels (Floors 7-5) - "Maintenance"**
- **Aesthetic:** Industrial, machinery, pipes
- **Wall color:** Gray-brown (#777755)
- **Feature types:** Pipes, machinery, tool boxes
- **Room density:** Medium
- **Mood:** Functional, worn, utilitarian

**Zone 3: Deep Levels (Floors 4-2) - "The Sewers"**
- **Aesthetic:** Wet, grimy, chaotic
- **Wall color:** Dark brown (#554433)
- **Feature types:** Puddles, grates, slime
- **Room density:** Lower (larger rooms, more hazards)
- **Mood:** Desperate, dangerous, decay

**Zone 4: Bottom (Floor 1) - "The Throne Room"**
- **Aesthetic:** THE TOILET (finale)
- **Wall color:** White tile (#cccccc)
- **Feature types:** Plumbing, the toilet
- **Room density:** Special (custom layout)
- **Mood:** Relief, victory, absurd triumph

**Implementation:**
```javascript
// FloorTheme class
class FloorTheme {
  constructor(name, wallColor, featureTypes, roomDensity, specialFeatures) {
    this.name = name;
    this.wallColor = wallColor;
    this.featureTypes = featureTypes;
    this.roomDensity = roomDensity;  // affects room count
    this.specialFeatures = specialFeatures;  // floor-specific elements
  }
}
```

**Theme Application:**
- Modify room generation parameters based on theme
- Change wall colors in renderer based on floor
- Select feature types from theme pool
- Adjust room/corridor density

#### 2. Vault System (Pre-designed Rooms)

**Hand-Crafted Room Templates:**

Pre-designed special room layouts stored as ASCII templates:

```javascript
// Example vault template
const VAULT_TREASURE_CROSS = `
#########
#.......#
#.#####.#
#.#***#.#
#.#*T*#.#
#.#***#.#
#.#####.#
#.......#
#########
`;

// T = treasure/feature, # = wall, . = floor, * = feature
```

**Vault Types:**
- Treasure vaults (5-7 layouts)
- Shrine layouts (3-4 layouts)
- Trap rooms (3-5 layouts)
- Special encounters (2-3 layouts)

**Vault Placement:**
- Parse template string into tile array
- Find suitable location (room slot)
- Stamp vault onto map
- Connect to corridor system
- Add appropriate door (locked for treasure)

**Vault Library:**
- 10-15 total vault templates
- Mix of sizes (small to large)
- Thematically varied
- Gameplay purpose (treasure, challenge, story)

#### 3. Environmental Hazards

**New Tile Types for Hazards:**

```javascript
export const TILE_WATER = 12;   // '~' blue - slows movement
export const TILE_CHASM = 13;   // ' ' empty - blocks movement, visual gap
export const TILE_TRAP = 14;    // '^' red - damage when stepped (Phase 3)
```

**Hazard Placement:**
- Water: Clusters in sewer levels (floors 4-2)
- Chasms: Large rooms, arena edges (dramatic effect)
- Traps: Corridors near special rooms, trap room type

**Hazard Effects (Prepare for Phase 3):**
- Water: Movement cost +50% (Phase 3 implementation)
- Chasm: Impassable, visual danger
- Trap: Damage when stepped, visible after first trigger (Phase 3)

**Generation Rules:**
- Hazards increase with depth
- Don't block critical paths (ensure connectivity)
- Cluster in logical locations (water in sewers, not offices)
- Visual variety without overwhelming

#### 4. Generation Quality Metrics

**Logging and Validation:**

```javascript
// After each floor generation, log:
{
  roomCount: number,
  roomTypeDistribution: {small: X, normal: Y, large: Z, ...},
  specialRoomCount: number,
  corridorLength: number,
  floorCoveragePercent: number,  // floor tiles / total tiles
  connectivityValid: boolean,
  doorCount: number,
  keyCount: number,
  generationTimeMs: number
}
```

**Quality Thresholds:**
- Floor coverage: 25-45% (not too sparse/crowded)
- Generation time: <200ms per floor
- Connectivity: 100% (always valid)
- Room distribution: Matches target ratios

**Debug Mode:**
- Visualize room connections (draw lines between room centers)
- Show room types (color-code by type)
- Display generation metrics in UI
- Toggle with 'D' key

### Technical Changes

**Files to Create:**
- `src/floor-themes.js` - Theme definitions and application
- `src/vault-library.js` - Pre-designed room templates

**Files to Modify:**
- `src/tile-map.js` - Add hazard tile types
- `src/renderer.js` - Apply theme colors to rendering
- `src/dungeon-generator.js` - Theme-aware generation, vault placement
- `src/game.js` - Pass theme to generator based on floor number

**New Classes:**
```javascript
class FloorTheme { ... }
class VaultLibrary {
  parseVaultTemplate(asciiString) { ... }
  getRandomVault(type) { ... }
  placeVault(tileMap, x, y, vault) { ... }
}
class GenerationMetrics { ... }
```

### Success Criteria

- ✅ 4 floor themes visually distinct
- ✅ Themes applied correctly per floor number
- ✅ 10+ vault templates working
- ✅ Vaults spawn without overlap/errors
- ✅ Environmental hazards placed logically
- ✅ Floor coverage balanced (25-45%)
- ✅ Generation metrics logged and validated
- ✅ Debug mode visualizes generation
- ✅ Each playthrough feels thematically coherent
- ✅ Performance remains acceptable

### Testing Checklist

- [ ] Generate full 10-floor run, verify themes correct
- [ ] Check vault variety (all templates appear)
- [ ] Verify hazards cluster correctly (water in sewers)
- [ ] Test floor coverage metrics (not too sparse)
- [ ] Performance test full generation
- [ ] Debug mode displays useful info
- [ ] Playtest: "Does each floor tier feel different?"
- [ ] Playtest: "Are vaults exciting discoveries?"

---

## Session 8: Game Identity & Mechanics Design ⭐

**Goal:** Ensure the game stands alone as a unique experience, not just "roguelike with toilet joke"
**Duration:** 75-90 minutes
**Status:** Pending (after Session 7)

**Session Type:** DESIGN SESSION (50% discussion, 25% documentation, 25% prototyping)

**Critical:** This session bridges Phase 2 to Phase 3 by defining EXACTLY what makes this game special.

### Part 1: Desperation Mechanics Deep Dive (30 min)

**Current State:** Meter climbs, looks pretty, does nothing mechanically.

**Questions to Answer:**

#### Movement Impact
How should desperation affect movement?

**Options:**
- **Option A:** Slower at high desperation (legs crossed, waddling)
  - Linear penalty: 100% desperation = 50% movement speed
  - Thresholds: 75%+ desperation = movement cost increases

- **Option B:** Faster but less controlled (panic sprint)
  - Speed increases, but can't stop on a dime
  - Risk: Might run into enemies/traps

- **Option C:** Movement cost increases (stamina-like)
  - Each move costs more "effort"
  - Must rest periodically at high desperation

**Recommendation:** Decide during session based on what feels FUN

#### Combat Impact

How should desperation affect combat? (Phase 3 preparation)

**Rage Mode Concept:**
- Higher desperation = more damage output (desperate strength)
- Trade-off: Accuracy penalty (hard to aim when desperate)
- Formula: `damage = baseDamage * (1 + desperation * 0.5)`
- Special moves unlock at thresholds (desperation attacks)

**Alternative: Desperation as Resource:**
- Spend desperation for powerful attacks
- Risk/reward: Use desperation for power, but closer to game over

#### Threshold Events

Define specific gameplay changes at desperation thresholds:

**Proposed Thresholds:**
- **0-24% (Green):** "Uncomfortable" - no mechanical effect, flavor text
- **25-49% (Yellow):** "Urgent" - flavor text, slight visual effects
- **50-74% (Orange):** "Critical" - movement penalty OR rage bonus activates
- **75-89% (Red):** "Desperate" - major effects, screen shake, panic
- **90-99% (Flashing Red):** "EXTREME" - severe penalties/bonuses, warning
- **100%:** Game over - "You didn't make it..."

**Visual Effects per Threshold:**
- Screen color tint (edges red at high desperation)
- Screen shake intensity
- Meter color transitions
- Warning messages

#### Desperation Management

How can players manage desperation?

**Options:**
- **Items:** Antacids (reduce 20%), meditation scrolls, fiber bars
- **Relief Stations:** Broken toilets on some floors (reduce 30%, limited uses)
- **Risk/Reward:** Deeper exploration at high desperation = better loot
- **Shrine Effects:** Special rooms reduce desperation

**Question:** Should desperation ONLY climb, or can it be reduced?
- Pure climb = pure pressure (harder, more tense)
- Reducible = strategic resource management (more player agency)

**Recommendation:** Reducible but expensive (items rare, shrines limited)

#### Deliverables
- [ ] Finalized desperation threshold effects documented
- [ ] Combat impact formula defined
- [ ] Movement impact specified
- [ ] Management mechanics decided
- [ ] Prototype 1-2 threshold effects in code

### Part 2: Thematic Coherence (20 min)

**Goal:** Make absurdist comedy MECHANICAL, not just flavor.

#### Narrative Framework

**Core Questions:**
1. **What is this place?**
   - Office building? Apartment complex? Wizard's tower? Mall?

2. **Why 10 floors?**
   - How does structure support narrative?

3. **Why is ONLY toilet at bottom?**
   - What's the story reason? (Management incompetence? Magical curse? Plumbing disaster?)

4. **Who are you?**
   - Office worker? Resident? Visitor? Why are you here?

**Proposed Narrative (Example - Decide in Session):**
```
You're an office worker in a bizarre corporate tower. Management,
in infinite wisdom, has declared all bathrooms "out of order"
except the one in the basement maintenance level. You REALLY need
to go. Between you and relief: 10 floors of increasingly absurd
obstacles, malfunctioning security, and desperate competitors.

Each floor deeper = older infrastructure, worse maintenance,
more chaos. Can you make it to the Throne?
```

#### Enemy Design Philosophy

**Enemies Should:**
- Fit the theme (corporate setting, maintenance, sewers)
- Be funny but threatening
- Reinforce the tone (absurd but challenging)

**Example Enemy Concepts (Brainstorm in Session):**
- **Security Bot** (floors 10-8) - Malfunctioning office security, slow but sturdy
- **Coffee Zombie** (floors 10-6) - Over-caffeinated coworker, fast attacks
- **Janitor Enforcer** (floors 7-5) - Protecting their domain, medium threat
- **Maintenance Gremlin** (floors 6-3) - Chaotic, breaks things, fast
- **Sewer Rat** (floors 4-2) - Swarm enemy, weak individually
- **Pipe Monster** (floors 3-1) - Plumbing nightmare, high threat
- **The Desperate** (all floors) - Other people who need the toilet, compete with you

**Question:** Do enemies also need to poop? (Comedy gold: enemies ALSO rushing to toilet)

#### Item Design Philosophy

**Every Item Should Feel Thematically Appropriate:**

**Weapons:**
- **Plunger** - Melee, knockback effect
- **TP Launcher** - Ranged, rapid fire
- **Wrench** - Melee, high damage, slow
- **Mop** - Melee, area attack (swing)
- **Stapler** - Ranged, low damage, fast
- **Coffee Pot** - Throwable, area splash damage

**Consumables:**
- **Antacid** - Reduce desperation 20%
- **Coffee** - Speed boost 30 sec BUT increases desperation
- **Fiber Bar** - Increase desperation (emergency damage boost?)
- **Donut** - Heal health
- **Energy Drink** - Temporary invincibility, crash afterwards

**Equipment:**
- **Tool Belt** - Extra inventory slot
- **Plumber's Boots** - Walk through water without penalty
- **Janitor's Keys** - Opens locked doors without consuming keys
- **Hard Hat** - Reduce damage from traps

#### Environmental Storytelling

**Make the World Feel Lived-In:**
- Graffiti on walls ("Toilet on Floor 1 broken too, try Floor -1 lol")
- Signs ("Restrooms Out of Order - Management")
- Notes ("If you're reading this, turn back. The toilet isn't worth it.")
- Skeletons (previous failed attempts)
- Office debris (papers, coffee cups, broken printers)

**Implementation:**
- New tile type: `TILE_GRAFFITI` or render text directly
- Random message selection based on floor
- Thematic consistency (office debris on upper floors, pipes in sewers)

#### Deliverables
- [ ] Narrative framework (2-3 paragraphs) written
- [ ] Enemy type list (5-7 concepts) with thematic justification
- [ ] Item type list (10-15 items) categorized
- [ ] Environmental storytelling ideas (10+ messages/elements)
- [ ] Document in new `GAME_DESIGN.md` file

### Part 3: Unique Mechanical Identity (25 min)

**Goal:** Define what makes this game special beyond the joke.

#### Core Gameplay Loop Definition

**Current Understanding:**
```
Explore → Find keys → Open doors → Fight enemies →
Manage desperation → Descend → Repeat → Victory
```

**Questions:**
- What's the "signature moment" players will remember?
- How does this feel different from NetHack/DCSS/Brogue?
- What's the unique tension/decision-making?

**Unique Tension: Time Pressure + Resource Management**
- Desperation climbs = urgency
- But rushing = miss loot, run into danger
- Explore thoroughly OR descend quickly?
- This tension should be MECHANICAL, not just narrative

#### Risk/Reward Systems

**Treasure Vaults vs Time:**
- Locked vaults have best loot
- But finding key + backtracking costs TIME (desperation climbs)
- Decision: Do I have time to loot this vault?

**Backtracking Penalties:**
- Stairs go up AND down
- Can return to previous floors
- But desperation keeps climbing
- Did you miss something important? Worth going back?

**High-Risk Shortcuts:**
- Break through weak walls? (spend resources, save time)
- Risky jumps over chasms? (chance to fail, faster route)
- Fight through enemy horde vs sneak around? (time vs safety)

#### Unique Systems to Prototype

**Brainstorm 2-3 Signature Mechanics:**

**Option 1: "Clench" Mechanic**
- Press 'C' to freeze desperation for 10 seconds
- Cooldown: 60 seconds
- Visual: Screen borders pulse, character animation
- Strategic use: Boss fights, vault looting, tricky navigation

**Option 2: Desperation as Power**
- High desperation unlocks powerful "desperation moves"
- E.g., "Desperate Dash" - teleport 5 tiles, costs 20% desperation
- E.g., "Rage Attack" - 3x damage, costs 30% desperation
- Risk/reward: Use power now or save for later?

**Option 3: Environmental Interaction**
- At 75%+ desperation, can bash through weak walls
- At 90%+ desperation, can force open locked doors (no key needed)
- Desperation = destructive power (thematically funny)

**Option 4: Toilet Humor Mechanics**
- Flush enemies (knockback into chasms/water)
- Plumbing puzzles (redirect pipes to open doors)
- Sewer surfing (ride water currents at high speed)

**Decision:** Pick 1-2 to implement in Phase 3

#### Win Condition Experience

**What Happens When You Reach The Toilet?**

**Proposed Victory Sequence:**
1. Player steps on toilet tile
2. Screen fades to black
3. ASCII art toilet (glorious)
4. Victory text: "YOU MADE IT!" with stats
5. Sound effect (if implemented) - comedic relief
6. Final score breakdown:
   - Time taken
   - Desperation level at victory
   - Enemies defeated
   - Items collected
   - Floors explored
   - Final score: weighted formula
7. High score comparison (if previous runs)
8. Option to restart or quit

**Victory Scoring Formula (Proposal):**
```
Score = (1000 / time_minutes) * (1 + desperation_percent)
        + enemies_defeated * 10
        + items_collected * 5
        + special_rooms_found * 20
```

Higher desperation at victory = bonus points (risk/reward)

#### Deliverables
- [ ] Core gameplay loop documented
- [ ] 2-3 unique mechanics designed (1-2 prototyped if time)
- [ ] Win condition experience scripted
- [ ] Scoring system formula defined
- [ ] Risk/reward systems specified

### Part 4: Phase 2 ↔ Phase 3 Bridge (15 min)

**Goal:** Ensure dungeon generation serves gameplay.

#### Review Phase 2 Through Gameplay Lens

**Room Types → Gameplay Purpose:**
- **Arena rooms** → Multi-enemy encounters, boss fights
- **Treasure vaults** → Risk/reward (time vs loot), key gates
- **Shrines** → Desperation relief, strategic resource
- **Libraries** → Lore, environmental storytelling, safe zones?
- **Trap rooms** → Skill testing, hazard navigation
- **Closets** → Secrets, hidden items, shortcuts?

**Question:** Are we missing any room types for our mechanics?
- **Safe rooms?** (desperation pauses, respite)
- **Challenge rooms?** (optional hard encounter, big reward)
- **Story rooms?** (lore, environmental narrative)

#### Features → Tactical Use

**Current Features and Combat Potential:**
- **Pillars** → Cover from ranged attacks, break line of sight
- **Doors** → Chokepoints, funnel enemies, block pursuit
- **Water** → Slow movement (player AND enemies)
- **Chasms** → Environmental hazards, push enemies into
- **Traps** → Damage, can lure enemies onto them

**Question:** Do we need additional features for combat tactics?
- **Explosive barrels?** (destroy for area damage)
- **Levers/switches?** (activate traps, close doors remotely)
- **Breakable walls?** (secret passages, shortcuts)

#### Theming → Narrative

**Do Current Themes Support Desperation Narrative?**

- **Floors 10-8 (Office):** Professional, orderly → Desperation still hidden
- **Floors 7-5 (Maintenance):** Functionality breaking down → Desperation rising
- **Floors 4-2 (Sewers):** Chaos, filth → Desperation critical
- **Floor 1 (Throne Room):** Relief, victory → Narrative payoff

**This works thematically!** Descent = physical and psychological deterioration.

**Enhancement Ideas:**
- Visual effects tied to desperation AND floor theme?
- Enemies get more "desperate" on lower floors too?
- Environmental messages reflect both floor and desperation level?

#### Adjustments to Phase 2 Plan

Based on mechanics discussion:

**Potential Additions:**
- [ ] Safe room type (desperation pauses inside)
- [ ] Challenge room type (optional hard encounter)
- [ ] Breakable wall tiles (desperation interaction)
- [ ] Environmental interaction hints (levers, switches)

**Potential Cuts:**
- None identified (all planned features useful)

#### Phase 3 Must-Implement List

**Carry Forward to Phase 3:**
1. Enemy AI with tactical use of features (cover, doors)
2. Combat system supporting desperation modifiers
3. Item spawning in appropriate room types (vaults, shrines)
4. Unique mechanics implementation (Clench, desperation moves)
5. Environmental hazard effects (water slow, trap damage)
6. Victory sequence with scoring
7. Desperation threshold effects
8. Enemy thematic variety (office → sewer enemy types)

#### Deliverables
- [ ] Any Phase 2 plan adjustments documented
- [ ] Clear "Phase 3 requirements" list created
- [ ] Priorities set (must-have vs nice-to-have for Phase 3)

### Session 8 Files Created

**New Documentation:**
- `project_memory/GAME_DESIGN.md` - Core game identity document
  - Narrative framework (2-3 paragraphs)
  - Desperation mechanics (thresholds, effects, management)
  - Enemy concepts (5-7 types with descriptions)
  - Item concepts (10-15 items categorized)
  - Unique mechanics (2-3 signature systems)
  - Win condition design
  - Environmental storytelling
  - Thematic guidelines

**Updated Documentation:**
- `project_memory/decisions.md` - Add Session 8 design decisions
- `project_memory/next_steps.md` - Phase 3 plan with Session 8 insights
- `project_memory/PHASE_2_PLAN.md` - Mark Session 8 complete

**Potential Code Prototyping (if time):**
- `src/desperation-meter.js` - Add threshold effect methods (stubs for Phase 3)
- Example: `getMovementPenalty()`, `getDamageBonus()`, `checkThresholdEffects()`

### Session 8 Success Criteria

- ✅ Crystal clear game identity documented
- ✅ Desperation mechanics fully designed (thresholds, effects)
- ✅ Enemy type list complete (5-7 types, thematically justified)
- ✅ Item type list complete (10-15 items, categorized)
- ✅ 1-2 unique mechanics defined and justified
- ✅ Win condition experience fully designed
- ✅ Narrative framework written (not just "toilet joke")
- ✅ Team (Phill + Claude) aligned on vision
- ✅ Excited to build Phase 3 (know exactly what to build)
- ✅ `GAME_DESIGN.md` serves as Phase 3 bible

### Session 8 Format

**Time Breakdown:**
- 30 min: Desperation mechanics (discussion + documentation)
- 20 min: Thematic coherence (narrative + enemies + items)
- 25 min: Unique mechanics (brainstorm + prototype planning)
- 15 min: Phase 2/3 bridge (review + adjustments)
- 10 min: Documentation + commit

**Collaborative Approach:**
- Ask questions, propose options, discuss trade-offs
- Document decisions as they're made
- Focus on what's FUN, not just what's "correct"
- Prototype lightweight if time allows
- Capture excitement in writing (motivation for Phase 3)

---

## Phase 2 Architecture Summary

### New Files Created

**Session 4:**
- `src/room-shapes.js` - Room shape generation utilities

**Session 6:**
- `src/door-system.js` - Door interaction logic (optional, may inline)

**Session 7:**
- `src/floor-themes.js` - Theme definitions and application
- `src/vault-library.js` - Pre-designed room templates and parsing

**Session 8:**
- `project_memory/GAME_DESIGN.md` - Game identity and mechanics bible

### Files Modified Across Phase 2

**Heavily Modified:**
- `src/dungeon-generator.js` - Core generation refactored
- `src/tile-map.js` - Many new tile types added
- `src/renderer.js` - Theme-based rendering

**Moderately Modified:**
- `src/player.js` - Door interaction, key collection
- `src/game.js` - Theme passing, player interaction handling
- `src/desperation-meter.js` - Threshold effects (Session 8)

**Lightly Modified:**
- `index.html` - Potentially UI for key count display

### New Tile Types (Complete List)

```javascript
// Existing (Phase 1)
TILE_FLOOR = 0        // '.' dark gray
TILE_WALL = 1         // '#' gray
TILE_STAIRS = 2       // '>' yellow
TILE_STAIRS_UP = 3    // '<' cyan
TILE_TOILET = 4       // 'T' magenta

// Session 4
TILE_PILLAR = 5       // 'O' gray
TILE_FEATURE = 6      // '*' blue

// Session 5 (optional)
TILE_CORRIDOR = 7     // '·' dark gray

// Session 6
TILE_DOOR_OPEN = 8    // '+' brown
TILE_DOOR_CLOSED = 9  // '+' brown
TILE_DOOR_LOCKED = 10 // '+' red
TILE_KEY = 11         // 'k' yellow

// Session 7
TILE_WATER = 12       // '~' blue
TILE_CHASM = 13       // ' ' empty/black
TILE_TRAP = 14        // '^' red
```

**Total Tile Types:** 15 (from 5)

### Data Structure Evolution

**Room Object (Before Phase 2):**
```javascript
{ x, y, width, height }
```

**Room Object (After Phase 2):**
```javascript
{
  x, y, width, height,
  shape: string,              // 'rectangular', 'circular', 'cross', etc.
  type: string,               // 'SMALL', 'NORMAL', 'LARGE', 'GRAND', 'CLOSET'
  specialType: string | null, // 'vault', 'shrine', 'arena', 'library', 'trap'
  features: [],               // placed features/pillars
  hasLockedDoor: boolean,
  doorPositions: [{x, y}],
  keyRequired: boolean
}
```

**Player Object Extension:**
```javascript
player.keysCollected = 0;  // Integer count of keys
```

---

## Phase 2 Success Criteria (Overall)

### Minimum Viable (Sessions 4-6)
- ✅ 6+ room shapes generating correctly
- ✅ Rooms categorized by size/purpose (closet → grand)
- ✅ Architectural features (pillars, center features) in appropriate rooms
- ✅ Organic winding corridors replace L-shapes
- ✅ All rooms guaranteed connected with occasional loops
- ✅ Doors at room entrances (open, closed, locked)
- ✅ Key system working (pickup, unlock doors)
- ✅ 3+ special room types (vault, shrine, arena)
- ✅ Visual variety floor-to-floor

### Excellent (Session 7)
- ✅ 4 floor theme tiers visually distinct
- ✅ Themes applied correctly per floor number
- ✅ 10+ vault templates spawning
- ✅ Environmental hazards (water, chasm, trap) placed logically
- ✅ Generation quality metrics validated
- ✅ Each playthrough feels unique

### Critical (Session 8)
- ✅ Game identity clearly defined and documented
- ✅ Desperation mechanics designed (ready for Phase 3)
- ✅ Enemy/item concepts finalized (thematically coherent)
- ✅ Unique mechanics chosen (signature gameplay)
- ✅ Win condition experience designed
- ✅ Phase 3 roadmap clear

### Quality Gates (All Sessions)
- ✅ Generation completes in <200ms per floor (performance)
- ✅ Zero generation failures (100% success rate)
- ✅ No unreachable rooms (connectivity verified)
- ✅ Code remains clean, modular, documented
- ✅ Playtesting feedback: "Every floor unique and interesting"
- ✅ Playtesting feedback: "I'm excited to see what Phase 3 adds"

---

## Why This Phase Makes the Game Great

### Technical Excellence
**Procedural Generation Rivals Classics:**
- Room variety matches NetHack's diversity
- Corridor sophistication approaches Brogue's organic feel
- Vault system borrowed from DCSS's best practices
- Thematic depth honors traditional roguelike branch variety

### Design Excellence
**Game Identity Beyond the Joke:**
- Desperation mechanic is MECHANICAL, not cosmetic
- Thematic coherence from top floor to toilet
- Environmental storytelling makes world feel lived-in
- Unique mechanics create memorable moments

### Foundation for Phase 3
**Combat/Items Will Shine Because:**
- Tactical spaces already exist (pillars, doors, chokepoints)
- Item placement meaningful (vaults, shrines, special rooms)
- Enemy variety supported by themes (office bots → sewer monsters)
- Risk/reward systems designed (time pressure vs exploration)

### Replayability
**Every Run Feels Different:**
- Procedural variety (rooms, corridors, vaults)
- Thematic depth (floor themes, environmental stories)
- Strategic decisions (vault loot vs time, key hunting, risk/reward)
- Scoring system encourages multiple approaches

---

## Post-Phase 2 State

**When Phase 2 Complete, We Will Have:**
- Dungeon generation system worthy of roguelike legends
- 15 tile types with clear purposes
- 6+ room shapes, 5 room sizes, 5+ special room types
- Organic corridor system with loops and variety
- Door and key mechanics working
- 10+ hand-crafted vault templates
- 4 thematic floor tiers
- Environmental hazards placed logically
- Clear game identity documented
- Desperation mechanics designed
- 5-7 enemy concepts ready for implementation
- 10-15 item concepts categorized
- 2-3 unique signature mechanics chosen
- Win condition experience scripted

**Then Phase 3 Will Implement:**
- Enemies spawned strategically using room types
- Combat system using tactical features (cover, doors, hazards)
- Items placed in appropriate locations (vaults, shrines)
- Desperation effects on movement and combat
- Unique mechanics (Clench, desperation moves, etc.)
- Victory sequence with scoring
- Sound effects (basic bleeps)

**Result:** A roguelike that respects the genre while standing alone as a unique, polished experience.

---

## Session Execution Philosophy

### Each Session Should:
1. Be independently playable and testable
2. Add visible, exciting features
3. Maintain code quality and architecture
4. Can be playtested immediately for feedback
5. Set up future sessions naturally

### Flexibility:
- Sessions may expand to subsessions (4a, 4b, 4c) if momentum strong
- Can absorb future work if features gel together
- Reality over plan - adjust based on what's fun
- If Session 7 reveals Session 8 needs, pivot accordingly
- Keep playtesting - best improvements come from playing

### Quality Over Speed:
- Don't rush sessions to hit plan
- Better to have 4 excellent sessions than 5 rushed ones
- If a feature isn't fun, cut it or rethink it
- Document what actually works, not what was planned
- Code review: Does this serve the player experience?

---

## Ready to Execute

**Phase 2 is fully planned and ready to execute.**

Next conversation should start with:
```
[!read-memory]
```

Which will load:
- `projectbrief.md` - Core concept
- `README.md` - Points to Phase 2 status
- `next_steps.md` - Session 4 ready to execute
- `PHASE_2_PLAN.md` (this file) - Full detailed plan

Then begin **Session 4: Room Variety & Architectural Features** immediately.

---

**Plan Created:** 2025-10-18
**Ready for Execution:** Session 4
**Estimated Phase Completion:** After Session 8 (~6-7 hours total)
