# DECISION_LOG

## Decision: keep existing IDE/CLI argument forwarding
- Rationale: User explicitly asked to keep the current IDE behavior while adding browser capability.
- Implementation: Existing final `call "%HERMES_EXE%" %*` path is unchanged.

## Decision: add browser-only aliases
- Rationale: A user-friendly way to open `localhost:9119/chat` without entering interactive CLI.
- Implementation: `--chat` and `--browser` call a shared `:open_browser_chat` subroutine.

## Decision: start dashboard with `--tui`
- Rationale: Hermes dashboard help and source comments identify `--tui` as the feature flag for the in-browser Chat tab.
- Implementation: `start "Hermes Dashboard" /B "%HERMES_EXE%" dashboard --host ... --port ... --tui`.

## Decision: probe `/chat` before launching
- Rationale: Avoid duplicate bind errors when port 9119 is already serving the dashboard but `dashboard --status` misses it.
- Implementation: `curl.exe -fsS --max-time 2 "%HERMES_DASHBOARD_CHAT_URL%"` in `:ensure_dashboard`.
