// Main game loop and initialization

import { Renderer, GRID_WIDTH, GRID_HEIGHT } from './renderer.js';
import { Player } from './player.js';
import { InputHandler } from './input.js';
import { DesperationMeter } from './desperation-meter.js';
import { TileMap, TILE_FLOOR, TILE_STAIRS, TILE_STAIRS_UP, TILE_TOILET, TILE_WEAPON, TILE_CONSUMABLE } from './tile-map.js';
import { DungeonGenerator } from './dungeon-generator.js';
import { CombatSystem } from './combat.js';
import {
    Enemy,
    ENEMY_SECURITY_BOT,
    ENEMY_COFFEE_ZOMBIE,
    ENEMY_JANITOR,
    ENEMY_GREMLIN,
    ENEMY_RAT,
    ENEMY_PIPE_MONSTER,
    ENEMY_THE_DESPERATE
} from './enemy.js';
import {
    PLUNGER,
    TOILET_BRUSH,
    WRENCH,
    MOP,
    TP_LAUNCHER,
    STAPLER,
    FIRE_EXTINGUISHER,
    COFFEE_POT,
    KEYBOARD,
    CEREMONIAL_PLUNGER
} from './weapon.js';
import { ANTACID, COFFEE, DONUT, ENERGY_DRINK } from './consumable.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.renderer = new Renderer(this.canvas);
        this.input = new InputHandler();

        // Initialize desperation meter
        this.desperationMeter = new DesperationMeter();

        // Initialize combat system
        this.combat = new CombatSystem(this);

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

        // Spawn enemies and weapons for starting floor
        this.spawnFloorEntities();

        // Game loop timing
        this.lastTime = 0;
        this.running = true;

        // Floor transition cooldown (prevent immediate re-trigger)
        this.transitionCooldown = 0;

        // Game state (Session 9e)
        this.gameState = 'playing'; // 'playing', 'game_over', 'victory'

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

    // Spawn enemies, weapons, and consumables for the current floor (Session 10)
    // Called on game start and floor transitions
    spawnFloorEntities() {
        // Clear any existing enemies, weapons, and consumables
        this.combat.enemies = [];
        this.combat.weapons.clear();
        this.combat.consumables.clear(); // Session 10

        const displayFloor = this.numFloors - this.currentFloor;
        console.log(`🎲 Spawning entities for Floor ${displayFloor}...`);

        // Floor-based enemy spawning (Session 11)
        const enemyConfigs = this.getEnemyConfigsForFloor(displayFloor);

        // Find upstairs position to avoid spawning enemies nearby
        const upstairsPos = this.tileMap.findUpStairsPosition();

        // Spawn each enemy config
        for (const { config, type, count } of enemyConfigs) {
            const enemiesToSpawn = count || 1;

            for (let i = 0; i < enemiesToSpawn; i++) {
                // Find random position at least 5 tiles from upstairs
                let spawnPos = null;
                let attempts = 0;

                while (attempts < 50 && !spawnPos) {
                    attempts++;
                    const x = 2 + Math.floor(Math.random() * (GRID_WIDTH - 4));
                    const y = 2 + Math.floor(Math.random() * (GRID_HEIGHT - 4));

                    // Check walkable and distance from upstairs
                    if (this.tileMap.isWalkable(x, y)) {
                        const distance = Math.abs(x - upstairsPos.x) + Math.abs(y - upstairsPos.y);
                        if (distance >= 5) {
                            const tile = this.tileMap.getTile(x, y);
                            // Only spawn on plain floor (not stairs, keys, doors)
                            if (tile === TILE_FLOOR) {
                                spawnPos = { x, y };
                            }
                        }
                    }
                }

                if (spawnPos) {
                    const enemy = new Enemy(spawnPos.x, spawnPos.y, config, type);
                    this.combat.enemies.push(enemy);
                    console.log(`  Spawned ${enemy.name} at (${spawnPos.x}, ${spawnPos.y})`);
                }
            }
        }

        // Spawn 1 weapon per floor
        let weaponSpawned = false;
        let attempts = 0;

        while (attempts < 50 && !weaponSpawned) {
            attempts++;
            const x = 2 + Math.floor(Math.random() * (GRID_WIDTH - 4));
            const y = 2 + Math.floor(Math.random() * (GRID_HEIGHT - 4));

            const tile = this.tileMap.getTile(x, y);

            // Only spawn on plain floor
            if (tile === TILE_FLOOR) {
                // Get random weapon from full pool (Session 10)
                const weapon = this.getRandomWeapon();

                // Place on map
                this.tileMap.setTile(x, y, TILE_WEAPON);

                // Store in combat system
                const weaponKey = `${x},${y}`;
                this.combat.weapons.set(weaponKey, weapon);

                console.log(`  Spawned ${weapon.name} at (${x}, ${y})`);
                weaponSpawned = true;
            }
        }

        // Spawn 2-3 consumables per floor (Session 10)
        const numConsumables = 2 + Math.floor(Math.random() * 2); // 2-3 consumables

        for (let i = 0; i < numConsumables; i++) {
            let consumableSpawned = false;
            let attempts = 0;

            while (attempts < 50 && !consumableSpawned) {
                attempts++;
                const x = 2 + Math.floor(Math.random() * (GRID_WIDTH - 4));
                const y = 2 + Math.floor(Math.random() * (GRID_HEIGHT - 4));

                const tile = this.tileMap.getTile(x, y);

                // Only spawn on plain floor
                if (tile === TILE_FLOOR) {
                    // Get random consumable (weighted probabilities)
                    const consumable = this.getRandomConsumable();

                    // Place on map
                    this.tileMap.setTile(x, y, TILE_CONSUMABLE);

                    // Store in combat system
                    const consumableKey = `${x},${y}`;
                    this.combat.consumables.set(consumableKey, consumable);

                    console.log(`  Spawned ${consumable.name} at (${x}, ${y})`);
                    consumableSpawned = true;
                }
            }
        }

        console.log(`✅ Floor ${displayFloor} entities spawned: ${this.combat.enemies.length} enemies, ${this.combat.weapons.size} weapons, ${this.combat.consumables.size} consumables`);
    }

    // Get random weapon from full weapon pool (Session 10)
    getRandomWeapon() {
        const allWeapons = [
            PLUNGER, TOILET_BRUSH, WRENCH, MOP,
            TP_LAUNCHER, STAPLER, FIRE_EXTINGUISHER,
            COFFEE_POT, KEYBOARD, CEREMONIAL_PLUNGER
        ];
        return allWeapons[Math.floor(Math.random() * allWeapons.length)];
    }

    // Get random consumable with weighted probabilities (Session 10)
    // Spawn rates from GAME_DESIGN.md:
    // - Antacid: 40% (most common - essential desperation management)
    // - Donut: 25% (healing)
    // - Coffee: 20% (speed boost + desperation)
    // - Energy Drink: 15% (invincibility + crash)
    getRandomConsumable() {
        const rand = Math.random() * 100;
        if (rand < 40) return ANTACID;       // 40%
        if (rand < 65) return DONUT;         // 25% (40 + 25 = 65)
        if (rand < 85) return COFFEE;        // 20% (65 + 20 = 85)
        return ENERGY_DRINK;                 // 15% (remaining)
    }

    // Get enemy configurations for floor (Session 11)
    // Returns array of { config, type, count } objects
    // Floor-themed spawning from GAME_DESIGN.md
    getEnemyConfigsForFloor(floor) {
        const enemies = [];

        // Floor 10-8: Office Zone (Security Bot, Coffee Zombie)
        if (floor >= 8) {
            // 1-2 Security Bots
            if (Math.random() < 0.8) {
                enemies.push({ config: ENEMY_SECURITY_BOT, type: 'SECURITY_BOT', count: 1 });
            }
            // 0-2 Coffee Zombies
            const zombieCount = Math.floor(Math.random() * 3); // 0-2
            if (zombieCount > 0) {
                enemies.push({ config: ENEMY_COFFEE_ZOMBIE, type: 'COFFEE_ZOMBIE', count: zombieCount });
            }
        }

        // Floor 7-5: Maintenance Zone (Security Bot, Coffee Zombie, Janitor, Gremlin)
        else if (floor >= 5) {
            const count = 2 + Math.floor(Math.random() * 3); // 2-4 enemies
            const types = [
                { config: ENEMY_SECURITY_BOT, type: 'SECURITY_BOT' },
                { config: ENEMY_COFFEE_ZOMBIE, type: 'COFFEE_ZOMBIE' },
                { config: ENEMY_JANITOR, type: 'JANITOR' },
                { config: ENEMY_GREMLIN, type: 'GREMLIN' }
            ];
            for (let i = 0; i < count; i++) {
                const enemyType = types[Math.floor(Math.random() * types.length)];
                enemies.push({ ...enemyType, count: 1 });
            }
        }

        // Floor 4-2: Sewer Zone (Rats in swarms, Gremlin, Pipe Monster)
        else if (floor >= 2) {
            // Rat swarms (2-4 rats)
            const ratCount = 2 + Math.floor(Math.random() * 3); // 2-4
            enemies.push({ config: ENEMY_RAT, type: 'RAT', count: ratCount });

            // 30% chance for Gremlin
            if (Math.random() < 0.3) {
                enemies.push({ config: ENEMY_GREMLIN, type: 'GREMLIN', count: 1 });
            }

            // 20% chance for Pipe Monster (rare)
            if (Math.random() < 0.2) {
                enemies.push({ config: ENEMY_PIPE_MONSTER, type: 'PIPE_MONSTER', count: 1 });
            }
        }

        // Floor 1: Throne Room (Pipe Monster + Rats)
        else {
            // Pipe Monster guards the throne
            enemies.push({ config: ENEMY_PIPE_MONSTER, type: 'PIPE_MONSTER', count: 1 });
            // Rat swarm
            const ratCount = 2 + Math.floor(Math.random() * 3); // 2-4
            enemies.push({ config: ENEMY_RAT, type: 'RAT', count: ratCount });
        }

        // 10% chance: The Desperate appears on ANY floor
        if (Math.random() < 0.1) {
            enemies.push({ config: ENEMY_THE_DESPERATE, type: 'THE_DESPERATE', count: 1 });
        }

        return enemies;
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
        // Stop updates if game over or victory (Session 9e)
        if (this.gameState !== 'playing') {
            // Check for restart input
            if (this.input.isRestartPressed()) {
                location.reload(); // Restart game by reloading page
            }
            return;
        }

        // Update desperation meter
        this.desperationMeter.update(deltaTime);

        // Update transition cooldown
        if (this.transitionCooldown > 0) {
            this.transitionCooldown -= deltaTime;
        }

        // Handle player movement input
        const movement = this.input.getMovementDirection();

        if (movement.dx !== 0 || movement.dy !== 0) {
            // Check if enemy occupies target position (prevent same-tile occupation)
            const targetX = this.player.x + movement.dx;
            const targetY = this.player.y + movement.dy;
            const enemyAtTarget = this.combat.enemies.some(e =>
                e.x === targetX && e.y === targetY
            );

            // Only move if no enemy at target position
            if (!enemyAtTarget) {
                this.player.move(movement.dx, movement.dy, currentTime, this.combat);
            }
        }

        // Handle attack input (SPACE key)
        if (this.input.isAttackPressed()) {
            this.combat.handlePlayerAttack();
        }

        // Handle inventory number key input (Session 10)
        // Press 1-8 to select and use/equip items from inventory
        const slotPressed = this.input.getNumberPressed();
        if (slotPressed !== null) {
            // Select the slot
            this.player.selectSlot(slotPressed);
            // Use/equip the item in that slot
            this.player.useSlot(slotPressed, this.desperationMeter, this);
        }

        // Update player state
        this.player.update(deltaTime);

        // Update combat system
        this.combat.update(deltaTime);

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

        // Spawn enemies and weapons for new floor
        this.spawnFloorEntities();

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

        // Spawn enemies and weapons for this floor
        this.spawnFloorEntities();

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

    // Render game over screen (Session 9e)
    renderGameOver() {
        const ctx = this.renderer.ctx;

        // Black overlay (semi-transparent)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, 800, 600);

        // Main text: "GAME OVER"
        ctx.font = 'bold 48px "Courier New", monospace';
        ctx.fillStyle = '#ff0000';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', 400, 250);

        // Subtext: "You didn't make it..."
        ctx.font = '24px "Courier New", monospace';
        ctx.fillStyle = '#888888';
        ctx.fillText("You didn't make it...", 400, 300);

        // Restart instruction: "Press R to Restart"
        ctx.font = '20px "Courier New", monospace';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('Press R to Restart', 400, 350);

        // Reset text alignment for other text rendering
        ctx.textAlign = 'left';
    }

    // Render everything
    render() {
        // Clear screen
        this.renderer.clear();

        // Draw tile map (floors and walls)
        this.drawTileMap();

        // Render enemies (before player, so player draws on top)
        this.drawEnemies();

        // Render player
        this.player.render(this.renderer);

        // Draw inventory UI (Session 10)
        this.drawInventoryUI();

        // Draw debug info
        this.drawDebugInfo();

        // Draw game over screen if applicable (Session 9e)
        if (this.gameState === 'game_over') {
            this.renderGameOver();
        }
    }

    // Draw all enemies
    drawEnemies() {
        for (const enemy of this.combat.enemies) {
            this.renderer.drawChar(enemy.char, enemy.x, enemy.y, enemy.color);
        }
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

    // Draw inventory UI (Session 10)
    // Shows 8 inventory slots with items and selection highlighting
    // Positioned at bottom of screen above status bar to avoid map overlap
    drawInventoryUI() {
        const slotWidth = 40;
        const slotHeight = 40;
        const slotPadding = 5;
        const inventoryBarHeight = 50; // Total height of inventory bar
        const inventoryBarY = 505; // Position above status bar (status bar at 560)

        // Draw inventory bar background panel (similar to status bar)
        this.renderer.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        this.renderer.ctx.fillRect(0, inventoryBarY, 800, inventoryBarHeight);

        // Draw border around inventory bar
        this.renderer.ctx.strokeStyle = '#888888';
        this.renderer.ctx.lineWidth = 2;
        this.renderer.ctx.strokeRect(0, inventoryBarY, 800, inventoryBarHeight);

        // Calculate starting X to center the 8 slots
        const totalSlotsWidth = (slotWidth * 8) + (slotPadding * 7);
        const startX = (800 - totalSlotsWidth) / 2;
        const startY = inventoryBarY + 5; // 5px padding from top of bar

        // Draw 8 inventory slots horizontally
        for (let i = 0; i < 8; i++) {
            const slotX = startX + i * (slotWidth + slotPadding);
            const slotY = startY;

            // Determine if this slot is selected
            const isSelected = (i === this.player.selectedSlot);

            // Slot background
            this.renderer.ctx.fillStyle = isSelected ? 'rgba(100, 100, 255, 0.5)' : 'rgba(50, 50, 50, 0.8)';
            this.renderer.ctx.fillRect(slotX, slotY, slotWidth, slotHeight);

            // Slot border
            this.renderer.ctx.strokeStyle = isSelected ? '#ffff00' : '#666666';
            this.renderer.ctx.lineWidth = isSelected ? 3 : 1;
            this.renderer.ctx.strokeRect(slotX, slotY, slotWidth, slotHeight);

            // Slot number (1-8)
            this.renderer.ctx.font = '10px "Courier New", monospace';
            this.renderer.ctx.fillStyle = '#aaaaaa';
            this.renderer.ctx.textAlign = 'left';
            this.renderer.ctx.textBaseline = 'top';
            this.renderer.ctx.fillText(String(i + 1), slotX + 2, slotY + 2);

            // Item character (if slot has item)
            const item = this.player.inventory[i];
            if (item) {
                this.renderer.ctx.font = 'bold 24px "Courier New", monospace';
                this.renderer.ctx.fillStyle = item.color;
                this.renderer.ctx.textAlign = 'center';
                this.renderer.ctx.textBaseline = 'middle';
                this.renderer.ctx.fillText(item.char, slotX + slotWidth / 2, slotY + slotHeight / 2 + 4);
            }
        }

        // Item name tooltip (show name and stats of selected slot item)
        // Display to the right of the slots
        const selectedItem = this.player.inventory[this.player.selectedSlot];
        if (selectedItem) {
            let tooltipText = selectedItem.name;
            // Add damage stats for weapons
            if (selectedItem.damageMin !== undefined) {
                tooltipText += ` (${Math.floor(selectedItem.damageMin)}-${Math.floor(selectedItem.damageMax)} dmg)`;
            }

            // Position tooltip to the right of slots
            const tooltipX = startX + totalSlotsWidth + 15;
            const tooltipY = inventoryBarY + (inventoryBarHeight / 2) - 7; // Vertically centered

            this.renderer.ctx.font = '14px "Courier New", monospace';
            this.renderer.ctx.fillStyle = '#ffff00';
            this.renderer.ctx.textAlign = 'left';
            this.renderer.ctx.textBaseline = 'middle';
            this.renderer.ctx.fillText(tooltipText, tooltipX, tooltipY);
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
