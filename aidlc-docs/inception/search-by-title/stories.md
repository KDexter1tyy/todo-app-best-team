# User Stories — Search by Title

## Epic: Find Todos Quickly

### US-1: Search Todos by Keyword
**As** Alex (busy professional with many todos),
**I want to** type a keyword into a search box and see only todos whose title contains that keyword,
**So that** I can find a specific task without scrolling through dozens of items.

**Acceptance Criteria:**
- [ ] A search input is visible on the dashboard above the todo list
- [ ] Typing a keyword filters the list to titles containing that keyword
- [ ] Matching is case-insensitive (`"GROCER"` matches `"Buy groceries"`)
- [ ] Matching is substring-based (`"groc"` matches `"Buy groceries"`)
- [ ] The filter is applied server-side via `GET /api/todos?q={query}`
- [ ] Typing is debounced 300 ms — no API call fires on every keystroke

---

### US-2: Clear Search to See All Todos
**As** Alex,
**I want to** clear the search input with a single click,
**So that** I can quickly return to the full todo list without retyping or refreshing.

**Acceptance Criteria:**
- [ ] A clear button (`×`) appears inside the search input when it has text
- [ ] Clicking the clear button empties the input
- [ ] The full todo list is re-fetched immediately (no debounce on clear)
- [ ] The clear button has an accessible name (`aria-label="Clear search"`)
- [ ] The clear button is keyboard-operable (Enter / Space activate it)

---

### US-3: See Helpful Feedback When No Matches Are Found
**As** Sam (team lead with many todos),
**I want to** see a clear message when my search returns no results,
**So that** I understand the list is empty due to my search, not because I have no todos.

**Acceptance Criteria:**
- [ ] When the search query yields zero matches, an empty state is shown
- [ ] The empty state title displays the searched term: `No todos match "{query}"`
- [ ] A `Clear search` button is shown in the empty state
- [ ] Clicking `Clear search` clears the query and re-fetches all todos
- [ ] This state is distinct from the "no todos yet" empty state shown when the user has zero todos

---

### US-4: Combine Search with Existing Filters and Sort
**As** Alex,
**I want to** apply a search keyword on top of my existing status / priority filters and sort,
**So that** I can find a high-priority pending task by typing only the first few letters of its title.

**Acceptance Criteria:**
- [ ] Search works alongside `status` filter, `priority` filter, and `sort_by`
- [ ] Filters and search are combined with AND semantics (e.g., `priority=high AND status=pending AND title contains "report"`)
- [ ] Sorting is applied after all filtering, including search
- [ ] Changing one filter does not clear the others (search persists when status changes, etc.)

---

## Story Summary

| ID | Story | Unit |
|---|---|---|
| US-1 | Search Todos by Keyword | Unit 1 (Backend) + Unit 3 (SearchBar) + Unit 4 (Integration) |
| US-2 | Clear Search to See All Todos | Unit 3 (SearchBar) + Unit 4 (Integration) |
| US-3 | No-Results Empty State | Unit 4 (Integration) |
| US-4 | Combine Search with Filters/Sort | Unit 1 (Backend) + Unit 4 (Integration) |
