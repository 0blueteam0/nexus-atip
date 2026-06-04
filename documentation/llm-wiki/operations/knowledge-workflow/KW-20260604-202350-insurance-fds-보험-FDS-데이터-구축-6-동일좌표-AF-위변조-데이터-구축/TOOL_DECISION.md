# TOOL_DECISION

- Used session_search because the user explicitly asked to continue from prior 보험 FDS 데이터 구축 #6 context.
- Used TDD because the continuation requires a behavior change/bug fix in generated data semantics.
- Created a separate v3.2 pipeline instead of mutating v3.1 output in place, preserving previous artifacts and making coordinate policy explicit.
- Used PIL ImageChops for deterministic pixel-diff validation because the user requirement is about same visual/coordinate position.
- Used vision_analyze for human-style visual QA of the contact sheet in addition to automated JSON/pixel gates.
