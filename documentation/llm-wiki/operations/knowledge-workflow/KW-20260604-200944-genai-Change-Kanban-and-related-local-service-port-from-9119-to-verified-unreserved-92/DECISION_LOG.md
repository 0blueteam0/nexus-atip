---
type: decision_log
task_id: KW-20260604-200944-genai-Change-Kanban-and-related-local-service-port-from-9119-to-verified-unreserved-92
project: genai
task: Change Kanban and related local service port from 9119 to verified unreserved 9203
created: 2026-06-04T20:09:44+09:00
---

# Decision Log

| time | decision | alternatives | reason | evidence |
|---|---|---|---|---|
|  |  |  |  |  |


## Decision - 2026-06-04T20:13:46.875267+09:00
- decision: Use `9203` as the default Hermes dashboard/Kanban browser-chat port for the Codex launcher instead of `9119`.
- rationale: Windows excludes TCP `9103-9202` on this host, which includes `9119`; `9203` is outside the excluded range and was verified bindable.
- affected_artifact: `J:/PortableApps/genai/hermes-codex.bat`


## Additional model default update - 2026-06-04T20:16:42.120771+09:00
- user_request: Set `HERMES_CODEX_MODEL=5.4` to `5.5` or always latest.
- action: Changed `J:/PortableApps/genai/hermes-codex.bat` from `set "HERMES_CODEX_MODEL=gpt-5.4"` to `set "HERMES_CODEX_MODEL=gpt-5.5"`.
- rationale: Current concrete verified model in `tools/hermes-codex-home/config.yaml` is already `gpt-5.5`; no verified universal `latest` alias was assumed.
- verification: `grep -nE 'HERMES_CODEX_MODEL|HERMES_DASHBOARD_PORT' hermes-codex.bat` shows `gpt-5.5` and `9203`; current profile config line 3 shows `default: gpt-5.5`.
