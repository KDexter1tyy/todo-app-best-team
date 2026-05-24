<template>
  <div class="relative w-full">
    <!-- Visually-hidden label for screen readers -->
    <label :for="inputId" class="sr-only">{{ ariaLabel }}</label>

    <!-- Leading magnifying-glass icon -->
    <span
      class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-secondary-400 dark:text-secondary-500"
      aria-hidden="true"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
        />
      </svg>
    </span>

    <!-- Search input -->
    <input
      :id="inputId"
      ref="inputRef"
      :value="internalValue"
      type="search"
      :placeholder="placeholder"
      :aria-label="ariaLabel"
      class="input-field text-sm py-1.5 pl-9 pr-9"
      autocomplete="off"
      @input="onInput"
      @keydown.esc="clearInput"
    />

    <!-- Trailing clear button (only when there's text) -->
    <button
      v-if="internalValue.length > 0"
      type="button"
      class="absolute inset-y-0 right-0 flex items-center pr-2.5 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-200 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-r-md"
      aria-label="Clear search"
      @click="clearInput"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'

interface Props {
  modelValue: string
  placeholder?: string
  debounceMs?: number
  ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Search by title…',
  debounceMs: 300,
  ariaLabel: 'Search todos by title',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

// Stable id per instance for label/input association
const inputId = `search-bar-${Math.random().toString(36).slice(2, 10)}`

const inputRef = ref<HTMLInputElement | null>(null)
const internalValue = ref<string>(props.modelValue)
let debounceTimer: ReturnType<typeof setTimeout> | null = null

function clearTimer() {
  if (debounceTimer !== null) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
}

function onInput(event: Event) {
  const target = event.target as HTMLInputElement
  const next = target.value
  internalValue.value = next

  clearTimer()

  // Empty input emits immediately (no debounce on clear-by-typing-empty)
  if (next.length === 0) {
    emit('update:modelValue', '')
    return
  }

  debounceTimer = setTimeout(() => {
    emit('update:modelValue', internalValue.value)
    debounceTimer = null
  }, props.debounceMs)
}

function clearInput() {
  clearTimer()
  internalValue.value = ''
  emit('update:modelValue', '')
  inputRef.value?.focus()
}

// Sync external changes to modelValue (e.g., parent calls "Clear search" elsewhere)
watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal !== internalValue.value) {
      internalValue.value = newVal
      // External change — cancel any pending emit since the parent already knows
      clearTimer()
    }
  }
)

onUnmounted(() => {
  clearTimer()
})
</script>
