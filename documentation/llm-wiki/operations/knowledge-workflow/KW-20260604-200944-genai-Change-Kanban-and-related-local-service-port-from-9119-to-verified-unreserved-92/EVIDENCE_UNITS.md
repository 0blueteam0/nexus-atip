---
type: evidence_unit
status: draft
id:
project: genai
created: 2026-06-04T20:09:44+09:00
---

# Evidence Unit

## Claim

## Source

- source_type:
- path_or_url:
- command:
- exit_code:
- collected_at:

## Evidence

## Confidence

## Limits

## Related Decisions



## E1: Runtime launcher port changed
- command: `patch` on `J:/PortableApps/genai/hermes-codex.bat`
- artifact_path: `J:/PortableApps/genai/hermes-codex.bat`
- verified_at: `2026-06-04T20:13:46.875267+09:00`
- observed: `HERMES_DASHBOARD_PORT` changed from `9119` to `9203`; help URL changed to `http://127.0.0.1:9203/chat`.

## E2: Launcher resolves dashboard/chat URLs to 9203
- command: `cmd.exe //C "hermes-codex.bat --where"`
- exit_code: 0
- artifact_path: `J:/PortableApps/genai/hermes-codex.bat`
- verified_at: `2026-06-04T20:13:46.875267+09:00`
- observed: `HERMES_DASHBOARD_URL=http://127.0.0.1:9203/` and `HERMES_DASHBOARD_CHAT_URL=http://127.0.0.1:9203/chat`.

## E3: Port 9203 is outside the current Windows reserved range and bindable
- command: `netsh interface ipv4 show excludedportrange protocol=tcp`; `python socket.bind(('127.0.0.1', 9203))`
- exit_code: 0
- artifact_path: `127.0.0.1:9203`
- verified_at: `2026-06-04T20:13:46.875267+09:00`
- observed: Windows reserved range includes `9103-9202`; bind probe reports `127.0.0.1:9203 bindable: yes`.


## Additional model default update - 2026-06-04T20:16:42.120771+09:00
- user_request: Set `HERMES_CODEX_MODEL=5.4` to `5.5` or always latest.
- action: Changed `J:/PortableApps/genai/hermes-codex.bat` from `set "HERMES_CODEX_MODEL=gpt-5.4"` to `set "HERMES_CODEX_MODEL=gpt-5.5"`.
- rationale: Current concrete verified model in `tools/hermes-codex-home/config.yaml` is already `gpt-5.5`; no verified universal `latest` alias was assumed.
- verification: `grep -nE 'HERMES_CODEX_MODEL|HERMES_DASHBOARD_PORT' hermes-codex.bat` shows `gpt-5.5` and `9203`; current profile config line 3 shows `default: gpt-5.5`.
