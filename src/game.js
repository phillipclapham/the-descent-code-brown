// Main game loop and initialization

import { Renderer, GRID_WIDTH, GRID_HEIGHT } from './renderer.js';
import { Player } from './player.js';
import { InputHandler } from './input.js';
import { DesperationMeter } from './desperation-meter.js';
import { TileMap, TILE_FLOOR, TILE_STAIRS, TILE_STAIRS_UP, TILE_TOILET, TILE_WEAPON, TILE_CONSUMABLE } from './tile-map.js';
import { DungeonGenerator } from './dungeon-generator.js';
import { CombatSystem } from './combat.js';
import { IntroModal } from './intro-modal.js';
import { SaveSystem } from './save-system.js';
import { MenuSystem } from './menu-system.js';
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
            this.tileMap,
            this.desperationMeter  // Session 12d: Pass reference for desperation abilities
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

        // Statistics tracking (Session 12a)
        this.startTime = Date.now();
        this.enemiesDefeated = 0;
        this.itemsCollected = 0;
        this.specialRoomsFound = new Set(); // Track unique rooms
        this.vaultsUnlocked = 0;
        this.keysUsed = 0;

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
        // Session 12c fix: Handle null case (Floor 10 has no upstairs)
        let upstairsPos = this.tileMap.findUpStairsPosition();
        if (!upstairsPos) {
            // No upstairs (Floor 10), use downstairs position instead
            upstairsPos = this.tileMap.findDownStairsPosition();
        }

        // Spawn each enemy config
        for (const { config, type, count } of enemyConfigs) {
            const enemiesToSpawn = count || 1;

            for (let i = 0; i < enemiesToSpawn; i++) {
                // Find random position at least 5 tiles from spawn area (stairs)
                let spawnPos = null;
                let attempts = 0;

                while (attempts < 50 && !spawnPos) {
                    attempts++;
                    const x = 2 + Math.floor(Math.random() * (GRID_WIDTH - 4));
                    const y = 2 + Math.floor(Math.random() * (GRID_HEIGHT - 4));

                    // Check walkable and distance from player spawn area
                    if (this.tileMap.isWalkable(x, y)) {
                        // Session 12c fix: Check if upstairsPos exists before accessing properties
                        const distance = upstairsPos
                            ? Math.abs(x - upstairsPos.x) + Math.abs(y - upstairsPos.y)
                            : 999; // No stairs found, allow spawn anywhere
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

        // Session 12d: Spawn extra consumables in break rooms
        if (this.tileMap.breakRooms && this.tileMap.breakRooms.length > 0) {
            for (const breakRoom of this.tileMap.breakRooms) {
                const numBreakRoomItems = 2 + Math.floor(Math.random() * 2); // 2-3 consumables
                console.log(`  🛋️  Spawning ${numBreakRoomItems} consumables in Break Room at (${breakRoom.x}, ${breakRoom.y})`);

                for (let i = 0; i < numBreakRoomItems; i++) {
                    // Find random position inside break room
                    let spawnPos = null;
                    let attempts = 0;

                    while (attempts < 30 && !spawnPos) {
                        attempts++;
                        const x = breakRoom.x + Math.floor(Math.random() * breakRoom.width);
                        const y = breakRoom.y + Math.floor(Math.random() * breakRoom.height);

                        const tile = this.tileMap.getTile(x, y);

                        // Only spawn on plain floor
                        if (tile === TILE_FLOOR) {
                            spawnPos = { x, y };
                        }
                    }

                    if (spawnPos) {
                        // Weighted probabilities for break room consumables
                        // Coffee (60%), Donut (30%), Energy Drink (10%)
                        const roll = Math.random();
                        let consumable;
                        if (roll < 0.60) {
                            consumable = COFFEE;
                        } else if (roll < 0.90) {
                            consumable = DONUT;
                        } else {
                            consumable = ENERGY_DRINK;
                        }

                        // Place on map
                        this.tileMap.setTile(spawnPos.x, spawnPos.y, TILE_CONSUMABLE);

                        // Store in combat system
                        const consumableKey = `${spawnPos.x},${spawnPos.y}`;
                        this.combat.consumables.set(consumableKey, consumable);

                        console.log(`     ☕ ${consumable.name} at (${spawnPos.x}, ${spawnPos.y})`);
                    }
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

        // Update desperation meter (Session 12a: pass player for clench check)
        this.desperationMeter.update(deltaTime, this.player);

        // Session 12d: Check for game over at 100% desperation
        if (this.desperationMeter.getValue() >= 100) {
            console.log('💀 GAME OVER! Desperation reached 100%');
            this.gameState = 'game_over';
            // Delete save on desperation death (preserve permadeath)
            SaveSystem.deleteSave();
            return; // Stop processing this frame
        }

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

        // Handle Clench input (Session 12a)
        if (this.input.isClenchPressed()) {
            this.player.activateClench();
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

        // Auto-save on floor transition (Session 12b)
        SaveSystem.save(this);
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

        // Auto-save on floor transition (Session 12b)
        SaveSystem.save(this);
    }

    // Handle victory condition (player reached the toilet!) (Session 12a)
    handleVictory() {
        console.log('🎉 VICTORY! You made it to the bathroom!');
        this.gameState = 'victory';
        this.saveHighScore();

        // Delete save on victory (preserve permadeath) (Session 12b)
        SaveSystem.deleteSave();
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

    // Render Clench UI (Session 12a - top-right corner to avoid overlap)
    renderClenchUI() {
        const ctx = this.renderer.ctx;
        const x = 790; // Right-aligned position (10px from right edge)
        const y = 20;  // Top of screen to avoid overlap with status bar

        ctx.font = '14px "Courier New", monospace';
        ctx.textAlign = 'right'; // Right-align to prevent overflow

        if (this.player.clenchActive) {
            // Active: show remaining time
            ctx.fillStyle = '#00ffff'; // Cyan
            ctx.fillText(`Clench: ACTIVE (${Math.ceil(this.player.clenchTimeRemaining)}s)`, x, y);
        } else if (this.player.clenchCooldownRemaining > 0) {
            // Cooldown: show remaining cooldown
            ctx.fillStyle = '#888888'; // Gray
            ctx.fillText(`Clench: ${Math.ceil(this.player.clenchCooldownRemaining)}s`, x, y);
        } else {
            // Ready: show ready state
            ctx.fillStyle = '#00ff00'; // Green
            ctx.fillText('Clench: READY', x, y);
        }

        // Reset text alignment
        ctx.textAlign = 'left';
    }

    // Render Clench visual effect (pulsing cyan border) (Session 12a)
    renderClenchEffect() {
        const ctx = this.renderer.ctx;

        // Pulsing cyan border
        const pulse = Math.sin(Date.now() / 150) * 0.5 + 0.5; // 0 to 1
        const alpha = 0.3 + (pulse * 0.4); // 0.3 to 0.7

        ctx.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
        ctx.lineWidth = 4;
        ctx.strokeRect(2, 2, 796, 596);
    }

    // Apply screen shake effect based on desperation threshold (Session 12a)
    applyScreenShake(threshold) {
        // Shake frequency based on threshold
        let shouldShake = false;
        const time = Date.now();

        if (threshold.level === 3) {
            // Occasional (every 3-5 seconds)
            shouldShake = (time % 4000) < 100;
        } else if (threshold.level === 4) {
            // Frequent (every 1-2 seconds)
            shouldShake = (time % 1500) < 100;
        } else if (threshold.level === 5) {
            // Constant
            shouldShake = true;
        }

        if (shouldShake) {
            const offsetX = (Math.random() - 0.5) * threshold.shake * 2;
            const offsetY = (Math.random() - 0.5) * threshold.shake * 2;
            this.renderer.ctx.save();
            this.renderer.ctx.translate(offsetX, offsetY);
        }

        return shouldShake; // Return whether shake was applied (for restore later)
    }

    // Apply screen tint overlay based on desperation threshold (Session 12a)
    applyScreenTint(threshold, shakeApplied) {
        const ctx = this.renderer.ctx;
        ctx.fillStyle = `${threshold.tintColor},${threshold.tintAlpha})`;
        ctx.fillRect(0, 0, 800, 600);

        // Restore after shake (if shake was applied)
        if (shakeApplied) {
            ctx.restore();
        }
    }

    // Render victory screen (Session 12a)
    renderVictory() {
        const ctx = this.renderer.ctx;

        // Black background
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, 800, 600);

        // ASCII Art Toilet (THE THRONE)
        ctx.font = '14px "Courier New", monospace';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';

        const toilet = [
            "           _____           ",
            "          /     \\          ",
            "         |  ___  |         ",
            "         | |   | |         ",
            "         | |___| |         ",
            "         |_______|         ",
            "            | |            ",
            "           /   \\           ",
            "          /_____\\          ",
            "                           ",
            "      * THE THRONE *       "
        ];

        let y = 60;
        toilet.forEach(line => {
            ctx.fillText(line, 400, y);
            y += 18;
        });

        // Victory Text
        y += 20;
        ctx.font = 'bold 32px "Courier New", monospace';
        ctx.fillStyle = '#00ff00';
        ctx.fillText('YOU MADE IT!', 400, y);

        y += 40;
        ctx.font = 'italic 20px "Courier New", monospace';
        ctx.fillStyle = '#888888';
        ctx.fillText('"Relief at last..."', 400, y);

        // Statistics
        y += 50;
        ctx.font = '16px "Courier New", monospace';
        ctx.fillStyle = '#ffff00';
        ctx.fillText('========== RUN STATISTICS ==========', 400, y);

        const elapsedTime = (Date.now() - this.startTime) / 1000;
        const minutes = Math.floor(elapsedTime / 60);
        const seconds = Math.floor(elapsedTime % 60);

        ctx.fillStyle = '#ffffff';
        y += 30;
        ctx.fillText(`Time Taken:          ${minutes}m ${seconds}s`, 400, y);
        y += 20;
        ctx.fillText(`Final Desperation:   ${Math.floor(this.desperationMeter.value)}%`, 400, y);
        y += 20;
        ctx.fillText(`Floors Explored:     10/10`, 400, y);
        y += 30;
        ctx.fillText(`Enemies Defeated:    ${this.enemiesDefeated}`, 400, y);
        y += 20;
        ctx.fillText(`Items Collected:     ${this.itemsCollected}`, 400, y);
        y += 20;
        ctx.fillText(`Special Rooms:       ${this.specialRoomsFound.size}`, 400, y);
        y += 20;
        ctx.fillText(`Keys Used:           ${this.keysUsed}`, 400, y);
        y += 20;
        ctx.fillText(`Vaults Unlocked:     ${this.vaultsUnlocked}`, 400, y);

        // Scoring
        y += 40;
        ctx.fillStyle = '#ffff00';
        ctx.fillText('===================================', 400, y);

        const score = this.calculateScore(elapsedTime);

        ctx.fillStyle = '#00ff00';
        y += 30;
        ctx.fillText(`Base Score:                   1000`, 400, y);
        y += 20;
        ctx.fillText(`Time Bonus (${minutes}:${seconds.toString().padStart(2, '0')}):          +${score.timeBonus}`, 400, y);
        y += 20;
        ctx.fillText(`Desperation Bonus (${Math.floor(this.desperationMeter.value)}%):    +${score.desperationBonus}`, 400, y);
        y += 20;
        ctx.fillText(`Combat Bonus (${this.enemiesDefeated} enemies):  +${score.combatBonus}`, 400, y);
        y += 20;
        ctx.fillText(`Exploration Bonus (${this.specialRoomsFound.size} rooms):+${score.explorationBonus}`, 400, y);
        y += 20;
        ctx.fillText(`Item Bonus (${this.itemsCollected} items):      +${score.itemBonus}`, 400, y);
        y += 20;
        ctx.fillStyle = '#ffff00';
        ctx.fillText('                          ______', 400, y);
        y += 20;
        ctx.font = 'bold 18px "Courier New", monospace';
        ctx.fillStyle = '#00ff00';
        ctx.fillText(`FINAL SCORE:                ${score.finalScore}`, 400, y);

        // High Score Comparison
        const highScore = this.loadHighScore();
        if (highScore && score.finalScore > highScore.score) {
            y += 30;
            ctx.fillStyle = '#ffff00';
            ctx.fillText('** NEW HIGH SCORE! **', 400, y);
            y += 20;
            ctx.fillStyle = '#888888';
            ctx.font = '14px "Courier New", monospace';
            ctx.fillText(`Previous Best: ${highScore.score}`, 400, y);
        } else if (highScore) {
            y += 30;
            ctx.fillStyle = '#888888';
            ctx.font = '14px "Courier New", monospace';
            ctx.fillText(`High Score: ${highScore.score}`, 400, y);
        }

        // Rank
        y += 40;
        const rank = this.getRank(score.finalScore);
        ctx.font = 'bold 20px "Courier New", monospace';
        ctx.fillStyle = '#00ffff';
        ctx.fillText(`Rank: ${rank.name}`, 400, y);
        y += 25;
        ctx.font = 'italic 14px "Courier New", monospace';
        ctx.fillStyle = '#888888';
        ctx.fillText(`"${rank.flavor}"`, 400, y);

        // Options
        y += 50;
        ctx.font = '16px "Courier New", monospace';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('[R] Play Again', 400, y);

        ctx.textAlign = 'left';
    }

    // Calculate score based on statistics (Session 12a)
    calculateScore(elapsedTime) {
        const baseScore = 1000;
        const timeBonus = Math.floor((300 / elapsedTime) * 100);
        const desperationBonus = Math.floor(this.desperationMeter.value * 5);
        const combatBonus = this.enemiesDefeated * 10;
        const explorationBonus = this.specialRoomsFound.size * 30;
        const itemBonus = this.itemsCollected * 5;

        const finalScore = baseScore + timeBonus + desperationBonus + combatBonus + explorationBonus + itemBonus;

        return {
            baseScore,
            timeBonus,
            desperationBonus,
            combatBonus,
            explorationBonus,
            itemBonus,
            finalScore
        };
    }

    // Get rank based on score (Session 12a)
    getRank(score) {
        if (score >= 2500) {
            return { name: 'LEGENDARY HOLDER', flavor: 'You held it like a legend' };
        } else if (score >= 2000) {
            return { name: 'DESPERATE HERO', flavor: 'You held it like a champion' };
        } else if (score >= 1500) {
            return { name: 'MADE IT', flavor: 'You survived the descent' };
        } else if (score >= 1000) {
            return { name: 'BARELY SURVIVED', flavor: 'That was close...' };
        } else if (score >= 500) {
            return { name: "SHOULD'VE GONE EARLIER", flavor: 'Next time, listen to your gut' };
        } else {
            return { name: 'NEXT TIME, SKIP LUNCH', flavor: 'Questionable life choices' };
        }
    }

    // Save high score to localStorage (Session 12a)
    saveHighScore() {
        const elapsedTime = (Date.now() - this.startTime) / 1000;
        const score = this.calculateScore(elapsedTime);
        const rank = this.getRank(score.finalScore);

        const minutes = Math.floor(elapsedTime / 60);
        const seconds = Math.floor(elapsedTime % 60);

        const highScoreData = {
            score: score.finalScore,
            time: `${minutes}:${seconds.toString().padStart(2, '0')}`,
            desperation: Math.floor(this.desperationMeter.value),
            enemiesDefeated: this.enemiesDefeated,
            date: new Date().toLocaleDateString(),
            rank: rank.name
        };

        localStorage.setItem('high_score', JSON.stringify(highScoreData));
    }

    // Load high score from localStorage (Session 12a)
    loadHighScore() {
        const data = localStorage.getItem('high_score');
        return data ? JSON.parse(data) : null;
    }

    // Render everything
    render() {
        // Get desperation threshold for visual effects (Session 12a)
        const threshold = this.desperationMeter.getCurrentThreshold();

        // Apply screen shake BEFORE rendering (Session 12a)
        let shakeApplied = false;
        if (threshold.shake > 0) {
            shakeApplied = this.applyScreenShake(threshold);
        }

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

        // Render Clench UI (Session 12a)
        this.renderClenchUI();

        // Apply screen tint AFTER rendering (overlay) (Session 12a)
        if (threshold.tintColor) {
            this.applyScreenTint(threshold, shakeApplied);
        }

        // Clench visual effect (cyan border pulse) (Session 12a)
        if (this.player.clenchActive) {
            this.renderClenchEffect();
        }

        // Draw game over screen if applicable (Session 9e)
        if (this.gameState === 'game_over') {
            this.renderGameOver();
        }

        // Draw victory screen if applicable (Session 12a)
        if (this.gameState === 'victory') {
            this.renderVictory();
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
        // Session 12c: Get player desperation for bashable wall highlighting
        const desperation = this.desperationMeter ? this.desperationMeter.getValue() : 0;
        const canBashWalls = desperation >= 75;

        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                const tile = this.tileMap.getTile(x, y);
                const char = this.tileMap.getTileChar(tile);
                let color = this.tileMap.getTileColor(tile);

                // Session 12c: Highlight bashable walls when at 75%+ desperation
                if (tile === 1 && canBashWalls && this.tileMap.isWallBashable(x, y)) {
                    color = '#aa6600'; // Orange-brown color for bashable walls (weaker looking)
                }

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

    // Helper: Get weapon by ID (for save/load)
    getWeaponById(id) {
        const weaponMap = {
            'plunger': PLUNGER,
            'toilet-brush': TOILET_BRUSH,
            'wrench': WRENCH,
            'mop': MOP,
            'tp-launcher': TP_LAUNCHER,
            'stapler': STAPLER,
            'fire-extinguisher': FIRE_EXTINGUISHER,
            'coffee-pot': COFFEE_POT,
            'keyboard': KEYBOARD,
            'ceremonial-plunger': CEREMONIAL_PLUNGER
        };
        return weaponMap[id] ? { ...weaponMap[id] } : null;
    }

    // Helper: Get consumable by ID (for save/load)
    getConsumableById(id) {
        const consumableMap = {
            'antacid': ANTACID,
            'coffee': COFFEE,
            'donut': DONUT,
            'energy-drink': ENERGY_DRINK
        };
        return consumableMap[id] ? { ...consumableMap[id] } : null;
    }
}

// Initialize game when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    // Show intro modal if first time
    const introModal = new IntroModal();

    introModal.show(() => {
        // Modal dismissed, show menu
        showMenu();
    });
});

// Show main menu (NEW GAME / CONTINUE)
function showMenu() {
    const canvas = document.getElementById('game-canvas');
    const tempRenderer = new Renderer(canvas);
    const menu = new MenuSystem(canvas, tempRenderer);

    // Menu loop
    function menuLoop() {
        if (menu.isActive()) {
            menu.render();
            requestAnimationFrame(menuLoop);
        } else {
            // Menu closed, get selected option
            const selectedOption = menu.getSelectedOption();

            if (selectedOption === 'new_game') {
                startNewGame();
            } else if (selectedOption === 'continue') {
                continueGame();
            }
        }
    }

    menuLoop();
}

// Start a new game
function startNewGame() {
    const game = new Game();
    game.start();

    // Make game globally accessible for console testing
    window.game = game;

    // Auto-save on page unload (Session 12b)
    window.addEventListener('beforeunload', () => {
        if (game.gameState === 'playing') {
            SaveSystem.save(game);
        }
    });
}

// Continue from save
function continueGame() {
    const saveData = SaveSystem.loadSave();

    if (!saveData) {
        console.error('No save data found!');
        startNewGame();
        return;
    }

    // Create game instance
    const game = new Game();

    // Restore state from save BEFORE starting game loop
    SaveSystem.continue(game, saveData);

    // Start game loop
    game.start();

    // Make game globally accessible for console testing
    window.game = game;

    // Auto-save on page unload (Session 12b)
    window.addEventListener('beforeunload', () => {
        if (game.gameState === 'playing') {
            SaveSystem.save(game);
        }
    });
}
