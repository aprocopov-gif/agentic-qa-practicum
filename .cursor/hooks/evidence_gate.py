#!/usr/bin/env python3
"""Shared evidence scorer gate for Cursor hooks. Trusts only live scorer stdout."""

from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[2]
EVIDENCE_CURRENT = REPO_ROOT / ".test-artifacts" / "evidence" / "current.json"
APPROVALS_DIR = REPO_ROOT / ".test-artifacts" / "approvals"
SCORE_CMD = [
    "npx",
    "tsx",
    "scripts/score-evidence.ts",
    "--verify-only",
    str(EVIDENCE_CURRENT.relative_to(REPO_ROOT)),
]
JIRA_BUG_ISSUE_TYPE = "Bug"
JIRA_CREATE_TOOL_NAMES = frozenset({"createJiraIssue"})


def load_stdin_json() -> dict[str, Any]:
    raw = sys.stdin.read()
    if not raw.strip():
        raise ValueError("empty stdin")
    data = json.loads(raw)
    if not isinstance(data, dict):
        raise ValueError("hook payload must be a JSON object")
    return data


def git_branch() -> str:
    override = os.environ.get("EVIDENCE_GATE_FORCE_BRANCH")
    if override:
        return override.strip()
    proc = subprocess.run(
        ["git", "rev-parse", "--abbrev-ref", "HEAD"],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    if proc.returncode != 0:
        return ""
    return proc.stdout.strip()


def run_scorer() -> dict[str, Any]:
    if not EVIDENCE_CURRENT.is_file():
        return {
            "decisionId": "missing",
            "decision": "inconclusive",
            "side": None,
            "score": 0,
            "oracle": False,
            "verified": [],
            "missing": ["current.json"],
            "contradictions": [],
            "rule": "gate:no-evidence-file",
            "allowedActions": [],
        }

    override = os.environ.get("EVIDENCE_GATE_SCORE_JSON")
    if override:
        parsed = json.loads(override)
        if not isinstance(parsed, dict):
            raise ValueError("EVIDENCE_GATE_SCORE_JSON must be a JSON object")
        return parsed

    proc = subprocess.run(
        SCORE_CMD,
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    if proc.returncode != 0:
        stderr = proc.stderr.strip() or proc.stdout.strip()
        return {
            "decisionId": "scorer-error",
            "decision": "inconclusive",
            "side": None,
            "score": 0,
            "oracle": False,
            "verified": [],
            "missing": ["scorer-failed"],
            "contradictions": [],
            "rule": "gate:scorer-exit",
            "allowedActions": [],
            "scorerError": stderr[:500],
        }

    lines = [line for line in proc.stdout.splitlines() if line.strip()]
    if not lines:
        raise ValueError("scorer produced no stdout")
    result = json.loads(lines[-1])
    if not isinstance(result, dict):
        raise ValueError("scorer stdout was not a JSON object")
    return result


def has_human_approval(decision_id: str) -> bool:
    path = APPROVALS_DIR / f"{decision_id}.json"
    return path.is_file()


def heal_gate_allows(result: dict[str, Any]) -> bool:
    decision = result.get("decision")
    side = result.get("side")
    decision_id = str(result.get("decisionId", ""))
    if decision == "act" and side == "drift":
        return True
    if decision == "escalate" and decision_id and has_human_approval(decision_id):
        return True
    return False


def bug_gate_allows(result: dict[str, Any]) -> bool:
    decision = result.get("decision")
    side = result.get("side")
    decision_id = str(result.get("decisionId", ""))
    if decision == "act" and side == "bug":
        return True
    if decision == "escalate" and decision_id and has_human_approval(decision_id):
        return True
    return False


def format_denial(result: dict[str, Any], context: str) -> str:
    decision_id = result.get("decisionId", "unknown")
    decision = result.get("decision", "unknown")
    score = result.get("score", 0)
    rule = result.get("rule", "unknown")
    missing = result.get("missing") or []
    contradictions = result.get("contradictions") or []
    side = result.get("side")
    side_text = side if side else "none"
    missing_text = ", ".join(missing) if missing else "none"
    contradiction_text = ", ".join(contradictions) if contradictions else "none"
    return (
        f"Evidence gate blocked {context}. "
        f"decisionId={decision_id} decision={decision} side={side_text} score={score} rule={rule}. "
        f"Missing: {missing_text}. Contradictions: {contradiction_text}. "
        f"Run: npx tsx scripts/score-evidence.ts --verify-only .test-artifacts/evidence/current.json "
        f"(do not trust saved decision files or chat labels)."
    )


def emit_deny(message: str) -> None:
    payload = {
        "permission": "deny",
        "user_message": message,
        "agent_message": message,
    }
    sys.stdout.write(json.dumps(payload))
    sys.stdout.write("\n")
    print(message, file=sys.stderr)
    sys.exit(2)


def emit_allow() -> None:
    payload = {"permission": "allow"}
    sys.stdout.write(json.dumps(payload))
    sys.stdout.write("\n")
    sys.exit(0)


def write_path_from_tool_input(tool_input: Any) -> str | None:
    if not isinstance(tool_input, dict):
        return None
    for key in ("path", "file_path", "filePath", "target"):
        value = tool_input.get(key)
        if isinstance(value, str) and value.strip():
            return value.replace("\\", "/")
    return None


def normalize_repo_relative(path_value: str) -> str:
    path = Path(path_value)
    if path.is_absolute():
        try:
            return path.resolve().relative_to(REPO_ROOT).as_posix()
        except ValueError:
            return path.as_posix()
    return path.as_posix()


def parse_mcp_tool_input(raw: Any) -> dict[str, Any]:
    if isinstance(raw, dict):
        return raw
    if isinstance(raw, str) and raw.strip():
        parsed = json.loads(raw)
        if isinstance(parsed, dict):
            return parsed
    return {}


def is_jira_bug_create(tool_name: str, tool_input: dict[str, Any]) -> bool:
    if tool_name not in JIRA_CREATE_TOOL_NAMES:
        return False
    issue_type = tool_input.get("issueType") or tool_input.get("issue_type")
    if not isinstance(issue_type, str):
        return False
    return issue_type.strip().lower() == JIRA_BUG_ISSUE_TYPE.lower()
