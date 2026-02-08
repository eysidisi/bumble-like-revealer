---
trigger: manual
---

You are refactoring an existing MV3 Chrome extension. 
Primary goal: improve maintainability/readability with ZERO behavior changes.

NON-NEGOTIABLE RULES
1) No feature changes
- Do not change business behavior, data shape, sort order, or UX.
- Existing interception + parsing + storage + UI output must remain identical.

2) Small, safe steps
- Work in tiny steps. After each step, show:
  a) what changed
  b) why
  c) risk level
  d) how to verify manually
- Never perform a big-bang rewrite.

3) Respect boundaries
- Keep concerns separated:
  - patchXMLHttpRequest.js / patchFetch.js: interception only
  - handlers.js: parsing + normalization only
  - models.js: data model only
  - storage module: persistence + dedupe only
  - sidepanel.*: rendering/UI only
  - page.js: orchestration only
- No module should do UI + storage + parsing together.

4) Preserve extension safety
- Keep MV3-compatible patterns.
- No eval, no dynamic remote scripts, no unsafe inline execution.
- Do not widen permissions in manifest unless explicitly requested.

5) Single source of truth
- Centralize constants/endpoints in constants.js.
- Centralize storage keys and schema version in one place.
- Centralize encounter normalization in one function.

6) Deterministic data flow
- Raw API response -> parser -> normalized Encounter[] -> dedupe -> storage -> UI.
- Do not bypass this flow.

7) Strong dedupe contract
- Dedupe by stable encounter id only.
- Merge updates deterministically (latest wins with clear rule).
- Never create duplicate rows in storage.

8) Make parsing resilient
- Parser must tolerate partial/missing fields.
- Skip invalid records safely; never crash the extension.
- Log parse failures in debug mode only.

9) Logging discipline
- Add a DEBUG flag and structured logs.
- No noisy console spam in normal mode.
- Never log sensitive tokens/cookies/auth headers.

10) Backward compatibility
- If storage schema changes, add explicit migration path.
- Old stored data must still load safely.

11) Keep UI dumb
- UI reads prepared view-models, not raw API payloads.
- Move sort/group logic out of sidepanel rendering into a pure helper.

12) Naming + file hygiene
- Clear function names (verb + noun).
- Maximize pure functions.
- Remove dead code and duplicate utilities.
- Keep files focused and short where possible.

13) Documentation update required
- After each refactor slice, update a short “Architecture Notes” section:
  - module responsibility
  - input/output contracts
  - edge cases handled

14) Verification before finishing
- Manual checks required:
  - encounters intercepted
  - statuses displayed correctly
  - dedupe works across repeated requests
  - photos/details still render
  - sorting order unchanged
  - extension reload produces no errors

EXECUTION PLAN (MANDATORY ORDER)
Step 1: Baseline snapshot (current behavior checklist + known flows)
Step 2: Extract/clean pure parsing functions
Step 3: Extract storage repository layer (get/save/merge/dedupe)
Step 4: Extract UI view-model mapper + sort helpers
Step 5: Thin page.js into orchestration only
Step 6: Remove dead code + normalize names
Step 7: Final verification report against baseline checklist
