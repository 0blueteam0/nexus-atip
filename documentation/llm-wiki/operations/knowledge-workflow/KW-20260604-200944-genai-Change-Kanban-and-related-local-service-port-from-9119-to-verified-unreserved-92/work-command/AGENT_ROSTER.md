---
type: work_command_record
task_id: KW-20260604-200944-genai-Change-Kanban-and-related-local-service-port-from-9119-to-verified-unreserved-92
project: genai
task: Change Kanban and related local service port from 9119 to verified unreserved 9203
created: 2026-06-04T20:09:44+09:00
source_package: K:/wiki/work command
---

# AGENT_ROSTER

## Roles Considered

| role | responsibility | used | reason |
|---|---|---|---|

## Handoff Rules



## Completion detail - 2026-06-04T20:15:14.688483+09:00
- scope: Change active Hermes Codex launcher dashboard/browser-chat port from reserved `9119` to verified unreserved `9203`.
- changed_artifact: `J:/PortableApps/genai/hermes-codex.bat`
- verification_1: `cmd.exe //C "hermes-codex.bat --where"` exit_code 0; emitted `HERMES_DASHBOARD_URL=http://127.0.0.1:9203/` and `HERMES_DASHBOARD_CHAT_URL=http://127.0.0.1:9203/chat`.
- verification_2: `cmd.exe //C "hermes-codex.bat --help"` exit_code 0; `--chat` help now shows `http://127.0.0.1:9203/chat`.
- verification_3: `netsh interface ipv4 show excludedportrange protocol=tcp` confirmed reserved range `9103-9202`; `9203` is outside it.
- verification_4: Python `socket.bind(('127.0.0.1', 9203))` succeeded.
- actor: Codex/Hermes agent performed scoped launcher edit and verification.


## Additional model default update - 2026-06-04T20:16:42.120771+09:00
- user_request: Set `HERMES_CODEX_MODEL=5.4` to `5.5` or always latest.
- action: Changed `J:/PortableApps/genai/hermes-codex.bat` from `set "HERMES_CODEX_MODEL=gpt-5.4"` to `set "HERMES_CODEX_MODEL=gpt-5.5"`.
- rationale: Current concrete verified model in `tools/hermes-codex-home/config.yaml` is already `gpt-5.5`; no verified universal `latest` alias was assumed.
- verification: `grep -nE 'HERMES_CODEX_MODEL|HERMES_DASHBOARD_PORT' hermes-codex.bat` shows `gpt-5.5` and `9203`; current profile config line 3 shows `default: gpt-5.5`.
