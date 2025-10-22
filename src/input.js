// Input handler - keyboard controls

export class InputHandler {
    constructor() {
        this.keys = {};
        this.setupListeners();
    }

    setupListeners() {
        window.addEventListener('keydown', (e) => {
            // Prevent default for arrow keys, WASD, and space to stop page scrolling
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'W', 'a', 'A', 's', 'S', 'd', 'D', ' '].includes(e.key)) {
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

    // Get movement direction based on arrow keys or WASD
    getMovementDirection() {
        let dx = 0;
        let dy = 0;

        if (this.isKeyPressed('ArrowUp') || this.isKeyPressed('w') || this.isKeyPressed('W')) {
            dy = -1;
        } else if (this.isKeyPressed('ArrowDown') || this.isKeyPressed('s') || this.isKeyPressed('S')) {
            dy = 1;
        }

        if (this.isKeyPressed('ArrowLeft') || this.isKeyPressed('a') || this.isKeyPressed('A')) {
            dx = -1;
        } else if (this.isKeyPressed('ArrowRight') || this.isKeyPressed('d') || this.isKeyPressed('D')) {
            dx = 1;
        }

        return { dx, dy };
    }

    // Check if any movement key is pressed (arrow keys or WASD)
    hasMovementInput() {
        return this.isKeyPressed('ArrowUp') ||
               this.isKeyPressed('ArrowDown') ||
               this.isKeyPressed('ArrowLeft') ||
               this.isKeyPressed('ArrowRight') ||
               this.isKeyPressed('w') || this.isKeyPressed('W') ||
               this.isKeyPressed('a') || this.isKeyPressed('A') ||
               this.isKeyPressed('s') || this.isKeyPressed('S') ||
               this.isKeyPressed('d') || this.isKeyPressed('D');
    }

    // Check if attack key (SPACE) is pressed
    isAttackPressed() {
        return this.isKeyPressed(' ');
    }

    // Check if restart key (R) is pressed (Session 9e)
    isRestartPressed() {
        return this.isKeyPressed('r') || this.isKeyPressed('R');
    }

    // Check if Clench key (C) is pressed (Session 12a)
    isClenchPressed() {
        return this.isKeyPressed('c') || this.isKeyPressed('C');
    }

    // Check if cycle weapon left key (Q) is pressed (Session 14)
    isQPressed() {
        return this.isKeyPressed('q') || this.isKeyPressed('Q');
    }

    // Check if cycle weapon right key (E) is pressed (Session 14)
    isEPressed() {
        return this.isKeyPressed('e') || this.isKeyPressed('E');
    }

    // Check if drop weapon key (X) is pressed (Session 14)
    isDropPressed() {
        return this.isKeyPressed('x') || this.isKeyPressed('X');
    }

    // Check if Enter key is pressed (Session 14)
    isEnterPressed() {
        return this.isKeyPressed('Enter');
    }

    // Check if Pause key (P) is pressed (Session 14)
    isPausePressed() {
        return this.isKeyPressed('p') || this.isKeyPressed('P');
    }

    // Check if Help key (H) is pressed (Session 16)
    isHelpPressed() {
        return this.isKeyPressed('h') || this.isKeyPressed('H');
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
