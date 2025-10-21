// Combat System - Handles player and enemy combat mechanics
// Implements desperation-modified combat formulas from GAME_DESIGN.md

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
            }
            // If on cooldown, silently ignore (no spam messages)
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
            console.log(`Attack MISS! Accuracy: ${Math.floor(accuracy * 100)}%, Desperation: ${Math.floor(desperation * 100)}%`);
        } else {
            // Attack hit - calculate damage
            const baseDamage = this.game.player.equippedWeapon.rollDamage();
            const finalDamage = this.calculateDamage(baseDamage, desperation);

            // Apply damage to enemy
            target.health -= finalDamage;

            // Show message to player
            this.game.player.setMessage(`Hit! ${finalDamage} damage`);

            // Console log for debugging
            console.log(
                `Attack HIT! Target: (${target.x}, ${target.y}), ` +
                `Damage: ${finalDamage} (base: ${Math.floor(baseDamage)}, ` +
                `rage: ${Math.floor((desperation * 0.8) * 100)}% bonus, ` +
                `desperation: ${Math.floor(desperation * 100)}%)`
            );

            // Check if enemy died
            if (target.health <= 0) {
                console.log(`Enemy defeated! ${target.name} at (${target.x}, ${target.y})`);
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
            console.log(`${enemy.name} MISS! (adjacent to player)`);
        } else {
            // Enemy hit - roll damage
            const damage = enemy.rollDamage();

            // Apply damage to player
            const died = this.game.player.takeDamage(damage);

            // Console log
            console.log(
                `${enemy.name} HIT player! Damage: ${damage}, ` +
                `Player HP: ${this.game.player.health}/${this.game.player.maxHealth}`
            );

            if (died) {
                console.log('Player defeated!');
                // Trigger game over state (Session 9e)
                this.game.gameState = 'game_over';
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

            // AI: Move toward player (if not adjacent)
            if (!enemy.isAdjacentToPlayer(this.game.player)) {
                enemy.moveToward(this.game.player, this.game.tileMap, this.enemies);
            }

            // Try to attack player (if adjacent and cooldown ready)
            this.handleEnemyAttack(enemy);
        }

        // Clean up dead enemies (remove from array)
        this.enemies = this.enemies.filter(e => e.health > 0);

        // Future Session 9d: Handle weapon/item pickups
    }
}
