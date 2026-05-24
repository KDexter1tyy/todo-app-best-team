import { ref, computed, onUnmounted } from 'vue'
import { notificationsApi } from '~/utils/api'
import type { Notification } from '~/types'

const POLL_INTERVAL_MS = 30_000

// Module-level singleton state so the bell, panel, and any other consumer
// share a single source of truth and a single polling timer.
const notifications = ref<Notification[]>([])
const unreadCount = ref(0)
const loading = ref(false)
const error = ref<string | null>(null)

let pollTimer: ReturnType<typeof setInterval> | null = null
let pollerCount = 0

async function fetchNotifications(): Promise<void> {
  loading.value = true
  error.value = null
  try {
    const res = await notificationsApi.list()
    notifications.value = res.notifications
    unreadCount.value = res.unread_count
  } catch (err: any) {
    error.value = err?.message || 'Failed to load notifications'
  } finally {
    loading.value = false
  }
}

async function markAsRead(id: string): Promise<void> {
  // Optimistic: flip is_read locally before the server confirms.
  const target = notifications.value.find((n) => n.id === id)
  if (target && !target.is_read) {
    target.is_read = true
    unreadCount.value = Math.max(0, unreadCount.value - 1)
  }
  try {
    await notificationsApi.markAsRead(id)
  } catch (err: any) {
    error.value = err?.message || 'Failed to mark as read'
    // On failure, refetch to reconcile.
    await fetchNotifications()
  }
}

async function markAllAsRead(): Promise<void> {
  const previous = notifications.value.map((n) => ({ ...n }))
  const previousUnread = unreadCount.value
  notifications.value = notifications.value.map((n) => ({ ...n, is_read: true }))
  unreadCount.value = 0
  try {
    await notificationsApi.markAllAsRead()
  } catch (err: any) {
    notifications.value = previous
    unreadCount.value = previousUnread
    error.value = err?.message || 'Failed to mark all as read'
  }
}

async function clearAll(): Promise<void> {
  const previous = notifications.value.slice()
  const previousUnread = unreadCount.value
  notifications.value = []
  unreadCount.value = 0
  try {
    await notificationsApi.clearAll()
  } catch (err: any) {
    notifications.value = previous
    unreadCount.value = previousUnread
    error.value = err?.message || 'Failed to clear notifications'
  }
}

function startPolling(): void {
  pollerCount++
  if (pollTimer !== null) {
    return
  }
  // Immediate fetch so the badge populates without waiting 30 s.
  fetchNotifications()
  pollTimer = setInterval(() => {
    fetchNotifications()
  }, POLL_INTERVAL_MS)
}

function stopPolling(): void {
  pollerCount = Math.max(0, pollerCount - 1)
  if (pollerCount === 0 && pollTimer !== null) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

export function useNotifications() {
  // Tie polling lifecycle to component lifecycle for any consumer that calls
  // startPolling without manually pairing stopPolling.
  onUnmounted(() => {
    if (pollerCount > 0) {
      stopPolling()
    }
  })

  return {
    // State
    notifications: computed(() => notifications.value),
    unreadCount: computed(() => unreadCount.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),

    // Actions
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    clearAll,
    startPolling,
    stopPolling,
  }
}
