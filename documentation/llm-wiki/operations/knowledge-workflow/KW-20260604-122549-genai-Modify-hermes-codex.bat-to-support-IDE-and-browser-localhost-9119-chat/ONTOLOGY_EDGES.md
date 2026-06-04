# ONTOLOGY_EDGES

- node: `hermes-codex.bat`
  type: launcher
  relations:
    - `starts` -> `hermes dashboard --tui`
    - `opens` -> `http://127.0.0.1:9119/chat`
    - `preserves` -> `Hermes CLI/IDE argument forwarding`

- node: `Hermes dashboard /chat`
  type: browser_chat_surface
  relations:
    - `requires_feature_flag` -> `--tui` or `HERMES_DASHBOARD_TUI=1`
    - `embeds` -> `hermes --tui via PTY bridge`
    - `has_platform_limit` -> `native Windows PTY unavailable in current Hermes Agent source`
