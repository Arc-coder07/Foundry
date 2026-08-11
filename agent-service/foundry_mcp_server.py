"""
Foundry MCP Server
==================
Exposes the Foundry Product Thinking OS workspace as an MCP server.
Any MCP-compatible client (Claude Desktop, Cursor, Antigravity CLI, IDE AI)
can connect and read/write workspace items, attachments, and milestones.

Run standalone:   python foundry_mcp_server.py
Run via FastMCP:  fastmcp dev foundry_mcp_server.py
"""

import json
import os
from pathlib import Path
from datetime import datetime
from typing import Optional

from fastmcp import FastMCP

# --- Paths ---
PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "data"
DB_FILE = DATA_DIR / "db.json"
MILESTONES_FILE = DATA_DIR / "milestones.json"
ATTACHMENTS_DIR = DATA_DIR / "attachments"

# --- Initialize MCP Server ---
mcp = FastMCP(
    "FoundryMCP",
    instructions=(
        "You are connected to the Foundry Product Thinking OS. "
        "Use the provided tools to read, search, create, and update "
        "workspace items (Ideas, PRDs, Research, etc.), milestones, "
        "and AI-generated research reports."
    ),
)

# --- Database Helpers ---

def _read_items() -> list[dict]:
    """Read all workspace items from disk."""
    if not DB_FILE.exists():
        return []
    return json.loads(DB_FILE.read_text(encoding="utf-8"))


def _write_items(items: list[dict]) -> None:
    """Write workspace items to disk."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    DB_FILE.write_text(json.dumps(items, indent=2), encoding="utf-8")


def _read_milestones() -> list[dict]:
    """Read all milestones from disk."""
    if not MILESTONES_FILE.exists():
        return []
    return json.loads(MILESTONES_FILE.read_text(encoding="utf-8"))


def _write_milestones(milestones: list[dict]) -> None:
    """Write milestones to disk."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    MILESTONES_FILE.write_text(json.dumps(milestones, indent=2), encoding="utf-8")


# ============================================================================
# TOOLS
# ============================================================================

@mcp.tool()
def foundry_list_items(
    item_type: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    tag: Optional[str] = None,
) -> str:
    """List all workspace items in Foundry, with optional filters.

    Args:
        item_type: Filter by type (Idea, Research, PRD, Architecture, Experiment, Task, Launch).
        status: Filter by status (Captured, Expanded, Validated, Planning, Building, Released, Archived).
        priority: Filter by priority (Low, Medium, High).
        tag: Filter by a specific tag.

    Returns:
        A JSON array of workspace item summaries.
    """
    items = _read_items()

    if item_type:
        items = [i for i in items if i.get("type", "").lower() == item_type.lower()]
    if status:
        items = [i for i in items if i.get("status", "").lower() == status.lower()]
    if priority:
        items = [i for i in items if i.get("priority", "").lower() == priority.lower()]
    if tag:
        items = [i for i in items if tag.lower() in [t.lower() for t in i.get("tags", [])]]

    summaries = []
    for item in items:
        summaries.append({
            "id": item["id"],
            "title": item["title"],
            "type": item.get("type"),
            "status": item.get("status"),
            "priority": item.get("priority"),
            "tags": item.get("tags", []),
            "summary": item.get("summary", ""),
            "createdAt": item.get("createdAt"),
            "updatedAt": item.get("updatedAt"),
        })

    return json.dumps(summaries, indent=2)


@mcp.tool()
def foundry_get_item(item_id: str) -> str:
    """Get full details of a specific workspace item by its ID.

    Args:
        item_id: The unique ID of the workspace item.

    Returns:
        Full JSON object of the workspace item, or an error message if not found.
    """
    items = _read_items()
    for item in items:
        if item["id"] == item_id:
            return json.dumps(item, indent=2)
    return json.dumps({"error": f"Item '{item_id}' not found."})


@mcp.tool()
def foundry_search_items(query: str) -> str:
    """Full-text search across workspace item titles, summaries, problems, and solutions.

    Args:
        query: The search query string. Case-insensitive.

    Returns:
        A JSON array of matching item summaries.
    """
    items = _read_items()
    query_lower = query.lower()
    results = []

    for item in items:
        searchable = " ".join([
            item.get("title", ""),
            item.get("summary", ""),
            item.get("problem", ""),
            item.get("proposedSolution", ""),
            item.get("uniqueInsight", ""),
            item.get("targetAudience", ""),
            item.get("longTermVision", ""),
        ]).lower()

        if query_lower in searchable:
            results.append({
                "id": item["id"],
                "title": item["title"],
                "type": item.get("type"),
                "status": item.get("status"),
                "summary": item.get("summary", ""),
            })

    return json.dumps(results, indent=2)


@mcp.tool()
def foundry_create_item(
    title: str,
    item_type: str = "Idea",
    summary: str = "",
    problem: str = "",
    proposed_solution: str = "",
    unique_insight: str = "",
    target_audience: str = "",
    tags: Optional[list[str]] = None,
    priority: str = "Medium",
) -> str:
    """Create a new workspace item in Foundry.

    Args:
        title: The title of the new item.
        item_type: The type (Idea, Research, PRD, Architecture, Experiment, Task, Launch). Default: Idea.
        summary: A one-sentence summary.
        problem: The problem this item addresses.
        proposed_solution: The proposed solution.
        unique_insight: What makes this unique.
        target_audience: Who this is for.
        tags: A list of tags for organization.
        priority: Low, Medium, or High. Default: Medium.

    Returns:
        The full JSON object of the newly created item.
    """
    items = _read_items()
    now = datetime.now().isoformat()

    new_item = {
        "id": f"item-{int(datetime.now().timestamp() * 1000)}",
        "type": item_type,
        "title": title,
        "summary": summary,
        "status": "Captured",
        "problem": problem,
        "proposedSolution": proposed_solution,
        "uniqueInsight": unique_insight,
        "targetAudience": target_audience,
        "validationHypothesis": "",
        "mvp": "",
        "longTermVision": "",
        "businessModel": "",
        "technicalChallenges": "",
        "provenance": datetime.now().strftime("%b %d, %Y").upper(),
        "source": "MCP",
        "confidence": "",
        "priority": priority,
        "interestLevel": "",
        "difficulty": "Medium",
        "tags": tags or [],
        "collection": item_type,
        "pinned": False,
        "createdAt": now,
        "updatedAt": now,
        "relatedIds": [],
        "timeline": [],
        "decisions": [],
        "attachments": [],
        "moodboard": [],
    }

    items.append(new_item)
    _write_items(items)
    return json.dumps(new_item, indent=2)


@mcp.tool()
def foundry_update_item(
    item_id: str,
    title: Optional[str] = None,
    summary: Optional[str] = None,
    status: Optional[str] = None,
    problem: Optional[str] = None,
    proposed_solution: Optional[str] = None,
    priority: Optional[str] = None,
    tags: Optional[list[str]] = None,
) -> str:
    """Update fields on an existing workspace item.

    Args:
        item_id: The ID of the item to update.
        title: New title (optional).
        summary: New summary (optional).
        status: New status (optional).
        problem: New problem statement (optional).
        proposed_solution: New proposed solution (optional).
        priority: New priority (optional).
        tags: New tags list (optional, replaces existing tags).

    Returns:
        The updated item JSON, or an error if not found.
    """
    items = _read_items()
    for item in items:
        if item["id"] == item_id:
            if title is not None:
                item["title"] = title
            if summary is not None:
                item["summary"] = summary
            if status is not None:
                item["status"] = status
            if problem is not None:
                item["problem"] = problem
            if proposed_solution is not None:
                item["proposedSolution"] = proposed_solution
            if priority is not None:
                item["priority"] = priority
            if tags is not None:
                item["tags"] = tags
            item["updatedAt"] = datetime.now().isoformat()
            _write_items(items)
            return json.dumps(item, indent=2)

    return json.dumps({"error": f"Item '{item_id}' not found."})


@mcp.tool()
def foundry_get_attachment(item_id: str, filename: str) -> str:
    """Read the contents of a markdown attachment file for a workspace item.

    Args:
        item_id: The workspace item ID.
        filename: The stored filename of the attachment.

    Returns:
        The markdown text content, or an error message.
    """
    file_path = ATTACHMENTS_DIR / item_id / filename
    if not file_path.exists():
        return json.dumps({"error": f"Attachment '{filename}' not found for item '{item_id}'."})
    return file_path.read_text(encoding="utf-8")


@mcp.tool()
def foundry_list_milestones(item_id: Optional[str] = None) -> str:
    """List all milestones from the Forge Timeline, optionally filtered by linked item.

    Args:
        item_id: If provided, only return milestones linked to this item.

    Returns:
        A JSON array of milestones.
    """
    milestones = _read_milestones()
    if item_id:
        milestones = [m for m in milestones if m.get("itemId") == item_id]
    return json.dumps(milestones, indent=2)


@mcp.tool()
def foundry_create_milestone(
    title: str,
    date: str,
    milestone_type: str = "custom",
    item_id: Optional[str] = None,
    note: str = "",
) -> str:
    """Create a new milestone in the Forge Timeline.

    Args:
        title: The milestone title.
        date: The date in YYYY-MM-DD format.
        milestone_type: The type (deadline, review, launch, custom). Default: custom.
        item_id: Optionally link this milestone to a workspace item ID.
        note: An optional note or description.

    Returns:
        The newly created milestone JSON.
    """
    milestones = _read_milestones()

    new_milestone = {
        "id": f"ms-{int(datetime.now().timestamp() * 1000)}",
        "title": title,
        "date": date,
        "itemId": item_id or "",
        "type": milestone_type,
        "completed": False,
        "note": note,
    }

    milestones.append(new_milestone)
    _write_milestones(milestones)
    return json.dumps(new_milestone, indent=2)


@mcp.tool()
def foundry_workspace_summary() -> str:
    """Get a high-level summary of the entire Foundry workspace.

    Returns:
        JSON with counts by type, status, priority, total items, and total milestones.
    """
    items = _read_items()
    milestones = _read_milestones()

    by_type: dict[str, int] = {}
    by_status: dict[str, int] = {}
    by_priority: dict[str, int] = {}

    for item in items:
        t = item.get("type", "Unknown")
        s = item.get("status", "Unknown")
        p = item.get("priority", "Unknown")
        by_type[t] = by_type.get(t, 0) + 1
        by_status[s] = by_status.get(s, 0) + 1
        by_priority[p] = by_priority.get(p, 0) + 1

    return json.dumps({
        "total_items": len(items),
        "total_milestones": len(milestones),
        "items_by_type": by_type,
        "items_by_status": by_status,
        "items_by_priority": by_priority,
    }, indent=2)


# ============================================================================
# RESOURCES
# ============================================================================

@mcp.resource("foundry://workspace/summary")
def workspace_summary_resource() -> str:
    """High-level workspace statistics."""
    return foundry_workspace_summary()


@mcp.resource("foundry://items/list")
def items_list_resource() -> str:
    """Complete list of all workspace items (summaries only)."""
    return foundry_list_items()


# --- Entry Point ---

if __name__ == "__main__":
    mcp.run()
