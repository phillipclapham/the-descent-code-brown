// Game persistence system

export class SaveSystem {
    static SAVE_KEY = 'save_game';
    static HIGHSCORE_KEY = 'high_score';
    static VERSION = '1.0';

    // Check if a save file exists
    static hasSave() {
        return localStorage.getItem(this.SAVE_KEY) !== null;
    }

    // Load save data
    static loadSave() {
        const data = localStorage.getItem(this.SAVE_KEY);
        if (!data) return null;

        try {
            const saveData = JSON.parse(data);

            // Validate save version
            if (saveData.version !== this.VERSION) {
                console.warn('Save file version mismatch, deleting save');
                this.deleteSave();
                return null;
            }

            return saveData;
        } catch (error) {
            console.error('Failed to load save:', error);
            return null;
        }
    }

    // Save game state
    static save(game) {
        const saveData = {
            // Player State
            floor: game.numFloors - game.currentFloor, // Display floor (10 → 1)
            playerHealth: game.player.health,
            playerMaxHealth: game.player.maxHealth,
            playerDesperation: game.desperationMeter.desperation,
            playerPosition: {
                x: game.player.x,
                y: game.player.y
            },
            keysCollected: game.player.keysCollected,

            // Inventory
            currentWeapon: game.player.weapon ? {
                id: game.player.weapon.id,
                ammo: game.player.weapon.ammo
            } : null,
            inventory: game.player.inventory.map(item => {
                if (!item) return null;
                return {
                    type: item.type,
                    id: item.id,
                    ammo: item.ammo,
                    quantity: item.quantity
                };
            }),

            // Clench state
            clenchCooldownRemaining: game.player.clenchCooldownRemaining,

            // Consumable effects
            speedBoostEndTime: game.player.speedBoostEndTime,
            invincibilityEndTime: game.player.invincibilityEndTime,
            crashEndTime: game.player.crashEndTime,

            // Statistics
            enemiesDefeated: game.enemiesDefeated,
            itemsCollected: game.itemsCollected,
            specialRoomsFound: game.specialRoomsFound.size,
            vaultsUnlocked: game.vaultsUnlocked,
            keysUsed: game.keysUsed,
            startTime: game.startTime,

            // Metadata
            timestamp: Date.now(),
            version: this.VERSION
        };

        try {
            localStorage.setItem(this.SAVE_KEY, JSON.stringify(saveData));
            console.log(`Game saved! Floor ${saveData.floor}, ${saveData.playerHealth}HP, ${Math.floor(saveData.playerDesperation)}% desperation`);
            return true;
        } catch (error) {
            console.error('Failed to save game:', error);
            return false;
        }
    }

    // Delete save file (on death/victory)
    static deleteSave() {
        localStorage.removeItem(this.SAVE_KEY);
        console.log('Save file deleted');
    }

    // Continue from save (restore player state, regenerate floor)
    static continue(game, saveData) {
        console.log(`Continuing from Floor ${saveData.floor}...`);

        // Calculate floor index (display floor 10 → 1 maps to index 0 → 9)
        const floorIndex = game.numFloors - saveData.floor;
        game.currentFloor = floorIndex;

        // Regenerate the floor (enemies/items will be different)
        game.tileMap = game.floors[floorIndex];

        // Restore player state
        game.player.health = saveData.playerHealth;
        game.player.maxHealth = saveData.playerMaxHealth;
        game.desperationMeter.desperation = saveData.playerDesperation;
        game.player.keysCollected = saveData.keysCollected;

        // Restore clench state
        game.player.clenchCooldownRemaining = saveData.clenchCooldownRemaining || 0;

        // Restore consumable effects
        game.player.speedBoostEndTime = saveData.speedBoostEndTime || 0;
        game.player.invincibilityEndTime = saveData.invincibilityEndTime || 0;
        game.player.crashEndTime = saveData.crashEndTime || 0;

        // Restore inventory
        game.player.inventory = saveData.inventory.map(item => {
            if (!item) return null;

            // Import weapons and consumables
            if (item.type === 'weapon') {
                const weapon = game.getWeaponById(item.id);
                if (weapon) {
                    weapon.ammo = item.ammo;
                }
                return weapon;
            } else if (item.type === 'consumable') {
                const consumable = game.getConsumableById(item.id);
                if (consumable) {
                    consumable.quantity = item.quantity;
                }
                return consumable;
            }
            return null;
        });

        // Restore current weapon
        if (saveData.currentWeapon) {
            const weapon = game.getWeaponById(saveData.currentWeapon.id);
            if (weapon) {
                weapon.ammo = saveData.currentWeapon.ammo;
                game.player.weapon = weapon;
            }
        }

        // Restore statistics
        game.enemiesDefeated = saveData.enemiesDefeated;
        game.itemsCollected = saveData.itemsCollected;
        game.specialRoomsFound = new Set(); // Can't restore Set, will recount
        game.vaultsUnlocked = saveData.vaultsUnlocked;
        game.keysUsed = saveData.keysUsed;
        game.startTime = saveData.startTime;

        // Spawn player near upstairs (safe position)
        const spawnPos = game.tileMap.findSafeSpawnNearUpstairs();
        game.player.x = spawnPos.x;
        game.player.y = spawnPos.y;

        // Update player's tile map reference
        game.player.tileMap = game.tileMap;

        // Respawn enemies and items for this floor
        game.spawnFloorEntities();

        console.log(`Continued at Floor ${saveData.floor}, position (${game.player.x}, ${game.player.y})`);
    }

    // Get save data preview (for Continue button display)
    static getSavePreview() {
        const saveData = this.loadSave();
        if (!saveData) return null;

        return {
            floor: saveData.floor,
            health: saveData.playerHealth,
            maxHealth: saveData.playerMaxHealth,
            desperation: Math.floor(saveData.playerDesperation),
            timestamp: saveData.timestamp
        };
    }

    // High score system (separate from save system)
    static saveHighScore(scoreData) {
        try {
            localStorage.setItem(this.HIGHSCORE_KEY, JSON.stringify(scoreData));
            console.log(`New high score: ${scoreData.score} (${scoreData.rank})`);
        } catch (error) {
            console.error('Failed to save high score:', error);
        }
    }

    static loadHighScore() {
        const data = localStorage.getItem(this.HIGHSCORE_KEY);
        return data ? JSON.parse(data) : null;
    }
}
