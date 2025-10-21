/**
 * Enemy class for The Descent: Code Brown
 * Handles enemy entities with AI, health, attacks, and movement
 */

export class Enemy {
    /**
     * @param {number} x - Starting x position
     * @param {number} y - Starting y position
     * @param {Object} config - Enemy configuration object
     */
    constructor(x, y, config, type = 'UNKNOWN') {
        this.x = x;
        this.y = y;
        this.type = type;  // Enemy type for drops and AI behavior

        // Copy config properties
        this.name = config.name;
        this.health = config.health;
        this.maxHealth = config.health;
        this.damageMin = config.damageMin;
        this.damageMax = config.damageMax;
        this.attackCooldown = 0;  // Current cooldown timer (seconds)
        this.attackCooldownTime = config.attackCooldownTime;  // Base cooldown
        this.moveCooldown = 0;  // Current movement cooldown (seconds)
        this.moveSpeed = config.moveSpeed;  // Tiles per second
        this.char = config.char;
        this.color = config.color;

        // Enemy-specific accuracy (80% base, no desperation modifier)
        this.accuracy = 0.80;

        // Behavioral flags (Session 11)
        this.fleeWhenDamaged = config.fleeWhenDamaged || false;
        this.fleeAt50Percent = config.fleeAt50Percent || false;
        this.swarmCourage = config.swarmCourage || false;
        this.territorial = config.territorial || false;
        this.guardVaults = config.guardVaults || false;
        this.competitor = config.competitor || false;
        this.goalSeeker = config.goalSeeker || false;
        this.avoidsConflict = config.avoidsConflict || false;
    }

    /**
     * Inflict damage on this enemy
     * @param {number} amount - Damage amount
     * @returns {boolean} True if enemy died
     */
    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        return this.health <= 0;
    }

    /**
     * Check if enemy can attack (cooldown ready)
     * @returns {boolean}
     */
    canAttack() {
        return this.attackCooldown <= 0;
    }

    /**
     * Check if enemy can move (cooldown ready)
     * @returns {boolean}
     */
    canMove() {
        return this.moveCooldown <= 0;
    }

    /**
     * Roll damage from this enemy's range
     * @returns {number}
     */
    rollDamage() {
        return Math.floor(this.damageMin + Math.random() * (this.damageMax - this.damageMin + 1));
    }

    /**
     * Simple greedy chase AI - move toward player
     * @param {Object} player - Player object with x, y
     * @param {Object} tileMap - TileMap for walkability checks
     * @param {Array} enemies - Array of all enemies (for collision check)
     */
    moveToward(player, tileMap, enemies) {
        if (!this.canMove()) return;

        // Calculate direction to player
        const dx = player.x > this.x ? 1 : (player.x < this.x ? -1 : 0);
        const dy = player.y > this.y ? 1 : (player.y < this.y ? -1 : 0);

        // Try horizontal movement first
        if (dx !== 0) {
            const targetX = this.x + dx;
            const targetY = this.y;

            if (this.canMoveTo(targetX, targetY, tileMap, enemies, player)) {
                this.x = targetX;
                this.moveCooldown = 1.0 / this.moveSpeed;  // Set cooldown based on speed
                return;
            }
        }

        // Try vertical movement
        if (dy !== 0) {
            const targetX = this.x;
            const targetY = this.y + dy;

            if (this.canMoveTo(targetX, targetY, tileMap, enemies, player)) {
                this.y = targetY;
                this.moveCooldown = 1.0 / this.moveSpeed;  // Set cooldown based on speed
                return;
            }
        }
    }

    /**
     * Check if target position is valid (walkable, not occupied)
     * @param {number} x - Target x
     * @param {number} y - Target y
     * @param {Object} tileMap - TileMap for walkability
     * @param {Array} enemies - Array of all enemies
     * @param {Object} player - Player object (optional, to prevent same-tile occupation)
     * @returns {boolean}
     */
    canMoveTo(x, y, tileMap, enemies, player = null) {
        // Check walkability
        if (!tileMap.isWalkable(x, y)) {
            return false;
        }

        // Check if player is at target position (prevent same-tile occupation)
        if (player && x === player.x && y === player.y) {
            return false;
        }

        // Check if another enemy is already there
        const occupied = enemies.some(enemy =>
            enemy !== this && enemy.x === x && enemy.y === y
        );

        return !occupied;
    }

    /**
     * Check if enemy is adjacent to player (for attack range)
     * @param {Object} player - Player with x, y
     * @returns {boolean}
     */
    isAdjacentToPlayer(player) {
        const dx = Math.abs(this.x - player.x);
        const dy = Math.abs(this.y - player.y);

        // Adjacent means exactly 1 tile away in one direction (not diagonal)
        return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
    }

    /**
     * Flee behavior - move away from player (Session 11)
     * Used by Gremlin (always) and Rat (when low HP)
     * @param {Object} player - Player object with x, y
     * @param {Object} tileMap - TileMap for walkability checks
     * @param {Array} enemies - Array of all enemies (for collision check)
     */
    moveAwayFrom(player, tileMap, enemies) {
        if (!this.canMove()) return;

        // Calculate direction AWAY from player
        const dx = player.x > this.x ? -1 : (player.x < this.x ? 1 : 0);
        const dy = player.y > this.y ? -1 : (player.y < this.y ? 1 : 0);

        // Try horizontal movement first
        if (dx !== 0) {
            const targetX = this.x + dx;
            const targetY = this.y;

            if (this.canMoveTo(targetX, targetY, tileMap, enemies, player)) {
                this.x = targetX;
                this.moveCooldown = 1.0 / this.moveSpeed;
                return;
            }
        }

        // Try vertical movement
        if (dy !== 0) {
            const targetX = this.x;
            const targetY = this.y + dy;

            if (this.canMoveTo(targetX, targetY, tileMap, enemies, player)) {
                this.y = targetY;
                this.moveCooldown = 1.0 / this.moveSpeed;
                return;
            }
        }
    }

    /**
     * Drop item on death (Session 11)
     * Returns item object or null based on enemy type and drop probabilities
     * @returns {Object|null} { type: 'weapon'|'consumable', name: string }
     */
    dropItem() {
        const roll = Math.random();

        switch(this.type) {
            case 'JANITOR':
                // 50% Mop, 30% Janitor's Keys, 20% Antacid
                if (roll < 0.5) return { type: 'weapon', name: 'MOP' };
                if (roll < 0.8) return { type: 'equipment', name: 'JANITORS_KEYS' };
                return { type: 'consumable', name: 'ANTACID' };

            case 'GREMLIN':
                // 50% Wrench, 30% Tools, 20% Nothing
                if (roll < 0.5) return { type: 'weapon', name: 'WRENCH' };
                if (roll < 0.8) return { type: 'consumable', name: 'ANTACID' };  // Tools→Antacid for now
                return null;

            case 'RAT':
                // 10% Fiber Bar, 5% Random consumable, 85% Nothing
                if (roll < 0.10) return { type: 'consumable', name: 'FIBER_BAR' };
                if (roll < 0.15) {
                    const consumables = ['ANTACID', 'DONUT', 'COFFEE'];
                    return { type: 'consumable', name: consumables[Math.floor(Math.random() * consumables.length)] };
                }
                return null;

            case 'PIPE_MONSTER':
                // 70% Plunger, 20% Antacid, 10% Legendary (for now: Ceremonial Plunger)
                if (roll < 0.7) return { type: 'weapon', name: 'PLUNGER' };
                if (roll < 0.9) return { type: 'consumable', name: 'ANTACID' };
                return { type: 'weapon', name: 'CEREMONIAL_PLUNGER' };

            case 'COFFEE_ZOMBIE':
                // 60% chance Coffee
                if (roll < 0.6) return { type: 'consumable', name: 'COFFEE' };
                return null;

            default:
                // Security Bot, The Desperate, etc. - no drops for now
                return null;
        }
    }

    /**
     * Update enemy cooldowns
     * @param {number} deltaTime - Time in milliseconds since last frame
     */
    update(deltaTime) {
        const deltaSeconds = deltaTime / 1000;

        // Tick down attack cooldown
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaSeconds;
        }

        // Tick down movement cooldown
        if (this.moveCooldown > 0) {
            this.moveCooldown -= deltaSeconds;
        }
    }
}

// ===== ENEMY CONFIGURATIONS =====

/**
 * Security Bot - Slow, tanky patrol enemy (floors 10-8)
 * Health: 40 HP (tanky)
 * Damage: 8-12 (moderate)
 * Attack Cooldown: 1.5 sec (slow attacks)
 * Move Speed: 1.0 tiles/sec (slow patrol)
 * Behavior: Steady pursuit, hard to kill
 */
export const ENEMY_SECURITY_BOT = {
    name: 'Security Bot',
    health: 40,
    damageMin: 8,
    damageMax: 12,
    attackCooldownTime: 1.5,
    moveSpeed: 1.0,
    char: 'S',
    color: '#888888'  // Gray
};

/**
 * Coffee Zombie - Fast, fragile aggressive enemy (floors 10-6)
 * Health: 20 HP (fragile)
 * Damage: 10-15 (higher damage)
 * Attack Cooldown: 0.8 sec (fast attacks)
 * Move Speed: 2.0 tiles/sec (fast chase)
 * Behavior: Aggressive rush, easy to kill but dangerous
 */
export const ENEMY_COFFEE_ZOMBIE = {
    name: 'Coffee Zombie',
    health: 20,
    damageMin: 10,
    damageMax: 15,
    attackCooldownTime: 0.8,
    moveSpeed: 2.0,
    char: 'Z',
    color: '#aa5500'  // Brown (coffee color)
};

/**
 * Janitor Enforcer - Territorial guard enemy (floors 7-5)
 * Health: 60 HP (tanky)
 * Damage: 12-18 (moderate-high)
 * Attack Cooldown: 1.2 sec (medium, area attack 2-tile reach)
 * Move Speed: 1.5 tiles/sec (medium)
 * Behavior: Guards special rooms (vaults), uses pillars for cover
 * Drop: 50% Mop, 30% Janitor's Keys, 20% Antacid
 */
export const ENEMY_JANITOR = {
    name: 'Janitor Enforcer',
    health: 60,
    damageMin: 12,
    damageMax: 18,
    attackCooldownTime: 1.2,
    moveSpeed: 1.5,
    char: 'J',
    color: '#8b4513',  // Brown (janitor uniform)
    territorial: true,
    guardVaults: true
};

/**
 * Maintenance Gremlin - Chaotic fast enemy (floors 6-3)
 * Health: 25 HP (fragile)
 * Damage: 6-10 (low)
 * Attack Cooldown: 1.0 sec (medium)
 * Move Speed: 2.5 tiles/sec (very fast!)
 * Behavior: Erratic movement, flees when damaged, pack tactics (spawn in groups of 2)
 * Drop: 50% Wrench, 30% Tools, 20% Nothing
 */
export const ENEMY_GREMLIN = {
    name: 'Maintenance Gremlin',
    health: 25,
    damageMin: 6,
    damageMax: 10,
    attackCooldownTime: 1.0,
    moveSpeed: 2.5,
    char: 'g',
    color: '#556b2f',  // Dark olive green
    fleeWhenDamaged: true,  // Coward AI
    packSpawn: 2  // Spawn in groups of 2
};

/**
 * Sewer Rat - Swarm enemy (floors 4-2)
 * Health: 10 HP (very fragile)
 * Damage: 4-8 (low)
 * Attack Cooldown: 0.7 sec (quick bites)
 * Move Speed: 2.0 tiles/sec (fast)
 * Behavior: Swarm spawns (2-4 together), surround player, flee at 50% HP if alone
 * Drop: 10% Fiber Bar, 5% Random consumable, 85% Nothing
 */
export const ENEMY_RAT = {
    name: 'Sewer Rat',
    health: 10,
    damageMin: 4,
    damageMax: 8,
    attackCooldownTime: 0.7,
    moveSpeed: 2.0,
    char: 'r',
    color: '#654321',  // Dark brown
    swarmSpawn: true,  // Spawn in groups of 2-4
    fleeAt50Percent: true,  // Flee when health < 50% if alone
    swarmCourage: true  // Don't flee if 2+ rats nearby
};

/**
 * Pipe Monster - Tank enemy (floors 3-1)
 * Health: 100 HP (very tanky, mini-boss tier)
 * Damage: 20-30 (high)
 * Attack Cooldown: 2.0 sec (slow, heavy hits)
 * Move Speed: 0.8 tiles/sec (slow)
 * Behavior: Blocks corridors, guards stairs, heals 2 HP/sec in water
 * Drop: 70% Plunger, 20% Antacid, 10% Legendary
 */
export const ENEMY_PIPE_MONSTER = {
    name: 'Pipe Monster',
    health: 100,
    damageMin: 20,
    damageMax: 30,
    attackCooldownTime: 2.0,
    moveSpeed: 0.8,
    char: 'P',
    color: '#2f4f2f',  // Dark green (sewage)
    tank: true,
    guardsStairs: true,
    waterRegen: 2  // HP/sec when in water
};

/**
 * The Desperate - Competitor AI (all floors, 10% spawn rate)
 * Health: 50 HP (same as player)
 * Damage: 10-15 (weapon-dependent in future)
 * Attack Cooldown: 1.0 sec (same as player)
 * Move Speed: 1.0 tiles/sec (affected by desperation, same as player)
 * Behavior: Goal-seeking (reach Floor 1), avoids combat, picks up items, has own desperation
 * If reaches Floor 1 first → game over
 */
export const ENEMY_THE_DESPERATE = {
    name: 'The Desperate',
    health: 50,
    damageMin: 10,
    damageMax: 15,
    attackCooldownTime: 1.0,
    moveSpeed: 1.0,
    char: '&',
    color: '#9370db',  // Purple/magenta (distinct from player)
    competitor: true,
    goalSeeker: true,  // Seeks downstairs, not player
    avoidsConflict: true  // Prefers avoiding combat
};
