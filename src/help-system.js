// Help system - in-game tutorial overlay (Session 16)

export class HelpSystem {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.active = false;
    this.currentTab = 0; // 0=Controls, 1=Mechanics, 2=Strategy, 3=Credits
    this.tabs = ["CONTROLS", "MECHANICS", "STRATEGY", "CREDITS"];
    this.scrollOffset = 0; // Scroll position for current tab

    // Content for each tab (arrays of lines to render)
    this.content = {
      controls: this.getControlsContent(),
      mechanics: this.getMechanicsContent(),
      strategy: this.getStrategyContent(),
      credits: this.getCreditsContent(),
    };
  }

  isActive() {
    return this.active;
  }

  toggle() {
    this.active = !this.active;
    if (this.active) {
      this.scrollOffset = 0; // Reset scroll when opening
    }
    return this.active; // Return state so game can pause
  }

  close() {
    this.active = false;
  }

  handleInput(key) {
    if (!this.active) return;

    // Tab navigation with left/right arrow keys
    if (key === "ArrowLeft" && this.currentTab > 0) {
      this.currentTab--;
      this.scrollOffset = 0; // Reset scroll on tab change
    } else if (key === "ArrowRight" && this.currentTab < this.tabs.length - 1) {
      this.currentTab++;
      this.scrollOffset = 0; // Reset scroll on tab change
    }

    // Scroll with W/S or up/down arrow keys
    if (key === "ArrowUp" || key === "w" || key === "W") {
      this.scrollOffset = Math.max(0, this.scrollOffset - 1);
    } else if (key === "ArrowDown" || key === "s" || key === "S") {
      const maxScroll = this.getMaxScroll();
      this.scrollOffset = Math.min(maxScroll, this.scrollOffset + 1);
    }

    // Tab navigation with number keys (1-4)
    if (key >= "1" && key <= "4") {
      this.currentTab = parseInt(key) - 1;
      this.scrollOffset = 0; // Reset scroll on tab change
    }

    // Close with ESC
    if (key === "Escape") {
      this.close();
    }
  }

  getMaxScroll() {
    // Calculate maximum scroll offset based on content length
    let lines = [];
    switch (this.currentTab) {
      case 0:
        lines = this.content.controls;
        break;
      case 1:
        lines = this.content.mechanics;
        break;
      case 2:
        lines = this.content.strategy;
        break;
      case 3:
        lines = this.content.credits;
        break;
    }
    const visibleLines = 20; // Number of lines that fit in visible area
    return Math.max(0, lines.length - visibleLines);
  }

  render() {
    if (!this.active) return;

    // Semi-transparent black background
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Content box dimensions
    const boxX = 50;
    const boxY = 40;
    const boxWidth = this.canvas.width - 100;
    const boxHeight = this.canvas.height - 80;

    // Draw content box border
    this.ctx.strokeStyle = "#00ff00";
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

    // Draw header
    this.ctx.fillStyle = "#00ff00";
    this.ctx.font = 'bold 24px "Courier New", monospace';
    this.ctx.textAlign = "center";
    this.ctx.fillText(
      "THE DESCENT: CODE BROWN - HELP",
      this.canvas.width / 2,
      boxY + 30
    );

    // Draw tabs (increased spacing from title: 50 → 60)
    this.renderTabs(boxX, boxY + 60, boxWidth);

    // Draw content for current tab (adjusted Y for taller tabs + more padding)
    this.renderTabContent(
      boxX + 20,
      boxY + 130,
      boxWidth - 40,
      boxHeight - 195
    );

    // Draw footer with scroll instructions
    this.ctx.fillStyle = "#00cc00";
    this.ctx.font = '14px "Courier New", monospace';
    this.ctx.textAlign = "center";
    this.ctx.fillText(
      "H/ESC: Close  |  ←/→ or 1-4: Switch tabs  |  W/S or ↑/↓: Scroll",
      this.canvas.width / 2,
      boxY + boxHeight - 15
    );
  }

  renderTabs(x, y, width) {
    const tabWidth = width / this.tabs.length;
    const tabHeight = 40; // Increased from 35 for more space

    this.tabs.forEach((tab, index) => {
      const tabX = x + index * tabWidth;
      const isActive = index === this.currentTab;

      // Tab background
      this.ctx.fillStyle = isActive
        ? "rgba(0, 255, 255, 0.2)"
        : "rgba(0, 0, 0, 0.3)";
      this.ctx.fillRect(tabX, y, tabWidth, tabHeight);

      // Tab border
      this.ctx.strokeStyle = isActive ? "#00ffff" : "#00cc00";
      this.ctx.lineWidth = isActive ? 2 : 1;
      this.ctx.strokeRect(tabX, y, tabWidth, tabHeight);

      // Tab text - better vertical centering
      this.ctx.fillStyle = isActive ? "#00ffff" : "#00ff00";
      this.ctx.font = isActive
        ? 'bold 16px "Courier New", monospace'
        : '14px "Courier New", monospace';
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle"; // Use middle baseline for perfect centering
      this.ctx.fillText(tab, tabX + tabWidth / 2, y + tabHeight / 2);
    });

    // Reset baseline for other text
    this.ctx.textBaseline = "alphabetic";
  }

  renderTabContent(x, y, width, availableHeight) {
    // Get content for current tab
    let lines = [];
    switch (this.currentTab) {
      case 0:
        lines = this.content.controls;
        break;
      case 1:
        lines = this.content.mechanics;
        break;
      case 2:
        lines = this.content.strategy;
        break;
      case 3:
        lines = this.content.credits;
        break;
    }

    // Calculate visible lines and scrolling
    const lineHeight = 26; // Increased from 20 for more breathing room
    const visibleLines = Math.floor(availableHeight / lineHeight);
    const totalLines = lines.length;
    const maxScroll = Math.max(0, totalLines - visibleLines);

    // Clamp scroll offset
    this.scrollOffset = Math.max(0, Math.min(this.scrollOffset, maxScroll));

    // Show scroll indicator at top if scrolled down
    if (this.scrollOffset > 0) {
      this.ctx.fillStyle = "#00ffff";
      this.ctx.font = 'bold 16px "Courier New", monospace';
      this.ctx.textAlign = "center";
      this.ctx.fillText("↑ More above ↑", x + width / 2, y - 5);
    }

    // Render visible lines only
    this.ctx.textAlign = "left";
    let currentY = y;

    const startLine = this.scrollOffset;
    const endLine = Math.min(startLine + visibleLines, totalLines);

    for (let i = startLine; i < endLine; i++) {
      const line = lines[i];

      // Parse line for styling (support for headers, normal text, indent)
      if (line.header) {
        this.ctx.fillStyle = "#00ffff";
        this.ctx.font = 'bold 18px "Courier New", monospace';
        if (i > startLine) currentY += 8; // Extra spacing before headers (less than before since line height increased)
      } else if (line.indent) {
        this.ctx.fillStyle = "#00cc00";
        this.ctx.font = '14px "Courier New", monospace';
      } else {
        this.ctx.fillStyle = "#00ff00";
        this.ctx.font = '15px "Courier New", monospace';
      }

      const textX = line.indent ? x + 30 : x;
      this.ctx.fillText(line.text, textX, currentY);
      currentY += lineHeight;
    }

    // Show scroll indicator at bottom if more content below
    if (this.scrollOffset < maxScroll) {
      this.ctx.fillStyle = "#00ffff";
      this.ctx.font = 'bold 16px "Courier New", monospace';
      this.ctx.textAlign = "center";
      this.ctx.fillText(
        "↓ More below ↓",
        x + width / 2,
        y + availableHeight + 20
      );
    }
  }

  getControlsContent() {
    return [
      { text: "MOVEMENT", header: true },
      { text: "WASD or Arrow Keys - Move in 8 directions", indent: false },
      {
        text: "Diagonal movement supported (W+A, W+D, S+A, S+D)",
        indent: true,
      },
      { text: "", indent: false },
      { text: "COMBAT", header: true },
      { text: "SPACE - Attack (auto-targets nearest enemy)", indent: false },
      { text: "Higher desperation = more damage, less accuracy", indent: true },
      { text: "Each weapon has different cooldown and range", indent: true },
      { text: "", indent: false },
      { text: "INVENTORY MANAGEMENT", header: true },
      { text: "Q / E - Cycle through all 8 inventory slots", indent: false },
      { text: "Slots 1-4: Weapons (auto-equip when selected)", indent: true },
      {
        text: "Slots 5-8: Consumables (select, then ENTER to use)",
        indent: true,
      },
      { text: "", indent: false },
      { text: "DIRECT SLOT ACCESS", header: true },
      { text: "1, 2, 3, 4 - Select weapon slot (auto-equips)", indent: false },
      { text: "5, 6, 7, 8 - Select consumable slot", indent: false },
      { text: "ENTER - Use currently selected consumable", indent: false },
      { text: "", indent: false },
      { text: "ITEM DROPPING", header: true },
      { text: "X - Drop current item (weapon or consumable)", indent: false },
      { text: "Dropped items appear on ground as pickups", indent: true },
      { text: "Strategic: drop weak weapons for better ones!", indent: true },
      { text: "", indent: false },
      { text: "SPECIAL ABILITIES", header: true },
      {
        text: "C - Clench (freeze desperation 10s, 60s cooldown)",
        indent: false,
      },
      {
        text: "Use before fights, vault looting, or emergencies",
        indent: true,
      },
      { text: "", indent: false },
      { text: "ENVIRONMENTAL INTERACTIONS", header: true },
      { text: "R - Restore at shrine (cyan Ω altar)", indent: false },
      { text: "One-time use: +30 HP, -30% desperation", indent: true },
      { text: "R - Read environmental feature (blue * symbol)", indent: false },
      { text: "Discover lore and world-building (can re-read)", indent: true },
      { text: "", indent: false },
      { text: "GAME CONTROLS", header: true },
      { text: "P - Pause game", indent: false },
      { text: "H - Toggle this help screen", indent: false },
      { text: "M - Mute/unmute sound", indent: false },
      { text: "R - Restart (only after game over or victory)", indent: false },
      { text: "", indent: false },
      { text: "INTERACTION", header: true },
      { text: "Walk over items to pick them up automatically", indent: false },
      {
        text: "Walk into doors to open (keys consumed automatically)",
        indent: false,
      },
      { text: "At 90% desperation: force locked doors open!", indent: true },
    ];
  }

  getMechanicsContent() {
    return [
      { text: "DESPERATION SYSTEM", header: true },
      {
        text: "Climbs at 0.35% per second (full run: 4-6 minutes)",
        indent: true,
      },
      { text: "At 100%: Game over!", indent: true },
      { text: "", indent: false },
      { text: "CLENCH MECHANIC ⭐ SIGNATURE FEATURE", header: true },
      { text: "Press C to freeze desperation for 10 seconds", indent: true },
      { text: "60-second cooldown between uses", indent: true },
      {
        text: 'Creates "clutch" moments - use before fights or vaults!',
        indent: true,
      },
      { text: "", indent: false },
      { text: "DESPERATION THRESHOLDS", header: true },
      { text: "0-24% (Green): No effects", indent: true },
      { text: "25-49% (Yellow): Minor penalties", indent: true },
      {
        text: "50-74% (Orange): -25% speed, +40% damage, -15% accuracy",
        indent: true,
      },
      {
        text: "75-89% (Red): -40% speed, +60% damage, -25% accuracy",
        indent: true,
      },
      { text: "         BASH WEAK WALLS (orange walls)", indent: true },
      {
        text: "90-99% (Flash): -50% speed, +75% damage, -30% accuracy",
        indent: true,
      },
      { text: "         FORCE LOCKED DOORS (bypass keys)", indent: true },
      { text: "", indent: false },
      { text: "BREAK ROOMS 🛋️", header: true },
      { text: "Special rooms where desperation PAUSES", indent: true },
      { text: "Found on floors 8-3 (~25% chance)", indent: true },
      {
        text: "Extra consumables spawn inside - strategic rest spots!",
        indent: true,
      },
      { text: "", indent: false },
      { text: "SHRINES 🕊️", header: true },
      {
        text: "Cyan Ω altars found in shrine rooms (40% spawn rate)",
        indent: true,
      },
      { text: "Press R while standing on shrine to pray", indent: true },
      { text: "Effect: +30 HP and -30% desperation", indent: true },
      { text: "One-time use only (turns gray after use)", indent: true },
      { text: "2-3 consumables spawn around each shrine", indent: true },
      { text: "", indent: false },
      { text: "ENVIRONMENTAL FEATURES ✨", header: true },
      { text: "Blue * symbols scattered throughout rooms", indent: true },
      { text: "Press R while standing on feature to read lore", indent: true },
      {
        text: "Discover ChromaCorp's dark history and employee humor",
        indent: true,
      },
      {
        text: "Messages change based on floor theme (office/maintenance/sewer)",
        indent: true,
      },
      {
        text: "Can re-read multiple times for different messages",
        indent: true,
      },
    ];
  }

  getStrategyContent() {
    return [
      { text: "DESPERATION MANAGEMENT", header: true },
      { text: "Use Clench before boss fights or vault looting", indent: true },
      {
        text: "Find Break Rooms for strategic rests (desperation pauses)",
        indent: true,
      },
      {
        text: "Save shrines for emergencies (+30 HP, -30% desperation)",
        indent: true,
      },
      { text: "Antacids reduce 25% desperation (use wisely!)", indent: true },
      {
        text: "Coffee gives +30% speed BUT increases 15% desperation",
        indent: true,
      },
      { text: "", indent: false },
      { text: "COMBAT TACTICS", header: true },
      { text: "High desperation = high risk, high reward", indent: true },
      { text: "Auto-targeting makes combat smooth", indent: true },
      { text: "Plunger: Balanced, reliable (15-20 dmg)", indent: true },
      {
        text: "Wrench: High damage with stun chance (20-28 dmg)",
        indent: true,
      },
      { text: "Mop: Area attack for crowds", indent: true },
      { text: "TP Launcher: Ranged with limited ammo", indent: true },
      { text: "", indent: false },
      { text: "EXPLORATION TIPS", header: true },
      {
        text: "Find keys to unlock vaults (or wait til 90% to force)",
        indent: true,
      },
      { text: "Bash weak walls at 75%+ for shortcuts", indent: true },
      { text: "Break Rooms are rare - use them wisely", indent: true },
      {
        text: "Read environmental features (blue *) for lore and humor",
        indent: true,
      },
      {
        text: "Explore thoroughly for items, shrines, and secrets",
        indent: true,
      },
      { text: "", indent: false },
      { text: "RISK / REWARD", header: true },
      { text: "Operate at high desperation for power (risky!)", indent: true },
      { text: "Or play it safe at low desperation (slower)", indent: true },
      { text: "Both strategies viable - find your style!", indent: true },
    ];
  }

  getCreditsContent() {
    return [
      { text: "THE DESCENT: CODE BROWN", header: true },
      { text: "", indent: false },
      { text: "Created by Phillip Clapham", indent: false },
      { text: "in collaboration with Claude Code (Anthropic)", indent: false },
      { text: "", indent: false },
      { text: "", indent: false },
      { text: "TECHNOLOGY", header: true },
      { text: "Vanilla JavaScript (ES6 modules)", indent: true },
      { text: "HTML5 Canvas rendering", indent: true },
      { text: "Pure ASCII aesthetic", indent: true },
      { text: "No external dependencies", indent: true },
      { text: "", indent: false },
      { text: "", indent: false },
      { text: "INSPIRED BY", header: true },
      { text: "NetHack", indent: true },
      { text: "Dungeon Crawl Stone Soup", indent: true },
      { text: "Brogue", indent: true },
      { text: "Classic roguelike tradition", indent: true },
      { text: "", indent: false },
      { text: "", indent: false },
      { text: "VERSION", header: true },
      { text: "1.0.0", indent: true },
      { text: "", indent: false },
      { text: "Thank you for playing!", indent: false },
    ];
  }
}
