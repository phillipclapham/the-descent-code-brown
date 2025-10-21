// Input handler - keyboard controls

export class InputHandler {
    constructor() {
        this.keys = {};
        this.setupListeners();
    }

    setupListeners() {
        window.addEventListener('keydown', (e) => {
            // Prevent default for arrow keys and space to stop page scrolling
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                e.preventDefault();
            }
            this.keys[e.key] = true;
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
    }

    // Check if a key is currently pressed
    isKeyPressed(key) {
        return !!this.keys[key];
    }

    // Get movement direction based on arrow keys
    getMovementDirection() {
        let dx = 0;
        let dy = 0;

        if (this.isKeyPressed('ArrowUp')) {
            dy = -1;
        } else if (this.isKeyPressed('ArrowDown')) {
            dy = 1;
        }

        if (this.isKeyPressed('ArrowLeft')) {
            dx = -1;
        } else if (this.isKeyPressed('ArrowRight')) {
            dx = 1;
        }

        return { dx, dy };
    }

    // Check if any movement key is pressed
    hasMovementInput() {
        return this.isKeyPressed('ArrowUp') ||
               this.isKeyPressed('ArrowDown') ||
               this.isKeyPressed('ArrowLeft') ||
               this.isKeyPressed('ArrowRight');
    }

    // Check if attack key (SPACE) is pressed
    isAttackPressed() {
        return this.isKeyPressed(' ');
    }

    // Check if restart key (R) is pressed (Session 9e)
    isRestartPressed() {
        return this.isKeyPressed('r') || this.isKeyPressed('R');
    }

    // Get number key pressed (1-8 for inventory slots) (Session 10)
    // Returns slot index (0-7) if a number key is pressed, null otherwise
    getNumberPressed() {
        for (let i = 1; i <= 8; i++) {
            if (this.isKeyPressed(String(i))) {
                return i - 1; // Return 0-7 (array indices)
            }
        }
        return null; // No number key pressed
    }
}
