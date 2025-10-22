// Weapon system - Defines weapon properties and instances
// From GAME_DESIGN.md weapon specifications

export class Weapon {
    constructor(name, damageMin, damageMax, cooldownTime, char = '!', id = null) {
        this.name = name;
        this.id = id || name.toLowerCase().replace(/\s+/g, '-'); // Session 14a: ID for save/load
        this.damageMin = damageMin;
        this.damageMax = damageMax;
        this.cooldownTime = cooldownTime; // seconds between attacks
        this.char = char; // Character to display when weapon is on ground
        this.color = '#ffff00'; // Yellow (standard for items)
    }

    // Roll damage within weapon's range
    rollDamage() {
        return this.damageMin + Math.random() * (this.damageMax - this.damageMin);
    }
}

// Weapon Instances (from GAME_DESIGN.md)
// Session 10: Full weapon variety (10 weapons total)

// ===== MELEE WEAPONS =====

// Toilet Brush - Fast, low damage starter weapon
// Damage: 8-12, Cooldown: 0.6 seconds
export const TOILET_BRUSH = new Weapon('Toilet Brush', 8, 12, 0.6, 'b');

// Plunger - Medium damage, medium speed
// Damage: 15-20, Cooldown: 1.0 seconds
// Special (Session 12): Knockback 1 tile
export const PLUNGER = new Weapon('Plunger', 15, 20, 1.0, 'p');

// Wrench - High damage, slow attack
// Damage: 20-28, Cooldown: 1.43 seconds (0.7 attacks/sec)
// Special (Session 11): 20% chance to stun 1 second
export const WRENCH = new Weapon('Wrench', 20, 28, 1.43, 'w');

// Mop - Medium damage, medium speed, area attack
// Damage: 12-18, Cooldown: 1.11 seconds (0.9 attacks/sec)
// Special (Session 12): Area attack (hits 3 tiles in arc)
export const MOP = new Weapon('Mop', 12, 18, 1.11, 'm');

// Fire Extinguisher - Medium damage, dual mode
// Damage: 10-15, Cooldown: 1.0 seconds
// Special (Session 12): Spray mode (4 tiles range, 3 uses, slows enemies)
export const FIRE_EXTINGUISHER = new Weapon('Fire Extinguisher', 10, 15, 1.0, 'f');

// ===== RANGED WEAPONS =====

// TP Launcher - Fast ranged weapon
// Damage: 10-15, Cooldown: 0.67 seconds (1.5 attacks/sec), Range: 6 tiles
// Special (Session 11): Ammo 30 shots, 3-shot burst option
export const TP_LAUNCHER = new Weapon('TP Launcher', 10, 15, 0.67, 't');

// Stapler - Very fast ranged weapon, weak but reliable
// Damage: 6-10, Cooldown: 0.5 seconds (2.0 attacks/sec), Range: 5 tiles
// Special: Infinite ammo (office supplies everywhere)
export const STAPLER = new Weapon('Stapler', 6, 10, 0.5, 's');

// ===== THROWABLE WEAPONS (One-time use) =====

// Coffee Pot - High damage throwable with splash
// Damage: 20-25, Cooldown: 999 seconds (1 use only), Range: 5 tiles
// Special (Session 11): Area splash (3x3 tiles), burning effect
export const COFFEE_POT = new Weapon('Coffee Pot', 20, 25, 999, 'c');

// Keyboard - Medium damage throwable with stun
// Damage: 15-20, Cooldown: 999 seconds (1 use only), Range: 4 tiles
// Special (Session 11): Stun 2 seconds (keys fly everywhere)
export const KEYBOARD = new Weapon('Keyboard', 15, 20, 999, 'k');

// ===== LEGENDARY WEAPON =====

// Ceremonial Plunger - THE ultimate weapon (RARE)
// Damage: 30-40, Cooldown: 1.0 seconds
// Special (Session 12): Knockback 2 tiles + 10% instant kill chance
// Spawn: Floor 1 vault only (if unlocked)
export const CEREMONIAL_PLUNGER = new Weapon('Ceremonial Plunger', 30, 40, 1.0, 'P');
