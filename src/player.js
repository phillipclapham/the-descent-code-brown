// Player entity - the @ character

import { GRID_WIDTH, GRID_HEIGHT } from './renderer.js';
import {
    TILE_DOOR_OPEN,
    TILE_DOOR_CLOSED,
    TILE_DOOR_LOCKED,
    TILE_KEY,
    TILE_WEAPON,
    TILE_CONSUMABLE,
    TILE_FLOOR
} from './tile-map.js';

export class Player {
    constructor(x, y, tileMap = null) {
        this.x = x;
        this.y = y;
        this.char = '@';
        this.color = '#00ffff'; // Cyan

        // Tile map reference for collision detection
        this.tileMap = tileMap;

        // Movement timing
        this.moveDelay = 200; // milliseconds between moves
        this.lastMoveTime = 0;

        // Inventory (Session 10)
        this.keysCollected = 0;
        this.inventory = new Array(8).fill(null); // 8 slots for weapons and consumables
        this.inventorySize = 8;
        this.selectedSlot = 0; // Currently selected inventory slot (0-7)

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
                if (this.keysCollected > 0) {
                    // Unlock the door
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
                    // Try to add to inventory
                    if (this.addToInventory(weapon)) {
                        // Success! Auto-equip if no weapon equipped
                        if (this.equippedWeapon === null) {
                            this.equippedWeapon = weapon;
                            this.setMessage(`Picked up and equipped ${weapon.name}!`);
                        } else {
                            this.setMessage(`Picked up ${weapon.name} (in inventory)`);
                        }
                        console.log(`Weapon picked up: ${weapon.name} at (${newX}, ${newY})`);

                        // Remove weapon from map and combat system
                        this.tileMap.setTile(newX, newY, TILE_FLOOR);
                        combat.weapons.delete(weaponKey);

                        // Increment game stats (Session 12a)
                        combat.game.itemsCollected++;
                    } else {
                        // Inventory full - don't move onto tile, show message
                        this.setMessage('Inventory full!');
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
                    // Try to add to inventory
                    if (this.addToInventory(consumable)) {
                        this.setMessage(`Picked up ${consumable.name}!`);
                        console.log(`Consumable picked up: ${consumable.name} at (${newX}, ${newY})`);

                        // Remove consumable from map and combat system
                        this.tileMap.setTile(newX, newY, TILE_FLOOR);
                        combat.consumables.delete(consumableKey);

                        // Increment game stats (Session 12a)
                        combat.game.itemsCollected++;
                    } else {
                        // Inventory full - don't move onto tile, show message
                        this.setMessage('Inventory full!');
                        return false;
                    }
                } else {
                    console.warn(`TILE_CONSUMABLE at (${newX}, ${newY}) but no consumable in combat.consumables Map!`);
                    // Clear the tile anyway to prevent stuck state
                    this.tileMap.setTile(newX, newY, TILE_FLOOR);
                }
                // Continue to move onto the tile
            }
        }

        // Check boundaries (collision with canvas edges)
        if (this.isValidPosition(newX, newY)) {
            this.x = newX;
            this.y = newY;
            this.lastMoveTime = currentTime;
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

    // ===== INVENTORY MANAGEMENT (Session 10) =====

    // Add item to inventory (weapon or consumable)
    // Returns true if successful, false if inventory full
    addToInventory(item) {
        // Find first empty slot
        const emptySlot = this.inventory.findIndex(slot => slot === null);
        if (emptySlot !== -1) {
            this.inventory[emptySlot] = item;
            console.log(`Added ${item.name} to inventory slot ${emptySlot + 1}`);
            return true;
        }
        console.log('Inventory full! Cannot add item.');
        return false; // Inventory full
    }

    // Select inventory slot (0-7)
    selectSlot(slotIndex) {
        if (slotIndex >= 0 && slotIndex < this.inventorySize) {
            this.selectedSlot = slotIndex;
            console.log(`Selected inventory slot ${slotIndex + 1}`);
        }
    }

    // Use item in selected slot
    // For weapons: equip them
    // For consumables: use them (and remove from inventory)
    useSlot(slotIndex, desperationMeter, game) {
        const item = this.inventory[slotIndex];
        if (!item) {
            return; // Empty slot, nothing to do
        }

        // Check if item is a weapon (has damageMin property)
        const isWeapon = item.damageMin !== undefined;
        // Check if item is a consumable (has effectFn property)
        const isConsumable = item.effectFn !== undefined;

        if (isWeapon) {
            // Equip weapon
            this.equippedWeapon = item;
            this.setMessage(`Equipped ${item.name}`);
            console.log(`Equipped ${item.name} from slot ${slotIndex + 1}`);
        } else if (isConsumable) {
            // Use consumable
            item.use(this, desperationMeter, game);
            this.setMessage(`Used ${item.name}`);
            this.inventory[slotIndex] = null; // Remove consumable after use
            console.log(`Used ${item.name} from slot ${slotIndex + 1} (removed from inventory)`);
        }
    }

    // Remove item from inventory slot
    removeFromInventory(slotIndex) {
        if (slotIndex >= 0 && slotIndex < this.inventorySize) {
            const item = this.inventory[slotIndex];
            this.inventory[slotIndex] = null;
            return item;
        }
        return null;
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
