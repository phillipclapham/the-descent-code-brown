// Renderer module - handles all ASCII rendering to canvas

export const TILE_SIZE = 20;
export const GRID_WIDTH = 40;
export const GRID_HEIGHT = 30;
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.fontSize = 16;
        this.font = `${this.fontSize}px "Courier New", monospace`;
    }

    // Convert grid coordinates to pixel coordinates
    gridToPixel(gridX, gridY) {
        return {
            x: gridX * TILE_SIZE,
            y: gridY * TILE_SIZE
        };
    }

    // Convert pixel coordinates to grid coordinates
    pixelToGrid(pixelX, pixelY) {
        return {
            x: Math.floor(pixelX / TILE_SIZE),
            y: Math.floor(pixelY / TILE_SIZE)
        };
    }

    // Clear the entire canvas
    clear() {
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    // Draw a character at grid position
    drawChar(char, gridX, gridY, color = '#ffffff') {
        const pos = this.gridToPixel(gridX, gridY);

        this.ctx.font = this.font;
        this.ctx.fillStyle = color;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';

        // Center character in tile
        const offsetX = (TILE_SIZE - this.fontSize) / 2;
        const offsetY = (TILE_SIZE - this.fontSize) / 2;

        this.ctx.fillText(char, pos.x + offsetX, pos.y + offsetY);
    }

    // Draw filled rectangle at grid position (for backgrounds, etc.)
    drawRect(gridX, gridY, width, height, color) {
        const pos = this.gridToPixel(gridX, gridY);
        this.ctx.fillStyle = color;
        this.ctx.fillRect(pos.x, pos.y, width * TILE_SIZE, height * TILE_SIZE);
    }

    // Draw text at pixel position (for UI elements)
    drawText(text, pixelX, pixelY, color = '#ffffff', size = 16) {
        this.ctx.font = `${size}px "Courier New", monospace`;
        this.ctx.fillStyle = color;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText(text, pixelX, pixelY);
    }
}
