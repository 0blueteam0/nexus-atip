---
type: work_command_record
task_id: KW-20260701-162340-Red-Team-Studio-Implement-RedTeam-AX-v2-tool-output-sanitizer-quarantine-redaction-preview-slice
project: Red-Team-Studio
task: Implement RedTeam AX v2 tool output sanitizer quarantine redaction preview slice
created: 2026-07-01T16:23:40+09:00
source_package: K:/wiki/work command
---

# DECISIONS

## Ledger

| id | decision | alternatives | reason | impact |
|---|---|---|---|---|

## Entries

# Decisions

| Decision | Evidence field | Result |
|---|---|---|
| Add a dedicated sanitizer preview API. | source_path=`runtime/redteam_v2_api_router.py`; endpoint=`/api/redteam/v2/tool-runs/{run_id}/sanitize-preview` | Preview can run before LLM analysis. |
| Quarantine prompt injection with score >= 0.85. | source_path=`runtime/redteam_v2_models.py`; test=`test_v2_tool_output_sanitizer_quarantines_prompt_injection_and_redacts_secret`; command_exit_code=0 | GT-OUTPUT-001 behavior covered. |
| Redact detected secrets and keep a redaction audit list. | source_path=`runtime/redteam_v2_models.py`; test=`test_v2_tool_output_sanitizer_quarantines_prompt_injection_and_redacts_secret`; command_exit_code=0 | GT-OUTPUT-002 behavior covered. |
| Keep raw tool output as untrusted data and only pass sanitized output to parser logic. | source_path=`runtime/redteam_v2_models.py`; verified_at=`2026-07-01T16:26:00+09:00`; command=`python -m unittest discover -s tests -p "test_redteam_v2_api_router.py"`; exit_code=0 | Parser receives sanitized outputs and quarantine blocks normalization. |
