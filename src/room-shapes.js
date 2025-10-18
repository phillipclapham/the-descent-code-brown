// Room Shapes System - Handles room categorization and shape generation
// Provides variety beyond basic rectangular rooms

import { TILE_FLOOR, TILE_PILLAR, TILE_FEATURE } from './tile-map.js';

// Room type constants (by size)
export const ROOM_TYPE = {
    CLOSET: 'CLOSET',   // 3x3 to 4x4
    SMALL: 'SMALL',     // 5x5 to 7x7
    NORMAL: 'NORMAL',   // 8x8 to 10x10
    LARGE: 'LARGE',     // 11x11 to 13x13
    GRAND: 'GRAND'      // 14x14 to 16x16
};

// Room shape constants
export const ROOM_SHAPE = {
    RECTANGULAR: 'RECTANGULAR',
    CIRCULAR: 'CIRCULAR',
    CROSS: 'CROSS',
    L_SHAPE: 'L_SHAPE',
    T_SHAPE: 'T_SHAPE',
    DIAMOND: 'DIAMOND'
};

// Categorize room by size (smallest dimension determines type)
export function categorizeRoomBySize(width, height) {
    const minDim = Math.min(width, height);

    if (minDim <= 4) return ROOM_TYPE.CLOSET;
    if (minDim <= 7) return ROOM_TYPE.SMALL;
    if (minDim <= 10) return ROOM_TYPE.NORMAL;
    if (minDim <= 13) return ROOM_TYPE.LARGE;
    return ROOM_TYPE.GRAND;
}

// Generate appropriate shape for room based on size and randomness
export function generateRoomShape(room) {
    const roomType = categorizeRoomBySize(room.width, room.height);

    // Closets are always rectangular (too small for complex shapes)
    if (roomType === ROOM_TYPE.CLOSET) {
        return ROOM_SHAPE.RECTANGULAR;
    }

    // Small rooms: mostly rectangular, occasional circular
    if (roomType === ROOM_TYPE.SMALL) {
        return Math.random() < 0.7 ? ROOM_SHAPE.RECTANGULAR : ROOM_SHAPE.CIRCULAR;
    }

    // Normal rooms: good variety
    if (roomType === ROOM_TYPE.NORMAL) {
        const rand = Math.random();
        if (rand < 0.3) return ROOM_SHAPE.RECTANGULAR;
        if (rand < 0.5) return ROOM_SHAPE.CIRCULAR;
        if (rand < 0.7) return ROOM_SHAPE.CROSS;
        return ROOM_SHAPE.L_SHAPE;
    }

    // Large rooms: all shapes possible
    if (roomType === ROOM_TYPE.LARGE) {
        const rand = Math.random();
        if (rand < 0.2) return ROOM_SHAPE.RECTANGULAR;
        if (rand < 0.35) return ROOM_SHAPE.CIRCULAR;
        if (rand < 0.5) return ROOM_SHAPE.CROSS;
        if (rand < 0.65) return ROOM_SHAPE.L_SHAPE;
        if (rand < 0.8) return ROOM_SHAPE.T_SHAPE;
        return ROOM_SHAPE.DIAMOND;
    }

    // Grand rooms: favor impressive shapes
    const rand = Math.random();
    if (rand < 0.1) return ROOM_SHAPE.RECTANGULAR;
    if (rand < 0.3) return ROOM_SHAPE.CIRCULAR;
    if (rand < 0.5) return ROOM_SHAPE.CROSS;
    if (rand < 0.7) return ROOM_SHAPE.T_SHAPE;
    return ROOM_SHAPE.DIAMOND;
}

// Carve room based on shape
export function carveRoomByShape(tileMap, room, shape) {
    switch (shape) {
        case ROOM_SHAPE.RECTANGULAR:
            carveRectangular(tileMap, room);
            break;
        case ROOM_SHAPE.CIRCULAR:
            carveCircular(tileMap, room);
            break;
        case ROOM_SHAPE.CROSS:
            carveCross(tileMap, room);
            break;
        case ROOM_SHAPE.L_SHAPE:
            carveLShape(tileMap, room);
            break;
        case ROOM_SHAPE.T_SHAPE:
            carveTShape(tileMap, room);
            break;
        case ROOM_SHAPE.DIAMOND:
            carveDiamond(tileMap, room);
            break;
        default:
            // Fallback to rectangular
            carveRectangular(tileMap, room);
    }
}

// Shape carving functions

function carveRectangular(tileMap, room) {
    for (let y = room.y; y < room.y + room.height; y++) {
        for (let x = room.x; x < room.x + room.width; x++) {
            tileMap.setTile(x, y, TILE_FLOOR);
        }
    }
}

function carveCircular(tileMap, room) {
    const centerX = room.x + room.width / 2;
    const centerY = room.y + room.height / 2;
    const radiusX = room.width / 2;
    const radiusY = room.height / 2;

    for (let y = room.y; y < room.y + room.height; y++) {
        for (let x = room.x; x < room.x + room.width; x++) {
            // Ellipse formula: (x-cx)²/rx² + (y-cy)²/ry² <= 1
            const normalizedX = (x - centerX) / radiusX;
            const normalizedY = (y - centerY) / radiusY;

            if (normalizedX * normalizedX + normalizedY * normalizedY <= 1) {
                tileMap.setTile(x, y, TILE_FLOOR);
            }
        }
    }
}

function carveCross(tileMap, room) {
    const centerX = room.x + Math.floor(room.width / 2);
    const centerY = room.y + Math.floor(room.height / 2);
    const armWidth = Math.max(3, Math.floor(room.width / 3));
    const armHeight = Math.max(3, Math.floor(room.height / 3));

    // Horizontal arm
    for (let y = centerY - Math.floor(armHeight / 2); y < centerY + Math.ceil(armHeight / 2); y++) {
        for (let x = room.x; x < room.x + room.width; x++) {
            tileMap.setTile(x, y, TILE_FLOOR);
        }
    }

    // Vertical arm
    for (let y = room.y; y < room.y + room.height; y++) {
        for (let x = centerX - Math.floor(armWidth / 2); x < centerX + Math.ceil(armWidth / 2); x++) {
            tileMap.setTile(x, y, TILE_FLOOR);
        }
    }
}

function carveLShape(tileMap, room) {
    // Create L-shape: bottom-left portion
    const horizontalHeight = Math.floor(room.height / 2) + Math.floor(Math.random() * 3);
    const verticalWidth = Math.floor(room.width / 2) + Math.floor(Math.random() * 3);

    // Horizontal portion (bottom)
    for (let y = room.y + room.height - horizontalHeight; y < room.y + room.height; y++) {
        for (let x = room.x; x < room.x + room.width; x++) {
            tileMap.setTile(x, y, TILE_FLOOR);
        }
    }

    // Vertical portion (left)
    for (let y = room.y; y < room.y + room.height; y++) {
        for (let x = room.x; x < room.x + verticalWidth; x++) {
            tileMap.setTile(x, y, TILE_FLOOR);
        }
    }
}

function carveTShape(tileMap, room) {
    const stemWidth = Math.max(3, Math.floor(room.width / 3));
    const topHeight = Math.max(3, Math.floor(room.height / 3));
    const centerX = room.x + Math.floor(room.width / 2);

    // Top horizontal bar
    for (let y = room.y; y < room.y + topHeight; y++) {
        for (let x = room.x; x < room.x + room.width; x++) {
            tileMap.setTile(x, y, TILE_FLOOR);
        }
    }

    // Vertical stem (center to bottom)
    for (let y = room.y + topHeight; y < room.y + room.height; y++) {
        for (let x = centerX - Math.floor(stemWidth / 2); x < centerX + Math.ceil(stemWidth / 2); x++) {
            tileMap.setTile(x, y, TILE_FLOOR);
        }
    }
}

function carveDiamond(tileMap, room) {
    const centerX = room.x + room.width / 2;
    const centerY = room.y + room.height / 2;
    const halfWidth = room.width / 2;
    const halfHeight = room.height / 2;

    for (let y = room.y; y < room.y + room.height; y++) {
        for (let x = room.x; x < room.x + room.width; x++) {
            // Diamond/rhombus: |x-cx|/w + |y-cy|/h <= 1
            const normalizedX = Math.abs(x - centerX) / halfWidth;
            const normalizedY = Math.abs(y - centerY) / halfHeight;

            if (normalizedX + normalizedY <= 1) {
                tileMap.setTile(x, y, TILE_FLOOR);
            }
        }
    }
}

// Place architectural features in a room (pillars, decorations)
export function placeArchitecturalFeatures(tileMap, room) {
    const roomType = categorizeRoomBySize(room.width, room.height);

    // Only large and grand rooms get pillars
    if (roomType === ROOM_TYPE.LARGE || roomType === ROOM_TYPE.GRAND) {
        placePillars(tileMap, room, roomType);
    }

    // All non-closet rooms get random decorations
    if (roomType !== ROOM_TYPE.CLOSET) {
        placeRoomDecorations(tileMap, room, roomType);
    }
}

function placePillars(tileMap, room, roomType) {
    // Different pillar patterns based on room size
    if (roomType === ROOM_TYPE.GRAND) {
        // Grand rooms: 4-corner pillars + center cluster
        placeCornerPillars(tileMap, room);
        if (Math.random() < 0.5) {
            placeCenterCluster(tileMap, room);
        }
    } else {
        // Large rooms: just corner pillars
        placeCornerPillars(tileMap, room);
    }
}

function placeCornerPillars(tileMap, room) {
    const inset = 2; // Distance from room edge

    // Only place if room is large enough
    if (room.width < 8 || room.height < 8) return;

    const positions = [
        { x: room.x + inset, y: room.y + inset },                              // Top-left
        { x: room.x + room.width - inset - 1, y: room.y + inset },             // Top-right
        { x: room.x + inset, y: room.y + room.height - inset - 1 },            // Bottom-left
        { x: room.x + room.width - inset - 1, y: room.y + room.height - inset - 1 }  // Bottom-right
    ];

    for (const pos of positions) {
        // Only place if position is floor (respects room shape)
        if (tileMap.getTile(pos.x, pos.y) === TILE_FLOOR) {
            tileMap.setTile(pos.x, pos.y, TILE_PILLAR);
        }
    }
}

function placeCenterCluster(tileMap, room) {
    const centerX = room.x + Math.floor(room.width / 2);
    const centerY = room.y + Math.floor(room.height / 2);

    // 2x2 pillar cluster at center
    const positions = [
        { x: centerX - 1, y: centerY - 1 },
        { x: centerX, y: centerY - 1 },
        { x: centerX - 1, y: centerY },
        { x: centerX, y: centerY }
    ];

    for (const pos of positions) {
        if (tileMap.getTile(pos.x, pos.y) === TILE_FLOOR) {
            tileMap.setTile(pos.x, pos.y, TILE_PILLAR);
        }
    }
}

// Place random decorations throughout a room (scaled by room size)
function placeRoomDecorations(tileMap, room, roomType) {
    // Determine decoration count based on room type
    let decorationCount = 0;

    switch (roomType) {
        case ROOM_TYPE.CLOSET:
            // Closets: 0-1 (50% chance of 1)
            decorationCount = Math.random() < 0.5 ? 1 : 0;
            break;
        case ROOM_TYPE.SMALL:
            // Small: 0-2 (average 1)
            decorationCount = Math.floor(Math.random() * 3);
            break;
        case ROOM_TYPE.NORMAL:
            // Normal: 1-3 (average 2)
            decorationCount = 1 + Math.floor(Math.random() * 3);
            break;
        case ROOM_TYPE.LARGE:
            // Large: 2-4 (average 3)
            decorationCount = 2 + Math.floor(Math.random() * 3);
            break;
        case ROOM_TYPE.GRAND:
            // Grand: 2-5 (average 3.5)
            decorationCount = 2 + Math.floor(Math.random() * 4);
            break;
    }

    // Get all valid floor tiles for decoration placement
    const validTiles = getValidDecorationTiles(tileMap, room, []);

    // Place decorations with spacing
    const placedDecorations = [];

    for (let i = 0; i < decorationCount && validTiles.length > 0; i++) {
        // Pick random valid tile
        const randomIndex = Math.floor(Math.random() * validTiles.length);
        const tile = validTiles[randomIndex];

        // Place decoration
        tileMap.setTile(tile.x, tile.y, TILE_FEATURE);
        placedDecorations.push(tile);

        // Remove this tile and nearby tiles from valid list (enforce spacing)
        const newValidTiles = [];
        for (const vt of validTiles) {
            const dist = Math.abs(vt.x - tile.x) + Math.abs(vt.y - tile.y);
            if (dist >= 2) { // Minimum 2-tile spacing
                newValidTiles.push(vt);
            }
        }
        validTiles.length = 0;
        validTiles.push(...newValidTiles);
    }
}

// Get valid floor tiles for decoration placement (excluding edges, pillars, etc.)
function getValidDecorationTiles(tileMap, room, existingDecorations) {
    const validTiles = [];

    // Iterate through room, excluding 1-tile border
    for (let y = room.y + 1; y < room.y + room.height - 1; y++) {
        for (let x = room.x + 1; x < room.x + room.width - 1; x++) {
            const tile = tileMap.getTile(x, y);

            // Only consider floor tiles (not walls, pillars, stairs, etc.)
            if (tile === TILE_FLOOR) {
                validTiles.push({ x, y });
            }
        }
    }

    return validTiles;
}

// Distribution helper: generates target room counts for a floor
export function getTargetRoomDistribution() {
    return {
        [ROOM_TYPE.GRAND]: 1,
        [ROOM_TYPE.LARGE]: 2 + Math.floor(Math.random() * 2),  // 2-3
        [ROOM_TYPE.NORMAL]: 3 + Math.floor(Math.random() * 3), // 3-5
        [ROOM_TYPE.SMALL]: 1 + Math.floor(Math.random() * 2),  // 1-2
        [ROOM_TYPE.CLOSET]: Math.random() < 0.3 ? 1 : 0        // 0-1
    };
}
