# WORKLOG

- Started knowledge workflow session for modifying `hermes-codex.bat`.
- Loaded Hermes Agent skill because the task modifies Hermes launcher/configuration behavior.
- Inspected `J:/PortableApps/genai/hermes-codex.bat` and confirmed it already starts `hermes dashboard` on port 9119 but did not pass `--tui` or expose a `/chat` helper option.
- Checked `hermes dashboard --help`; verified `--tui` enables the in-browser Chat tab and default port is 9119.
- Checked Hermes Agent source notes: dashboard `/chat` embeds `hermes --tui`; native Windows PTY support is not complete, and the chat tab may show a WSL recommendation banner if the PTY bridge cannot run.
- Modified `hermes-codex.bat` to define `HERMES_DASHBOARD_URL`, `HERMES_DASHBOARD_CHAT_URL`, and `HERMES_DASHBOARD_TUI=1`.
- Added `--chat` and `--browser` aliases that ensure the dashboard is reachable and open `http://127.0.0.1:9119/chat`.
- Changed dashboard startup to `hermes dashboard --host 127.0.0.1 --port 9119 --tui`.
- Added an HTTP `/chat` reachability probe using `curl.exe` before starting a new dashboard, avoiding duplicate bind attempts when port 9119 is already serving the UI.
- Ran `cmd.exe //C "J:\\PortableApps\\genai\\hermes-codex.bat --where"`; exit_code 0; output contained the expected root and `/chat` URL.
- Ran `cmd.exe //C "J:\\PortableApps\\genai\\hermes-codex.bat --help"`; exit_code 0; output included the new `--chat` and `--browser` commands.
- Ran `cmd.exe //C "J:\\PortableApps\\genai\\hermes-codex.bat --chat"`; first run started/opened the dashboard, subsequent run reused the reachable `/chat` URL without a duplicate bind error.
- Ran Python `urllib.request.urlopen("http://127.0.0.1:9119/chat")`; exit_code 0; response status was 200 with `text/html; charset=utf-8`.
