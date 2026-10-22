#!/usr/bin/env python3
"""preToolUse (Write): agents must never create human approval files."""

from __future__ import annotations

import sys

from evidence_gate import (
    emit_allow,
    emit_deny,
    load_stdin_json,
    normalize_repo_relative,
    write_path_from_tool_input,
)


def main() -> None:
    payload = load_stdin_json()
    if payload.get("tool_name") != "Write":
        emit_allow()

    rel = write_path_from_tool_input(payload.get("tool_input"))
    if not rel:
        emit_allow()

    normalized = normalize_repo_relative(rel)
    if not normalized.startswith(".test-artifacts/approvals/"):
        emit_allow()

    message = (
        "Blocked: .test-artifacts/approvals/ files are human-authored only. "
        "Create approval JSON by hand after reviewing evidence scorer output."
    )
    emit_deny(message)


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # noqa: BLE001
        emit_deny(f"Approvals guard error: {exc}")
