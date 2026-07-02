---
type: decision_log
project: Red Team Studio
task: RedTeam AX operator evidence submission validator slice
---

# Decision Log

| decision | outcome |
|---|---|
| Default validator status is `awaiting_operator_evidence_submission` | Prevents false readiness before a manifest exists |
| `--require-approved` exits non-zero unless all evidence passes | Supports strict operational promotion later |
| Runtime readiness includes submission blocker | Makes missing approved evidence visible in API/UI |
| RTA-COMP-015 remains partial | Actual Docker/WSL/OpenVAS/ZAP evidence is still missing |
