// Desperation Meter - The core pressure mechanic
// Visual indicator of player's urgency that increases over time

export class DesperationMeter {
    constructor() {
        this.value = 0; // 0-100
        this.maxValue = 100;
        this.increaseRate = 0.35; // Percent per second (tuned in Session 12c for strategic play)

        // Session 12c: Track threshold crossings for power unlock messages
        this.bashWallsUnlocked = false;
        this.forceDoorsUnlocked = false;

        // Session 12d: Track break room state for entry/exit messages
        this.inBreakRoom = false;

        // Create DOM element for the meter
        this.element = this.createMeterElement();

        // Session 18.5e: DON'T force 0% in constructor (breaks CONTINUE)
        // Let reset() handle NEW GAME, and restore() handle CONTINUE

        // Session 15: Force initial render to ensure visual state matches value (fixes rare bug)
        this.render();

        console.log('Desperation meter initialized (value: ' + Math.floor(this.value) + '%)');
    }

    // Create the meter UI element
    createMeterElement() {
        const container = document.getElementById('desperation-meter');

        if (!container) {
            console.error('Desperation meter container not found in HTML');
            return null;
        }

        // Clear any existing content
        container.innerHTML = '';

        // Create meter bar structure
        const label = document.createElement('div');
        label.className = 'meter-label';
        label.textContent = 'DESPERATION';

        const barContainer = document.createElement('div');
        barContainer.className = 'meter-bar-container';

        const bar = document.createElement('div');
        bar.className = 'meter-bar';
        bar.id = 'desperation-bar';

        const percentage = document.createElement('div');
        percentage.className = 'meter-percentage';
        percentage.id = 'desperation-percentage';
        percentage.textContent = '0%';

        barContainer.appendChild(bar);
        container.appendChild(label);
        container.appendChild(barContainer);
        container.appendChild(percentage);

        return { container, bar, percentage };
    }

    // Update meter value based on time
    update(deltaTime, player) {  // Add player parameter (Session 12a)
        // Check if clenched (Session 12a)
        if (player && player.clenchActive) {
            return; // Don't increment desperation while clenched
        }

        // Session 12d: Check if player in break room (desperation pauses)
        if (player && player.tileMap && player.tileMap.isPositionInBreakRoom) {
            const nowInBreakRoom = player.tileMap.isPositionInBreakRoom(player.x, player.y);

            // Entry/exit messages
            if (nowInBreakRoom && !this.inBreakRoom) {
                player.setMessage('BREAK ROOM - Desperation paused');
                console.log('🛋️  Entered break room (desperation paused)');
            } else if (!nowInBreakRoom && this.inBreakRoom) {
                console.log('🚪 Left break room (desperation resuming)');
            }

            this.inBreakRoom = nowInBreakRoom;

            // Pause desperation while in break room
            if (nowInBreakRoom) {
                return; // Don't increment in break room (safe zone!)
            }
        }

        if (this.value >= this.maxValue) {
            // Future: trigger game over or max desperation effects
            return;
        }

        const oldValue = this.value;

        // Increase based on delta time (deltaTime is in milliseconds)
        const increase = (this.increaseRate / 1000) * deltaTime;
        this.value = Math.min(this.value + increase, this.maxValue);

        // Session 12c: Check for threshold crossings and show power unlock messages
        if (player) {
            // Bash walls unlock at 75%
            if (oldValue < 75 && this.value >= 75 && !this.bashWallsUnlocked) {
                this.bashWallsUnlocked = true;
                player.setMessage('DESPERATE! You can now BASH through weak walls!');
                if (player.game) player.game.soundSystem.playThresholdAlert(); // Session 17
                console.log('🧱 Bash walls ability unlocked at 75% desperation');
            }

            // Force doors unlock at 90%
            if (oldValue < 90 && this.value >= 90 && !this.forceDoorsUnlocked) {
                this.forceDoorsUnlocked = true;
                player.setMessage('EXTREME! You can now FORCE locked doors open!');
                if (player.game) player.game.soundSystem.playThresholdAlert(); // Session 17
                console.log('🚪 Force doors ability unlocked at 90% desperation');
            }
        }

        // Update visual
        this.render();
    }

    // Render the meter state
    render() {
        if (!this.element || !this.element.bar || !this.element.percentage) {
            return;
        }

        const percentage = Math.floor(this.value);

        // Update bar width
        this.element.bar.style.width = `${percentage}%`;

        // Update percentage text
        this.element.percentage.textContent = `${percentage}%`;

        // Update color based on thresholds (Session 12a)
        const threshold = this.getCurrentThreshold();

        // Apply flashing effect if threshold has flash property
        const color = threshold.flash
            ? (Date.now() % 400 < 200 ? threshold.color : '#880000') // Flash effect
            : threshold.color;

        this.element.bar.style.backgroundColor = color;
    }

    // Determine meter color based on value (DEPRECATED - use getCurrentThreshold())
    getMeterColor(percentage) {
        if (percentage < 33) {
            return '#00ff00'; // Green - safe
        } else if (percentage < 66) {
            return '#ffff00'; // Yellow - getting urgent
        } else {
            return '#ff0000'; // Red - critical!
        }
    }

    // Reset meter (for new game, level transitions, etc.)
    reset() {
        this.value = 0;
        // Session 12c: Reset threshold unlock flags
        this.bashWallsUnlocked = false;
        this.forceDoorsUnlocked = false;
        // Session 12d: Reset break room state
        this.inBreakRoom = false;

        // Session 18.5d: AGGRESSIVE reset - disable transition, force to 0%, re-enable after delay
        if (this.element && this.element.bar) {
            this.element.bar.style.transition = 'none';
            this.element.bar.style.width = '0%';
            if (this.element.percentage) {
                this.element.percentage.textContent = '0%';
            }
            // Re-enable transition after ensuring 0% is applied
            setTimeout(() => {
                if (this.element && this.element.bar) {
                    this.element.bar.style.transition = '';
                }
            }, 100);
        }

        this.render();
        console.log('✅ NEW GAME: Desperation meter RESET to 0%');
    }

    // Get current value (for gameplay effects in future sessions)
    getValue() {
        return this.value;
    }

    // Set rate (for difficulty tuning)
    setRate(rate) {
        this.increaseRate = rate;
    }

    // Reduce desperation by percentage points (Session 10: consumables)
    // amount is in percentage points (e.g., 25 = reduce by 25%)
    reduceBy(amount) {
        this.value = Math.max(this.value - amount, 0);

        // Session 12c: Reset threshold unlock flags if we drop back below them
        if (this.value < 75) {
            this.bashWallsUnlocked = false;
        }
        if (this.value < 90) {
            this.forceDoorsUnlocked = false;
        }

        this.render();
        console.log(`Desperation reduced by ${amount}% (now ${Math.floor(this.value)}%)`);
    }

    // Increase desperation by percentage points (Session 10: consumables)
    // amount is in percentage points (e.g., 15 = increase by 15%)
    increaseBy(amount) {
        this.value = Math.min(this.value + amount, this.maxValue);
        this.render();
        console.log(`Desperation increased by ${amount}% (now ${Math.floor(this.value)}%)`);
    }

    // Get current desperation threshold for visual effects (Session 12a)
    getCurrentThreshold() {
        const desp = this.value;

        if (desp < 25) {
            return { level: 1, name: 'Comfortable', color: '#00ff00', shake: 0, tintColor: null, tintAlpha: 0 };
        } else if (desp < 50) {
            return { level: 2, name: 'Urgent', color: '#ffff00', shake: 0, tintColor: 'rgba(50,50,0', tintAlpha: 0.05 };
        } else if (desp < 75) {
            return { level: 3, name: 'Critical', color: '#ff8800', shake: 2, tintColor: 'rgba(255,136,0', tintAlpha: 0.10 };
        } else if (desp < 90) {
            return { level: 4, name: 'Desperate', color: '#ff0000', shake: 3, tintColor: 'rgba(255,0,0', tintAlpha: 0.15 };
        } else if (desp < 100) {
            return { level: 5, name: 'EXTREME', color: '#ff0000', shake: 4, tintColor: 'rgba(255,0,0', tintAlpha: 0.20, flash: true };
        } else {
            return { level: 6, name: 'GAME OVER', color: '#ff0000', shake: 0, tintColor: null, tintAlpha: 0 };
        }
    }
}
