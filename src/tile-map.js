// Tile Map System - 2D grid for dungeon layout
// Handles floor, wall, and stairs tiles with collision detection

// Tile type constants
export const TILE_FLOOR = 0;
export const TILE_WALL = 1;
export const TILE_STAIRS = 2;      // Stairs down
export const TILE_STAIRS_UP = 3;   // Stairs up
export const TILE_TOILET = 4;      // Victory condition (final floor)
export const TILE_PILLAR = 5;      // Pillar - blocks movement
export const TILE_FEATURE = 6;     // Decorative feature - walkable
export const TILE_DOOR_OPEN = 7;   // Open door - walkable
export const TILE_DOOR_CLOSED = 8; // Closed door - walk into to open
export const TILE_DOOR_LOCKED = 9; // Locked door - requires key
export const TILE_KEY = 10;        // Key pickup - walkable
export const TILE_WATER = 11;      // Water - walkable, visual hazard (Phase 3: slow movement)
export const TILE_CHASM = 12;      // Chasm - non-walkable, visual danger
export const TILE_TRAP = 13;       // Trap - walkable, visual hazard (Phase 3: damage)
export const TILE_WEAPON = 14;     // Weapon pickup - walkable
export const TILE_CONSUMABLE = 15; // Consumable item pickup - walkable

export class TileMap {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.theme = null;  // Floor theme for visual styling (set by generator)

        // Initialize 2D array (row-major: tiles[y][x])
        this.tiles = [];
        for (let y = 0; y < height; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < width; x++) {
                this.tiles[y][x] = TILE_FLOOR;
            }
        }

        // Session 12c: Wall metadata for bashable walls
        // Map key: "x,y" -> boolean (true if bashable)
        this.wallBashable = new Map();

        // Session 12d: Break room safe zones (desperation pauses inside)
        // Array of {x, y, width, height} for room bounds checking
        this.breakRooms = [];

        console.log(`TileMap initialized: ${width}x${height}`);
    }

    // Get tile type at position
    getTile(x, y) {
        // Bounds check
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return TILE_WALL; // Treat out-of-bounds as wall
        }

        return this.tiles[y][x];
    }

    // Set tile type at position
    setTile(x, y, tileType) {
        // Bounds check
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return false;
        }

        this.tiles[y][x] = tileType;
        return true;
    }

    // Check if a position is walkable (for collision detection)
    isWalkable(x, y) {
        const tile = this.getTile(x, y);
        return tile === TILE_FLOOR ||
               tile === TILE_STAIRS ||
               tile === TILE_STAIRS_UP ||
               tile === TILE_TOILET ||
               tile === TILE_FEATURE ||
               tile === TILE_DOOR_OPEN ||
               tile === TILE_KEY ||
               tile === TILE_WEAPON ||      // Walkable (can walk over to pick up)
               tile === TILE_CONSUMABLE ||  // Walkable (can walk over to pick up)
               tile === TILE_WATER ||       // Walkable (Phase 3: slow movement)
               tile === TILE_TRAP;          // Walkable (Phase 3: damage)
        // Note: TILE_DOOR_CLOSED, TILE_DOOR_LOCKED, and TILE_CHASM are NOT walkable
        // Player interaction will open/unlock doors first
        // Chasms are impassable visual hazards
    }

    // Session 12c: Mark a wall as bashable
    setWallBashable(x, y, bashable = true) {
        const key = `${x},${y}`;
        if (bashable) {
            this.wallBashable.set(key, true);
        } else {
            this.wallBashable.delete(key);
        }
    }

    // Session 12c: Check if a wall is bashable
    isWallBashable(x, y) {
        const key = `${x},${y}`;
        return this.wallBashable.has(key) && this.wallBashable.get(key) === true;
    }

    // Session 12d: Add break room bounds for desperation pause detection
    addBreakRoom(x, y, width, height) {
        this.breakRooms.push({ x, y, width, height });
        console.log(`   🛋️  Break Room registered at (${x}, ${y}) size ${width}x${height}`);
    }

    // Session 12d: Check if position is inside any break room
    isPositionInBreakRoom(x, y) {
        return this.breakRooms.some(room =>
            x >= room.x && x < room.x + room.width &&
            y >= room.y && y < room.y + room.height
        );
    }

    // Fill a rectangular area with a tile type
    fillRect(x, y, width, height, tileType) {
        for (let dy = 0; dy < height; dy++) {
            for (let dx = 0; dx < width; dx++) {
                this.setTile(x + dx, y + dy, tileType);
            }
        }
    }

    // Draw a border of walls around the entire map
    drawBorder() {
        // Top and bottom
        for (let x = 0; x < this.width; x++) {
            this.setTile(x, 0, TILE_WALL);
            this.setTile(x, this.height - 1, TILE_WALL);
        }

        // Left and right
        for (let y = 0; y < this.height; y++) {
            this.setTile(0, y, TILE_WALL);
            this.setTile(this.width - 1, y, TILE_WALL);
        }
    }

    // Get character representation for rendering
    getTileChar(tileType) {
        switch (tileType) {
            case TILE_FLOOR:
                return '.';
            case TILE_WALL:
                return '#';
            case TILE_STAIRS:
                return '>';  // Down
            case TILE_STAIRS_UP:
                return '<';  // Up
            case TILE_TOILET:
                return 'T';  // Victory!
            case TILE_PILLAR:
                return 'O';  // Pillar
            case TILE_FEATURE:
                return '*';  // Feature
            case TILE_DOOR_OPEN:
                return '+';  // Open door
            case TILE_DOOR_CLOSED:
                return '+';  // Closed door
            case TILE_DOOR_LOCKED:
                return '+';  // Locked door
            case TILE_KEY:
                return 'k';  // Key
            case TILE_WEAPON:
                return '!';  // Weapon
            case TILE_CONSUMABLE:
                return '?';  // Consumable
            case TILE_WATER:
                return '~';  // Water
            case TILE_CHASM:
                return ' ';  // Chasm (empty space)
            case TILE_TRAP:
                return '^';  // Trap
            default:
                return '?';
        }
    }

    // Get color for tile type
    getTileColor(tileType) {
        // Use theme colors if available, otherwise fall back to defaults
        switch (tileType) {
            case TILE_FLOOR:
                return this.theme?.floorColor || '#333333';
            case TILE_WALL:
                return this.theme?.wallColor || '#888888';
            case TILE_STAIRS:
                return '#ffff00';     // Yellow (down) - always bright
            case TILE_STAIRS_UP:
                return '#00ffff';     // Cyan (up) - always bright
            case TILE_TOILET:
                return '#ff00ff';     // Magenta (victory!) - always bright
            case TILE_PILLAR:
                return this.theme?.pillarColor || '#666666';
            case TILE_FEATURE:
                return this.theme?.featureColor || '#4444ff';
            case TILE_DOOR_OPEN:
                return this.theme?.doorOpenColor || '#aa7744';
            case TILE_DOOR_CLOSED:
                return this.theme?.doorClosedColor || '#996633';
            case TILE_DOOR_LOCKED:
                return this.theme?.doorLockedColor || '#ff0000';
            case TILE_KEY:
                return '#ffff00';     // Yellow (key) - always bright
            case TILE_WEAPON:
                return '#ffff00';     // Yellow (weapon) - always bright
            case TILE_CONSUMABLE:
                return '#00ff00';     // Green (consumable) - always bright
            case TILE_WATER:
                return '#4488cc';     // Blue (water)
            case TILE_CHASM:
                return '#000000';     // Black (chasm/void)
            case TILE_TRAP:
                return '#ff4444';     // Red (trap)
            default:
                return '#ff0000';     // Red (error)
        }
    }

    // Clear entire map to floor
    clear() {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                this.tiles[y][x] = TILE_FLOOR;
            }
        }
    }

    // Find a valid walkable position (useful for spawning player)
    findWalkablePosition() {
        // CRITICAL FIX (Session 12c): Spawn in connected room, not isolated room
        // Bug: Old logic scanned top-left, could spawn in isolated room
        // Fix: Spawn near stairs (guaranteed connected via connectivity validation)

        // Priority 1: Spawn near upstairs (guaranteed connected room)
        const upstairs = this.findUpStairsPosition();
        if (upstairs) {
            // Found upstairs, spawn adjacent
            const adjacent = [
                {x: upstairs.x - 1, y: upstairs.y},
                {x: upstairs.x + 1, y: upstairs.y},
                {x: upstairs.x, y: upstairs.y - 1},
                {x: upstairs.x, y: upstairs.y + 1}
            ];

            for (const pos of adjacent) {
                if (this.isWalkable(pos.x, pos.y)) {
                    console.log(`Spawning near upstairs at (${pos.x}, ${pos.y})`);
                    return pos;
                }
            }

            // No adjacent walkable, spawn ON upstairs
            console.log(`Spawning ON upstairs at (${upstairs.x}, ${upstairs.y})`);
            return upstairs;
        }

        // Priority 2: No upstairs (Floor 10), spawn near downstairs
        const downstairs = this.findDownStairsPosition();
        if (downstairs) {
            const adjacent = [
                {x: downstairs.x - 1, y: downstairs.y},
                {x: downstairs.x + 1, y: downstairs.y},
                {x: downstairs.x, y: downstairs.y - 1},
                {x: downstairs.x, y: downstairs.y + 1}
            ];

            for (const pos of adjacent) {
                if (this.isWalkable(pos.x, pos.y)) {
                    console.log(`Spawning near downstairs at (${pos.x}, ${pos.y})`);
                    return pos;
                }
            }

            // No adjacent walkable, spawn ON downstairs (rare, but safe)
            console.log(`Spawning ON downstairs at (${downstairs.x}, ${downstairs.y})`);
            return downstairs;
        }

        // Priority 3: Fallback - search from top-left for first walkable tile
        // This should never happen if dungeon generated correctly
        console.warn('⚠️ No stairs found, using fallback spawn (isolated room risk!)');
        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                if (this.isWalkable(x, y)) {
                    return { x, y };
                }
            }
        }

        // Last resort: center of map
        return {
            x: Math.floor(this.width / 2),
            y: Math.floor(this.height / 2)
        };
    }

    // Find upward staircase position (for guaranteed safe spawn)
    findUpStairsPosition() {
        // Search for upward stairs
        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                if (this.getTile(x, y) === TILE_STAIRS_UP) {
                    return { x, y };
                }
            }
        }

        // No upstairs found (e.g., Floor 10)
        return null;
    }

    // Find downward staircase or toilet position (Session 12c)
    findDownStairsPosition() {
        // Search for downward stairs or toilet
        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                const tile = this.getTile(x, y);
                if (tile === TILE_STAIRS || tile === TILE_TOILET) {
                    return { x, y };
                }
            }
        }

        // No downstairs found
        return null;
    }

    // Find a safe spawn position ADJACENT to upstairs (not ON upstairs)
    // This prevents immediate stair re-trigger without needing cooldowns
    findSafeSpawnNearUpstairs() {
        // First, find upstairs
        const upstairs = this.findUpStairsPosition();

        // Session 12c fix: Handle null case (Floor 10 has no upstairs)
        if (!upstairs) {
            console.warn('No upstairs found (Floor 10?), using findWalkablePosition fallback');
            // Fallback to downstairs or general walkable position
            const downstairs = this.findDownStairsPosition();
            if (downstairs) {
                // Try adjacent to downstairs
                const adjacent = [
                    {x: downstairs.x - 1, y: downstairs.y},
                    {x: downstairs.x + 1, y: downstairs.y},
                    {x: downstairs.x, y: downstairs.y - 1},
                    {x: downstairs.x, y: downstairs.y + 1}
                ];

                for (const pos of adjacent) {
                    if (this.isWalkable(pos.x, pos.y)) {
                        return pos;
                    }
                }
                return downstairs;
            }

            // Last resort: search for any walkable position
            for (let y = 1; y < this.height - 1; y++) {
                for (let x = 1; x < this.width - 1; x++) {
                    if (this.isWalkable(x, y)) {
                        return { x, y };
                    }
                }
            }
        }

        // Find all adjacent walkable tiles (4-directional)
        const adjacentTiles = [
            {x: upstairs.x - 1, y: upstairs.y},     // West
            {x: upstairs.x + 1, y: upstairs.y},     // East
            {x: upstairs.x, y: upstairs.y - 1},     // North
            {x: upstairs.x, y: upstairs.y + 1}      // South
        ];

        // Filter to only walkable tiles (not walls, not locked doors)
        const walkableAdjacent = adjacentTiles.filter(tile =>
            this.isWalkable(tile.x, tile.y)
        );

        if (walkableAdjacent.length > 0) {
            // Pick a random adjacent walkable tile
            const spawn = walkableAdjacent[Math.floor(Math.random() * walkableAdjacent.length)];
            console.log(`Spawning adjacent to upstairs at (${spawn.x}, ${spawn.y}), upstairs at (${upstairs.x}, ${upstairs.y})`);
            return spawn;
        }

        // Edge case: no adjacent walkable tiles (upstairs completely surrounded?)
        // Fallback: spawn ON upstairs (will need cooldown, but rare)
        console.warn('No adjacent walkable tiles to upstairs, spawning ON upstairs');
        return upstairs;
    }
}
