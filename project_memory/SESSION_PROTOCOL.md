# Project Protocol

## Core Principle

Detailed documentation enables focused execution on small tasks
while maintaining full project context. Session-based development
maintains focus while preserving continuity.

## Sequential Session Execution (NON-NEGOTIABLE)

**The Rule**: Work sessions in order. Finish current session before starting next.

✅ **Allowed** (Smart Flexibility):
- Fix related bugs discovered during current session
- Absorb adjacent work when context is loaded
- Extend session duration when making progress
- Add subsessions (21a, 21b, 21c) organically

❌ **Never Allowed** (Scope Jump):
- Skip ahead to later sessions
- Work on different phase while current incomplete
- "While we're here" additions from unrelated sessions
- Jumping around the roadmap

**Why This Works**:
- Context stays loaded (efficient)
- No orphaned work (complete)
- Memory stays clean (organized)
- Estimates improve over time (learning)

**Real Example**:
Session 21M: Planned to fix 2 bugs. User found Bug #5 during testing.
✅ Fixed it immediately (context loaded, related code, efficient)
❌ Would be wasteful: "Add to 21N, fix later" (reload all context)
Result: 3 bugs fixed in 60 min vs 2 planned

**When to Pivot**:
If current session reveals blocker for next session:
1. Document blocker in current session
2. Finish current session cleanly
3. Adjust plan for next session
4. Stay sequential

## Memory Structure

- `project_memory/` at root
- `projectbrief.md` - Project essence (<200 lines)
- `README.md` - Navigation index & session tracker
- `SESSION_PROTOCOL.md` - Development workflow template
- `next_steps.md` - Active session tracker & simple session details
- Session files: `PHASE_X_SESSION_Y.md` for complex work only
- Conditional: `decisions.md`, `architecture.md`

## Project Lifecycle

### Phase Organization
- Projects evolve through 3-7 major phases
- Each phase: 3-5 sessions with clear deliverables
- `ROADMAP.md` - Multi-phase planning document
- `PHASE_X_COMPLETION_REPORT.md` - Phase consolidation
- Phase completion triggers archive & compression ritual

### Session Flexibility
- Sessions can expand to subsessions (9a, 9b, 9c)
- When momentum strong: extend session, don't stop artificially
- Sessions can absorb future planned work
- Plans serve momentum, not vice versa
- Document reality over plan

### Memory Compression Hierarchy
Raw work → Session notes → Phase summary → Archive → Brief update
- Active memory: next_steps.md + projectbrief.md (<500 lines total)
- Archive: COMPLETED_SESSIONS_ARCHIVE.md (unlimited)
- Navigation: README.md points to current state

## Session-Based Development

Break work into 30-45 minute focused sessions:
- Each session: self-contained with clear goals
- Start session: `[!read-memory]` to load context and identify current task
- End session: commit, push, `[!update-memory]` to create perfect handoff
- Fresh conversations maintain perfect continuity via project memory

## Session File Strategy

Use `next_steps.md` for session details when:
- Tasks are straightforward (15-30 min)
- Implementation follows standard patterns
- Work is incremental or iterative
- Testing, polish, or minor adjustments

Create individual session files when:
- Complex architectural changes
- Novel feature implementation
- Multi-step refactoring (>45 min)
- Work requires detailed specifications
- Breaking new conceptual ground

## Execution Patterns

### The 80/20 Rule
- 80% of work stays in next_steps.md
- 20% graduates to SESSION_X.md files
- If creating many session files, simplify approach

### Momentum vs Plan
- Strong momentum: keep going (Session 11 → 11a-11j)
- Blocked: document blockers, pivot, don't force
- Tired: stop cleanly with clear handoff

### Decision Points (Make Explicit)
**When to consolidate phase:**
- All deliverables functional
- No critical bugs remain
- Ready for next layer of work

**When to extend session:**
- Making rapid progress
- Context fully loaded
- Energy remains high

**When to stop:**
- Approaching 45-60 minutes
- Natural completion point
- Energy depleting

## Decision Framework (Six Cuts)

1. Necessity: Does this serve core function?
2. Efficiency: Is there a more direct path?
3. Friction: Does this reduce operational resistance?
4. Dependency: What breaks if removed?
5. Perception: Will this be intuitive?
6. Emergence: Does this create valuable compound effects?

## Commands

### Context Loading
- `[!read-memory]` - Standard load (projectbrief + README + next_steps)
- `[!read-memory-full]` - Include ROADMAP + decisions (for architectural work)
- `[!read-memory-light]` - Just next_steps (for quick fixes)

### Session Management
- `[!update-memory]` - Document completion, create handoff
- `[!review-session]` - Quality check (optional, recommended 30+ min)
- `[!archive-phase]` - Consolidate phase learnings, clean working memory

### Command Implementation

When `[!review-session]` is called:
1. Run `git diff HEAD~1` to see session changes
2. Extract session goals from `next_steps.md`
3. Launch Task tool with subagent_type: "general-purpose" and this prompt:
   - Review only the commit changes
   - Check if session goals were met
   - Apply Six Cuts principle to detect over-engineering
   - Provide 5-line summary maximum
4. Include review output in memory update

## Working Principles

- First principles over patterns
- Function drives form
- Session-based focus with memory continuity
- Remove until it breaks, then add back the minimum
- Document decisions, not process
- Every line of documentation must earn its keep

## System Evolution

### Continuous Discovery
The system discovers itself through use:
1. Try the documented approach
2. When reality differs, follow reality
3. Document what actually worked
4. Update patterns without apology

### Failure Documentation
When things don't work:
- Note in decisions.md: "Tried X, failed because Y"
- Extract principle for future
- Pivot without shame

### Documentation as Tool
Every document must be:
- **Active** (guides current work), OR
- **Navigation** (helps find things), OR
- **Learning** (captures patterns)
If none of these: delete it

### Phase-End Ritual
1. Run tests, ensure functional
2. Write phase completion report
3. Archive session details
4. Update projectbrief if needed (rarely)
5. Clean next_steps for fresh start
6. Commit with "[!update-memory]" tag

## Critical Success Factors

**For seamless continuity:**
- Every session starts with [!read-memory]
- Every session ends with commit + [!update-memory]
- Blockers documented immediately
- Reality beats plan every time
- Working memory stays under 500 lines
- Archives preserve everything

**The system works because:**
- Memory enables focus on small tasks
- Sessions prevent context overflow
- Archives prevent memory bloat
- Patterns capture tacit knowledge
- Flexibility allows organic growth
