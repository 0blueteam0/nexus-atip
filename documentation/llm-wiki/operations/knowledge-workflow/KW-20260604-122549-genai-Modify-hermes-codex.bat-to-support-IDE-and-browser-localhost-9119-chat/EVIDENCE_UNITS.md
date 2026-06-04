# EVIDENCE_UNITS

## EU-001 dashboard CLI help
- command: `J:/PortableApps/genai/tools/hermes-agent/.venv/Scripts/hermes.exe dashboard --help`
- exit_code: 0
- evidence: Help includes `--tui` described as exposing the in-browser Chat tab, and default port 9119.
- verified_at: 2026-06-04T12:25:49+09:00 session

## EU-002 batch path resolution
- command: `cmd.exe //C "J:\\PortableApps\\genai\\hermes-codex.bat --where"`
- exit_code: 0
- evidence: Output includes `HERMES_DASHBOARD_CHAT_URL=http://127.0.0.1:9119/chat`.
- artifact_path: `J:/PortableApps/genai/hermes-codex.bat`

## EU-003 help text
- command: `cmd.exe //C "J:\\PortableApps\\genai\\hermes-codex.bat --help"`
- exit_code: 0
- evidence: Output includes new `--chat` and `--browser` commands.

## EU-004 browser chat open/reuse
- command: `cmd.exe //C "J:\\PortableApps\\genai\\hermes-codex.bat --chat"`
- exit_code: 0
- evidence: Subsequent run output: `Hermes browser chat already reachable: http://127.0.0.1:9119/chat` and `Opening Hermes browser chat`.

## EU-005 HTTP route
- command: Python `urllib.request.urlopen('http://127.0.0.1:9119/chat')`
- exit_code: 0
- evidence: HTTP 200, `content-type: text/html; charset=utf-8`, HTML document prefix returned.

## EU-006 repository tracking
- command: `git status --short -- hermes-codex.bat && git ls-files --stage -- hermes-codex.bat`
- exit_code: 0
- evidence: Git short status reports `hermes-codex.bat` as an untracked file; it is not present in `git ls-files --stage`.
