// Player entity - the @ character

import { GRID_WIDTH, GRID_HEIGHT } from './renderer.js';
import {
    TILE_DOOR_OPEN,
    TILE_DOOR_CLOSED,
    TILE_DOOR_LOCKED,
    TILE_KEY,
    TILE_WEAPON,
    TILE_CONSUMABLE,
    TILE_FLOOR,
    TILE_WALL,
    TILE_WATER,
    TILE_TRAP
} from './tile-map.js';

export class Player {
    constructor(x, y, tileMap = null, desperationMeter = null) {
        this.x = x;
        this.y = y;
        this.char = '@';
        this.color = '#00ffff'; // Cyan

        // Tile map reference for collision detection
        this.tileMap = tileMap;

        // Desperation meter reference (Session 12d: needed for wall bashing & door forcing)
        this.desperationMeter = desperationMeter;

        // Movement timing
        this.baseMoveDelay = 200; // Base milliseconds between moves
        this.moveDelay = 200; // Current milliseconds between moves (modified by water, speed boosts, etc.)
        this.lastMoveTime = 0;

        // Inventory (Session 14: Dual inventory system)
        this.keysCollected = 0;
        this.weaponInventory = new Array(4).fill(null); // 4 weapon slots
        this.consumableInventory = new Array(4).fill(null); // 4 consumable slots
        this.selectedWeaponIndex = 0; // Currently selected weapon slot (0-3)
        this.selectedConsumableIndex = 0; // Currently selected consumable slot (0-3)

        // Combat properties
        this.health = 100;
        this.maxHealth = 100;
        this.attackCooldown = 0; // seconds
        this.equippedWeapon = null;

        // Consumable effect timers (Session 10)
        this.speedBoostEndTime = 0;      // Coffee: +30% speed for 30 seconds
        this.invincibilityEndTime = 0;   // Energy Drink: invincibility for 10 seconds
        this.crashEndTime = 0;           // Energy Drink: slow crash for 5 seconds after invincibility

        // Clench mechanic (Session 12a)
        this.clenchActive = false;
        this.clenchDuration = 10; // seconds
        this.clenchCooldown = 60; // seconds
        this.clenchCooldownRemaining = 0;
        this.clenchTimeRemaining = 0;

        // Message system (for door interaction feedback)
        this.message = '';
        this.messageTime = 0;
    }

    // Attempt to move in a direction
    // combat parameter is optional (for weapon pickup)
    move(dx, dy, currentTime, combat = null) {
        // Check if enough time has passed since last move
        if (currentTime - this.lastMoveTime < this.moveDelay) {
            return false;
        }

        const newX = this.x + dx;
        const newY = this.y + dy;

        // Check tile map for special interactions
        if (this.tileMap) {
            const tile = this.tileMap.getTile(newX, newY);

            // Handle door interactions
            if (tile === TILE_DOOR_CLOSED) {
                // Open the door
                this.tileMap.setTile(newX, newY, TILE_DOOR_OPEN);
                this.setMessage('Door opened');
                this.lastMoveTime = currentTime;
                return true; // Door opened, but don't move into it this turn
            }

            if (tile === TILE_DOOR_LOCKED) {
                // Session 12c: Force door at 90%+ desperation
                const desperation = this.desperationMeter ? this.desperationMeter.getValue() : 0;

                if (desperation >= 90) {
                    // FORCE the door open (no key needed!)
                    this.tileMap.setTile(newX, newY, TILE_DOOR_OPEN);
                    this.setMessage('You FORCE the door open!');
                    this.lastMoveTime = currentTime;
                    return true; // Door forced, don't move into it this turn
                } else if (this.keysCollected > 0) {
                    // Unlock the door with key
                    this.tileMap.setTile(newX, newY, TILE_DOOR_OPEN);
                    this.keysCollected--;
                    this.setMessage('Door unlocked! Keys: ' + this.keysCollected);
                    this.lastMoveTime = currentTime;

                    // Increment game stats (Session 12a)
                    if (combat && combat.game) {
                        combat.game.keysUsed++;
                    }

                    return true; // Door unlocked, but don't move into it this turn
                } else {
                    // Can't unlock without key
                    this.setMessage('Locked! Need a key');
                    return false;
                }
            }

            // Handle key pickup
            if (tile === TILE_KEY) {
                // Pick up the key
                this.keysCollected++;
                this.tileMap.setTile(newX, newY, TILE_FLOOR);
                this.setMessage('Key collected! Keys: ' + this.keysCollected);
                // Continue to move onto the tile
            }

            // Handle weapon pickup (Session 10: use inventory)
            if (tile === TILE_WEAPON && combat) {
                // Find weapon at this position in combat.weapons Map
                const weaponKey = `${newX},${newY}`;
                const weapon = combat.weapons.get(weaponKey);

                if (weapon) {
                    // Try to add to inventory (Session 14: routes to weapon inventory)
                    if (this.addToInventory(weapon)) {
                        // Success! Auto-equip happens in addWeapon() if needed
                        this.setMessage(`Picked up ${weapon.name}`);
                        console.log(`Weapon picked up: ${weapon.name} at (${newX}, ${newY})`);

                        // Remove weapon from map and combat system
                        this.tileMap.setTile(newX, newY, TILE_FLOOR);
                        combat.weapons.delete(weaponKey);

                        // Increment game stats (Session 12a)
                        combat.game.itemsCollected++;
                    } else {
                        // Weapon inventory full - don't move onto tile, show message
                        this.setMessage('Weapon inventory full! Press X to drop');
                        return false;
                    }
                } else {
                    console.warn(`TILE_WEAPON at (${newX}, ${newY}) but no weapon in combat.weapons Map!`);
                    // Clear the tile anyway to prevent stuck state
                    this.tileMap.setTile(newX, newY, TILE_FLOOR);
                }
                // Continue to move onto the tile
            }

            // Handle consumable pickup (Session 10)
            if (tile === TILE_CONSUMABLE && combat) {
                // Find consumable at this position in combat.consumables Map
                const consumableKey = `${newX},${newY}`;
                const consumable = combat.consumables.get(consumableKey);

                if (consumable) {
                    // Try to add to inventory (Session 14: routes to consumable inventory)
                    if (this.addToInventory(consumable)) {
                        this.setMessage(`Picked up ${consumable.name}`);
                        console.log(`Consumable picked up: ${consumable.name} at (${newX}, ${newY})`);

                        // Remove consumable from map and combat system
                        this.tileMap.setTile(newX, newY, TILE_FLOOR);
                        combat.consumables.delete(consumableKey);

                        // Increment game stats (Session 12a)
                        combat.game.itemsCollected++;
                    } else {
                        // Consumable inventory full - don't move onto tile, show message
                        this.setMessage('Consumable inventory full!');
                        return false;
                    }
                } else {
                    console.warn(`TILE_CONSUMABLE at (${newX}, ${newY}) but no consumable in combat.consumables Map!`);
                    // Clear the tile anyway to prevent stuck state
                    this.tileMap.setTile(newX, newY, TILE_FLOOR);
                }
                // Continue to move onto the tile
            }

            // Session 12c: Bash walls at 75%+ desperation
            if (tile === TILE_WALL && this.tileMap) {
                const desperation = this.desperationMeter ? this.desperationMeter.getValue() : 0;

                if (desperation >= 75) {
                    // Check if this wall is bashable
                    if (this.tileMap.isWallBashable(newX, newY)) {
                        // BASH through the wall!
                        this.tileMap.setTile(newX, newY, TILE_FLOOR);
                        this.setMessage('You bash through the wall!');
                        this.lastMoveTime = currentTime;
                        // Don't move into the tile this turn, but wall is now broken
                        return true;
                    } else {
                        // Wall is too strong to bash
                        this.setMessage('Wall is too strong to bash');
                        return false;
                    }
                } else {
                    // Not desperate enough
                    this.setMessage('Not desperate enough to bash walls...');
                    return false;
                }
            }
        }

        // Check boundaries (collision with canvas edges)
        if (this.isValidPosition(newX, newY)) {
            this.x = newX;
            this.y = newY;
            this.lastMoveTime = currentTime;

            // Session 12c: Environmental hazards (after successful movement)
            if (this.tileMap) {
                const movedTile = this.tileMap.getTile(newX, newY);

                // Water slows movement (50% slower next move)
                if (movedTile === TILE_WATER) {
                    this.moveDelay = this.baseMoveDelay * 1.5; // 50% slower
                    this.setMessage('You wade through water...');
                } else {
                    // Reset to base speed when not in water
                    this.moveDelay = this.baseMoveDelay;
                }

                // Traps deal damage
                if (movedTile === TILE_TRAP) {
                    const trapDamage = 5;
                    this.health -= trapDamage;
                    this.setMessage(`You trigger a trap! -${trapDamage} HP`);
                    console.log(`Player stepped on trap: -${trapDamage} HP (now ${this.health}/${this.maxHealth})`);
                }
            }

            return true;
        }

        return false;
    }

    // Check if a position is valid (within bounds and walkable)
    isValidPosition(x, y) {
        // Boundary check (primary safety)
        if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) {
            return false;
        }

        // Tile map collision check (if tile map exists)
        if (this.tileMap) {
            return this.tileMap.isWalkable(x, y);
        }

        // Default: position is valid if in bounds
        return true;
    }

    // Take damage
    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        this.setMessage(`-${amount} HP`);
        return this.health <= 0; // Return true if dead
    }

    // Check if player can attack
    canAttack() {
        return this.attackCooldown <= 0 && this.equippedWeapon !== null;
    }

    // Update player state
    update(deltaTime) {
        // Update Clench duration (Session 12a)
        if (this.clenchActive) {
            this.clenchTimeRemaining -= deltaTime / 1000; // Convert to seconds
            if (this.clenchTimeRemaining <= 0) {
                this.clenchActive = false;
                this.setMessage('Clench ended!');
            }
        }

        // Update cooldown (always ticking down if > 0) (Session 12a)
        if (this.clenchCooldownRemaining > 0) {
            this.clenchCooldownRemaining -= deltaTime / 1000; // Convert to seconds
        }

        // Tick attack cooldown (deltaTime in milliseconds)
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime / 1000; // Convert to seconds
        }
    }

    // Activate Clench mechanic (Session 12a)
    activateClench() {
        if (this.clenchCooldownRemaining > 0) {
            this.setMessage(`Clench on cooldown! (${Math.ceil(this.clenchCooldownRemaining)}s)`);
            return false;
        }

        this.clenchActive = true;
        this.clenchTimeRemaining = this.clenchDuration;
        this.clenchCooldownRemaining = this.clenchCooldown;
        this.setMessage('CLENCH ACTIVATED!');
        return true;
    }

    // ===== INVENTORY MANAGEMENT (Session 14: Dual Inventory System) =====

    // Add item to inventory (weapon or consumable) - routes to correct inventory
    // Returns true if successful, false if inventory full
    addToInventory(item) {
        // Check if item is a weapon (has damageMin property)
        const isWeapon = item.damageMin !== undefined;
        // Check if item is a consumable (has effectFn property)
        const isConsumable = item.effectFn !== undefined;

        if (isWeapon) {
            return this.addWeapon(item);
        } else if (isConsumable) {
            return this.addConsumable(item);
        }

        console.warn('Item is neither weapon nor consumable:', item);
        return false;
    }

    // Add weapon to weapon inventory
    addWeapon(weapon) {
        const emptySlot = this.weaponInventory.findIndex(slot => slot === null);
        if (emptySlot === -1) {
            console.log('Weapon inventory full! Cannot add weapon.');
            return false; // Weapon inventory full
        }

        this.weaponInventory[emptySlot] = weapon;
        console.log(`Added ${weapon.name} to weapon slot ${emptySlot + 1}`);

        // Auto-equip if no weapon currently equipped
        if (this.equippedWeapon === null) {
            this.selectedWeaponIndex = emptySlot;
            this.equippedWeapon = weapon;
            console.log(`Auto-equipped ${weapon.name}`);
        }

        return true;
    }

    // Add consumable to consumable inventory
    addConsumable(consumable) {
        const emptySlot = this.consumableInventory.findIndex(slot => slot === null);
        if (emptySlot === -1) {
            console.log('Consumable inventory full! Cannot add consumable.');
            return false; // Consumable inventory full
        }

        this.consumableInventory[emptySlot] = consumable;
        console.log(`Added ${consumable.name} to consumable slot ${emptySlot + 1}`);
        return true;
    }

    // Cycle weapon selection (Q = -1, E = +1)
    cycleWeapon(direction) {
        this.selectedWeaponIndex = (this.selectedWeaponIndex + direction + 4) % 4;
        this.equippedWeapon = this.weaponInventory[this.selectedWeaponIndex];

        const weaponName = this.equippedWeapon ? this.equippedWeapon.name : 'Empty';
        this.setMessage(`Selected: ${weaponName}`);
        console.log(`Cycled weapon to slot ${this.selectedWeaponIndex + 1}: ${weaponName}`);
    }

    // Drop currently selected weapon (X key)
    dropWeapon(tileMap, combat) {
        const weapon = this.weaponInventory[this.selectedWeaponIndex];
        if (!weapon) {
            this.setMessage('No weapon to drop');
            return false;
        }

        // Spawn weapon at player position
        const key = `${this.x},${this.y}`;
        combat.weapons.set(key, weapon);
        tileMap.setTile(this.x, this.y, TILE_WEAPON);

        // Remove from inventory
        this.weaponInventory[this.selectedWeaponIndex] = null;
        this.equippedWeapon = this.weaponInventory[this.selectedWeaponIndex]; // Now null if empty

        this.setMessage(`Dropped ${weapon.name}`);
        console.log(`Dropped ${weapon.name} at (${this.x}, ${this.y})`);
        return true;
    }

    // Equip weapon from specific slot (1-4 keys)
    equipWeaponSlot(slotIndex) {
        if (slotIndex < 0 || slotIndex >= 4) return;

        this.selectedWeaponIndex = slotIndex;
        this.equippedWeapon = this.weaponInventory[slotIndex];

        const weaponName = this.equippedWeapon ? this.equippedWeapon.name : 'Empty';
        this.setMessage(`Equipped: ${weaponName}`);
        console.log(`Equipped weapon slot ${slotIndex + 1}: ${weaponName}`);
    }

    // Use consumable from specific slot (5-8 keys)
    useConsumableSlot(slotIndex, desperationMeter, game) {
        if (slotIndex < 0 || slotIndex >= 4) return;

        const consumable = this.consumableInventory[slotIndex];
        if (!consumable) {
            return; // Empty slot
        }

        // Use consumable
        consumable.use(this, desperationMeter, game);
        this.setMessage(`Used ${consumable.name}`);
        this.consumableInventory[slotIndex] = null; // Remove after use
        console.log(`Used ${consumable.name} from consumable slot ${slotIndex + 1}`);
    }

    // Use currently selected consumable (ENTER key)
    useSelectedConsumable(desperationMeter, game) {
        const consumable = this.consumableInventory[this.selectedConsumableIndex];
        if (!consumable) {
            this.setMessage('No consumable selected');
            return;
        }

        // Use consumable
        consumable.use(this, desperationMeter, game);
        this.setMessage(`Used ${consumable.name}`);
        this.consumableInventory[this.selectedConsumableIndex] = null; // Remove after use
        console.log(`Used ${consumable.name} from selected slot ${this.selectedConsumableIndex + 1}`);
    }

    // ===== END INVENTORY MANAGEMENT =====

    // Render the player with visual effects (Session 11)
    render(renderer) {
        const currentTime = Date.now();
        let playerColor = this.color; // Default cyan

        // Coffee speed boost: Bright green tint
        if (this.speedBoostEndTime && currentTime < this.speedBoostEndTime) {
            playerColor = '#00ff00'; // Bright green (speed boost active)
        }

        // Energy Drink invincibility: Flash between bright white and cyan (awesome but visible)
        if (this.invincibilityEndTime && currentTime < this.invincibilityEndTime) {
            const flash = Math.floor(currentTime / 150) % 2; // Flash every 150ms
            playerColor = flash ? '#eeeeee' : '#88ffff'; // Bright white / Bright cyan (dramatic but not opaque)
        }

        // Crash effect: Gray/dim (overrides other effects)
        if (this.crashEndTime && currentTime < this.crashEndTime) {
            playerColor = '#666666'; // Gray (slowed/crashed)
        }

        renderer.drawChar(this.char, this.x, this.y, playerColor);
    }

    // Set a message to display to the player
    setMessage(msg) {
        this.message = msg;
        this.messageTime = Date.now();
    }

    // Get current message (clears after 2 seconds)
    getMessage() {
        if (Date.now() - this.messageTime > 2000) {
            this.message = '';
        }
        return this.message;
    }
}
