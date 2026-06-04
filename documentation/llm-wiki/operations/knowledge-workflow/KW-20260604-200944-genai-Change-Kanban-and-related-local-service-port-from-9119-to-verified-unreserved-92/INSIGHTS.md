---
type: insight
status: draft
project: genai
created: 2026-06-04T20:09:44+09:00
---

# Insight

## 관찰

## 통찰

## 제안

## 적용 가능 범위

## 후속 작업



## Insight - 2026-06-04T20:13:46.875267+09:00
- Port `9119` is not safe as a durable local dashboard/Kanban default on this Windows host because it falls in excluded range `9103-9202`.
- `9203` is a host-verified replacement for this launcher and should be preferred for future Kanban/dashboard local service references.


## Additional model default update - 2026-06-04T20:16:42.120771+09:00
- user_request: Set `HERMES_CODEX_MODEL=5.4` to `5.5` or always latest.
- action: Changed `J:/PortableApps/genai/hermes-codex.bat` from `set "HERMES_CODEX_MODEL=gpt-5.4"` to `set "HERMES_CODEX_MODEL=gpt-5.5"`.
- rationale: Current concrete verified model in `tools/hermes-codex-home/config.yaml` is already `gpt-5.5`; no verified universal `latest` alias was assumed.
- verification: `grep -nE 'HERMES_CODEX_MODEL|HERMES_DASHBOARD_PORT' hermes-codex.bat` shows `gpt-5.5` and `9203`; current profile config line 3 shows `default: gpt-5.5`.
