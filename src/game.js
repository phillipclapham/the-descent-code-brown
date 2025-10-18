// Main game loop and initialization

import { Renderer, GRID_WIDTH, GRID_HEIGHT } from './renderer.js';
import { Player } from './player.js';
import { InputHandler } from './input.js';
import { DesperationMeter } from './desperation-meter.js';
import { TileMap, TILE_STAIRS } from './tile-map.js';
import { DungeonGenerator } from './dungeon-generator.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.renderer = new Renderer(this.canvas);
        this.input = new InputHandler();

        // Initialize desperation meter
        this.desperationMeter = new DesperationMeter();

        // Multi-floor system
        this.numFloors = 5;
        this.currentFloor = 0;
        this.floors = [];

        // Generate all dungeon floors
        this.generateFloors();

        // Set active tile map to first floor
        this.tileMap = this.floors[this.currentFloor];

        // Initialize player at a valid walkable position on first floor
        const spawnPos = this.tileMap.findWalkablePosition();
        this.player = new Player(
            spawnPos.x,
            spawnPos.y,
            this.tileMap
        );

        // Game loop timing
        this.lastTime = 0;
        this.running = true;

        console.log('Game initialized');
        console.log(`Grid: ${GRID_WIDTH}x${GRID_HEIGHT}`);
        console.log(`Generated ${this.numFloors} dungeon floors`);
        console.log(`Player starting position: (${this.player.x}, ${this.player.y})`);
    }

    // Generate all dungeon floors
    generateFloors() {
        const generator = new DungeonGenerator(GRID_WIDTH, GRID_HEIGHT);

        for (let i = 0; i < this.numFloors; i++) {
            const tileMap = new TileMap(GRID_WIDTH, GRID_HEIGHT);
            generator.generate(tileMap);
            this.floors.push(tileMap);
        }

        console.log(`${this.numFloors} floors generated`);
    }

    // Initialize and start the game
    start() {
        console.log('Game starting...');
        this.running = true;
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    // Main game loop
    gameLoop(currentTime) {
        if (!this.running) return;

        // Calculate delta time in milliseconds
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        // Update game state
        this.update(currentTime, deltaTime);

        // Render everything
        this.render();

        // Continue loop
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    // Update game state
    update(currentTime, deltaTime) {
        // Update desperation meter
        this.desperationMeter.update(deltaTime);

        // Handle player movement input
        const movement = this.input.getMovementDirection();

        if (movement.dx !== 0 || movement.dy !== 0) {
            this.player.move(movement.dx, movement.dy, currentTime);
        }

        // Update player state
        this.player.update(deltaTime);

        // Check for level transitions (player standing on stairs)
        this.checkLevelTransition();
    }

    // Check if player is on stairs and handle level transition
    checkLevelTransition() {
        const playerTile = this.tileMap.getTile(this.player.x, this.player.y);

        if (playerTile === TILE_STAIRS) {
            // Check if not on last floor
            if (this.currentFloor < this.numFloors - 1) {
                this.descendToNextFloor();
            } else {
                // On last floor - victory condition (to be implemented in Phase 4)
                console.log('You found the bathroom! (Victory not implemented yet)');
            }
        }
    }

    // Descend to the next floor
    descendToNextFloor() {
        this.currentFloor++;
        this.tileMap = this.floors[this.currentFloor];

        // Update player's tile map reference
        this.player.tileMap = this.tileMap;

        // Find stairs position on new floor and spawn player there
        const spawnPos = this.tileMap.findWalkablePosition();
        this.player.x = spawnPos.x;
        this.player.y = spawnPos.y;

        console.log(`Descended to floor ${this.currentFloor + 1}`);
    }

    // Render everything
    render() {
        // Clear screen
        this.renderer.clear();

        // Draw tile map (floors and walls)
        this.drawTileMap();

        // Render player
        this.player.render(this.renderer);

        // Draw debug info
        this.drawDebugInfo();
    }

    // Draw tile map
    drawTileMap() {
        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                const tile = this.tileMap.getTile(x, y);
                const char = this.tileMap.getTileChar(tile);
                const color = this.tileMap.getTileColor(tile);
                this.renderer.drawChar(char, x, y, color);
            }
        }
    }

    // Draw debug information
    drawDebugInfo() {
        const posText = `Position: (${this.player.x}, ${this.player.y})`;
        const floorText = `Floor: ${this.currentFloor + 1} / ${this.numFloors}`;

        this.renderer.drawText(posText, 10, 10, '#00ff00', 14);
        this.renderer.drawText(floorText, 10, 30, '#ffff00', 14);
    }
}

// Initialize game when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    game.start();
});
