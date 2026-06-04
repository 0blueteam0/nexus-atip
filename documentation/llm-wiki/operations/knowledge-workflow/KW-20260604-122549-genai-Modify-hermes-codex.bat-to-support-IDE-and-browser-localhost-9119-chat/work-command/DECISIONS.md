# DECISIONS

- Decision: Use Hermes dashboard `--tui` instead of a separate web chat implementation.
  - evidence_command: `J:/PortableApps/genai/tools/hermes-agent/.venv/Scripts/hermes.exe dashboard --help`
  - exit_code: 0
  - evidence_output: Help text includes `--tui` and describes the in-browser Chat tab.
  - impact: Existing dashboard remains the single web surface.

- Decision: Add `--chat` and `--browser` aliases.
  - evidence_source: User request asked for browser use at `localhost:9119/chat` while preserving current IDE behavior.
  - artifact_path: `J:/PortableApps/genai/hermes-codex.bat`
  - impact: The launcher can open browser chat without changing IDE args.

- Decision: Probe `/chat` with `curl.exe` before starting a new dashboard.
  - evidence_command: `cmd.exe //C "J:\\PortableApps\\genai\\hermes-codex.bat --chat"`
  - exit_code: 0
  - evidence_output: Re-run output reports `Hermes browser chat already reachable` and opens the same URL.
  - impact: Re-running `--chat` reuses the existing server and avoids duplicate 9119 bind attempts.
