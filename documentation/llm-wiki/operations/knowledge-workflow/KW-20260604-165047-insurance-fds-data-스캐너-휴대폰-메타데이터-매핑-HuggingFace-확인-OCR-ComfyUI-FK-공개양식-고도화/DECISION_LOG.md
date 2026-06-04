---
type: decision_log
task_id: KW-20260604-165047-insurance-fds-data-스캐너-휴대폰-메타데이터-매핑-HuggingFace-확인-OCR-ComfyUI-FK-공개양식-고도화
project: insurance-fds-data
task: 스캐너-휴대폰-메타데이터-매핑-HuggingFace-확인-OCR-ComfyUI-FK-공개양식-고도화
created: 2026-06-04T16:50:47+09:00
---

# Decision Log

| time | decision | alternatives | reason | evidence |
|---|---|---|---|---|
|  |  |  |  |  |


## Decisions
- Prefix policy preserved: NO for synthetic normal/golden pairs, AF for synthetic anomaly/tamper pairs, FK only for abstracted actual-pattern taxonomy not copied artifacts.
- Do not synthesize real logos/seals/signatures/PII; keep synthetic placeholders.
- Keep generation dry-run for ComfyUI until local/cloud endpoint is explicitly available.
