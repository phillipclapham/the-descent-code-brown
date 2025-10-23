/**
 * Boot Sequence Animation
 * Professional ChromaCorp system initialization screen
 */

export class BootSequence {
  constructor() {
    this.container = null;
    this.progressBar = null;
    this.progressValue = 0;
    this.progressTarget = 100;
    this.bootMessages = [
      { text: "CHROMACORP EMERGENCY PROTOCOLS", delay: 0 },
      { text: "SYSTEM INITIALIZING...", delay: 300 },
      { text: "DIRECTIVE 2847-B ACTIVE", delay: 600 },
      { text: "LOADING DUNGEON GENERATOR...", delay: 900 },
      { text: "CALIBRATING DESPERATION METER...", delay: 1200 },
      { text: "READY TO DESCEND", delay: 1500 },
    ];
    this.duration = 2500; // Total boot time
    this.skipped = false;
  }

  /**
   * Show boot sequence (skippable, auto-dismisses)
   */
  show() {
    return new Promise((resolve) => {
      // Create boot screen overlay
      this.container = document.createElement("div");
      this.container.id = "boot-sequence";
      this.container.innerHTML = `
                <div class="boot-overlay">
                    <div class="boot-content">
                        <div class="boot-logo">
                            <div class="boot-divider">═══════════════════════════════════════════════════</div>
                            <h1 class="boot-title">THE DESCENT</h1>
                            <h2 class="boot-subtitle">CODE BROWN</h2>
                            <div class="boot-divider">═══════════════════════════════════════════════════</div>
                            <div class="boot-system">CHROMACORP EMERGENCY SYSTEM v2.847</div>
                        </div>
                        <div class="boot-messages" id="boot-messages"></div>
                        <div class="boot-progress">
                            <div class="boot-progress-bar" id="boot-progress-bar"></div>
                        </div>
                        <div class="boot-hint">PRESS ANY KEY TO SKIP</div>
                    </div>
                </div>
            `;

      document.body.appendChild(this.container);

      this.progressBar = document.getElementById("boot-progress-bar");
      const messagesContainer = document.getElementById("boot-messages");

      // Add skip handler
      const skipHandler = (e) => {
        if (!this.skipped) {
          this.skipped = true;
          this.dismiss(resolve);
          document.removeEventListener("keydown", skipHandler);
          document.removeEventListener("click", skipHandler);
        }
      };

      document.addEventListener("keydown", skipHandler);
      document.addEventListener("click", skipHandler);

      // Animate boot messages
      this.bootMessages.forEach(({ text, delay }) => {
        setTimeout(() => {
          if (!this.skipped) {
            const msg = document.createElement("div");
            msg.className = "boot-message";
            msg.textContent = `> ${text}`;
            messagesContainer.appendChild(msg);

            // Scroll to bottom
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
          }
        }, delay);
      });

      // Animate progress bar
      this.animateProgress();

      // Auto-dismiss after duration
      setTimeout(() => {
        if (!this.skipped) {
          this.dismiss(resolve);
          document.removeEventListener("keydown", skipHandler);
          document.removeEventListener("click", skipHandler);
        }
      }, this.duration);
    });
  }

  /**
   * Animate progress bar from 0 to 100%
   */
  animateProgress() {
    const startTime = Date.now();
    const duration = this.duration - 200; // Slightly faster than messages

    const animate = () => {
      if (this.skipped) return;

      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / duration) * 100, 100);

      this.progressBar.style.width = `${progress}%`;

      if (progress < 100) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  /**
   * Dismiss boot sequence with fade-out
   */
  dismiss(resolve) {
    this.container.classList.add("boot-fade-out");
    setTimeout(() => {
      if (this.container && this.container.parentNode) {
        this.container.remove();
      }
      resolve();
    }, 300);
  }
}

/**
 * Initialize boot sequence on page load
 * Always shows (like turning on a game console every time)
 */
export function initBootSequence() {
  // Always show boot sequence (removed session check per user feedback)
  // Wait for DOM to be ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      const boot = new BootSequence();
      boot.show();
    });
  } else {
    const boot = new BootSequence();
    boot.show();
  }
}
