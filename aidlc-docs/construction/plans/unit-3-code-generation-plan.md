# Unit 3 — Code Generation Plan

**Unit**: Notification Bell UI
**Mode**: Happy path only, no additional test files
**Sources**: `unit-of-work.md`, `unit-of-work-dependency.md` (Contract 1, Contract 5), `components.md`, `component-methods.md`

## Stories Implemented
- US-5: Bell icon with unread count badge
- US-6: Notification panel with list
- US-7: Mark individual notification as read
- US-8: Mark all as read
- US-9: Clear all notifications
- US-10: 30-second polling

## Generation Steps

### Step 1: Type Definitions
- [x] Modify `frontend/types/index.ts` — add `Notification` and `NotificationsListResponse` interfaces (additive; no changes to existing types)

### Step 2: API Client Extension
- [ ] Modify `frontend/utils/api.ts` — add `PATCH` to allowed methods, add `notificationsApi` object with `list()`, `markAsRead(id)`, `markAllAsRead()`, `clearAll()`

### Step 3: Composable
- [ ] Create `frontend/composables/useNotifications.ts` — reactive state (`notifications`, `unreadCount`, `loading`, `error`), actions (`fetchNotifications`, `markAsRead`, `markAllAsRead`, `clearAll`), polling lifecycle (`startPolling`, `stopPolling`) at 30 s interval, `onUnmounted` cleanup

### Step 4: Notification Panel Component
- [ ] Create `frontend/components/NotificationPanel.vue` — dropdown receiving `notifications` and `unreadCount` props, emits `mark-read`, `mark-all-read`, `clear-all`, `close`, displays type icon (bell/clock), message, relative time, read/unread visual state, "Mark all as read" + "Clear all" buttons, empty state

### Step 5: Notification Bell Component
- [ ] Create `frontend/components/NotificationBell.vue` — bell icon button + badge (hidden when `unreadCount == 0`), toggles `NotificationPanel`, closes panel on outside click and Escape, calls `startPolling` on mount

### Step 6: Dashboard Integration
- [ ] Modify `frontend/pages/dashboard.vue` — mount `<NotificationBell />` in the right-side header actions before `<DarkModeToggle />`

### Step 7: Code Summary Document
- [ ] Create `aidlc-docs/construction/unit-3-notification-bell-ui/code/code-summary.md`

## Deferred (Per User Decision)
- Test files (no unit, integration, or e2e tests for Unit 3)
- Error-state edge cases beyond the optimistic-update rollback already in pattern
- Confirmation dialog before "Clear all" (mentioned as optional in US-9; not implemented)
