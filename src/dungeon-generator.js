// Dungeon Generator - Creates procedural room-based dungeons
// Generates rooms, connects them with corridors, and places stairs

import { getThemeForFloor } from './floor-themes.js';
import { getRandomVaultTemplate, placeVaultTemplate, canFitTemplate } from './vault-library.js';
import {
    TILE_FLOOR,
    TILE_WALL,
    TILE_STAIRS,
    TILE_STAIRS_UP,
    TILE_TOILET,
    TILE_DOOR_OPEN,
    TILE_DOOR_CLOSED,
    TILE_DOOR_LOCKED,
    TILE_KEY,
    TILE_WEAPON,
    TILE_FEATURE,
    TILE_PILLAR
} from './tile-map.js';
import {
    categorizeRoomBySize,
    generateRoomShape,
    carveRoomByShape,
    placeArchitecturalFeatures,
    ROOM_SHAPE
} from './room-shapes.js';

// Generation metrics for quality tracking and debugging
class GenerationMetrics {
    constructor() {
        this.roomCount = 0;
        this.specialRoomCount = 0;
        this.corridorSegments = 0;
        this.doorCount = 0;
        this.lockedDoorCount = 0;
        this.keyCount = 0;
        this.startTime = 0;
        this.endTime = 0;
        this.specialRoomTypes = {};
    }

    start() {
        this.startTime = performance.now();
    }

    end() {
        this.endTime = performance.now();
    }

    log(floorNumber) {
        const duration = (this.endTime - this.startTime).toFixed(1);
        console.log(`📊 Floor ${floorNumber} Metrics:`);
        console.log(`   Rooms: ${this.roomCount} (${this.specialRoomCount} special)`);
        if (this.specialRoomCount > 0) {
            const types = Object.entries(this.specialRoomTypes)
                .map(([type, count]) => `${count}x${type}`)
                .join(', ');
            console.log(`   Special: ${types}`);
        }
        console.log(`   Doors: ${this.doorCount} (${this.lockedDoorCount} locked)`);
        console.log(`   Keys: ${this.keyCount}`);
        console.log(`   Corridor segments: ${this.corridorSegments}`);
        console.log(`   Generation time: ${duration}ms`);
    }

    addSpecialRoom(type) {
        this.specialRoomCount++;
        this.specialRoomTypes[type] = (this.specialRoomTypes[type] || 0) + 1;
    }
}

export class DungeonGenerator {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.rooms = [];
    }

    // Generate a complete dungeon on a tile map
    // floorNumber: Display floor number (10 = top, 1 = bottom)
    // isFirstFloor: if true, does NOT place upward stairs (nothing above)
    // isLastFloor: if true, places toilet instead of downward stairs
    generate(tileMap, floorNumber, isFirstFloor = false, isLastFloor = false) {
        // Initialize metrics
        const metrics = new GenerationMetrics();
        metrics.start();

        // Set floor theme for visual styling
        tileMap.theme = getThemeForFloor(floorNumber);
        console.log(`🎨 Generating Floor ${floorNumber} - Theme: ${tileMap.theme.name}`);

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
                features: [],
                specialType: null,  // 'vault', 'shrine', 'arena', 'library', 'trap', or null
                hasLockedDoor: false,
                doorPositions: [],
                keyRequired: false
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
                metrics.corridorSegments += path.length;
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

        // Place stairs FIRST (before doors/keys) so we know where to spawn player
        // and can validate progression properly

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

        // Assign special room types (1-2 per floor)
        this.assignSpecialRooms(metrics);

        // Apply vault templates to vault rooms (hand-crafted layouts)
        this.applyVaultTemplates(tileMap);

        // Place doors at room entrances (after stairs placed)
        this.placeDoors(tileMap, metrics);

        // Place keys (before validation)
        this.placeKeys(tileMap, metrics);

        // CRITICAL: Validate progression is possible (stairs reachable with available keys)
        // Now that stairs actually exist on the map!
        console.log('🔍 Running progression validation...');
        this.validateProgression(tileMap, isLastFloor);
        console.log('✅ Progression validation complete');

        // Session 12c: Mark some walls as bashable (desperation ability)
        this.markBashableWalls(tileMap, floorNumber);

        // Finalize and log metrics
        metrics.roomCount = this.rooms.length;
        metrics.end();
        metrics.log(floorNumber);

        // Log room variety
        const roomTypes = this.rooms.map(r => r.type);
        const shapes = this.rooms.map(r => r.shape);
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

    // Assign special room types to 1-2 rooms per floor
    assignSpecialRooms(metrics) {
        if (this.rooms.length < 2) return;

        const numSpecial = 1 + Math.floor(Math.random() * 2); // 1-2 special rooms

        // CRITICAL: Only 1 vault per floor (1 key = 1 locked door)
        // Other special types don't have locked doors
        const specialTypes = ['shrine', 'arena', 'library', 'trap'];

        // Select random rooms for special designation (skip first room with upstairs, and last room with downstairs)
        const availableRooms = this.rooms.slice(1, -1);
        const shuffled = availableRooms.sort(() => Math.random() - 0.5);

        // Track if vault has been placed (max 1 per floor)
        let vaultPlaced = false;

        for (let i = 0; i < Math.min(numSpecial, shuffled.length); i++) {
            const room = shuffled[i];
            let specialType;

            // First special room: 75% chance vault, 25% chance other (increased from 50% for better key hunting gameplay)
            if (i === 0 && Math.random() < 0.75) {
                specialType = 'vault';
                vaultPlaced = true;
            } else {
                // Pick from non-vault types
                specialType = specialTypes[Math.floor(Math.random() * specialTypes.length)];
            }

            room.specialType = specialType;
            metrics.addSpecialRoom(specialType);

            // Vaults are always locked
            if (specialType === 'vault') {
                room.hasLockedDoor = true;
                room.keyRequired = true;
            }
        }
    }

    // Apply hand-crafted vault templates to vault rooms
    applyVaultTemplates(tileMap) {
        const vaultRooms = this.rooms.filter(r => r.specialType === 'vault');

        for (const room of vaultRooms) {
            // Get random vault template
            const template = getRandomVaultTemplate();

            // Check if template fits
            if (!canFitTemplate(room, template)) {
                console.warn(`Vault template ${template.name} doesn't fit in room, keeping procedural vault`);
                continue;
            }

            // BEFORE clearing: detect existing corridor connections
            const corridorEntrances = [];
            for (let x = room.x; x < room.x + room.width; x++) {
                for (let y = room.y; y < room.y + room.height; y++) {
                    // Check if this is an edge tile
                    const isEdge = (x === room.x || x === room.x + room.width - 1 ||
                                   y === room.y || y === room.y + room.height - 1);

                    if (isEdge && tileMap.getTile(x, y) === TILE_FLOOR) {
                        // This is a corridor entrance - check if it connects outside
                        const neighbors = [
                            {x: x - 1, y, dx: -1, dy: 0},
                            {x: x + 1, y, dx: 1, dy: 0},
                            {x, y: y - 1, dx: 0, dy: -1},
                            {x, y: y + 1, dx: 0, dy: 1}
                        ];

                        for (const n of neighbors) {
                            const outsideRoom = (n.x < room.x || n.x >= room.x + room.width ||
                                               n.y < room.y || n.y >= room.y + room.height);

                            if (outsideRoom && tileMap.getTile(n.x, n.y) === TILE_FLOOR) {
                                corridorEntrances.push({x, y});
                                break;
                            }
                        }
                    }
                }
            }

            // Clear room interior only (preserve edges where corridors connect)
            for (let x = room.x + 1; x < room.x + room.width - 1; x++) {
                for (let y = room.y + 1; y < room.y + room.height - 1; y++) {
                    tileMap.setTile(x, y, TILE_WALL);
                }
            }

            // Place template
            const entrance = placeVaultTemplate(tileMap, room, template);

            if (entrance) {
                // Store template entrance for door placement
                room.templateEntrance = entrance;

                // CRITICAL: Carve floor paths from corridor entrances to template entrance
                // This ensures the vault is accessible even if corridors don't align with template entrance
                for (const corridorEntrance of corridorEntrances) {
                    this.carvePathInRoom(tileMap, corridorEntrance, entrance, room);
                }
            }
        }
    }

    // Carve a simple path between two points within a room (for connecting corridors to vault template entrance)
    carvePathInRoom(tileMap, start, end, room) {
        let x = start.x;
        let y = start.y;

        // Carve L-shaped path: horizontal first, then vertical
        while (x !== end.x) {
            if (x >= room.x && x < room.x + room.width && y >= room.y && y < room.y + room.height) {
                const currentTile = tileMap.getTile(x, y);
                // Don't overwrite stairs or special tiles
                if (currentTile === TILE_WALL || currentTile === TILE_FEATURE || currentTile === TILE_PILLAR) {
                    tileMap.setTile(x, y, TILE_FLOOR);
                }
            }
            x += (end.x > x) ? 1 : -1;
        }

        while (y !== end.y) {
            if (x >= room.x && x < room.x + room.width && y >= room.y && y < room.y + room.height) {
                const currentTile = tileMap.getTile(x, y);
                if (currentTile === TILE_WALL || currentTile === TILE_FEATURE || currentTile === TILE_PILLAR) {
                    tileMap.setTile(x, y, TILE_FLOOR);
                }
            }
            y += (end.y > y) ? 1 : -1;
        }
    }

    // Find entrance positions for a room (where corridor meets room edge)
    findRoomEntrances(room, tileMap) {
        const entrances = [];

        // For ALL rooms (including vaults), find actual edge entrances where corridors connect
        // Doors should be placed at chokepoints (room edges), not in the middle of rooms
        // For vaults, the templateEntrance is the interior destination, not where the door goes

        // Check room perimeter for floor tiles adjacent to corridor
        for (let x = room.x; x < room.x + room.width; x++) {
            for (let y = room.y; y < room.y + room.height; y++) {
                // Only check perimeter tiles
                const isPerimeter = (x === room.x || x === room.x + room.width - 1 ||
                                    y === room.y || y === room.y + room.height - 1);

                if (!isPerimeter) continue;

                const tile = tileMap.getTile(x, y);

                // If this is a floor tile on room edge, check if adjacent to corridor
                if (tile === TILE_FLOOR) {
                    // Check 4 directions for corridor (floor outside room bounds)
                    const neighbors = [
                        {x: x - 1, y, dx: -1, dy: 0},
                        {x: x + 1, y, dx: 1, dy: 0},
                        {x, y: y - 1, dx: 0, dy: -1},
                        {x, y: y + 1, dx: 0, dy: 1}
                    ];

                    for (const n of neighbors) {
                        // Check if neighbor is outside room bounds
                        const outsideRoom = (n.x < room.x || n.x >= room.x + room.width ||
                                           n.y < room.y || n.y >= room.y + room.height);

                        if (outsideRoom && tileMap.getTile(n.x, n.y) === TILE_FLOOR) {
                            // This is an entrance! Corridor connects here
                            entrances.push({x, y, direction: {dx: n.dx, dy: n.dy}});
                            break; // Only count each tile once
                        }
                    }
                }
            }
        }

        return entrances;
    }

    // Place doors at room entrances
    placeDoors(tileMap, metrics) {
        for (const room of this.rooms) {
            const entrances = this.findRoomEntrances(room, tileMap);

            // Track if we've locked a door for this vault (only lock ONE entrance per vault)
            let lockedDoorPlaced = false;

            for (const entrance of entrances) {
                let doorType = TILE_DOOR_OPEN; // Default: open

                // Special rooms get 100% doors
                if (room.specialType) {
                    if (room.hasLockedDoor && !lockedDoorPlaced) {
                        // Lock ONLY the first entrance of a vault
                        doorType = TILE_DOOR_LOCKED;
                        metrics.lockedDoorCount++;
                        lockedDoorPlaced = true;
                    } else {
                        // Other entrances to vault, or non-vault special rooms
                        doorType = Math.random() < 0.5 ? TILE_DOOR_CLOSED : TILE_DOOR_OPEN;
                    }
                } else {
                    // Normal rooms: 50% chance of closed door
                    if (Math.random() < 0.5) {
                        doorType = TILE_DOOR_CLOSED;
                    }
                }

                // Place door
                tileMap.setTile(entrance.x, entrance.y, doorType);
                room.doorPositions.push({x: entrance.x, y: entrance.y, type: doorType});
                metrics.doorCount++;
            }
        }
    }

    // Find all tiles accessible from a start position (respecting locked doors)
    // Returns Set of "x,y" strings
    findAccessibleTiles(tileMap, startX, startY) {
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

                // Walk on floors, open doors, stairs, features - NOT walls or locked doors
                if (!visited.has(nKey) &&
                    tile !== TILE_WALL &&
                    tile !== TILE_DOOR_LOCKED &&
                    tile !== undefined) {
                    queue.push(neighbor);
                }
            }
        }

        return visited;
    }

    // Find rooms accessible from a start position WITHOUT going through locked doors
    findAccessibleRooms(tileMap, startX, startY) {
        const accessibleTiles = this.findAccessibleTiles(tileMap, startX, startY);
        const accessibleRooms = new Set();

        // Check which rooms contain accessible tiles
        for (const room of this.rooms) {
            for (let x = room.x; x < room.x + room.width; x++) {
                for (let y = room.y; y < room.y + room.height; y++) {
                    if (accessibleTiles.has(`${x},${y}`)) {
                        accessibleRooms.add(room);
                        break;
                    }
                }
                if (accessibleRooms.has(room)) break;
            }
        }

        return Array.from(accessibleRooms);
    }

    // Place keys in accessible rooms (NOT inside locked rooms)
    placeKeys(tileMap, metrics) {
        // Find locked rooms
        const lockedRooms = this.rooms.filter(r => r.hasLockedDoor);

        if (lockedRooms.length === 0) return;

        // Find spawn point (first room center, where upstairs will be)
        const firstRoom = this.rooms[0];
        const spawnX = firstRoom.x + Math.floor(firstRoom.width / 2);
        const spawnY = firstRoom.y + Math.floor(firstRoom.height / 2);

        // Find all rooms accessible from spawn WITHOUT unlocking doors
        const accessibleRooms = this.findAccessibleRooms(tileMap, spawnX, spawnY);

        console.log(`Accessible rooms from spawn: ${accessibleRooms.length} of ${this.rooms.length}`);

        for (const lockedRoom of lockedRooms) {
            // Find eligible rooms: accessible AND not the locked room itself
            const eligibleRooms = accessibleRooms.filter(r => r !== lockedRoom);

            if (eligibleRooms.length === 0) {
                console.error('No accessible rooms for key placement! Placing in first room anyway.');
                eligibleRooms.push(firstRoom); // Emergency fallback
            }

            // Place key in a random accessible room (spread keys around)
            const targetRoom = eligibleRooms[Math.floor(Math.random() * eligibleRooms.length)];

            // Find a valid floor position in room (not on stairs, features, doors)
            let attempts = 0;
            let keyPlaced = false;

            while (attempts < 50 && !keyPlaced) {
                attempts++;

                const x = targetRoom.x + 1 + Math.floor(Math.random() * (targetRoom.width - 2));
                const y = targetRoom.y + 1 + Math.floor(Math.random() * (targetRoom.height - 2));

                const tile = tileMap.getTile(x, y);

                // Only place on plain floor (not stairs, features, doors)
                if (tile === TILE_FLOOR) {
                    tileMap.setTile(x, y, TILE_KEY);
                    keyPlaced = true;
                    metrics.keyCount++;
                    console.log(`Key placed in accessible room at (${x}, ${y})`);
                }
            }

            if (!keyPlaced) {
                console.warn('Failed to place key - trying room center as fallback');
                // Fallback: place at room center
                const centerX = targetRoom.x + Math.floor(targetRoom.width / 2);
                const centerY = targetRoom.y + Math.floor(targetRoom.height / 2);

                // Only place if not on stairs
                const centerTile = tileMap.getTile(centerX, centerY);
                if (centerTile === TILE_FLOOR) {
                    tileMap.setTile(centerX, centerY, TILE_KEY);
                    metrics.keyCount++;
                    console.log(`Key placed at room center (${centerX}, ${centerY}) as fallback`);
                }
            }
        }
    }

    // Place weapons on the floor (1 weapon per floor)
    // Weapons spawn in random walkable positions, avoiding stairs/doors
    placeWeapons(tileMap, combat, floorNumber) {
        // Import weapon types (will be passed from game.js)
        // For now, spawn 1 weapon per floor
        const numWeapons = 1;

        for (let i = 0; i < numWeapons; i++) {
            // Find random walkable position
            const pos = this.findRandomWalkablePosition(tileMap);

            if (pos) {
                // Place weapon tile on map
                tileMap.setTile(pos.x, pos.y, TILE_WEAPON);

                // Store weapon in combat system (will be set by game.js after generation)
                // combat.weapons is a Map<"x,y", Weapon>
                // The actual weapon instance will be set externally
                console.log(`Weapon spawn point placed at (${pos.x}, ${pos.y})`);
            }
        }
    }

    // Place enemies on the floor (1-2 enemies per floor)
    // Enemies spawn away from upstairs to prevent instant combat
    placeEnemies(tileMap, combat, floorNumber) {
        // 1-2 enemies per floor
        const numEnemies = Math.floor(Math.random() * 2) + 1; // 1 or 2

        // Find upstairs position to avoid spawning near it
        const firstRoom = this.rooms[0];
        const upstairsX = firstRoom.x + Math.floor(firstRoom.width / 2);
        const upstairsY = firstRoom.y + Math.floor(firstRoom.height / 2);

        for (let i = 0; i < numEnemies; i++) {
            // Find random walkable position at least 5 tiles away from upstairs
            const pos = this.findRandomWalkablePositionAwayFrom(tileMap, upstairsX, upstairsY, 5);

            if (pos) {
                // Enemy will be spawned by game.js after generation
                // Store spawn position for external enemy creation
                console.log(`Enemy spawn point placed at (${pos.x}, ${pos.y}), distance from upstairs: ${Math.abs(pos.x - upstairsX) + Math.abs(pos.y - upstairsY)} tiles`);
            }
        }

        // Return spawn positions for external enemy creation
        const spawnPositions = [];
        for (let i = 0; i < numEnemies; i++) {
            const pos = this.findRandomWalkablePositionAwayFrom(tileMap, upstairsX, upstairsY, 5);
            if (pos) spawnPositions.push(pos);
        }
        return spawnPositions;
    }

    // Find a random walkable position (not on stairs, doors, keys, pillars)
    findRandomWalkablePosition(tileMap) {
        const maxAttempts = 50;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            // Pick random room
            const room = this.rooms[Math.floor(Math.random() * this.rooms.length)];

            // Pick random position within room (avoid edges)
            const x = room.x + 1 + Math.floor(Math.random() * (room.width - 2));
            const y = room.y + 1 + Math.floor(Math.random() * (room.height - 2));

            const tile = tileMap.getTile(x, y);

            // Only place on plain floor tiles
            if (tile === TILE_FLOOR) {
                return { x, y };
            }
        }

        console.warn('Failed to find walkable position after 50 attempts');
        return null;
    }

    // Find a random walkable position away from a specific point
    findRandomWalkablePositionAwayFrom(tileMap, targetX, targetY, minDistance) {
        const maxAttempts = 50;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const pos = this.findRandomWalkablePosition(tileMap);

            if (pos) {
                const distance = Math.abs(pos.x - targetX) + Math.abs(pos.y - targetY);
                if (distance >= minDistance) {
                    return pos;
                }
            }
        }

        console.warn(`Failed to find walkable position ${minDistance} tiles away after 50 attempts`);
        // Fallback: return any walkable position
        return this.findRandomWalkablePosition(tileMap);
    }

    // Validate that player can progress (stairs reachable with available keys)
    // This simulates the player's journey and ensures no softlock situations
    validateProgression(tileMap, isLastFloor) {
        // Find spawn point (first room center)
        const firstRoom = this.rooms[0];
        const spawnX = firstRoom.x + Math.floor(firstRoom.width / 2);
        const spawnY = firstRoom.y + Math.floor(firstRoom.height / 2);

        // Find stairs position (last room center or toilet)
        const lastRoom = this.rooms[this.rooms.length - 1];
        const stairsX = lastRoom.x + Math.floor(lastRoom.width / 2);
        const stairsY = lastRoom.y + Math.floor(lastRoom.height / 2);

        // Simulate player journey with key collection
        let keysCollected = 0;
        let accessible = this.findAccessibleTiles(tileMap, spawnX, spawnY);

        // Count accessible keys
        for (const tileKey of accessible) {
            const [x, y] = tileKey.split(',').map(Number);
            if (tileMap.getTile(x, y) === TILE_KEY) {
                keysCollected++;
            }
        }

        console.log(`Progression check: ${keysCollected} keys accessible from spawn`);

        // Check if stairs are accessible
        const stairsKey = `${stairsX},${stairsY}`;
        if (accessible.has(stairsKey)) {
            console.log('✅ Stairs accessible without unlocking doors - progression valid');
            return; // All good!
        }

        // Stairs NOT accessible - need to unlock doors
        console.warn('⚠️ Stairs not immediately accessible, checking with keys...');

        // Simulate unlocking doors with available keys
        let doorsUnlocked = 0;
        const maxIterations = 10; // Safety limit

        for (let iteration = 0; iteration < maxIterations; iteration++) {
            if (accessible.has(stairsKey)) {
                console.log(`✅ Stairs accessible after unlocking ${doorsUnlocked} doors`);
                return; // Stairs now accessible!
            }

            if (keysCollected === 0) {
                break; // No more keys to use
            }

            // Find locked doors adjacent to accessible area
            const lockedDoorsToTry = [];
            for (const tileKey of accessible) {
                const [x, y] = tileKey.split(',').map(Number);

                // Check 4 neighbors for locked doors
                const neighbors = [
                    {x: x - 1, y},
                    {x: x + 1, y},
                    {x, y: y - 1},
                    {x, y: y + 1}
                ];

                for (const n of neighbors) {
                    if (tileMap.getTile(n.x, n.y) === TILE_DOOR_LOCKED) {
                        lockedDoorsToTry.push({x: n.x, y: n.y});
                    }
                }
            }

            if (lockedDoorsToTry.length === 0) {
                break; // No locked doors to unlock
            }

            // Unlock first locked door (simulate using a key)
            const doorToUnlock = lockedDoorsToTry[0];
            tileMap.setTile(doorToUnlock.x, doorToUnlock.y, TILE_DOOR_OPEN);
            keysCollected--;
            doorsUnlocked++;

            console.log(`  Unlocking door at (${doorToUnlock.x}, ${doorToUnlock.y}), keys remaining: ${keysCollected}`);

            // Re-calculate accessible area
            accessible = this.findAccessibleTiles(tileMap, spawnX, spawnY);

            // Recount accessible keys
            keysCollected = 0;
            for (const tileKey of accessible) {
                const [x, y] = tileKey.split(',').map(Number);
                if (tileMap.getTile(x, y) === TILE_KEY) {
                    keysCollected++;
                }
            }
        }

        // Final check
        if (!accessible.has(stairsKey)) {
            console.error('❌ SOFTLOCK DETECTED: Stairs unreachable even with all keys!');
            console.log('   Unlocking all remaining locked doors to fix...');

            // Emergency fix: unlock ALL locked doors
            for (let y = 0; y < this.height; y++) {
                for (let x = 0; x < this.width; x++) {
                    if (tileMap.getTile(x, y) === TILE_DOOR_LOCKED) {
                        tileMap.setTile(x, y, TILE_DOOR_OPEN);
                        console.log(`   Emergency unlock: (${x}, ${y})`);
                    }
                }
            }

            // Update room metadata (no more locked doors)
            for (const room of this.rooms) {
                if (room.hasLockedDoor) {
                    room.hasLockedDoor = false;
                    room.keyRequired = false;
                    console.log(`   Room vault status removed`);
                }
            }

            console.log('✅ All locks removed - progression now guaranteed');
        }
    }

    // Session 12c: Mark some walls as bashable (desperation ability at 75%+)
    markBashableWalls(tileMap, floorNumber) {
        // Determine bashable percentage based on floor (office = weak walls, sewer = strong walls)
        let bashablePercentage;
        if (floorNumber >= 8) {
            bashablePercentage = 0.60; // Office floors (10-8): 60% drywall
        } else if (floorNumber >= 5) {
            bashablePercentage = 0.40; // Maintenance floors (7-5): 40% mixed
        } else {
            bashablePercentage = 0.30; // Sewer floors (4-1): 30% concrete
        }

        let wallsMarked = 0;
        let wallsTotal = 0;

        // Iterate over all tiles and mark non-critical walls as bashable
        for (let y = 1; y < this.height - 1; y++) {  // Skip outer boundary
            for (let x = 1; x < this.width - 1; x++) {  // Skip outer boundary
                if (tileMap.getTile(x, y) === TILE_WALL) {
                    wallsTotal++;

                    // Never mark critical walls:
                    // 1. Outer boundary (already skipped above)
                    // 2. Vault walls (walls of rooms with hasLockedDoor=true)
                    const isVaultWall = this.isWallOfVault(x, y);

                    if (!isVaultWall && Math.random() < bashablePercentage) {
                        tileMap.setWallBashable(x, y, true);
                        wallsMarked++;
                    }
                }
            }
        }

        console.log(`🧱 Marked ${wallsMarked}/${wallsTotal} walls as bashable (${Math.floor(bashablePercentage * 100)}%)`);
    }

    // Helper: Check if a wall position is part of a vault room perimeter
    isWallOfVault(x, y) {
        for (const room of this.rooms) {
            if (room.specialType === 'vault' || room.hasLockedDoor) {
                // Check if (x,y) is on the perimeter of this vault room
                const onPerimeter = (
                    (x === room.x - 1 || x === room.x + room.width) &&
                    (y >= room.y - 1 && y <= room.y + room.height)
                ) || (
                    (y === room.y - 1 || y === room.y + room.height) &&
                    (x >= room.x - 1 && x <= room.x + room.width)
                );

                if (onPerimeter) {
                    return true;
                }
            }
        }
        return false;
    }
}
