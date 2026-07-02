---
type: decision_log
task_id: KW-20260703-041522-Red-Team-Studio-RedTeam-AX-real-operating-E2E-next-progress-slice
project: Red Team Studio
task: RedTeam AX real operating E2E next progress slice
created: 2026-07-03T04:15:22+09:00
---

# Decision Log

| time | decision | alternatives | reason | evidence |
|---|---|---|---|---|
| 2026-07-03T04:15:22+09:00 | Enhance SCA normalizer for CycloneDX components and affects linkage. | Add a separate SCA endpoint or leave SBOM as raw generic data. | SCA is a named required tool and should produce Evidence candidates through the existing governed collection path. | `runtime/redteam_v2_models.py`, SCA focused regression |
| 2026-07-03T04:15:22+09:00 | Require component-match review before Claim use. | Treat vulnerability affects as sufficient proof. | SBOM affects links can be wrong or stale; RedTeam AX requires unsupported claims to remain zero. | `requires_component_match_review=true` |
