# Decisions

- The foreground lane should proceed module-first: catalog modules, connect them to LangGraph nodes, then evolve each module backend.
- Current implementation remains connector-free and action-free.
- Replay evaluation is represented as an offline module, not an online investigation node, to preserve no-response safety.
- Module ownership assurance is a required graph quality gate.
