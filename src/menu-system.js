// Menu system with Continue button

import { SaveSystem } from './save-system.js';

export class MenuSystem {
    constructor(canvas, renderer) {
        this.canvas = canvas;
        this.renderer = renderer;
        this.menuActive = true;
        this.selectedOption = 'new_game'; // 'new_game' or 'continue'
        this.hasSave = SaveSystem.hasSave();
        this.savePreview = this.hasSave ? SaveSystem.getSavePreview() : null;
        this.highScore = SaveSystem.loadHighScore();

        // Set up key handlers
        this.setupInputHandlers();
    }

    setupInputHandlers() {
        this.keyHandler = (e) => {
            if (!this.menuActive) return;

            if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
                this.selectedOption = 'new_game';
            } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
                if (this.hasSave) {
                    this.selectedOption = 'continue';
                }
            } else if (e.key === 'Enter' || e.key === ' ') {
                this.selectOption();
            }
        };

        window.addEventListener('keydown', this.keyHandler);
    }

    cleanup() {
        window.removeEventListener('keydown', this.keyHandler);
    }

    selectOption() {
        // Menu will be closed by the callback
        this.menuActive = false;
        this.cleanup();
    }

    isActive() {
        return this.menuActive;
    }

    getSelectedOption() {
        return this.selectedOption;
    }

    render() {
        const ctx = this.renderer.ctx;

        // Clear screen
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, 800, 600);

        // Title
        ctx.font = 'bold 36px "Courier New", monospace';
        ctx.fillStyle = '#00ff00';
        ctx.textAlign = 'center';
        ctx.fillText('THE DESCENT: CODE BROWN', 400, 100);

        // Subtitle
        ctx.font = '16px "Courier New", monospace';
        ctx.fillStyle = '#888888';
        ctx.fillText('Can you make it to The Throne?', 400, 130);

        // Menu options start position
        let yPos = 220;

        // NEW GAME option
        const newGameSelected = this.selectedOption === 'new_game';
        ctx.font = 'bold 24px "Courier New", monospace';
        ctx.fillStyle = newGameSelected ? '#00ff00' : '#666666';
        ctx.fillText(newGameSelected ? '> NEW GAME <' : 'NEW GAME', 400, yPos);

        yPos += 60;

        // CONTINUE option (if save exists)
        if (this.hasSave && this.savePreview) {
            const continueSelected = this.selectedOption === 'continue';
            ctx.font = 'bold 24px "Courier New", monospace';
            ctx.fillStyle = continueSelected ? '#00ff00' : '#666666';
            ctx.fillText(continueSelected ? '> CONTINUE <' : 'CONTINUE', 400, yPos);

            // Save preview details
            ctx.font = '14px "Courier New", monospace';
            ctx.fillStyle = continueSelected ? '#00ff00' : '#555555';
            const previewText = `Floor ${this.savePreview.floor} | ${this.savePreview.desperation}% Desperation | ${this.savePreview.health}/${this.savePreview.maxHealth} HP`;
            ctx.fillText(previewText, 400, yPos + 25);

            yPos += 80;
        }

        // High score display
        if (this.highScore) {
            ctx.font = 'bold 18px "Courier New", monospace';
            ctx.fillStyle = '#ffaa00';
            ctx.fillText('HIGH SCORE', 400, yPos);

            ctx.font = '16px "Courier New", monospace';
            ctx.fillStyle = '#888888';
            ctx.fillText(`${this.highScore.score} - ${this.highScore.rank}`, 400, yPos + 25);
            ctx.fillText(`${this.highScore.enemiesDefeated} enemies | ${this.highScore.time}`, 400, yPos + 45);
        }

        // Instructions
        ctx.font = '14px "Courier New", monospace';
        ctx.fillStyle = '#666666';
        ctx.textAlign = 'center';
        ctx.fillText('Arrow Keys / W/S - Select', 400, 520);
        ctx.fillText('Enter / Space - Confirm', 400, 545);
    }
}
