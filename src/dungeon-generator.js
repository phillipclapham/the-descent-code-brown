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
            }
        }

        // NEW: Connect rooms using graph-based system (after all rooms generated)
        if (this.rooms.length >= 2) {
            // Build connection graph using nearest-neighbor strategy
            const connections = this.buildConnectionGraph();

            // Connect rooms with winding corridors
            for (const [idx1, idx2] of connections) {
                const path = this.findPathBetweenRooms(
                    this.rooms[idx1],
                    this.rooms[idx2],
                    tileMap
                );
                this.carveWindingCorridor(tileMap, path);
            }

            // Add secondary connections for loops (25% of rooms)
            this.addSecondaryConnections(tileMap);

            // Validate connectivity and fix if needed
            const firstRoom = this.rooms[0];
            const startX = firstRoom.x + Math.floor(firstRoom.width / 2);
            const startY = firstRoom.y + Math.floor(firstRoom.height / 2);

            if (!this.validateConnectivity(tileMap, startX, startY)) {
                console.warn('Connectivity validation failed, fixing orphaned rooms...');
                const orphaned = this.findOrphanedRooms(tileMap, startX, startY);

                for (const orphanedRoom of orphaned) {
                    // Connect to first room (guaranteed to be connected)
                    this.forceConnectRoom(tileMap, orphanedRoom, this.rooms[0]);
                }

                // Re-validate
                if (this.validateConnectivity(tileMap, startX, startY)) {
                    console.log('Connectivity restored!');
                } else {
                    console.error('Failed to restore connectivity');
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

    // Calculate distance between two room centers
    distance(room1, room2) {
        const x1 = room1.x + Math.floor(room1.width / 2);
        const y1 = room1.y + Math.floor(room1.height / 2);
        const x2 = room2.x + Math.floor(room2.width / 2);
        const y2 = room2.y + Math.floor(room2.height / 2);

        // Manhattan distance (better for grid-based pathfinding)
        return Math.abs(x2 - x1) + Math.abs(y2 - y1);
    }

    // Build connection graph using nearest-neighbor strategy
    // Returns array of [room1, room2] pairs to connect
    buildConnectionGraph() {
        if (this.rooms.length < 2) {
            return [];
        }

        const connections = [];
        const connected = new Set([0]); // Start with first room as connected
        const unconnected = new Set(this.rooms.map((_, i) => i).slice(1));

        // Build minimum spanning tree using nearest neighbor
        while (unconnected.size > 0) {
            let bestDistance = Infinity;
            let bestPair = null;

            // Find closest unconnected room to any connected room
            for (const connectedIdx of connected) {
                for (const unconnectedIdx of unconnected) {
                    const dist = this.distance(
                        this.rooms[connectedIdx],
                        this.rooms[unconnectedIdx]
                    );

                    if (dist < bestDistance) {
                        bestDistance = dist;
                        bestPair = [connectedIdx, unconnectedIdx];
                    }
                }
            }

            if (bestPair) {
                connections.push(bestPair);
                connected.add(bestPair[1]);
                unconnected.delete(bestPair[1]);
            } else {
                // Safety: shouldn't happen, but break if no connection found
                break;
            }
        }

        return connections;
    }

    // Find path between two rooms using "drunk walk" algorithm
    // Returns array of {x, y} points representing the path
    findPathBetweenRooms(room1, room2, tileMap) {
        const x1 = room1.x + Math.floor(room1.width / 2);
        const y1 = room1.y + Math.floor(room1.height / 2);
        const x2 = room2.x + Math.floor(room2.width / 2);
        const y2 = room2.y + Math.floor(room2.height / 2);

        const path = [{x: x1, y: y1}];
        let currentX = x1;
        let currentY = y1;

        const maxIterations = this.distance(room1, room2) * 3;
        let iterations = 0;

        while ((currentX !== x2 || currentY !== y2) && iterations < maxIterations) {
            iterations++;

            // 70% chance to move toward target, 30% chance random direction
            let nextX = currentX;
            let nextY = currentY;

            if (Math.random() < 0.7) {
                // Move toward target
                if (currentX < x2) nextX++;
                else if (currentX > x2) nextX--;
                else if (currentY < y2) nextY++;
                else if (currentY > y2) nextY--;
            } else {
                // Random direction (4-directional)
                const directions = [
                    {dx: 0, dy: -1}, // North
                    {dx: 0, dy: 1},  // South
                    {dx: -1, dy: 0}, // West
                    {dx: 1, dy: 0}   // East
                ];
                const dir = directions[Math.floor(Math.random() * directions.length)];
                nextX = currentX + dir.dx;
                nextY = currentY + dir.dy;
            }

            // Bounds check
            if (nextX > 0 && nextX < this.width - 1 &&
                nextY > 0 && nextY < this.height - 1) {
                currentX = nextX;
                currentY = nextY;
                path.push({x: currentX, y: currentY});
            }
        }

        // If we didn't reach target, fall back to L-shaped corridor
        if (currentX !== x2 || currentY !== y2) {
            console.log('Drunk walk failed, using L-shaped fallback');
            return this.createLShapedPath(x1, y1, x2, y2);
        }

        return path;
    }

    // Create L-shaped path as fallback (original algorithm)
    createLShapedPath(x1, y1, x2, y2) {
        const path = [];

        // Randomly choose horizontal-then-vertical or vertical-then-horizontal
        if (Math.random() < 0.5) {
            // Horizontal then vertical
            const startX = Math.min(x1, x2);
            const endX = Math.max(x1, x2);
            for (let x = startX; x <= endX; x++) {
                path.push({x, y: y1});
            }
            const startY = Math.min(y1, y2);
            const endY = Math.max(y1, y2);
            for (let y = startY; y <= endY; y++) {
                path.push({x: x2, y});
            }
        } else {
            // Vertical then horizontal
            const startY = Math.min(y1, y2);
            const endY = Math.max(y1, y2);
            for (let y = startY; y <= endY; y++) {
                path.push({x: x1, y});
            }
            const startX = Math.min(x1, x2);
            const endX = Math.max(x1, x2);
            for (let x = startX; x <= endX; x++) {
                path.push({x, y: y2});
            }
        }

        return path;
    }

    // Carve winding corridor from path array
    carveWindingCorridor(tileMap, path) {
        for (const point of path) {
            // Only carve if it's a wall (don't overwrite rooms)
            if (tileMap.getTile(point.x, point.y) === TILE_WALL) {
                tileMap.setTile(point.x, point.y, TILE_FLOOR);
            }
        }
    }

    // Add secondary connections to create loops (25% of rooms)
    addSecondaryConnections(tileMap) {
        const numSecondary = Math.floor(this.rooms.length * 0.25);

        for (let i = 0; i < numSecondary && i < this.rooms.length - 1; i++) {
            const room1 = this.rooms[i];
            const room2 = this.rooms[i + 2 < this.rooms.length ? i + 2 : i + 1];

            const path = this.findPathBetweenRooms(room1, room2, tileMap);
            this.carveWindingCorridor(tileMap, path);
        }
    }

    // Validate connectivity using flood-fill from start position
    // Returns true if all rooms are reachable
    validateConnectivity(tileMap, startX, startY) {
        const visited = new Set();
        const queue = [{x: startX, y: startY}];

        while (queue.length > 0) {
            const {x, y} = queue.shift();
            const key = `${x},${y}`;

            if (visited.has(key)) continue;
            visited.add(key);

            // Check all 4 directions
            const neighbors = [
                {x: x - 1, y},
                {x: x + 1, y},
                {x, y: y - 1},
                {x, y: y + 1}
            ];

            for (const neighbor of neighbors) {
                const tile = tileMap.getTile(neighbor.x, neighbor.y);
                const nKey = `${neighbor.x},${neighbor.y}`;

                // Walk on floors, stairs, and other walkable tiles
                if (!visited.has(nKey) && tile !== TILE_WALL && tile !== undefined) {
                    queue.push(neighbor);
                }
            }
        }

        // Check if all room centers are reachable
        for (const room of this.rooms) {
            const cx = room.x + Math.floor(room.width / 2);
            const cy = room.y + Math.floor(room.height / 2);
            const key = `${cx},${cy}`;

            if (!visited.has(key)) {
                console.warn('Room not reachable:', room);
                return false;
            }
        }

        return true;
    }

    // Find orphaned (unreachable) rooms
    findOrphanedRooms(tileMap, startX, startY) {
        const visited = new Set();
        const queue = [{x: startX, y: startY}];

        // Flood-fill to find reachable tiles
        while (queue.length > 0) {
            const {x, y} = queue.shift();
            const key = `${x},${y}`;

            if (visited.has(key)) continue;
            visited.add(key);

            const neighbors = [
                {x: x - 1, y},
                {x: x + 1, y},
                {x, y: y - 1},
                {x, y: y + 1}
            ];

            for (const neighbor of neighbors) {
                const tile = tileMap.getTile(neighbor.x, neighbor.y);
                const nKey = `${neighbor.x},${neighbor.y}`;

                if (!visited.has(nKey) && tile !== TILE_WALL && tile !== undefined) {
                    queue.push(neighbor);
                }
            }
        }

        // Find rooms whose centers are not reachable
        const orphaned = [];
        for (const room of this.rooms) {
            const cx = room.x + Math.floor(room.width / 2);
            const cy = room.y + Math.floor(room.height / 2);
            const key = `${cx},${cy}`;

            if (!visited.has(key)) {
                orphaned.push(room);
            }
        }

        return orphaned;
    }

    // Force connect an orphaned room to a connected room (emergency straight line)
    forceConnectRoom(tileMap, orphanedRoom, connectedRoom) {
        const x1 = orphanedRoom.x + Math.floor(orphanedRoom.width / 2);
        const y1 = orphanedRoom.y + Math.floor(orphanedRoom.height / 2);
        const x2 = connectedRoom.x + Math.floor(connectedRoom.width / 2);
        const y2 = connectedRoom.y + Math.floor(connectedRoom.height / 2);

        console.log('Force connecting orphaned room with straight line');

        // Simple L-shaped connection (guaranteed to work)
        const path = this.createLShapedPath(x1, y1, x2, y2);
        this.carveWindingCorridor(tileMap, path);
    }
}
