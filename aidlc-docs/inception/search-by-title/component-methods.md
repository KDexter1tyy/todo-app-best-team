# Component Methods — Search by Title

## TodoService Extensions (Unit 1)

### Modified: `list_todos(user_id, status, priority, sort_by, q) -> list[Todo]`
- New parameter `q: str | None = None`
- If `q` is provided:
  - `q_norm = q.strip().lower()`
  - If `len(q_norm) > 200`: raise `ValidationError([{ "field": "q", "message": "Search query must be 200 characters or fewer" }])`
  - If `q_norm` is non-empty: keep only records where `q_norm in record["title"].lower()`
- All other behavior unchanged
- `q` filter is applied AFTER user-scoping, BEFORE `status` and `priority` filters

---

## Todos Router Extensions (Unit 1)

### Modified: `GET /api/todos`
- New `Query` parameter `q: str | None = None` with description `"Search by title (case-insensitive substring)"`
- Passes `q` through to `todo_service.list_todos`
- No additional validation in the router (service handles length check)

---

## todosApi (Unit 2)

### Modified: `todosApi.list(params?: TodoListParams) -> Promise<Todo[]>`
- Accepts `TodoListParams` (status, priority, sort_by, q — all optional)
- Normalizes empty-string `q` to `undefined` before passing to `apiFetch`
- Returns `Todo[]` from `GET /api/todos`

---

## TodoListParams Type (Unit 2)

### New Type
```typescript
export interface TodoListParams {
  status?: string
  priority?: string
  sort_by?: string
  q?: string
}
```

---

## SearchBar.vue (Unit 3)

### Props
- `modelValue: string` — current value (v-model)
- `placeholder?: string` — default `'Search by title…'`
- `debounceMs?: number` — default `300`
- `ariaLabel?: string` — default `'Search todos by title'`

### Emits
- `update:modelValue: (value: string) => void`

### Internal Methods (private to component)

- `onInput(event: Event) -> void`
  - Reads the new input value into a local `internalValue` ref
  - Cancels any pending debounce timer
  - If new value is empty: emit `update:modelValue('')` immediately
  - Otherwise: start a `debounceMs` timer; on fire, emit `update:modelValue(internalValue)`

- `clearInput() -> void`
  - Cancels any pending debounce timer
  - Sets `internalValue = ''`
  - Emits `update:modelValue('')` immediately
  - Returns focus to the input

- `watch(modelValue) -> void`
  - When the parent updates `modelValue` externally, sync `internalValue`

### Lifecycle
- `onUnmounted` — clear any pending debounce timer

---

## Todos Pinia Store (Unit 4)

### State Extension
- `q: string | undefined` — current search query

### Modified: `fetchTodos() -> Promise<void>`
- Includes `q: this.q` in the params passed to `todosApi.list`

### New: `setSearchQuery(value: string | undefined) -> void`
- Normalizes `''` to `undefined`
- Assigns to `state.q`
- Does NOT trigger fetch (caller is responsible)

---

## useTodos Composable (Unit 4)

### New Exposed: `setSearchQuery(value: string | undefined) -> void`
- Delegates to `store.setSearchQuery(value)`

---

## Dashboard Page (Unit 4)

### New Local State
- `searchQuery: Ref<string | undefined>` — synced with store via watch or directly bound

### New Handler: `handleSearchChange(value: string) -> Promise<void>`
- Normalizes `''` to `undefined`
- Calls `setSearchQuery(normalized)`
- Calls `fetchTodos()` (and `fetchStats()` if stats should also reflect search — out of scope per requirements; stats remain global)

### New Handler: `handleClearSearch() -> Promise<void>`
- Calls `handleSearchChange('')`

### Template Additions
- Mount `<SearchBar />` above (or inside) the existing FilterBar section
- Replace empty-state rendering: if `todos.length === 0` AND `searchQuery` is non-empty, show search-specific empty state with `Clear search` button; else show existing "no todos yet" empty state
