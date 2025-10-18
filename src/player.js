// Player entity - the @ character

import { GRID_WIDTH, GRID_HEIGHT } from './renderer.js';

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

    // Update player state
    update(deltaTime) {
        // Future: animations, status effects, etc.
    }

    // Render the player
    render(renderer) {
        renderer.drawChar(this.char, this.x, this.y, this.color);
    }
}
