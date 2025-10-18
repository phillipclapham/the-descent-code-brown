# The Descent: Code Brown

ASCII roguelike where you desperately need to reach the bathroom at the bottom of a dungeon.

## Quick Navigation

- **Current Focus:** `next_steps.md` - Active session work
- **Project Essence:** `projectbrief.md` - Core concept and scope
- **Development Workflow:** `SESSION_PROTOCOL.md` - How we work
- **Long-term Plan:** `ROADMAP.md` - Phase breakdown

## Project Status

**Current Phase:** Phase 1 - Core Systems  
**Current Session:** Session 1 - Game Loop & Player Movement  
**Status:** ⏳ Ready to start

## Session Tracker

### Phase 1: Core Systems (Sessions 1-3)
- [ ] **Session 1** - Game loop, player movement, basic display
- [ ] **Session 2** - Desperation meter, collision detection
- [ ] **Session 3** - Basic dungeon layout, stairs between levels

### Phase 2: Dungeon Generation (Sessions 4-6)
- [ ] **Session 4** - Procedural room generation
- [ ] **Session 5** - Corridor connections, variety
- [ ] **Session 6** - Item and enemy placement

### Phase 3: Combat & Items (Sessions 7-9)
- [ ] **Session 7** - Combat mechanics, basic enemy
- [ ] **Session 8** - Weapon variety, inventory system
- [ ] **Session 9** - Multiple enemy types, AI behaviors

### Phase 4: Polish & Balance (Sessions 10-12)
- [ ] **Session 10** - Game over/victory screens, sound
- [ ] **Session 11** - Balance testing, difficulty tuning
- [ ] **Session 12** - Tutorial, high scores, final polish

## Command Quick Reference

- `[!read-memory]` - Load context (projectbrief + README + next_steps)
- `[!update-memory]` - Document session completion
- `[!read-memory-full]` - Include ROADMAP + decisions (for architectural work)

## File Structure

```
the-descent-code-brown/
├── index.html              # Game entry point
├── src/                    # Source code
│   ├── game.js            # Main game loop
│   ├── player.js          # Player entity
│   ├── dungeon.js         # Dungeon generation
│   ├── renderer.js        # ASCII rendering
│   └── ...                # Other systems
├── project_memory/         # Project management
│   ├── projectbrief.md    # Core concept
│   ├── README.md          # This file
│   ├── SESSION_PROTOCOL.md
│   ├── next_steps.md      # Current work
│   ├── ROADMAP.md         # Long-term plan
│   └── archive/           # Completed sessions
└── README.md              # Public project readme
```

## Development Principles

1. **Sequential Sessions** - Work in order, finish before moving on
2. **Session-Based Focus** - 30-45 minutes with clear goals
3. **Reality Over Plan** - Follow what works, document actual approach
4. **Simplicity First** - Remove until it breaks, add back minimum
5. **Organic Growth** - Sessions can expand (1a, 1b, 1c) when momentum strong

## Getting Started

For Claude Code:
1. Run `[!read-memory]` to load context
2. Check `next_steps.md` for current session goals
3. Start work on identified tasks
4. Commit and `[!update-memory]` when done

---

**Created:** October 18, 2025  
**Type:** Zero-pressure fun project  
**Tech:** Vanilla JS, HTML5 Canvas, ASCII rendering
