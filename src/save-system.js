// Game persistence system

export class SaveSystem {
    static SAVE_KEY = 'save_game';
    static HIGHSCORE_KEY = 'high_score';
    static VERSION = '2.0'; // Session 14: Dual inventory system

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

            // Session 14: Allow both v1.0 and v2.0 saves (will migrate v1 on load)
            if (saveData.version !== '1.0' && saveData.version !== '2.0') {
                console.warn('Save file version unknown, deleting save');
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
            playerDesperation: game.desperationMeter.value,
            playerPosition: {
                x: game.player.x,
                y: game.player.y
            },
            keysCollected: game.player.keysCollected,

            // Inventory (Session 14: Dual inventory system)
            weaponInventory: game.player.weaponInventory.map(weapon => {
                if (!weapon) return null;
                return {
                    type: 'weapon',
                    id: weapon.id,
                    ammo: weapon.ammo
                };
            }),
            consumableInventory: game.player.consumableInventory.map(consumable => {
                if (!consumable) return null;
                return {
                    type: 'consumable',
                    id: consumable.id,
                    quantity: consumable.quantity
                };
            }),
            selectedSlot: game.player.selectedSlot, // Session 14a: Unified selection (0-7)
            lastWeaponSlot: game.player.lastWeaponSlot,

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
        game.player.health = saveData.playerHealth || 100;
        game.player.maxHealth = saveData.playerMaxHealth || 100;
        game.desperationMeter.value = saveData.playerDesperation || 0;
        // Session 18.5: Force render to update visual after restoring value
        game.desperationMeter.render();
        console.log(`Restored desperation: ${Math.floor(game.desperationMeter.value)}%`);
        game.player.keysCollected = saveData.keysCollected || 0;

        // Restore clench state
        game.player.clenchCooldownRemaining = saveData.clenchCooldownRemaining || 0;

        // Restore consumable effects
        game.player.speedBoostEndTime = saveData.speedBoostEndTime || 0;
        game.player.invincibilityEndTime = saveData.invincibilityEndTime || 0;
        game.player.crashEndTime = saveData.crashEndTime || 0;

        // Session 14: Restore inventory (handle both v1.0 and v2.0)
        if (saveData.version === '2.0') {
            // V2.0: Dual inventory system
            game.player.weaponInventory = saveData.weaponInventory.map(weapon => {
                if (!weapon) return null;
                const weaponObj = game.getWeaponById(weapon.id);
                if (weaponObj) {
                    weaponObj.ammo = weapon.ammo;
                }
                return weaponObj;
            });

            game.player.consumableInventory = saveData.consumableInventory.map(consumable => {
                if (!consumable) return null;
                const consumableObj = game.getConsumableById(consumable.id);
                if (consumableObj) {
                    consumableObj.quantity = consumable.quantity;
                }
                return consumableObj;
            });

            // Session 14a: Restore unified selection
            game.player.selectedSlot = saveData.selectedSlot || 0;
            game.player.lastWeaponSlot = saveData.lastWeaponSlot || 0;

            // Restore equipped weapon reference
            const weaponSlot = game.player.selectedSlot < 4 ? game.player.selectedSlot : game.player.lastWeaponSlot;
            game.player.equippedWeapon = game.player.weaponInventory[weaponSlot];

        } else if (saveData.version === '1.0') {
            // V1.0: Migrate from single inventory to dual inventory
            console.log('Migrating v1.0 save to v2.0 dual inventory system...');

            const oldInventory = saveData.inventory || [];
            const weapons = [];
            const consumables = [];

            // Split old inventory by type
            for (const item of oldInventory) {
                if (!item) continue;

                if (item.type === 'weapon') {
                    const weapon = game.getWeaponById(item.id);
                    if (weapon) {
                        weapon.ammo = item.ammo;
                        weapons.push(weapon);
                    }
                } else if (item.type === 'consumable') {
                    const consumable = game.getConsumableById(item.id);
                    if (consumable) {
                        consumable.quantity = item.quantity;
                        consumables.push(consumable);
                    }
                }
            }

            // Place into new dual inventories (up to 4 each)
            game.player.weaponInventory = new Array(4).fill(null);
            game.player.consumableInventory = new Array(4).fill(null);

            for (let i = 0; i < Math.min(weapons.length, 4); i++) {
                game.player.weaponInventory[i] = weapons[i];
            }
            for (let i = 0; i < Math.min(consumables.length, 4); i++) {
                game.player.consumableInventory[i] = consumables[i];
            }

            // Restore currentWeapon as equipped weapon
            if (saveData.currentWeapon) {
                const weapon = game.getWeaponById(saveData.currentWeapon.id);
                if (weapon) {
                    weapon.ammo = saveData.currentWeapon.ammo;
                    // Find this weapon in inventory and select it (Session 14a: Use selectedSlot)
                    const weaponIndex = game.player.weaponInventory.findIndex(w => w && w.id === weapon.id);
                    if (weaponIndex !== -1) {
                        game.player.selectedSlot = weaponIndex;
                        game.player.lastWeaponSlot = weaponIndex;
                        game.player.equippedWeapon = game.player.weaponInventory[weaponIndex];
                    } else {
                        // Add to first empty slot if not found
                        const emptySlot = game.player.weaponInventory.findIndex(w => w === null);
                        if (emptySlot !== -1) {
                            game.player.weaponInventory[emptySlot] = weapon;
                            game.player.selectedSlot = emptySlot;
                            game.player.lastWeaponSlot = emptySlot;
                            game.player.equippedWeapon = weapon;
                        }
                    }
                }
            } else {
                // No weapon equipped - select first weapon slot
                game.player.selectedSlot = 0;
                game.player.lastWeaponSlot = 0;
                game.player.equippedWeapon = game.player.weaponInventory[0];
            }

            console.log(`Migration complete: ${weapons.length} weapons, ${consumables.length} consumables`);
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

        // Session 12d: Restore desperationMeter reference (needed for wall bashing & door forcing)
        game.player.desperationMeter = game.desperationMeter;

        // Session 17: Restore game reference (needed for sound system access)
        game.player.game = game;

        // Respawn enemies and items for this floor
        game.spawnFloorEntities();

        console.log(`Continued at Floor ${saveData.floor}, position (${game.player.x}, ${game.player.y})`);
    }

    // Get save data preview (for Continue button display)
    static getSavePreview() {
        const saveData = this.loadSave();
        if (!saveData) return null;

        return {
            floor: saveData.floor || 10,
            health: saveData.playerHealth || 100,
            maxHealth: saveData.playerMaxHealth || 100,
            desperation: Math.floor(saveData.playerDesperation || 0),
            timestamp: saveData.timestamp || Date.now()
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
