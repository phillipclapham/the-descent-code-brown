// Tile Map System - 2D grid for dungeon layout
// Handles floor, wall, and stairs tiles with collision detection

// Tile type constants
export const TILE_FLOOR = 0;
export const TILE_WALL = 1;
export const TILE_STAIRS = 2;

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
        return tile === TILE_FLOOR || tile === TILE_STAIRS;
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
                return '>';
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
                return '#ffff00';
            default:
                return '#ff00ff';
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
}
