# Handoff

## What changed
- Installed OWASP ZAP 2.17.0 cross-platform package locally under Red Team Studio tools.
- TOOL-ZAP-001 now points to portable zap.bat with expected launcher SHA-256.
- execution-presets now returns a ZAP version-only safe_smoke_steps entry separate from normal runner_steps.
- Actual governed ZAP version-only smoke passed and produced an install evidence candidate.

## Verification
- py_compile: exit_code=0.
- zap.bat -version: exit_code=0, output 2.17.0.
- targeted unittest: exit_code=0.
- frontend runtime/launch sanity and node check: exit_code=0.
- knowledge workflow close gate pending at time of writing.

## Remaining risk
- ZAP active scan, daemon start, spider, API key use, and organization endpoint import remain incomplete.
- Full RedTeam AX completion remains active and incomplete.
