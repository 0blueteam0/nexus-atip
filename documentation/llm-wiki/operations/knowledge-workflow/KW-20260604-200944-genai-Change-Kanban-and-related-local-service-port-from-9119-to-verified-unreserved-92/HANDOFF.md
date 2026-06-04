---
type: handoff
status: active
project: genai
updated: 2026-06-04T20:09:44+09:00
---

# Handoff

## 현재 상태

## 완료된 것

## 검증된 것

## 아직 위험한 것

## 열린 질문

## 다음 액션

## 반드시 읽을 문서

## 관련 도구와 스크립트

## 다시 논의하지 않아도 되는 결정



## Handoff - 2026-06-04T20:13:46.875267+09:00
- Changed `J:/PortableApps/genai/hermes-codex.bat` so the Hermes dashboard/browser chat uses `127.0.0.1:9203`.
- Verification commands:
  - `cmd.exe //C "hermes-codex.bat --where"` -> exit_code 0; URL output uses `9203`.
  - `cmd.exe //C "hermes-codex.bat --help"` -> exit_code 0; `--chat` help uses `http://127.0.0.1:9203/chat`.
  - `netsh interface ipv4 show excludedportrange protocol=tcp` -> shows `9103-9202`, not `9203`.
  - Python socket bind probe -> `127.0.0.1:9203 bindable: yes`.
- Historical documentation still contains old `9119` evidence by design; active `.bat` runtime config no longer does.


## Additional model default update - 2026-06-04T20:16:42.120771+09:00
- user_request: Set `HERMES_CODEX_MODEL=5.4` to `5.5` or always latest.
- action: Changed `J:/PortableApps/genai/hermes-codex.bat` from `set "HERMES_CODEX_MODEL=gpt-5.4"` to `set "HERMES_CODEX_MODEL=gpt-5.5"`.
- rationale: Current concrete verified model in `tools/hermes-codex-home/config.yaml` is already `gpt-5.5`; no verified universal `latest` alias was assumed.
- verification: `grep -nE 'HERMES_CODEX_MODEL|HERMES_DASHBOARD_PORT' hermes-codex.bat` shows `gpt-5.5` and `9203`; current profile config line 3 shows `default: gpt-5.5`.
