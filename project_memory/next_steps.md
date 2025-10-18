# Next Steps

**Current Phase:** Phase 1 - Core Systems  
**Current Session:** Session 1 - Game Loop & Player Movement  
**Status:** Ready to start  
**Last Updated:** 2025-10-18

---

## Session 1: Game Loop & Player Movement

**Goal:** Get basic game running with player character that responds to keyboard input.

**Duration Estimate:** 30-45 minutes

**Deliverables:**
- [ ] Basic HTML file with Canvas element
- [ ] Game loop (update/render cycle at 60fps)
- [ ] Player character (@) renders on screen
- [ ] Keyboard input handler (arrow keys or WASD)
- [ ] Player moves in response to input
- [ ] Simple collision with canvas bounds

**Technical Approach:**
- Vanilla JavaScript (keep it simple)
- HTML5 Canvas for rendering
- requestAnimationFrame for game loop
- Event listeners for keyboard input
- Character-based coordinate system (grid-based movement)

**Implementation Tasks:**

1. **Setup HTML Structure** (~5 min)
   - Create index.html
   - Add Canvas element (800x600 or similar)
   - Link to game.js
   - Basic CSS for centering/styling

2. **Create Game Loop** (~10 min)
   - Initialize canvas context
   - Set up requestAnimationFrame loop
   - Create update() and render() functions
   - Target 60fps with delta time

3. **Implement Player Entity** (~10 min)
   - Player object with x, y position
   - Character representation (@)
   - Size/collision bounds
   - Render function to draw player

4. **Add Keyboard Input** (~10 min)
   - Event listeners for keydown
   - Input state tracking (which keys pressed)
   - Movement logic (arrow keys or WASD)
   - Update player position based on input

5. **Basic Collision** (~5 min)
   - Check canvas boundaries
   - Prevent player from moving off screen
   - Clamp position to valid range

**Success Criteria:**
- Game runs smoothly in browser
- Player character (@) visible on screen
- Character moves in all four directions
- Character stops at screen edges
- No console errors
- Clean, readable code

**Notes:**
- Keep character size reasonable (maybe 16x16 or 20x20 pixels)
- Consider grid-based movement (snap to grid) vs smooth movement
- Start with simple rendering, can enhance later
- Focus on getting it working, optimize later

**Next Session Preview:**
Session 2 will add the desperation meter UI and proper collision detection system.

---

## Upcoming Sessions

### Session 2: Desperation Meter & Collision
- Implement desperation meter UI
- Time-based increase
- Visual representation
- Enhanced collision detection system

### Session 3: Basic Dungeon & Stairs
- Simple dungeon layout (walls, floors)
- Stairs down to next level
- Multi-floor structure
- Level transition logic

---

## Blockers

None currently.

---

## Notes

- This is a zero-pressure fun project
- Focus on getting something playable quickly
- Iterate based on what feels fun
- Don't overthink - just build and play
