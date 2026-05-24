# Unit 3 — Code Summary

**Unit**: Notification Bell UI
**Mode**: Happy path only, no test files
**Verification**: `nuxt build` completed successfully (client + server bundles, dashboard chunk includes the new components).

## Files

| Action | Path | Purpose |
|---|---|---|
| Modified | `frontend/types/index.ts` | Added `NotificationType`, `Notification`, `NotificationsListResponse` |
| Modified | `frontend/utils/api.ts` | Added `PATCH` to allowed methods; added `notificationsApi` with `list`, `markAsRead`, `markAllAsRead`, `clearAll` |
| Created | `frontend/composables/useNotifications.ts` | Singleton state + 30 s polling lifecycle + optimistic updates |
| Created | `frontend/components/NotificationPanel.vue` | Dropdown list (read/unread visuals, type icon, relative time, mark-all and clear-all footer) |
| Created | `frontend/components/NotificationBell.vue` | Bell icon, unread badge, panel toggle, outside-click + Escape handling |
| Modified | `frontend/pages/dashboard.vue` | Mounted `<NotificationBell />` next to `<DarkModeToggle />` in the header |

## Story Coverage

| Story | Implementation |
|---|---|
| US-5 (Bell + badge) | `NotificationBell.vue` with reactive `unreadCount` and `99+` cap |
| US-6 (Panel) | `NotificationPanel.vue` with type icons, message, relative time, read/unread distinction |
| US-7 (Mark one as read) | Click on unread item → `markAsRead(id)` (optimistic) |
| US-8 (Mark all as read) | Footer button → `markAllAsRead()` (optimistic with rollback) |
| US-9 (Clear all) | Footer button → `clearAll()` (optimistic with rollback) |
| US-10 (Polling) | `startPolling()` on mount, 30 s interval, `stopPolling()` on unmount |

## Contract Compliance (Contract 5 / Contract 1)

- `GET /api/notifications` consumed via `notificationsApi.list()` returning `NotificationsListResponse`
- `PATCH /api/notifications/{id}/read` consumed via `notificationsApi.markAsRead(id)`
- `POST /api/notifications/read-all` consumed via `notificationsApi.markAllAsRead()` (returns `{ marked_count }`)
- `DELETE /api/notifications` consumed via `notificationsApi.clearAll()`
- TypeScript shapes match the JSON contract exactly (`id`, `user_id`, `todo_id`, `type`, `message`, `is_read`, `created_at`).

## Cross-Unit Notes

- Backend (Unit 1) is not yet implemented. The bell will currently fail its first poll; the composable surfaces the error string into `error.value` without breaking the dashboard.
- This unit makes no assumptions about Unit 4 (`reminder_at` on todos) and does not touch `frontend/types/index.ts`'s `Todo` interface.

## Deferred (per user instruction)

- No unit, integration, or e2e tests
- No "Are you sure?" confirmation before Clear all (US-9 marks this optional)
- No focus-trap inside the panel (a11y baseline kept to: aria-label, aria-expanded, aria-haspopup, Escape to close)
