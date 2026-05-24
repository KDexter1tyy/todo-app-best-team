"""Reminder checker module — pure detection logic for due notifications.

This module provides a pure function that determines which todos need
reminder or overdue notifications generated, without performing any I/O.
"""

from datetime import date, datetime, timezone


def check_user(
    user_id: str,
    todos: list[dict],
    existing_notifications: list[dict],
) -> list[tuple[str, str, str]]:
    """Detect todos that need notifications generated.

    Pure function — no I/O, no side effects.

    Args:
        user_id: UUID4 string of the user to check.
        todos: List of todo dicts for this user. Each dict has keys:
            - "id": str (UUID4)
            - "user_id": str (UUID4)
            - "title": str
            - "status": str ("pending" | "in-progress" | "done")
            - "due_date": str | None (ISO date "YYYY-MM-DD")
            - "reminder_at": str | None (ISO datetime "YYYY-MM-DDTHH:MM:SSZ")
        existing_notifications: List of notification dicts for this user. Each dict has keys:
            - "id": str (UUID4)
            - "user_id": str (UUID4)
            - "todo_id": str (UUID4)
            - "type": str ("reminder" | "overdue")
            - "is_read": bool

    Returns:
        List of tuples: [(todo_id, notification_type, message), ...]
        - todo_id: str (UUID4) — the todo that triggered the notification
        - notification_type: str — "reminder" or "overdue"
        - message: str — e.g., "Reminder: Buy groceries" or "Overdue: Submit report"
    """
    now = datetime.now(timezone.utc)
    today = date.today()
    results: list[tuple[str, str, str]] = []

    # Build a set of existing (todo_id, type) pairs for fast deduplication lookup
    existing_set: set[tuple[str, str]] = set()
    for notif in existing_notifications:
        todo_id = notif.get("todo_id", "")
        notif_type = notif.get("type", "")
        if todo_id and notif_type:
            existing_set.add((todo_id, notif_type))

    for todo in todos:
        todo_id = todo.get("id", "")
        status = todo.get("status", "")
        title = todo.get("title", "")

        # Skip completed todos
        if status == "done":
            continue

        # Check reminder_at: if set and <= now, generate reminder notification
        reminder_at_str = todo.get("reminder_at")
        if reminder_at_str:
            try:
                reminder_at = datetime.fromisoformat(
                    reminder_at_str.replace("Z", "+00:00")
                )
                if reminder_at <= now:
                    if (todo_id, "reminder") not in existing_set:
                        results.append((todo_id, "reminder", f"Reminder: {title}"))
            except (ValueError, TypeError):
                # Skip invalid reminder_at values
                pass

        # Check due_date: if set and < today, generate overdue notification
        due_date_str = todo.get("due_date")
        if due_date_str:
            try:
                due_date = date.fromisoformat(due_date_str)
                if due_date < today:
                    if (todo_id, "overdue") not in existing_set:
                        results.append((todo_id, "overdue", f"Overdue: {title}"))
            except (ValueError, TypeError):
                # Skip invalid due_date values
                pass

    return results
