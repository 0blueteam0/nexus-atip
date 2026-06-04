# SCOPE

Project: genai
Task: Modify `hermes-codex.bat` so the existing IDE/CLI workflow remains available and Hermes browser chat can be opened at `http://127.0.0.1:9119/chat`.

In scope:
- Launcher-only changes in `J:/PortableApps/genai/hermes-codex.bat`.
- Preserve existing argument forwarding to `hermes.exe` for IDE/CLI use.
- Add browser chat convenience entrypoints.
- Verify batch syntax and local HTTP route.

Out of scope:
- Installing new packages.
- Rebuilding Hermes Agent UI.
- Implementing native Windows ConPTY support for dashboard `/chat`.
