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
    constructor(x, y, config) {
        this.x = x;
        this.y = y;

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

            if (this.canMoveTo(targetX, targetY, tileMap, enemies)) {
                this.x = targetX;
                this.moveCooldown = 1.0 / this.moveSpeed;  // Set cooldown based on speed
                return;
            }
        }

        // Try vertical movement
        if (dy !== 0) {
            const targetX = this.x;
            const targetY = this.y + dy;

            if (this.canMoveTo(targetX, targetY, tileMap, enemies)) {
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
     * @returns {boolean}
     */
    canMoveTo(x, y, tileMap, enemies) {
        // Check walkability
        if (!tileMap.isWalkable(x, y)) {
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
