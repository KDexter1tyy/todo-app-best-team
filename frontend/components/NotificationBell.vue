<template>
  <div ref="rootRef" class="relative">
    <button
      type="button"
      class="relative inline-flex items-center justify-center w-10 h-10 rounded-lg text-secondary-500 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-200 hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-secondary-900"
      :aria-label="ariaLabel"
      :aria-expanded="open"
      aria-haspopup="dialog"
      @click="toggle"
    >
      <!-- Bell icon -->
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>

      <!-- Unread badge -->
      <span
        v-if="unreadCount > 0"
        class="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center min-w-[1.125rem] h-[1.125rem] px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold leading-none ring-2 ring-white dark:ring-secondary-800"
        aria-hidden="true"
      >
        {{ badgeText }}
      </span>
    </button>

    <!-- Panel -->
    <Transition
      enter-active-class="transition duration-150 ease-out"
      leave-active-class="transition duration-100 ease-in"
      enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <NotificationPanel
        v-if="open"
        :notifications="notifications"
        :unread-count="unreadCount"
        @mark-read="onMarkRead"
        @mark-all-read="onMarkAllRead"
        @clear-all="onClearAll"
        @close="close"
      />
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useNotifications } from '~/composables/useNotifications'

const {
  notifications,
  unreadCount,
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  clearAll,
  startPolling,
  stopPolling,
} = useNotifications()

const open = ref(false)
const rootRef = ref<HTMLElement | null>(null)

const badgeText = computed(() => (unreadCount.value > 99 ? '99+' : String(unreadCount.value)))
const ariaLabel = computed(() => {
  if (unreadCount.value === 0) return 'Notifications'
  return `Notifications, ${unreadCount.value} unread`
})

function toggle() {
  open.value = !open.value
  if (open.value) {
    // Refresh on open so users see the latest before the next poll tick.
    fetchNotifications()
  }
}

function close() {
  open.value = false
}

function onMarkRead(id: string) {
  markAsRead(id)
}

function onMarkAllRead() {
  markAllAsRead()
}

function onClearAll() {
  clearAll()
}

function onDocumentClick(event: MouseEvent) {
  if (!open.value) return
  const target = event.target as Node | null
  if (rootRef.value && target && !rootRef.value.contains(target)) {
    close()
  }
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && open.value) {
    close()
  }
}

onMounted(() => {
  startPolling()
  document.addEventListener('click', onDocumentClick)
  document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  stopPolling()
  document.removeEventListener('click', onDocumentClick)
  document.removeEventListener('keydown', onKeydown)
})
</script>
