// Combat System - Handles player and enemy combat mechanics
// Implements desperation-modified combat formulas from GAME_DESIGN.md

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
import { TILE_WEAPON, TILE_CONSUMABLE } from './tile-map.js';
import { SaveSystem } from './save-system.js';

export class CombatSystem {
    constructor(game) {
        this.game = game; // Reference to Game instance for accessing player, tileMap, desperationMeter
        this.enemies = []; // Enemy array (will populate in Session 9c)
        this.weapons = new Map(); // Ground weapons: Map<"x,y", Weapon> (Session 9d)
        this.consumables = new Map(); // Ground consumables: Map<"x,y", Consumable> (Session 10)
    }

    // Find nearest adjacent enemy (auto-targeting)
    // Checks N, S, E, W tiles for enemy presence
    findNearestAdjacentEnemy() {
        const playerX = this.game.player.x;
        const playerY = this.game.player.y;

        // Check 4 adjacent tiles in priority order: North, South, West, East
        const offsets = [
            { dx: 0, dy: -1 },  // North
            { dx: 0, dy: 1 },   // South
            { dx: -1, dy: 0 },  // West
            { dx: 1, dy: 0 }    // East
        ];

        for (const offset of offsets) {
            const targetX = playerX + offset.dx;
            const targetY = playerY + offset.dy;

            // Find enemy at this position
            const enemy = this.enemies.find(e =>
                e.x === targetX &&
                e.y === targetY &&
                e.health > 0
            );

            if (enemy) {
                return enemy;
            }
        }

        return null; // No adjacent enemy found
    }

    // Calculate accuracy with desperation penalty
    // Formula from GAME_DESIGN.md: base 90%, -30% at max desperation, minimum 60%
    // desperation: 0-1 decimal (0% = 0.0, 100% = 1.0)
    calculateAccuracy(desperation) {
        const baseAccuracy = 0.90;
        const penalty = desperation * 0.3;
        return Math.max(0.60, baseAccuracy - penalty);
    }

    // Calculate damage with rage multiplier
    // Formula from GAME_DESIGN.md: +80% damage at max desperation
    // desperation: 0-1 decimal (0% = 0.0, 100% = 1.0)
    calculateDamage(baseDamage, desperation) {
        const rageMultiplier = 1 + (desperation * 0.8);
        return Math.floor(baseDamage * rageMultiplier);
    }

    // Main player attack handler (called when SPACE pressed)
    handlePlayerAttack() {
        // Check if player can attack (has weapon + cooldown expired)
        if (!this.game.player.canAttack()) {
            if (!this.game.player.equippedWeapon) {
                this.game.player.setMessage('Need a weapon!');
                return;
            }
            // On cooldown - show message occasionally (not every frame to prevent spam)
            if (!this.lastCooldownMessageTime || Date.now() - this.lastCooldownMessageTime > 500) {
                this.game.player.setMessage(`Cooldown: ${this.game.player.attackCooldown.toFixed(1)}s`);
                this.lastCooldownMessageTime = Date.now();
            }
            return;
        }

        // Find nearest adjacent enemy (auto-targeting)
        const target = this.findNearestAdjacentEnemy();
        if (!target) {
            this.game.player.setMessage('No target!');
            return;
        }

        // Get desperation as decimal (0-1) for formulas
        const desperation = this.game.desperationMeter.getValue() / 100;

        // Roll accuracy check
        const accuracy = this.calculateAccuracy(desperation);
        const hit = Math.random() < accuracy;

        if (!hit) {
            // Attack missed
            this.game.player.setMessage('MISS!');
            this.game.soundSystem.playMiss(); // Session 17
        } else {
            // Attack hit - calculate damage
            const baseDamage = this.game.player.equippedWeapon.rollDamage();
            const finalDamage = this.calculateDamage(baseDamage, desperation);

            // Session 17: Play hit sound (pitch scales with damage)
            const weaponMaxDamage = this.game.player.equippedWeapon.damageMax;
            this.game.soundSystem.playHit(finalDamage, weaponMaxDamage);

            // Apply damage to enemy
            target.health -= finalDamage;

            // Show message to player
            this.game.player.setMessage(`Hit! ${finalDamage} damage`);

            // Check if enemy died
            if (target.health <= 0) {
                this.game.soundSystem.playEnemyDeath(); // Session 17
            }
        }

        // Set player cooldown from weapon
        this.game.player.attackCooldown = this.game.player.equippedWeapon.cooldownTime;
    }

    // Handle a single enemy's attack on the player
    // Enemies have 80% base accuracy (no desperation modifier)
    handleEnemyAttack(enemy) {
        if (!enemy.canAttack()) {
            return; // Still on cooldown
        }

        // Check if adjacent to player
        if (!enemy.isAdjacentToPlayer(this.game.player)) {
            return; // Not in attack range
        }

        // Roll accuracy check (80% for enemies, no desperation)
        const hit = Math.random() < enemy.accuracy;

        if (!hit) {
            // Enemy missed
        } else {
            // Enemy hit - roll damage
            const damage = enemy.rollDamage();

            // Session 17: Play hit sound for player getting hit
            const enemyMaxDamage = enemy.damageMax; // Fixed: enemy uses damageMax not damage.max
            this.game.soundSystem.playHit(damage, enemyMaxDamage);

            // Apply damage to player
            const died = this.game.player.takeDamage(damage);

            // Console log
                `${enemy.name} HIT player! Damage: ${damage}, ` +
                `Player HP: ${this.game.player.health}/${this.game.player.maxHealth}`
            );

            if (died) {
                // Trigger game over state (Session 9e)
                this.game.gameState = 'game_over';

                // Delete save on death (preserve permadeath) (Session 12b)
                SaveSystem.deleteSave();
            }
        }

        // Set enemy attack cooldown
        enemy.attackCooldown = enemy.attackCooldownTime;
    }

    // Update combat state (called every frame)
    update(deltaTime) {
        // Update all enemies
        for (const enemy of this.enemies) {
            // Update enemy cooldowns
            enemy.update(deltaTime);

            // AI: Determine movement behavior (Session 11 - Tactical AI)
            if (!enemy.isAdjacentToPlayer(this.game.player)) {
                // Check for flee behaviors
                let shouldFlee = false;

                // Gremlin: Flee when damaged
                if (enemy.fleeWhenDamaged && enemy.health < enemy.maxHealth) {
                    shouldFlee = true;
                }

                // Rat: Flee at 50% HP if alone
                if (enemy.fleeAt50Percent && enemy.health < enemy.maxHealth * 0.5) {
                    // Check swarm courage: Don't flee if 2+ rats nearby
                    if (enemy.swarmCourage) {
                        const nearbyAllies = this.enemies.filter(e =>
                            e.type === enemy.type &&
                            e !== enemy &&
                            Math.abs(e.x - enemy.x) + Math.abs(e.y - enemy.y) <= 3
                        );
                        // Only flee if alone (< 2 nearby allies)
                        shouldFlee = (nearbyAllies.length < 2);
                    } else {
                        shouldFlee = true;
                    }
                }

                // Execute movement
                if (shouldFlee) {
                    enemy.moveAwayFrom(this.game.player, this.game.tileMap, this.enemies);
                } else {
                    enemy.moveToward(this.game.player, this.game.tileMap, this.enemies);
                }
            }

            // Try to attack player (if adjacent and cooldown ready)
            this.handleEnemyAttack(enemy);
        }

        // Handle enemy drops and clean up dead enemies (Session 11)
        const deadEnemies = this.enemies.filter(e => e.health <= 0);
        for (const deadEnemy of deadEnemies) {
            // Try to drop an item
            const drop = deadEnemy.dropItem();
            if (drop) {
                this.spawnDrop(deadEnemy.x, deadEnemy.y, drop);
            }

            // Increment game stats (Session 12a)
            this.game.enemiesDefeated++;
        }

        // Clean up dead enemies (remove from array)
        this.enemies = this.enemies.filter(e => e.health > 0);
    }

    // Spawn dropped item on map (Session 11)
    // Called when enemy dies and drops an item
    spawnDrop(x, y, drop) {
        const { type, name } = drop;

        if (type === 'weapon') {
            // Spawn weapon tile
            this.game.tileMap.setTile(x, y, TILE_WEAPON);
            // Get weapon object by name
            const weapon = this.getWeaponByName(name);
            if (weapon) {
                const weaponKey = `${x},${y}`;
                this.weapons.set(weaponKey, weapon);
            }
        } else if (type === 'consumable') {
            // Spawn consumable tile
            this.game.tileMap.setTile(x, y, TILE_CONSUMABLE);
            // Get consumable object by name
            const consumable = this.getConsumableByName(name);
            if (consumable) {
                const consumableKey = `${x},${y}`;
                this.consumables.set(consumableKey, consumable);
            }
        }
        // Note: 'equipment' type not yet implemented (Phase 4)
    }

    // Get weapon object by name (Session 11)
    getWeaponByName(name) {
        const weaponMap = {
            'PLUNGER': PLUNGER,
            'TOILET_BRUSH': TOILET_BRUSH,
            'WRENCH': WRENCH,
            'MOP': MOP,
            'TP_LAUNCHER': TP_LAUNCHER,
            'STAPLER': STAPLER,
            'FIRE_EXTINGUISHER': FIRE_EXTINGUISHER,
            'COFFEE_POT': COFFEE_POT,
            'KEYBOARD': KEYBOARD,
            'CEREMONIAL_PLUNGER': CEREMONIAL_PLUNGER
        };
        return weaponMap[name] || null;
    }

    // Get consumable object by name (Session 11)
    getConsumableByName(name) {
        const consumableMap = {
            'ANTACID': ANTACID,
            'COFFEE': COFFEE,
            'DONUT': DONUT,
            'ENERGY_DRINK': ENERGY_DRINK,
            'FIBER_BAR': ANTACID  // Placeholder: Fiber Bar not implemented yet, use Antacid
        };
        return consumableMap[name] || null;
    }
}
