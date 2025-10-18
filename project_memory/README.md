# The Descent: Code Brown

ASCII roguelike where you desperately need to reach the bathroom at the bottom of a dungeon.

## Quick Navigation

- **Current Focus:** `next_steps.md` - Session 5 ready to execute
- **Phase 2 Plan:** `PHASE_2_PLAN.md` - Complete Sessions 4-8 detailed plan
- **Project Essence:** `projectbrief.md` - Core concept and scope
- **Phase 1 Report:** `PHASE_1_COMPLETION_REPORT.md` - Comprehensive phase analysis
- **Completed Work:** `COMPLETED_SESSIONS_ARCHIVE.md` - Detailed session history
- **Development Workflow:** `SESSION_PROTOCOL.md` - How we work
- **Long-term Plan:** `ROADMAP.md` - Phase breakdown
- **Technical Decisions:** `decisions.md` - Why we chose what we chose

## Project Status

**Current Phase:** Phase 2 - Dungeon Generation & Game Identity
**Current Session:** Session 5 - Corridor Sophistication & Connectivity
**Status:** ✅ Session 4 Complete! Ready for Session 5

## Session Tracker

### Phase 1: Core Systems ✅ COMPLETE & ARCHIVED
- [x] **Session 1** - Game loop, player movement, basic display
- [x] **Session 2** - Desperation meter, collision detection
- [x] **Session 3** - Procedural dungeons, multi-floor system
- [x] **Session 3a** - Bi-directional stairs, 10 floors, toilet victory

**See:** `PHASE_1_COMPLETION_REPORT.md` and `COMPLETED_SESSIONS_ARCHIVE.md`

### Phase 2: Dungeon Generation & Game Identity ⏳ CURRENT
- [x] **Session 4** ✅ - Room variety & architectural features (COMPLETE)
- [ ] **Session 5** ⏳ - Corridor sophistication & connectivity (NEXT)
- [ ] **Session 6** - Doors, keys & special rooms
- [ ] **Session 7** - Thematic depth & polish (NOT optional)
- [ ] **Session 8** ⭐ - Game identity & mechanics design (CRITICAL)

**See:** `PHASE_2_PLAN.md` for complete detailed plan

### Phase 3: Combat & Items
- [ ] **Session 9** - Combat mechanics & basic enemy
- [ ] **Session 10** - Weapon variety & inventory system
- [ ] **Session 11** - Enemy types & tactical AI
- [ ] **Session 12** - Unique mechanics & items

### Phase 4: Polish & Balance
- [ ] **Session 13** - Game over/victory screens, sound
- [ ] **Session 14** - Balance testing, difficulty tuning
- [ ] **Session 15** - Tutorial, high scores, final polish

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
│   ├── renderer.js        # ASCII rendering
│   ├── input.js           # Keyboard input
│   └── ...                # Other systems (to come)
├── project_memory/         # Project management
│   ├── projectbrief.md    # Core concept
│   ├── README.md          # This file (navigation)
│   ├── SESSION_PROTOCOL.md # Development workflow
│   ├── next_steps.md      # Current work
│   ├── ROADMAP.md         # Long-term plan
│   ├── decisions.md       # Technical decisions log
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
