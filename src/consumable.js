// Consumable system - Items that can be used once for various effects
// From GAME_DESIGN.md consumable specifications

export class Consumable {
    constructor(name, effectFn, char, description) {
        this.name = name;
        this.effectFn = effectFn; // Function: (player, desperationMeter, game) => void
        this.char = char; // Character to display when consumable is on ground
        this.description = description;
        this.color = '#00ff00'; // Green for consumables (distinguishes from yellow weapons)
    }

    // Use the consumable - applies effect and is then consumed (removed from inventory)
    use(player, desperationMeter, game) {
        this.effectFn(player, desperationMeter, game);
    }
}

// ===== CONSUMABLE INSTANCES =====
// Session 10: 4 core consumables

// Antacid Tablet - ESSENTIAL desperation management item
// Effect: Reduce desperation by 25%
// Spawn: 20% in normal rooms, 50% in shrines (most common)
// Use Case: Emergency desperation relief, critical item for late game
export const ANTACID = new Consumable(
    'Antacid Tablet',
    (player, desperationMeter) => {
        desperationMeter.reduceBy(25); // Reduce by 25 percentage points
        console.log('Antacid used: -25% desperation');
    },
    'a',
    'Reduces desperation by 25%'
);

// Coffee - RISK/REWARD item
// Effect: +30% movement speed for 30 seconds
// Side Effect: +15% desperation immediately
// Spawn: 60% in break rooms, 20% in vending machines
// Use Case: Sprint to stairs when time is critical, accept desperation cost
export const COFFEE = new Consumable(
    'Coffee',
    (player, desperationMeter, game) => {
        // Set speed boost timer (30 seconds from now)
        player.speedBoostEndTime = game.currentTime + 30;

        // Increase desperation immediately (the cost of speed)
        desperationMeter.increaseBy(15); // +15 percentage points

        console.log('Coffee consumed: +30% speed for 30s, +15% desperation');
    },
    'C', // Capital C to distinguish from coffee pot weapon
    '+30% speed for 30s, +15% desperation'
);

// Donut - Classic healing item
// Effect: Restore 25 HP
// Spawn: 30% in break rooms, 40% in vending machines, 10% in normal rooms
// Use Case: Emergency healing during combat
export const DONUT = new Consumable(
    'Donut',
    (player) => {
        const healAmount = 25;
        const oldHealth = player.health;
        player.health = Math.min(player.health + healAmount, player.maxHealth);
        const actualHeal = player.health - oldHealth;
        console.log(`Donut consumed: +${actualHeal} HP (${oldHealth} → ${player.health})`);
    },
    'd',
    'Restores 25 HP'
);

// Energy Drink - High-risk, high-reward combat consumable
// Effect: Invincibility for 10 seconds
// Side Effects: +20% desperation immediately, 5-second slow crash after invincibility ends
// Spawn: 10% in vending machines, 10% in break rooms (rare)
// Use Case: Boss fights, desperate combat situations, emergency escapes
export const ENERGY_DRINK = new Consumable(
    'Energy Drink',
    (player, desperationMeter, game) => {
        // Invincibility for 10 seconds
        player.invincibilityEndTime = game.currentTime + 10;

        // Crash starts when invincibility ends, lasts 5 more seconds
        player.crashEndTime = game.currentTime + 15;

        // Increase desperation immediately (the cost of power)
        desperationMeter.increaseBy(20); // +20 percentage points

        console.log('Energy Drink consumed: Invincibility 10s, +20% desperation, 5s crash after');
    },
    'e',
    'Invincibility 10s, +20% desperation, crash after'
);

// ===== FUTURE CONSUMABLES (Session 11+) =====
// Fiber Bar - +15% desperation, +50% damage for 20 seconds
// Meditation Scroll (RARE) - Reduce desperation by 40%
// Emergency Kit - Restore 30 HP + reduce desperation 15%
