# Requirements — Search by Title Feature

## Intent Analysis
- **User Request**: Add a search-by-title capability to the existing Todo application
- **Request Type**: New Feature (extending brownfield app)
- **Scope**: Multiple Components (backend service/router extension, frontend state, new UI component, dashboard wiring)
- **Complexity**: Low–Moderate — additive query parameter on the backend, debounced UI input on the frontend

---

## Functional Requirements

### FR-1: Backend Search Query Parameter
- `GET /api/todos` accepts a new optional query parameter `q` (string)
- `q` is trimmed of leading/trailing whitespace before evaluation
- When `q` is provided and non-empty after trim, results are filtered to todos whose `title` contains `q` (case-insensitive substring match)
- When `q` is missing or empty after trim, the endpoint behaves exactly as before (no filtering by title)
- `q` length is bounded to a maximum of 200 characters (matches title `max_length`)
- `q` length above 200 returns `422 Unprocessable Entity` with a clear validation message

### FR-2: Combinability with Existing Filters
- `q` is combinable with the existing `status`, `priority`, and `sort_by` query parameters
- Filtering order: user-scoping → title search → status filter → priority filter → sorting
- `q` does not change pagination behavior (no pagination exists today; search returns all matches)

### FR-3: Frontend API Client Type Extension
- The `todosApi.list` function accepts an optional `q?: string` parameter alongside existing `status`, `priority`, `sort_by`
- The TypeScript types in `frontend/types/index.ts` expose a shared `TodoListParams` type that includes `q?: string`
- Sending `q: undefined` or `q: ''` results in no `q` query parameter being attached (existing `apiFetch` already filters out undefined values; empty strings must be normalized client-side)

### FR-4: SearchBar UI Component
- A new component `SearchBar.vue` provides a single-line text input
- Placeholder text: `Search by title…`
- A leading magnifying-glass icon is rendered inside the input
- A trailing clear button (`×`) appears only when the input has a non-empty value
- Clicking the clear button empties the input and emits the change immediately (no debounce on clear)
- The component exposes a `v-model` interface (`modelValue: string` prop, `update:modelValue` event)
- The component is fully accessible: associated `<label>` (visible or visually-hidden), `aria-label`, keyboard-operable clear button, visible focus ring
- Component matches existing design tokens (`input-field` class, dark-mode-aware colors)

### FR-5: Debounced Search Input
- Typing in the search input is debounced for 300 ms before the change is propagated upward
- Clearing the input (via clear button or selecting all + delete) propagates immediately, with no debounce
- Debouncing happens inside `SearchBar.vue` (component-local concern), not in the store

### FR-6: State Integration
- The Pinia `todos` store gains a new state field `q: string | undefined`
- A new action `setSearchQuery(value: string | undefined)` updates the field
- `fetchTodos()` includes the current `q` in API params
- The `useTodos` composable exposes a `setSearchQuery` action that delegates to the store
- The dashboard wires `SearchBar`'s `update:modelValue` to call `setSearchQuery` and re-fetch todos

### FR-7: No-Results Empty State
- When the user has todos but a non-empty search query yields zero matches, the dashboard shows an empty state with:
  - Title: `No todos match "{query}"`
  - Description: `Try a different search term, or clear the search to see all todos.`
  - Action button: `Clear search`
- This empty state is visually distinct (or at minimum textually distinct) from the existing "no todos yet" empty state
- Clicking `Clear search` calls `setSearchQuery(undefined)` and re-fetches

### FR-8: Search Reset on Logout
- The search query is cleared from the store on logout (consistent with how filters/sort behave today)
- This is achieved by resetting the store state during the logout flow OR by ensuring the store is recreated on next login

---

## Non-Functional Requirements

### NFR-1: Performance
- Search must complete within 100 ms server-side for a typical user (< 100 todos)
- Frontend debouncing prevents API floods during fast typing

### NFR-2: Compatibility
- `q` is an additive, optional parameter — no breaking changes to existing API consumers
- Existing `GET /api/todos` callers (no `q`) continue to receive identical responses

### NFR-3: Simplicity
- No new backend dependencies (pure Python string operations)
- No new frontend dependencies (debounce implemented inline with `setTimeout`)
- JSON file storage unchanged

### NFR-4: Accessibility
- All new UI is keyboard-operable
- Color contrast meets the existing app's WCAG AA baseline
- Clear button has discernible accessible name (e.g., `aria-label="Clear search"`)

---

## Constraints
- Backend: Python FastAPI, extend existing `TodoService.list_todos` and `GET /api/todos` route
- Frontend: Nuxt 3, Vue 3 Composition API, Pinia, Tailwind CSS — match existing patterns (`FilterBar.vue`, `useTodos.ts`, `stores/todos.ts`)
- Storage: unchanged
- Auth: unchanged (existing httpOnly cookie JWT; search is per-user scoped)
- No new infrastructure or deployment changes
