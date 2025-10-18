// Player entity - the @ character

import { GRID_WIDTH, GRID_HEIGHT } from './renderer.js';

export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.char = '@';
        this.color = '#00ffff'; // Cyan

        // Movement timing
        this.moveDelay = 200; // milliseconds between moves
        this.lastMoveTime = 0;
    }

    // Attempt to move in a direction
    move(dx, dy, currentTime) {
        // Check if enough time has passed since last move
        if (currentTime - this.lastMoveTime < this.moveDelay) {
            return false;
        }

        const newX = this.x + dx;
        const newY = this.y + dy;

        // Check boundaries (collision with canvas edges)
        if (this.isValidPosition(newX, newY)) {
            this.x = newX;
            this.y = newY;
            this.lastMoveTime = currentTime;
            return true;
        }

        return false;
    }

    // Check if a position is valid (within bounds)
    isValidPosition(x, y) {
        return x >= 0 && x < GRID_WIDTH && y >= 0 && y < GRID_HEIGHT;
    }

    // Update player state
    update(deltaTime) {
        // Future: animations, status effects, etc.
    }

    // Render the player
    render(renderer) {
        renderer.drawChar(this.char, this.x, this.y, this.color);
    }
}
