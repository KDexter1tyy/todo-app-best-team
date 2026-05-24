<template>
  <div
    class="absolute right-0 mt-2 w-80 sm:w-96 max-h-[28rem] overflow-hidden rounded-lg shadow-xl bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 flex flex-col"
    role="dialog"
    aria-modal="false"
    aria-label="Notifications"
  >
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-secondary-200 dark:border-secondary-700">
      <h3 class="text-sm font-semibold text-secondary-900 dark:text-white">
        Notifications
      </h3>
      <button
        type="button"
        class="text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-200 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
        aria-label="Close notifications panel"
        @click="$emit('close')"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Notification list -->
    <div class="overflow-y-auto flex-1">
      <!-- Empty state -->
      <div
        v-if="notifications.length === 0"
        class="px-4 py-10 text-center text-sm text-secondary-500 dark:text-secondary-400"
      >
        <svg class="w-10 h-10 mx-auto mb-3 text-secondary-300 dark:text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        <p>You're all caught up.</p>
      </div>

      <!-- List -->
      <ul v-else class="divide-y divide-secondary-100 dark:divide-secondary-700">
        <li
          v-for="n in notifications"
          :key="n.id"
          class="px-4 py-3 transition-colors duration-150 cursor-pointer"
          :class="n.is_read
            ? 'bg-white dark:bg-secondary-800 hover:bg-secondary-50 dark:hover:bg-secondary-700/40'
            : 'bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30'"
          @click="onItemClick(n)"
        >
          <div class="flex items-start gap-3">
            <!-- Type icon -->
            <span
              class="flex-shrink-0 mt-0.5 w-6 h-6 rounded-full flex items-center justify-center"
              :class="n.type === 'reminder'
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300'
                : 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300'"
              aria-hidden="true"
            >
              <!-- Reminder = bell, Overdue = clock -->
              <svg v-if="n.type === 'reminder'" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <svg v-else class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>

            <!-- Body -->
            <div class="flex-1 min-w-0">
              <p
                class="text-sm"
                :class="n.is_read
                  ? 'text-secondary-600 dark:text-secondary-300'
                  : 'text-secondary-900 dark:text-white font-medium'"
              >
                {{ n.message }}
              </p>
              <p class="mt-0.5 text-xs text-secondary-500 dark:text-secondary-400">
                {{ formatRelativeTime(n.created_at) }}
              </p>
            </div>

            <!-- Unread dot -->
            <span
              v-if="!n.is_read"
              class="flex-shrink-0 mt-1.5 w-2 h-2 rounded-full bg-primary-500"
              aria-label="Unread"
            />
          </div>
        </li>
      </ul>
    </div>

    <!-- Footer actions -->
    <div
      v-if="notifications.length > 0"
      class="flex items-center justify-between gap-2 px-4 py-2 border-t border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-900/40"
    >
      <button
        type="button"
        class="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-1"
        :disabled="unreadCount === 0"
        @click="$emit('mark-all-read')"
      >
        Mark all as read
      </button>
      <button
        type="button"
        class="text-xs font-medium text-secondary-600 hover:text-red-600 dark:text-secondary-400 dark:hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-red-500 rounded px-1"
        @click="$emit('clear-all')"
      >
        Clear all
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Notification } from '~/types'

interface Props {
  notifications: Notification[]
  unreadCount: number
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'mark-read', id: string): void
  (e: 'mark-all-read'): void
  (e: 'clear-all'): void
  (e: 'close'): void
}>()

function onItemClick(n: Notification) {
  if (!n.is_read) {
    emit('mark-read', n.id)
  }
}

function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  const now = Date.now()
  const diffSec = Math.max(0, Math.floor((now - then) / 1000))

  if (diffSec < 60) return 'just now'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin} min ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr} hr ago`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 7) return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
</script>
