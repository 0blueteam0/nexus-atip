# Decisions

- Keep builder and importer separate so operators review generated JSON before import.
- Restrict builder to workspace directories and known text-like scanner output extensions.
- Track unmatched files and alternatives because filename detection is advisory.
- Persist builder artifacts under case `toolchain-runs` so audit history is visible.
- Preserve `commands_executed_by_api=false`, `active_scan_executed=false`, and `trusted_as_instruction=false`.
