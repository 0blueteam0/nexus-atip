# Tooling

Available/used:
- uv: ephemeral Python dependency execution.
- python-docx: DOCX generation and QA.
- python-pptx: PPTX generation and structural QA.
- delegate_task: DOCX and PPTX strategy subagents.
- Hermes file/terminal tools: script creation, command execution, evidence logging.

Audited but not directly used as native current-session tools:
- MCP servers in .gemini/settings.json and .codex/config.toml, including desktop-commander, filesystem, shrimp-task, sequential-thinking, gateway-related servers. Current Hermes session would require native MCP configuration/restart for direct exposure.

Unavailable:
- soffice/libreoffice in PATH for rendered visual QA.
