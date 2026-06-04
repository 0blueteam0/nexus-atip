# HANDOFF

- Changed artifact: `J:/PortableApps/genai/hermes-codex.bat`
- New use:
  - `hermes-codex.bat --chat`
  - `hermes-codex.bat --browser`
  - direct URL: `http://127.0.0.1:9119/chat`
- Existing use preserved:
  - `hermes-codex.bat [args]` still forwards args to `hermes.exe` after ensuring dashboard availability.
- Verification:
  - `--where`: exit_code 0
  - `--help`: exit_code 0
  - `--chat`: exit_code 0
  - HTTP `/chat`: status 200
- Known platform note:
  - Native Windows route loads, but Hermes source documents PTY-backed embedded TUI as POSIX-only. WSL may be needed for a fully interactive browser TUI until Windows ConPTY support exists.
