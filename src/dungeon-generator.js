// Dungeon Generator - Creates procedural room-based dungeons
// Generates rooms, connects them with corridors, and places stairs

import { TILE_FLOOR, TILE_WALL, TILE_STAIRS, TILE_STAIRS_UP, TILE_TOILET } from './tile-map.js';
import {
    categorizeRoomBySize,
    generateRoomShape,
    carveRoomByShape,
    placeArchitecturalFeatures,
    ROOM_SHAPE
} from './room-shapes.js';

export class DungeonGenerator {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.rooms = [];
    }

    // Generate a complete dungeon on a tile map
    // isFirstFloor: if true, does NOT place upward stairs (nothing above)
    // isLastFloor: if true, places toilet instead of downward stairs
    generate(tileMap, isFirstFloor = false, isLastFloor = false) {
        // Clear and fill with walls
        this.fillWithWalls(tileMap);

        // Generate 3-5 rooms
        const numRooms = 3 + Math.floor(Math.random() * 3); // 3-5 rooms
        this.rooms = [];

        let attempts = 0;
        const maxAttempts = 100;

        while (this.rooms.length < numRooms && attempts < maxAttempts) {
            attempts++;

            // Random room parameters (wider size range for variety)
            const width = 5 + Math.floor(Math.random() * 12); // 5-16 tiles wide
            const height = 5 + Math.floor(Math.random() * 12); // 5-16 tiles tall
            const x = 2 + Math.floor(Math.random() * (this.width - width - 4));
            const y = 2 + Math.floor(Math.random() * (this.height - height - 4));

            // Create enhanced room object
            const room = {
                x,
                y,
                width,
                height,
                type: categorizeRoomBySize(width, height),
                shape: null,  // Will be assigned during carving
                features: []
            };

            // Generate shape based on room size
            room.shape = generateRoomShape(room);

            // Check if room overlaps with existing rooms
            if (!this.overlapsAny(room)) {
                // Carve room using its shape
                carveRoomByShape(tileMap, room, room.shape);

                // Add architectural features (pillars, center features)
                placeArchitecturalFeatures(tileMap, room);

                this.rooms.push(room);

                // Connect to previous room if not first room
                if (this.rooms.length > 1) {
                    this.connectRooms(
                        tileMap,
                        this.rooms[this.rooms.length - 2],
                        room
                    );
                }
            }
        }

        // Place upward stairs in the first room (for backtracking)
        // But NOT on the first floor (nothing above to go back to)
        if (this.rooms.length > 0 && !isFirstFloor) {
            const firstRoom = this.rooms[0];
            const upStairsX = firstRoom.x + Math.floor(firstRoom.width / 2);
            const upStairsY = firstRoom.y + Math.floor(firstRoom.height / 2);
            tileMap.setTile(upStairsX, upStairsY, TILE_STAIRS_UP);
        }

        // Place downward stairs or toilet in the last room
        if (this.rooms.length > 0) {
            const lastRoom = this.rooms[this.rooms.length - 1];
            const stairsX = lastRoom.x + Math.floor(lastRoom.width / 2);
            const stairsY = lastRoom.y + Math.floor(lastRoom.height / 2);

            if (isLastFloor) {
                // Final floor: place toilet instead of stairs
                tileMap.setTile(stairsX, stairsY, TILE_TOILET);
            } else {
                // Regular floor: place downward stairs
                tileMap.setTile(stairsX, stairsY, TILE_STAIRS);
            }
        }

        // Log room variety
        const roomTypes = this.rooms.map(r => r.type);
        const shapes = this.rooms.map(r => r.shape);
        console.log(`Dungeon generated: ${this.rooms.length} rooms${isLastFloor ? ' (FINAL FLOOR)' : ''}`);
        console.log(`  Types: ${roomTypes.join(', ')}`);
        console.log(`  Shapes: ${shapes.join(', ')}`);
    }

    // Fill entire map with walls
    fillWithWalls(tileMap) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                tileMap.setTile(x, y, TILE_WALL);
            }
        }
    }

    // Check if room overlaps with any existing rooms (with 1-tile buffer)
    overlapsAny(room) {
        for (const other of this.rooms) {
            if (this.roomsOverlap(room, other)) {
                return true;
            }
        }
        return false;
    }

    // Check if two rooms overlap (with 1-tile buffer for walls)
    roomsOverlap(room1, room2) {
        return !(
            room1.x + room1.width + 1 < room2.x ||
            room2.x + room2.width + 1 < room1.x ||
            room1.y + room1.height + 1 < room2.y ||
            room2.y + room2.height + 1 < room1.y
        );
    }

    // Connect two rooms with L-shaped corridor
    connectRooms(tileMap, room1, room2) {
        // Get center points of each room
        const x1 = room1.x + Math.floor(room1.width / 2);
        const y1 = room1.y + Math.floor(room1.height / 2);
        const x2 = room2.x + Math.floor(room2.width / 2);
        const y2 = room2.y + Math.floor(room2.height / 2);

        // Randomly choose horizontal-then-vertical or vertical-then-horizontal
        if (Math.random() < 0.5) {
            // Horizontal then vertical
            this.carveHorizontalCorridor(tileMap, x1, x2, y1);
            this.carveVerticalCorridor(tileMap, y1, y2, x2);
        } else {
            // Vertical then horizontal
            this.carveVerticalCorridor(tileMap, y1, y2, x1);
            this.carveHorizontalCorridor(tileMap, x1, x2, y2);
        }
    }

    // Carve horizontal corridor between two x coordinates at y
    carveHorizontalCorridor(tileMap, x1, x2, y) {
        const startX = Math.min(x1, x2);
        const endX = Math.max(x1, x2);

        for (let x = startX; x <= endX; x++) {
            tileMap.setTile(x, y, TILE_FLOOR);
        }
    }

    // Carve vertical corridor between two y coordinates at x
    carveVerticalCorridor(tileMap, y1, y2, x) {
        const startY = Math.min(y1, y2);
        const endY = Math.max(y1, y2);

        for (let y = startY; y <= endY; y++) {
            tileMap.setTile(x, y, TILE_FLOOR);
        }
    }

    // Get the position of stairs in the last room (useful for player spawning)
    getStairsPosition() {
        if (this.rooms.length === 0) {
            return null;
        }

        const lastRoom = this.rooms[this.rooms.length - 1];
        return {
            x: lastRoom.x + Math.floor(lastRoom.width / 2),
            y: lastRoom.y + Math.floor(lastRoom.height / 2)
        };
    }
}
