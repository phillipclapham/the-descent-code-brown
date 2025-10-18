// Player entity - the @ character

import { GRID_WIDTH, GRID_HEIGHT } from './renderer.js';
import {
    TILE_DOOR_OPEN,
    TILE_DOOR_CLOSED,
    TILE_DOOR_LOCKED,
    TILE_KEY,
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

        // Inventory
        this.keysCollected = 0;

        // Message system (for door interaction feedback)
        this.message = '';
        this.messageTime = 0;
    }

    // Attempt to move in a direction
    move(dx, dy, currentTime) {
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

    // Update player state
    update(deltaTime) {
        // Future: animations, status effects, etc.
    }

    // Render the player
    render(renderer) {
        renderer.drawChar(this.char, this.x, this.y, this.color);
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
