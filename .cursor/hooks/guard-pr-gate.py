#!/usr/bin/env python3
"""beforeShellExecution: gh pr create on heal/* requires evidence gate."""

from __future__ import annotations

import re
import sys

from evidence_gate import (
    emit_allow,
    emit_deny,
    format_denial,
    git_branch,
    heal_gate_allows,
    load_stdin_json,
    run_scorer,
)

PR_CREATE = re.compile(r"(^|\s)gh\s+pr\s+create\b")


def main() -> None:
    payload = load_stdin_json()
    command = payload.get("command")
    if not isinstance(command, str) or not PR_CREATE.search(command):
        emit_allow()

    branch = git_branch()
    if not branch.startswith("heal/"):
        emit_allow()

    result = run_scorer()
    if heal_gate_allows(result):
        emit_allow()
    emit_deny(format_denial(result, f"`gh pr create` on branch {branch}"))


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # noqa: BLE001
        emit_deny(f"Evidence PR gate error: {exc}")

