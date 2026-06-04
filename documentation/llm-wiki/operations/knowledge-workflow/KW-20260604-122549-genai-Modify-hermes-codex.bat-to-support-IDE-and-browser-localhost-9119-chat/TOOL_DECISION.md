# TOOL_DECISION

- Used `skill_view(hermes-agent)` because Hermes Agent configuration/launcher behavior was being changed.
- Used `read_file`/`search_files` for repository inspection instead of shell grep/cat.
- Used `patch` for targeted batch file edits.
- Used `terminal` for real command verification (`hermes dashboard --help`, Windows batch invocation via `cmd.exe //C`, HTTP probe via Python, git status).
- Used `write_file` for knowledge workflow evidence files.
