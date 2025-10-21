// Desperation Meter - The core pressure mechanic
// Visual indicator of player's urgency that increases over time

export class DesperationMeter {
    constructor() {
        this.value = 0; // 0-100
        this.maxValue = 100;
        this.increaseRate = 1; // Percent per second (tunable)

        // Create DOM element for the meter
        this.element = this.createMeterElement();

        console.log('Desperation meter initialized');
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
    update(deltaTime) {
        if (this.value >= this.maxValue) {
            // Future: trigger game over or max desperation effects
            return;
        }

        // Increase based on delta time (deltaTime is in milliseconds)
        const increase = (this.increaseRate / 1000) * deltaTime;
        this.value = Math.min(this.value + increase, this.maxValue);

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

        // Update color based on thresholds
        const color = this.getMeterColor(percentage);
        this.element.bar.style.backgroundColor = color;
    }

    // Determine meter color based on value
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
        this.render();
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
}
