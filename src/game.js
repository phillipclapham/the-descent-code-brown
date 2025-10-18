// Main game loop and initialization

import { Renderer, GRID_WIDTH, GRID_HEIGHT } from './renderer.js';
import { Player } from './player.js';
import { InputHandler } from './input.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.renderer = new Renderer(this.canvas);
        this.input = new InputHandler();

        // Initialize player at center of screen
        this.player = new Player(
            Math.floor(GRID_WIDTH / 2),
            Math.floor(GRID_HEIGHT / 2)
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

        // Draw floor (simple dot pattern for now)
        this.drawFloor();

        // Render player
        this.player.render(this.renderer);

        // Draw debug info
        this.drawDebugInfo();
    }

    // Draw simple floor pattern
    drawFloor() {
        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                this.renderer.drawChar('.', x, y, '#333333');
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
