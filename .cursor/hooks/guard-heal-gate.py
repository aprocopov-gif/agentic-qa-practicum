#!/usr/bin/env python3
"""preToolUse (Write): POM edits on heal/* branches require evidence gate."""

from __future__ import annotations

import sys

from evidence_gate import (
    emit_allow,
    emit_deny,
    format_denial,
    git_branch,
    heal_gate_allows,
    load_stdin_json,
    normalize_repo_relative,
    run_scorer,
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
    branch = git_branch()
    if not branch.startswith("heal/"):
        emit_allow()
    if not normalized.startswith("pages/"):
        emit_allow()

    result = run_scorer()
    if heal_gate_allows(result):
        emit_allow()
    emit_deny(format_denial(result, f"Write to {normalized} on branch {branch}"))


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # noqa: BLE001 — hook must fail closed
        emit_deny(f"Evidence heal gate error: {exc}")

