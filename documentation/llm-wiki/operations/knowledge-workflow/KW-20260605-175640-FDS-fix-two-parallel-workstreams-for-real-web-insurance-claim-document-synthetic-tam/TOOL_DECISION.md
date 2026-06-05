# Tool Decision

- `session_search`: tried first for previous conversation memory. It returned no direct matches for the narrow FDS mass-test query.
- `search_files` and `read_file`: used to recover durable repo handoffs and policy docs because filesystem artifacts are more reliable than compacted chat memory.
- `pytest --durations`: used to ground the mass-test delay/RCA scope in real current execution rather than memory.
- `write_file`: used to create a durable Korean scope report.
