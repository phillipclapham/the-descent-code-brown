// Main game loop and initialization

import { Renderer, GRID_WIDTH, GRID_HEIGHT } from './renderer.js';
import { Player } from './player.js';
import { InputHandler } from './input.js';
import { DesperationMeter } from './desperation-meter.js';
import { TileMap } from './tile-map.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.renderer = new Renderer(this.canvas);
        this.input = new InputHandler();

        // Initialize desperation meter
        this.desperationMeter = new DesperationMeter();

        // Initialize tile map (matches grid dimensions)
        this.tileMap = new TileMap(GRID_WIDTH, GRID_HEIGHT);
        this.tileMap.createTestWalls(); // Session 2: test walls for collision verification

        // Initialize player at a valid walkable position
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
        console.log(`Player starting position: (${this.player.x}, ${this.player.y})`);
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
        const debugText = `Position: (${this.player.x}, ${this.player.y})`;
        this.renderer.drawText(debugText, 10, 10, '#00ff00', 14);
    }
}

// Initialize game when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    game.start();
});
