// Story introduction modal system

export class IntroModal {
    constructor() {
        this.modalElement = null;
        this.hasBeenSeen = localStorage.getItem('intro_seen') === 'true';
    }

    // Check if modal should be shown
    shouldShow() {
        return !this.hasBeenSeen;
    }

    // Create and show the modal
    show(onDismiss) {
        if (!this.shouldShow()) {
            onDismiss();
            return;
        }

        // Create modal HTML
        this.modalElement = document.createElement('div');
        this.modalElement.id = 'intro-modal';
        this.modalElement.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <h2>THE DESCENT: CODE BROWN</h2>
                    <pre class="modal-story">╔══════════════════════════════════════════╗
║   CHROMACORP CORPORATE TOWER             ║
║   Management Directive 2847-B            ║
╚══════════════════════════════════════════╝

You're an office worker at ChromaCorp Tower.
After an ill-advised lunch at the sketchy
taco truck outside, nature calls with
increasing urgency.

Unfortunately, Management issued Directive
2847-B this morning: "All restroom facilities
on Floors 2-10 are hereby declared out-of-
order due to budget realignment synergy
optimization."

Translation: They broke all the toilets to
save money and refuse to fix them.

The ONLY working facility in the entire
building is THE THRONE — the legendary
basement restroom on Floor 1, a relic from
when the building was first constructed.

Between you and relief: ten floors of
increasingly decrepit infrastructure,
malfunctioning security systems, over-
caffeinated coworkers who've lost their
minds, territorial janitors, and an ancient
sewer system that should have been
condemned years ago.

Worse still, you're not alone. Other
desperate souls are racing for Floor 1.
There's only one throne.

Time is running out.
The pressure is building.
The desperation is real.

Can you make it to The Throne?

Survive the descent. Find The Throne.
Hold it like a legend.

(Check the controls sidebar on the left!)</pre>
                    <div class="modal-buttons">
                        <button id="start-game-btn" class="btn-primary">START GAME</button>
                        <button id="skip-intro-btn" class="btn-secondary">Skip ></button>
                    </div>
                </div>
            </div>
        `;

        // Add to document
        document.body.appendChild(this.modalElement);

        // Attach event listeners
        document.getElementById('start-game-btn').addEventListener('click', () => {
            this.dismiss(onDismiss);
        });

        document.getElementById('skip-intro-btn').addEventListener('click', () => {
            this.dismiss(onDismiss);
        });

        // Allow ESC key to dismiss
        this.escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.dismiss(onDismiss);
            }
        };
        document.addEventListener('keydown', this.escapeHandler);
    }

    // Dismiss modal and set localStorage flag
    dismiss(callback) {
        // Set flag so modal won't show again
        localStorage.setItem('intro_seen', 'true');
        this.hasBeenSeen = true;

        // Remove modal from DOM
        if (this.modalElement) {
            this.modalElement.remove();
            this.modalElement = null;
        }

        // Remove escape handler
        if (this.escapeHandler) {
            document.removeEventListener('keydown', this.escapeHandler);
            this.escapeHandler = null;
        }

        // Call callback to start game
        if (callback) {
            callback();
        }
    }

    // Force show modal (for "Story" button in menu)
    forceShow(onDismiss) {
        this.hasBeenSeen = false; // Temporarily reset
        this.show(onDismiss);
    }
}
