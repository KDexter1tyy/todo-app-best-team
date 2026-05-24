# Unit 4 — Code Generation Plan

**Unit**: Reminder Form Integration
**Mode**: Bare-minimum happy path; no test files; no negative-case validation.
**Sources**: `unit-of-work.md` (Unit 4), `unit-of-work-dependency.md` (Contract 4 / Contract 6), `components.md`, `unit-of-work-story-map.md`

## Stories Implemented (acceptance criteria owned by Unit 4)
- US-1: Datetime-local input in TodoForm for reminder_at
- US-2: Display reminder time + ReminderBadge on TodoItem

## Generation Steps

### Step 1: Type Extensions
- [ ] Modify `frontend/types/index.ts` — add `reminder_at: string | null` to `Todo`. `TodoCreate` and `TodoUpdate` use `Partial<Pick<Todo, ...>>` so they pick it up automatically once the field name is in `Pick`.

### Step 2: ReminderBadge Component
- [ ] Create `frontend/components/ReminderBadge.vue` — renders nothing when `reminder_at` is null; "upcoming" badge (info style) when in the future; "due" badge (warning style) when past and todo not done.

### Step 3: TodoForm Field
- [ ] Modify `frontend/components/TodoForm.vue` — add a `datetime-local` input wired to `form.reminder_at`. On submit, convert local datetime to ISO 8601 UTC. On edit, convert incoming ISO back to local datetime-local format.

### Step 4: TodoItem Display
- [ ] Modify `frontend/components/TodoItem.vue` — show formatted reminder datetime when set; render `<ReminderBadge>` next to it.

### Step 5: Dashboard Integration
- [ ] Modify `frontend/pages/dashboard.vue`:
  - Add `reminder_at` datetime-local input to the inline create form, with ISO conversion on submit
  - Show reminder time and `<ReminderBadge>` on each todo card in the inline list

### Step 6: Composable Adjustment
- [ ] Modify `frontend/composables/useTodos.ts` — include `reminder_at` (default `null`) in the optimistic-create payload so the new required field is satisfied.

### Step 7: Code Summary
- [ ] Create `aidlc-docs/construction/unit-4-reminder-form-integration/code/code-summary.md`

### Step 8: Build verification
- [ ] Run `nuxt build` to confirm Unit 4 changes compile.

## Deferred (per user instruction)
- No unit tests, integration tests, or e2e tests
- No negative-case form validation beyond what's already in TodoForm.vue
- No backend changes (Unit 2 owns Todo's `reminder_at` server-side; until Unit 2 ships, the field will round-trip as `undefined` against the current API but not break anything)
