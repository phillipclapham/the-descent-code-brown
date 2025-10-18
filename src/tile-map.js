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

export class TileMap {
    constructor(width, height) {
        this.width = width;
        this.height = height;

        // Initialize 2D array (row-major: tiles[y][x])
        this.tiles = [];
        for (let y = 0; y < height; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < width; x++) {
                this.tiles[y][x] = TILE_FLOOR;
            }
        }

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
               tile === TILE_KEY;
        // Note: TILE_DOOR_CLOSED and TILE_DOOR_LOCKED are NOT walkable
        // Player interaction will open/unlock them first
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
            default:
                return '?';
        }
    }

    // Get color for tile type
    getTileColor(tileType) {
        switch (tileType) {
            case TILE_FLOOR:
                return '#333333';
            case TILE_WALL:
                return '#888888';
            case TILE_STAIRS:
                return '#ffff00';     // Yellow (down)
            case TILE_STAIRS_UP:
                return '#00ffff';     // Cyan (up)
            case TILE_TOILET:
                return '#ff00ff';     // Magenta (victory!)
            case TILE_PILLAR:
                return '#666666';     // Gray (pillar)
            case TILE_FEATURE:
                return '#4444ff';     // Blue (feature)
            case TILE_DOOR_OPEN:
                return '#aa7744';     // Brown (open door)
            case TILE_DOOR_CLOSED:
                return '#996633';     // Brown (closed door)
            case TILE_DOOR_LOCKED:
                return '#ff0000';     // Red (locked door)
            case TILE_KEY:
                return '#ffff00';     // Yellow (key)
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
        // Search from top-left for first walkable tile
        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                if (this.isWalkable(x, y)) {
                    return { x, y };
                }
            }
        }

        // Fallback: return center (shouldn't happen if map has any floor)
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

        // No upstairs found (first floor) - find any walkable position
        return this.findWalkablePosition();
    }

    // Find a safe spawn position ADJACENT to upstairs (not ON upstairs)
    // This prevents immediate stair re-trigger without needing cooldowns
    findSafeSpawnNearUpstairs() {
        // First, find upstairs
        const upstairs = this.findUpStairsPosition();

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
