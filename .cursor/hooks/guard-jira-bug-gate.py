#!/usr/bin/env python3
"""beforeMCPExecution: Jira Bug create requires evidence gate."""

from __future__ import annotations

import sys

from evidence_gate import (
    bug_gate_allows,
    emit_allow,
    emit_deny,
    format_denial,
    is_jira_bug_create,
    load_stdin_json,
    parse_mcp_tool_input,
    run_scorer,
)


def main() -> None:
    payload = load_stdin_json()
    tool_name = payload.get("tool_name")
    if not isinstance(tool_name, str):
        emit_allow()

    tool_input = parse_mcp_tool_input(payload.get("tool_input"))
    if not is_jira_bug_create(tool_name, tool_input):
        emit_allow()

    result = run_scorer()
    if bug_gate_allows(result):
        emit_allow()
    emit_deny(format_denial(result, f"MCP {tool_name} issueType Bug"))


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # noqa: BLE001
        emit_deny(f"Evidence Jira gate error: {exc}")

