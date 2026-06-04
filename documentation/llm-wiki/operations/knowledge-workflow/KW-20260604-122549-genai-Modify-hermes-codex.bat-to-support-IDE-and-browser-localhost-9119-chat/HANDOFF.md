# HANDOFF

Changed file:
- `J:/PortableApps/genai/hermes-codex.bat`

What changed:
- Added dashboard URL variables and `HERMES_DASHBOARD_TUI=1`.
- Added `--chat` and `--browser` options to open `http://127.0.0.1:9119/chat`.
- Dashboard startup now includes `--tui`.
- `:ensure_dashboard` first probes `/chat` with `curl.exe` to avoid duplicate port binding.

Verification:
- `cmd.exe //C "J:\\PortableApps\\genai\\hermes-codex.bat --where"` exit 0.
- `cmd.exe //C "J:\\PortableApps\\genai\\hermes-codex.bat --help"` exit 0.
- `cmd.exe //C "J:\\PortableApps\\genai\\hermes-codex.bat --chat"` exit 0.
- `http://127.0.0.1:9119/chat` returned HTTP 200.

Remaining risk:
- Native Windows dashboard `/chat` route loads, but embedded TUI PTY support is documented as POSIX-only. If the chat pane shows a WSL banner, Hermes Agent needs a future Windows ConPTY/pywinpty implementation or the dashboard should be run from WSL.
- `hermes-codex.bat` is untracked in git status, so normal `git diff` does not show it unless added/tracked.
