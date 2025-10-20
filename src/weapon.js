// Weapon system - Defines weapon properties and instances
// From GAME_DESIGN.md weapon specifications

export class Weapon {
    constructor(name, damageMin, damageMax, cooldownTime, char = '!') {
        this.name = name;
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
// Phase 3 starter weapons - more weapons added in Session 10

// Toilet Brush - Fast, low damage starter weapon
// Damage: 8-12, Cooldown: 0.6 seconds
export const TOILET_BRUSH = new Weapon('Toilet Brush', 8, 12, 0.6, 'b');

// Plunger - Slower, higher damage weapon
// Damage: 15-20, Cooldown: 1.0 seconds
export const PLUNGER = new Weapon('Plunger', 15, 20, 1.0, 'p');
