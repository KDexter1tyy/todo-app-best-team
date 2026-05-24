<template>
  <span
    v-if="state !== 'none'"
    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
    :class="badgeClasses"
    :aria-label="ariaLabel"
  >
    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
    {{ state === 'due' ? 'Due' : 'Upcoming' }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  reminderAt: string | null
  status: 'pending' | 'in-progress' | 'done'
}

const props = defineProps<Props>()

const state = computed<'none' | 'upcoming' | 'due'>(() => {
  if (!props.reminderAt) return 'none'
  const reminderTime = new Date(props.reminderAt).getTime()
  if (Number.isNaN(reminderTime)) return 'none'
  const now = Date.now()
  if (reminderTime > now) return 'upcoming'
  if (props.status === 'done') return 'none'
  return 'due'
})

const badgeClasses = computed(() => {
  if (state.value === 'due') {
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  }
  return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
})

const ariaLabel = computed(() =>
  state.value === 'due' ? 'Reminder due' : 'Reminder upcoming'
)
</script>
