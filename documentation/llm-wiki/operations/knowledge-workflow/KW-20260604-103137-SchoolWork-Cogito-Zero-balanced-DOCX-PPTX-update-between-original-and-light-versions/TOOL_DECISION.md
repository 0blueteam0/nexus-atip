# Tool Decision

## Tools checked
- python-docx: used for DOCX generation and QA.
- python-pptx: used for PPTX generation and QA.
- uv: used to run ephemeral dependency environment.
- Node/npm/npx: available; no extra install needed for this artifact.
- LibreOffice/soffice: not available in PATH, so rendered PDF/image visual QA was not claimed.
- MCP configs audited: .gemini/settings.json and .codex/config.toml contain multiple MCP servers, including filesystem/desktop_commander/shrimp_task/sequential_thinking and others. Current Hermes session did not expose direct native MCP tools without restart, so built-in Hermes tools plus delegate_task agents were used.

## Agents used
- DOCX content strategy subagent: proposed balanced structure and content recovery points.
- PPTX design/story subagent: proposed 14-slide balanced deck and restrained palette/layout strategy.

## Decision
Use direct Office document generation via Python because it is deterministic, locally available, and sufficient for creating editable DOCX/PPTX copies.
