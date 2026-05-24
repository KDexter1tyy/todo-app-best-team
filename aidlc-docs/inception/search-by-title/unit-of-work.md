# Units of Work — Search by Title

## Decomposition: 4 Units for Parallel Development

This feature is decomposed into exactly 4 units of work. Each unit can be developed by an independent engineer. Units communicate through well-defined contracts (see `unit-of-work-dependency.md`).

---

## Unit 1: Backend Search Endpoint

**Responsibility**: Extend `TodoService.list_todos` and the `GET /api/todos` route to accept an optional `q` query parameter and perform case-insensitive substring filtering on `title`.

**Owns**:
- `q` query parameter on `GET /api/todos`
- Title-search filtering logic in `TodoService.list_todos`
- Validation of `q` length (≤ 200 chars)

**Files**:
| File | Action | Description |
|---|---|---|
| `backend/services/todo_service.py` | Modify | Add `q: str \| None = None` parameter to `list_todos`; trim, lowercase, substring-match `title`; raise `ValidationError` if `q` length > 200 |
| `backend/routers/todos.py` | Modify | Add `q` `Query` parameter to `list_todos` route handler; pass through to service |

**API Contracts Exposed** (consumed by Unit 4):
- `GET /api/todos?q={query}` — returns user's todos filtered by case-insensitive title substring
- `q` is combinable with existing `status`, `priority`, `sort_by` parameters
- Response shape unchanged: `list[Todo]`

**Dependencies**: None — fully standalone backend change

---

## Unit 2: Frontend Types & API Client

**Responsibility**: Update TypeScript types and the `todosApi.list` client function to support the new `q` parameter.

**Owns**:
- `TodoListParams` type definition (or inline param type on `todosApi.list`)
- `todosApi.list` signature

**Files**:
| File | Action | Description |
|---|---|---|
| `frontend/types/index.ts` | Modify | Export a new `TodoListParams` type with `status?`, `priority?`, `sort_by?`, `q?` |
| `frontend/utils/api.ts` | Modify | Update `todosApi.list` signature to accept `TodoListParams`; ensure empty-string `q` is not sent |

**Contracts Exposed** (consumed by Unit 4):
- `todosApi.list({ q: 'foo' })` calls `GET /api/todos?q=foo`
- `TodoListParams` is importable from `~/types`

**Dependencies**: None — types and the API client wrap Unit 1's HTTP contract, but they can be authored from the contract spec without Unit 1 being merged

---

## Unit 3: SearchBar UI Component

**Responsibility**: Create a standalone, reusable, accessible, debounced search input component.

**Owns**:
- `SearchBar.vue` component
- Local debounce logic (300 ms)
- Clear button + icon styling

**Files**:
| File | Action | Description |
|---|---|---|
| `frontend/components/SearchBar.vue` | Create | Search input + leading icon + trailing clear button; v-model interface; 300 ms debounce; accessible markup |

**Contracts Exposed** (consumed by Unit 4):
- Props: `modelValue: string`, `placeholder?: string` (default `'Search by title…'`), `debounceMs?: number` (default `300`)
- Emits: `update:modelValue` with the new string value
- Behavior: typing emits debounced after `debounceMs`; clear emits immediately

**Dependencies**: None — pure presentational component, no API or store coupling

---

## Unit 4: Dashboard Integration & State

**Responsibility**: Wire SearchBar into the dashboard, manage the search query in the Pinia store and `useTodos` composable, render the no-results empty state, and ensure search resets on logout.

**Owns**:
- `q` state field and `setSearchQuery` action in the todos store
- `setSearchQuery` exposure on the `useTodos` composable
- `SearchBar` placement on `pages/dashboard.vue`
- No-results empty state rendering on the dashboard

**Files**:
| File | Action | Description |
|---|---|---|
| `frontend/stores/todos.ts` | Modify | Add `q: string \| undefined` to state; include `q` in `fetchTodos` params; add `setSearchQuery` action; reset `q` on store reset |
| `frontend/composables/useTodos.ts` | Modify | Expose `setSearchQuery` from the composable |
| `frontend/pages/dashboard.vue` | Modify | Mount `SearchBar` above the FilterBar; bind to local ref synced with store; render no-results empty state when search yields zero matches |

**Depends On**:
- **Unit 1** — for the backend `q` query parameter to actually filter results (can mock during dev)
- **Unit 2** — for the typed API client signature
- **Unit 3** — for the `SearchBar` component to import and mount

---

## Unit Ownership Summary

| File | Unit 1 | Unit 2 | Unit 3 | Unit 4 |
|---|---|---|---|---|
| `backend/services/todo_service.py` | ✓ modifies | — | — | — |
| `backend/routers/todos.py` | ✓ modifies | — | — | — |
| `frontend/types/index.ts` | — | ✓ modifies | — | — |
| `frontend/utils/api.ts` | — | ✓ modifies | — | — |
| `frontend/components/SearchBar.vue` | — | — | ✓ owns | — |
| `frontend/stores/todos.ts` | — | — | — | ✓ modifies |
| `frontend/composables/useTodos.ts` | — | — | — | ✓ modifies |
| `frontend/pages/dashboard.vue` | — | — | — | ✓ modifies |

**Shared File Conflict Resolution**: None — every shared file in this feature is touched by exactly one unit. Clean ownership.

---

## Dependency Graph (Build Order)

```
Unit 1 (Backend Search)        ← no dependencies, can start immediately
Unit 2 (Types & API Client)    ← no dependencies (works from contract spec), can start immediately
Unit 3 (SearchBar Component)   ← no dependencies, can start immediately
Unit 4 (Dashboard Integration) ← depends on Units 2 + 3 at integration time;
                                 depends on Unit 1 for end-to-end behavior
```

**All 4 units can be developed in parallel** because:
- Units 1, 2, and 3 have no upstream dependencies and can ship independently
- Unit 4 can be built against mock data and a placeholder for `SearchBar` until Units 2 and 3 land

---

## Merge Order (Integration)

1. **Unit 1** merges first (provides backend filtering)
2. **Unit 2** merges second (provides typed API surface)
3. **Unit 3** merges third (provides UI component)
4. **Unit 4** merges last (wires everything together)
