// Vault Library - Hand-crafted special room templates
// These create memorable, well-designed encounters vs purely procedural

import {
    TILE_FLOOR,
    TILE_WALL,
    TILE_PILLAR,
    TILE_FEATURE
} from './tile-map.js';

// Vault template structure:
// - tiles: 2D array of tile constants (tiles[y][x])
// - entrance: {x, y} relative coordinates where door should be placed
// - All templates designed with single entrance for door placement

export const VAULT_TEMPLATES = {
    // Small cross vault (7x7) - Symmetrical treasure room
    TREASURE_CROSS: {
        name: 'Treasure Cross',
        width: 7,
        height: 7,
        entrance: {x: 3, y: 6}, // Bottom center
        tiles: [
            [1, 1, 1, 1, 1, 1, 1],  // 1 = TILE_WALL
            [1, 1, 1, 0, 1, 1, 1],  // 0 = TILE_FLOOR
            [1, 1, 0, 6, 0, 1, 1],  // 6 = TILE_FEATURE (treasure/item spawn)
            [1, 0, 6, 6, 6, 0, 1],
            [1, 1, 0, 6, 0, 1, 1],
            [1, 1, 1, 0, 1, 1, 1],
            [1, 1, 1, 0, 1, 1, 1]   // Entrance at bottom
        ]
    },

    // Prison cells (9x7) - Multiple small chambers
    PRISON: {
        name: 'Prison Cells',
        width: 9,
        height: 7,
        entrance: {x: 4, y: 6},
        tiles: [
            [1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 6, 1, 0, 1, 0, 1, 6, 1],  // Cells with features
            [1, 0, 1, 0, 1, 0, 1, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 1],  // Central corridor
            [1, 0, 1, 0, 1, 0, 1, 0, 1],
            [1, 6, 1, 0, 1, 0, 1, 6, 1],
            [1, 1, 1, 1, 0, 1, 1, 1, 1]   // Entrance
        ]
    },

    // Pillared hall (9x9) - Grand chamber with pillars
    PILLARED_HALL: {
        name: 'Pillared Hall',
        width: 9,
        height: 9,
        entrance: {x: 4, y: 8},
        tiles: [
            [1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 5, 0, 6, 0, 5, 0, 1],  // 5 = TILE_PILLAR
            [1, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 6, 0, 6, 0, 6, 0, 1],  // Central features
            [1, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 5, 0, 6, 0, 5, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 1, 1, 1, 0, 1, 1, 1, 1]   // Entrance
        ]
    },

    // Shrine (7x7) - Circular altar room
    SHRINE: {
        name: 'Shrine',
        width: 7,
        height: 7,
        entrance: {x: 3, y: 6},
        tiles: [
            [1, 1, 1, 1, 1, 1, 1],
            [1, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 6, 0, 0, 1],  // Central altar
            [1, 0, 6, 6, 6, 0, 1],  // Ring of features
            [1, 0, 0, 6, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 1],
            [1, 1, 1, 0, 1, 1, 1]   // Entrance
        ]
    },

    // Treasure chamber (9x7) - Locked vault layout
    TREASURE_CHAMBER: {
        name: 'Treasure Chamber',
        width: 9,
        height: 7,
        entrance: {x: 4, y: 6},
        tiles: [
            [1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 6, 0, 0, 0, 0, 0, 6, 1],
            [1, 0, 1, 1, 1, 1, 1, 0, 1],
            [1, 0, 1, 6, 6, 6, 1, 0, 1],  // Inner vault
            [1, 0, 1, 1, 1, 1, 1, 0, 1],
            [1, 6, 0, 0, 0, 0, 0, 6, 1],
            [1, 1, 1, 1, 0, 1, 1, 1, 1]   // Entrance
        ]
    }
};

/**
 * Get random vault template
 * @returns {Object} Random vault template
 */
export function getRandomVaultTemplate() {
    const templates = Object.values(VAULT_TEMPLATES);
    return templates[Math.floor(Math.random() * templates.length)];
}

/**
 * Place vault template onto tile map at room location
 * @param {TileMap} tileMap - The tile map
 * @param {Object} room - Room object with x, y, width, height
 * @param {Object} template - Vault template
 * @returns {Object} Entrance position in world coordinates, or null if placement failed
 */
export function placeVaultTemplate(tileMap, room, template) {
    // Check if template fits in room
    if (template.width > room.width || template.height > room.height) {
        console.warn(`Vault template ${template.name} too large for room (${template.width}x${template.height} vs ${room.width}x${room.height})`);
        return null;
    }

    // Center template in room
    const offsetX = room.x + Math.floor((room.width - template.width) / 2);
    const offsetY = room.y + Math.floor((room.height - template.height) / 2);

    // Stamp template tiles onto map
    for (let ty = 0; ty < template.height; ty++) {
        for (let tx = 0; tx < template.width; tx++) {
            const tileType = template.tiles[ty][tx];
            const worldX = offsetX + tx;
            const worldY = offsetY + ty;
            tileMap.setTile(worldX, worldY, tileType);
        }
    }

    // Calculate entrance position in world coordinates
    const entranceX = offsetX + template.entrance.x;
    const entranceY = offsetY + template.entrance.y;


    return {
        x: entranceX,
        y: entranceY
    };
}

/**
 * Check if a vault template can fit in a room
 * @param {Object} room - Room object
 * @param {Object} template - Vault template
 * @returns {boolean} True if template fits
 */
export function canFitTemplate(room, template) {
    return template.width <= room.width && template.height <= room.height;
}
