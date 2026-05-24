# Unit 4 — Code Summary

**Unit**: Reminder Form Integration
**Mode**: Bare-minimum happy path; no test files
**Verification**: `nuxt build` succeeded — client + server bundled cleanly; dashboard chunk grew from ~52 kB to ~55.5 kB to include the new reminder UI.

## Files

| Action | Path | Purpose |
|---|---|---|
| Modified | `frontend/types/index.ts` | Added `reminder_at: string \| null` to `Todo`; extended `TodoCreate` and `TodoUpdate` picks |
| Created | `frontend/components/ReminderBadge.vue` | "Upcoming" / "Due" pill, hidden when `reminder_at` is null |
| Modified | `frontend/components/TodoForm.vue` | Added `datetime-local` input + Clear button; ISO ↔ local-input conversion helpers |
| Modified | `frontend/components/TodoItem.vue` | Displays formatted reminder time + `<ReminderBadge>` next to the due date |
| Modified | `frontend/pages/dashboard.vue` | Added reminder field to inline create form; renders reminder time and badge on each card |
| Modified | `frontend/composables/useTodos.ts` | Optimistic-create payload now includes `reminder_at` so the new required Todo field is satisfied |

## Story Coverage

| Story | Implementation |
|---|---|
| US-1 (Set reminder on create / edit) | TodoForm + dashboard inline create form both expose a `datetime-local` input; submitter converts to ISO 8601 UTC |
| US-2 (View reminder + badge) | TodoItem and dashboard list show the formatted reminder datetime; `<ReminderBadge>` shows "Upcoming" if future, "Due" if past and not done, hidden when null |

## Contract Compliance (Contract 4 / Contract 6)

- `Todo` interface: adds `reminder_at: string | null`
- `TodoCreate` / `TodoUpdate`: include optional `reminder_at`
- Wire format: ISO 8601 UTC (`new Date(localInput).toISOString()` on submit)
- Edit roundtrip: ISO from server → local datetime-local string for editing
- Empty input → `null` (clears the reminder)

## Cross-Unit Notes

- Backend (Unit 2) is not yet implemented; it owns the `reminder_at` field on the server-side `Todo` model. Until Unit 2 ships, the field will be sent in requests but ignored by the current backend, and incoming responses won't include it (the optional `?? null` fallbacks in optimistic updates and component templates handle that gracefully).
- Unit 3 (Notification Bell) remains independent. The badge state change is purely client-side based on `reminder_at <= now`; actual notifications come from the backend when Unit 2 ships.

## Deferred (per user instruction)

- No unit, integration, or e2e tests
- No client-side validation rejecting past datetimes (browser allows it; backend ultimately validates)
- No "all-day" toggle for the reminder
