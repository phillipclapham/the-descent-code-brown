# SESSION 18: PLAYTESTING CHECKLIST & DOCUMENTATION

## 🐛 BUGS FOUND DURING CODE REVIEW

### BUG #1: CRITICAL - Desperation save/load reset ✅ FIXED
**Issue:** Save system used wrong property name (`.desperation` instead of `.value`)
**Impact:** Every save/load would reset player desperation to 0%
**Fix:** Changed `game.desperationMeter.desperation` → `game.desperationMeter.value` in save-system.js:42
**Status:** ✅ FIXED - Verify during save/load testing

---

## 📋 MANUAL PLAYTESTING PROTOCOL

**You must physically play the game to complete this session!**

Open the game in your browser (`python3 -m http.server` then visit `http://localhost:8000`) and work through these tests systematically.

---

## PHASE 1: SYSTEMATIC PLAYTHROUGHS

### RUN #1: AGGRESSIVE PLAYSTYLE (~15-20 min)
**Goal:** Victory via high desperation abilities

**Route:**
- Let desperation climb to 75%+ (don't use Antacids or Break Rooms)
- Test wall bashing (should unlock at 75%, orange-brown walls)
- Test door forcing (should unlock at 90%, bypass keys)
- Use Clench strategically for "clutch" moments
- Engage in combat at high desperation (test rage damage bonus)

**Track:**
- [ ] Wall bashing unlocks at 75% desperation?
- [ ] Door forcing unlocks at 90% desperation?
- [ ] Clench timing - is 10s/60s balanced?
- [ ] High desperation combat - too hard or fun challenge?
- [ ] Screen shake/tint effects - enhance or annoy?
- [ ] Did you die at 100% desperation properly?
- [ ] Victory achievable with this playstyle?

**Document:**
```
Run #1: Aggressive

Outcome: [Victory/Defeat @ Floor X]
Time: [X:XX]
Score: [XXXX] (Rank: [XXXX])
Desperation at End: [X%]

Observations:
- Wall bashing:
- Door forcing:
- Clench timing:
- Balance notes:
- Bugs found:
```

---

### RUN #2: CAUTIOUS PLAYSTYLE (~20-25 min)
**Goal:** Victory via low desperation, thorough exploration

**Route:**
- Find all keys, open locked doors normally
- Use Break Rooms (floors 8-3, 25% spawn chance)
- Pick up Antacids, maintain <50% desperation
- Explore thoroughly, find vaults
- Use Coffee for speed, Energy Drink for invincibility

**Track:**
- [ ] Break Room spawn rate - too rare/common/good? (25%)
- [ ] Break Room desperation pause - works correctly?
- [ ] Antacid effectiveness - reduces 25%, spawn rate good?
- [ ] Low desperation combat - accuracy/damage feel right?
- [ ] Consumable spawn rate - 2-3 per floor adequate?
- [ ] Exploration rewarding? (vaults, special rooms)
- [ ] Victory achievable with this playstyle?

**Document:**
```
Run #2: Cautious

Outcome: [Victory/Defeat @ Floor X]
Time: [X:XX]
Score: [XXXX] (Rank: [XXXX])
Desperation at End: [X%]

Break Rooms Found: [X]
Antacids Used: [X]
Keys Collected: [X]

Observations:
- Break Room frequency:
- Desperation management:
- Consumable availability:
- Balance notes:
- Bugs found:
```

---

### RUN #3: INVENTORY STRESS TEST (~15-20 min)
**Goal:** Test inventory system edge cases

**Actions to Test:**
- [ ] Pick up 5+ weapons (5th should trigger "inventory full")
- [ ] Cycle weapons during combat (Q/E keys while attacking)
- [ ] Drop weapon mid-combat (X key, verify spawns correctly)
- [ ] Pick up dropped weapon (should replace in slot)
- [ ] Fill all 8 slots (4 weapons + 4 consumables)
- [ ] Direct select slots 1-8 (number keys)
- [ ] Cycle to consumable slot (5-8), press ENTER to use
- [ ] Drop consumable (X key from consumable slot)
- [ ] Use consumable during active Coffee effect (stacking?)
- [ ] Save with full inventory → Close → Load → Verify all items restored

**Track:**
- [ ] Visual clarity - which slot selected obvious?
- [ ] Cycling smooth - no stuttering or skipped slots?
- [ ] Drop spawns correctly - no out of bounds?
- [ ] Full inventory message clear?
- [ ] Weapon auto-equip on pickup (if no weapon equipped)?
- [ ] Consumable "press ENTER" message shows?
- [ ] Save/load preserves all 8 slots correctly?

**Document:**
```
Run #3: Inventory Stress

Bugs Found:
1. [Description] - Severity: [CRITICAL/HIGH/MED/LOW]

UX Observations:
- Visual clarity:
- Cycling feel:
- Drop behavior:
- Selection feedback:
```

---

## PHASE 2: EDGE CASE VALIDATION (~30-45 min)

### SAVE/LOAD SCENARIOS

**Test 1: Save with Active Effects**
- [ ] Use Coffee (speed boost) → Save → Close browser → Load → Verify timer continues
- [ ] Use Energy Drink (invincibility) → Save → Load → Verify flashing effect restored
- [ ] Activate Clench → Save (while active) → Load → Verify cooldown correct

**Test 2: Save at Critical States**
- [ ] Save at 99% desperation → Load → Verify NOT 0% (BUG #1 fix validation)
- [ ] Save with full inventory (8/8 items) → Load → Verify all items present
- [ ] Save with 1 HP → Load → Verify health correct

**Test 3: Save/Load Flow**
- [ ] Play to Floor 7 → Descend (auto-save) → Close browser
- [ ] Reopen → Main menu shows CONTINUE with preview (Floor 7, X% desp, X/100 HP)
- [ ] Select CONTINUE → Spawns on Floor 7 near stairs?
- [ ] Inventory/stats/effects all restored correctly?

### DEATH SCENARIOS

**Test All Death Triggers:**
- [ ] Die from enemy combat (HP → 0) → "GAME OVER" screen → Save deleted?
- [ ] Die at exactly 100% desperation → "GAME OVER" screen → Save deleted?
- [ ] Die in Break Room (desperation still increases to 100%) → Game over?
- [ ] Die during active Clench (should still die) → Game over?
- [ ] Die with Coffee effect active → Proper death screen?

### VICTORY SCENARIOS

**Test Victory Flow:**
- [ ] Reach Floor 1 → Find toilet (should be visible)
- [ ] Walk onto toilet tile → Victory screen appears?
- [ ] Victory screen shows: ASCII toilet art, stats, score, rank
- [ ] Score calculation seems reasonable (time + desp + combat + explore)
- [ ] Press R to restart → New game begins properly?
- [ ] High score saved to localStorage?
- [ ] Close → Reopen → Main menu shows high score?
- [ ] Victory with Clench active → Still shows victory properly?
- [ ] Victory with 95%+ desperation → Bonus reflected in score?

### BOUNDARY CONDITIONS

**Test Edge States:**
- [ ] Floor 10 start → No upstairs reference (should be null-safe)
- [ ] Floor 1 → Toilet is reachable (not blocked by walls/enemies)
- [ ] Locked door @ 89% desperation → Can't force (need key or wait)
- [ ] Locked door @ 90% desperation → Auto-force works (bypass key)
- [ ] Weak wall @ 74% desperation → Can't bash
- [ ] Weak wall @ 75% desperation → Bash works (creates floor tile)
- [ ] Vault room → Walls never bashable (protected loot)

---

## PHASE 3: BUG HUNTING CHECKLIST

### NEW SYSTEMS (Session 13-17)

**Sound System (Session 17)**
- [ ] All 16 sounds play correctly (combat, items, desperation, environment, UI)?
- [ ] M key toggles mute on/off?
- [ ] Mute preference persists (close → reopen → still muted)?
- [ ] Victory fanfare plays (C-E-G-C arpeggio)?
- [ ] Defeat "wahwah" plays on death?
- [ ] No console errors related to Web Audio API?

**Tutorial System (Session 16)**
- [ ] H key opens/closes tutorial?
- [ ] All 4 tabs accessible (←/→ or 1-4 keys)?
- [ ] Scrolling works (W/S or ↑/↓ if content long)?
- [ ] Content accurate (reflects Sessions 13-17 changes)?
- [ ] Game pauses while tutorial open?
- [ ] No typos or outdated info?

**Inventory Redesign (Session 14)**
- [ ] Dual inventory (4 weapons + 4 consumables) visually clear?
- [ ] Q/E cycling through all 8 slots smoothly?
- [ ] X key drops both weapons AND consumables?
- [ ] Slots 1-4 auto-equip weapons (instant switch)?
- [ ] Slots 5-8 select consumables (require ENTER to use)?
- [ ] Visual indicator shows selected slot clearly?

**WASD Controls (Session 13)**
- [ ] WASD movement works (8 directions)?
- [ ] Arrow keys still work?
- [ ] No conflicts (W doesn't trigger weapon actions)?
- [ ] Diagonal movement smooth (W+A, S+D, etc.)?

### REGRESSION TESTING (Previous Sessions)

**Session 12d: Desperation Abilities**
- [ ] Wall bashing reference restored after save/load?
- [ ] Door forcing works after save/load?
- [ ] Game over at 100% desperation triggers properly?

**Session 12c: Balance & Hazards**
- [ ] Desperation rate 0.35%/sec feels good? (4-6 min runs)
- [ ] Water puddles slow movement (blue ~ tiles)?
- [ ] Traps damage player (red ^ tiles, 5 HP)?

**Session 12b: Save System**
- [ ] Save v2.0 format compatible (if old v1 save exists, migrates)?
- [ ] beforeunload saves on page close (prevent accidental loss)?

**Session 12a: Clench & Victory**
- [ ] Clench UI displays correctly (top-right, no overlap)?
- [ ] Victory sequence complete (art, stats, scoring, high score)?

---

## PERFORMANCE & CONSOLE CHECK

### Performance Metrics
- [ ] Game runs at consistent 60fps (use browser DevTools)
- [ ] No lag during combat or floor transitions
- [ ] Floor generation <200ms (feels instant)
- [ ] No memory leaks (play 15+ floors, check DevTools memory tab)
- [ ] Save/load performance acceptable (<500ms)

### Console Errors
- [ ] Open browser DevTools console
- [ ] Play through full run
- [ ] Check for any red errors (document if found)
- [ ] Check for excessive warnings (document if many)
- [ ] Note: console.log statements are OK for now (will clean up)

---

## BALANCE ASSESSMENT QUESTIONS

After 3+ complete runs, answer these:

**Desperation Rate (0.35%/sec = 4.75 min for 0→100%)**
- [ ] Creates tension without being oppressive?
- [ ] Allows strategic exploration?
- [ ] Too fast? Too slow? Just right?

**Clench Mechanic (10s freeze, 60s cooldown)**
- [ ] Valuable but not overpowered?
- [ ] Creates "clutch" moments?
- [ ] Too strong? Too weak? Balanced?

**Break Rooms (25% spawn on floors 8-3)**
- [ ] Spawn rate feels good?
- [ ] Worth seeking out?
- [ ] Too rare? Too common?

**Enemy Difficulty**
- [ ] Completable with practice (50%+ win rate)?
- [ ] Difficulty curve smooth (Floor 10→1)?
- [ ] Any enemies too hard/easy?

**Item Spawns**
- [ ] 1 weapon + 2-3 consumables per floor adequate?
- [ ] Antacids common enough (40% spawn)?
- [ ] Energy Drinks rare enough (10% spawn)?

**Playstyle Viability**
- [ ] Aggressive (high desp) viable?
- [ ] Cautious (low desp) viable?
- [ ] Speedrun (rush) viable?
- [ ] Dominant strategy exists (trivializes game)?

---

## UX OBSERVATIONS

### First-Time Player Experience
- [ ] Dual inventory system intuitive without tutorial?
- [ ] Item types visually distinct (weapons vs consumables)?
- [ ] Clench mechanic discoverable?
- [ ] Messages guide without spam?
- [ ] Feedback immediate and clear?
- [ ] Tutorial explains mechanics well?

### Visual Clarity
- [ ] UI readable and uncluttered?
- [ ] Important events noticeable (thresholds, Break Rooms)?
- [ ] Visual effects enhance (not distract)?
- [ ] Aesthetic consistent (terminal green/cyan)?

### Polish Opportunities
**Document any:**
- Confusing moments (what wasn't clear?)
- Frustrating friction (what felt clunky?)
- Delightful moments (what felt great?)
- Missing feedback (actions without confirmation?)

---

## BUG DOCUMENTATION TEMPLATE

For each bug found:

```markdown
### BUG #X: [Brief Description]
**Severity:** [CRITICAL/HIGH/MEDIUM/LOW]
**Reproduction Steps:**
1. [Step 1]
2. [Step 2]
3. [Expected vs Actual]

**Impact:** [How does this affect gameplay?]
**Fix Priority:** [Block release? Fix later?]
```

---

## SESSION 18 SUCCESS CRITERIA

By end of testing, confidently answer YES to all:

- [ ] Game is completable with practice
- [ ] All major bugs fixed (no game-breakers)
- [ ] Balance feels fair and fun (not frustrating or trivial)
- [ ] All new systems work together (no integration failures)
- [ ] Performance is smooth (60fps, no lag, no console errors)
- [ ] UX is polished and intuitive (first-time player can succeed)
- [ ] Ready to show publicly without embarrassment

**If ANY are NO:** Document gaps, we'll fix in Session 18a.

---

## FINAL DOCUMENTATION

After completing all tests, create summary:

```markdown
# SESSION 18 PLAYTEST SUMMARY

## Total Runs: [X]
- Victories: [X]
- Defeats: [X]
- Win Rate: [X%]

## Bugs Found: [X]
[List with severity]

## Balance Adjustments Needed: [X]
[List with specific tuning suggestions]

## UX Improvements Needed: [X]
[List with specific friction points]

## Performance: [EXCELLENT/GOOD/NEEDS WORK]
[Notes]

## READY FOR PUBLIC RELEASE? [YES/NO]
[Reasoning]
```

---

**Notes:**
- Take your time - this is quality assurance, not a speedrun
- Document everything - bugs, observations, feelings
- Test edge cases intentionally (try to break things)
- Think like a first-time player (what's confusing?)
- Have fun! This is the game we built together 🎮
