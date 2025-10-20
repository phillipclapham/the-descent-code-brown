// Main game loop and initialization

import { Renderer, GRID_WIDTH, GRID_HEIGHT } from './renderer.js';
import { Player } from './player.js';
import { InputHandler } from './input.js';
import { DesperationMeter } from './desperation-meter.js';
import { TileMap, TILE_STAIRS, TILE_STAIRS_UP, TILE_TOILET } from './tile-map.js';
import { DungeonGenerator } from './dungeon-generator.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.renderer = new Renderer(this.canvas);
        this.input = new InputHandler();

        // Initialize desperation meter
        this.desperationMeter = new DesperationMeter();

        // Multi-floor system
        this.numFloors = 10;  // 10 floors: start at floor 10, descend to floor 1
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

        // Floor transition cooldown (prevent immediate re-trigger)
        this.transitionCooldown = 0;

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
            const displayFloor = this.numFloors - i;  // Floor number (10 → 1)
            const isFirstFloor = (i === 0);  // Top floor (Floor 10)
            const isLastFloor = (i === this.numFloors - 1);  // Bottom floor (Floor 1)
            generator.generate(tileMap, displayFloor, isFirstFloor, isLastFloor);
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

        // Update transition cooldown
        if (this.transitionCooldown > 0) {
            this.transitionCooldown -= deltaTime;
        }

        // Handle player movement input
        const movement = this.input.getMovementDirection();

        if (movement.dx !== 0 || movement.dy !== 0) {
            this.player.move(movement.dx, movement.dy, currentTime);
        }

        // Handle attack input (SPACE key)
        if (this.input.isAttackPressed()) {
            console.log('Attack pressed');
        }

        // Update player state
        this.player.update(deltaTime);

        // Check for level transitions (player standing on stairs)
        // Only if cooldown expired (prevents immediate re-trigger after spawning)
        if (this.transitionCooldown <= 0) {
            this.checkLevelTransition();
        }
    }

    // Check if player is on stairs and handle level transition
    checkLevelTransition() {
        const playerTile = this.tileMap.getTile(this.player.x, this.player.y);

        // Check for downward stairs
        if (playerTile === TILE_STAIRS) {
            if (this.currentFloor < this.numFloors - 1) {
                this.descendToNextFloor();
            }
        }

        // Check for upward stairs
        if (playerTile === TILE_STAIRS_UP) {
            if (this.currentFloor > 0) {
                this.ascendToPreviousFloor();
            }
        }

        // Check for toilet (victory condition)
        if (playerTile === TILE_TOILET) {
            this.handleVictory();
        }
    }

    // Descend to the next floor
    descendToNextFloor() {
        this.currentFloor++;
        this.tileMap = this.floors[this.currentFloor];

        // Update player's tile map reference
        this.player.tileMap = this.tileMap;

        // CRITICAL: Spawn ADJACENT to upstairs (guarantees safe spawn, can see/reach escape)
        const spawnPos = this.tileMap.findSafeSpawnNearUpstairs();
        this.player.x = spawnPos.x;
        this.player.y = spawnPos.y;

        // Small cooldown just in case (100ms - only for edge case where spawn IS on upstairs)
        this.transitionCooldown = 100;

        const displayFloor = this.numFloors - this.currentFloor;
        console.log(`⬇️  Descended to Floor ${displayFloor}`);
    }

    // Ascend to the previous floor
    ascendToPreviousFloor() {
        this.currentFloor--;
        this.tileMap = this.floors[this.currentFloor];

        // Update player's tile map reference
        this.player.tileMap = this.tileMap;

        // CRITICAL: Spawn ADJACENT to upstairs (guarantees safe spawn)
        const spawnPos = this.tileMap.findSafeSpawnNearUpstairs();
        this.player.x = spawnPos.x;
        this.player.y = spawnPos.y;

        // Small cooldown just in case (100ms - only for edge case)
        this.transitionCooldown = 100;

        const displayFloor = this.numFloors - this.currentFloor;
        console.log(`⬆️  Ascended to Floor ${displayFloor}`);
    }

    // Handle victory condition (player reached the toilet!)
    handleVictory() {
        console.log('🎉 VICTORY! You made it to the bathroom!');
        // TODO Phase 4: Display victory screen, stop game, etc.
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
        // Draw bottom status bar background (full width)
        const statusBarHeight = 40;
        const statusBarY = 560;

        this.renderer.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        this.renderer.ctx.fillRect(0, statusBarY, 800, statusBarHeight);

        // Draw border around status bar
        this.renderer.ctx.strokeStyle = '#888888';
        this.renderer.ctx.lineWidth = 2;
        this.renderer.ctx.strokeRect(0, statusBarY, 800, statusBarHeight);

        // Build status text (horizontal layout with separators)
        const displayFloor = this.numFloors - this.currentFloor;
        const healthText = `HP: ${this.player.health}/${this.player.maxHealth}`;
        const weaponName = this.player.equippedWeapon ? this.player.equippedWeapon.name : 'None';
        const statusText = `Floor: ${displayFloor} | ${healthText} | Keys: ${this.player.keysCollected} | Weapon: ${weaponName} | Pos: (${this.player.x}, ${this.player.y})`;

        // Draw status text (centered vertically in bar)
        this.renderer.drawText(statusText, 10, statusBarY + 12, '#ffffff', 14);

        // Display player message (if any) - centered above status bar
        const message = this.player.getMessage();
        if (message) {
            // Measure text width for centered background
            this.renderer.ctx.font = '16px "Courier New", monospace';
            const textWidth = this.renderer.ctx.measureText(message).width;
            const msgX = (800 - textWidth) / 2 - 10;
            const msgY = statusBarY - 35;

            // Background for message
            this.renderer.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            this.renderer.ctx.fillRect(msgX, msgY, textWidth + 20, 25);

            // Border for message
            this.renderer.ctx.strokeStyle = '#888888';
            this.renderer.ctx.lineWidth = 2;
            this.renderer.ctx.strokeRect(msgX, msgY, textWidth + 20, 25);

            this.renderer.drawText(message, msgX + 10, msgY + 5, '#ff8800', 16);
        }
    }
}

// Initialize game when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    game.start();

    // Make game globally accessible for console testing
    window.game = game;
});
