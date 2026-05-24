# Unit of Work Dependencies — Search by Title

This document defines the EXACT contracts between units. Each contract specifies precise API signatures, request/response shapes, field names, and function signatures. Engineers MUST implement these contracts exactly as specified.

---

## Contract 1: Unit 1 → External (HTTP API)

**Provider**: Unit 1 (Backend Search Endpoint)
**Consumers**: Unit 2 (API Client), Unit 4 (Integration)

### Modified Endpoint: `GET /api/todos`

**Authentication**: httpOnly cookie `token` (JWT) — unchanged

**Query Parameters** (extended):
| Param | Type | Required | Description |
|---|---|---|---|
| `status` | string | No | (existing) `pending` \| `in-progress` \| `done` |
| `priority` | string | No | (existing) `low` \| `medium` \| `high` |
| `sort_by` | string | No | (existing) `due_date` \| `created_at` |
| `q` | string | No | **NEW** — case-insensitive substring to match against `title`. Max length 200. |

**Behavior**:
- `q` is trimmed before evaluation. Empty `q` (after trim) is treated as no filter.
- Match is case-insensitive substring on `Todo.title`.
- `q` is applied AFTER user_id scoping, BEFORE `status` and `priority` filters.
- Sorting (when `sort_by` is provided) is applied after all filtering.

**Request Examples**:
```
GET /api/todos?q=groceries
GET /api/todos?q=report&status=pending&sort_by=due_date
GET /api/todos?q=GROCER          (matches "Buy groceries")
GET /api/todos?q=                (empty after trim — same as no q)
```

**Response** (200 OK): `list[Todo]` — unchanged shape.

**Error Responses**:
- 401: `{ "detail": "Authentication required" }`
- 422: `{ "detail": [{ "field": "q", "message": "Search query must be 200 characters or fewer" }] }`

---

## Contract 2: Unit 1 → Internal (TodoService Method Signature)

**Provider**: Unit 1
**Consumer**: `routers/todos.py` (within Unit 1's own scope, but documented for clarity)

### Modified Function: `TodoService.list_todos`

**Signature** (extended):
```python
def list_todos(
    self,
    user_id: str,
    status: str | None = None,
    priority: str | None = None,
    sort_by: str | None = None,
    q: str | None = None,
) -> list[Todo]:
    """List user's todos with optional filtering, search, and sorting.

    Args:
        user_id: The authenticated user's ID.
        status: Optional status filter value.
        priority: Optional priority filter value.
        sort_by: Optional sort field ("due_date" or "created_at").
        q: Optional case-insensitive substring to match against title.
           Trimmed before use. Empty string after trim = no filter.
           Length > 200 chars raises ValidationError.

    Returns:
        A list of Todo objects matching the criteria.

    Raises:
        ValidationError: If filter/sort/q values are invalid.
    """
```

**Filtering Logic**:
```python
# Pseudocode
records = todo_store.read_all()
records = [r for r in records if r['user_id'] == user_id]
if q:
    q_norm = q.strip().lower()
    if q_norm:
        if len(q_norm) > 200: raise ValidationError(...)
        records = [r for r in records if q_norm in r['title'].lower()]
if status: records = [r for r in records if r['status'] == status]
if priority: records = [r for r in records if r['priority'] == priority]
# sort
return [Todo(**r) for r in records]
```

---

## Contract 3: Unit 2 → Unit 4 (TypeScript Types & API Client)

**Provider**: Unit 2
**Consumer**: Unit 4

### TypeScript Type: `TodoListParams`

**File**: `frontend/types/index.ts`

```typescript
export interface TodoListParams {
  status?: string
  priority?: string
  sort_by?: string
  q?: string
}
```

### Function: `todosApi.list`

**File**: `frontend/utils/api.ts`

**Signature**:
```typescript
list(params?: TodoListParams): Promise<Todo[]>
```

**Behavior**:
- Maps the params object to query string via existing `apiFetch` `params` option
- Empty-string `q` is normalized to `undefined` so no `q=` is appended
- Trimming is the caller's responsibility (the SearchBar/store handles it)

---

## Contract 4: Unit 3 → Unit 4 (SearchBar Component Interface)

**Provider**: Unit 3
**Consumer**: Unit 4

### Component: `SearchBar.vue`

**File**: `frontend/components/SearchBar.vue`

**Props**:
| Prop | Type | Default | Description |
|---|---|---|---|
| `modelValue` | `string` | `''` | The current search query (v-model) |
| `placeholder` | `string` | `'Search by title…'` | Input placeholder text |
| `debounceMs` | `number` | `300` | Debounce delay before emitting `update:modelValue` while typing |
| `ariaLabel` | `string` | `'Search todos by title'` | Accessible name for the input |

**Emits**:
| Event | Payload | When |
|---|---|---|
| `update:modelValue` | `string` | After `debounceMs` of typing inactivity, OR immediately when the clear button is clicked / value is emptied |

**Usage Example**:
```vue
<SearchBar
  :model-value="searchQuery"
  @update:model-value="handleSearchChange"
/>
```

**Behavior Specification**:
- Internal state holds the immediate input value for responsive UI
- A timer started on each keystroke; cleared/restarted on next keystroke
- After `debounceMs`, the timer fires and emits `update:modelValue` with the latest value
- The clear button (visible only when value non-empty) cancels any pending timer and emits `update:modelValue` with `''` immediately
- When the parent updates `modelValue` externally (e.g., via "Clear search" button in the empty state), the internal state syncs

---

## Contract 5: Unit 4 → Internal (Store / Composable)

**Provider**: Unit 4 (own scope, documented for testability)

### Pinia Store Extension

**File**: `frontend/stores/todos.ts`

**State extension**:
```typescript
interface TodosState {
  // …existing fields
  q: string | undefined
}
```

**New action**:
```typescript
setSearchQuery(value: string | undefined): void
// Normalizes '' to undefined; assigns to state.q.
// Does NOT trigger a fetch — the caller is responsible for that.
```

**`fetchTodos` extension**:
```typescript
// pass current state.q as q in the params object to todosApi.list
```

### Composable Extension

**File**: `frontend/composables/useTodos.ts`

**New exposed function**:
```typescript
setSearchQuery(value: string | undefined): void
// Delegates to the store's setSearchQuery.
```

---

## Integration Sequence (Runtime)

```
1. User types "groc" in the SearchBar input (Unit 3)
2. SearchBar's internal timer starts
3. After 300 ms of inactivity, SearchBar emits update:modelValue="groc"
4. Dashboard's @update:modelValue handler calls setSearchQuery("groc") then fetchTodos()
5. useTodos composable delegates setSearchQuery to the store (Unit 4)
6. Store's fetchTodos calls todosApi.list({ status, priority, sort_by, q: "groc" }) (Unit 4 → Unit 2)
7. todosApi.list builds GET /api/todos?q=groc and sends with credentials
8. Backend route handler receives q, passes to TodoService.list_todos (Unit 1)
9. TodoService applies user-scoping → q substring filter → status filter → priority filter → sort
10. Filtered Todo[] returned to frontend
11. Store updates state.todos; dashboard renders matching items, OR no-results empty state if length === 0 (Unit 4)
12. User clicks Clear (in input or in empty state) → SearchBar emits '' immediately → setSearchQuery(undefined) → fetchTodos()
```

---

## Dependency Graph (Build Order)

```
Unit 1 (Backend)        ← no upstream deps
Unit 2 (Types & API)    ← no upstream deps (works from spec)
Unit 3 (SearchBar)      ← no upstream deps
Unit 4 (Integration)    ← depends on Units 1, 2, 3 at integration; mockable during dev
```

**All 4 units can be developed in parallel.**

---

## Merge Order

1. **Unit 1** (backend) — adds the query parameter; safe additive change
2. **Unit 2** (types & API client) — adds the typed surface
3. **Unit 3** (SearchBar) — adds the component
4. **Unit 4** (integration) — wires everything; final visible feature
