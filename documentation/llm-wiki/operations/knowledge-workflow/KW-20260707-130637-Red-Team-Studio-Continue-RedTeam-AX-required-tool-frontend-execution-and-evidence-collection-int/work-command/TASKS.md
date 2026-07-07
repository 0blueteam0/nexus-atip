# Tasks

| id | task | status | evidence |
|---|---|---|---|
| T-001 | Confirm current required tool readiness and local executable availability | done | PATH showed npm/node/docker only; Nuclei absent before portable install |
| T-002 | Install ProjectDiscovery Nuclei official release binary in project portable tool root | done | `nuclei.exe -version` returned v3.11.0 |
| T-003 | Compute Nuclei wrapper SHA-256 and pin it in runtime profile | done | SHA-256 5315e0938ed80f60d78d90433d919bce5485eb94c61a1f36e3cb376e1285b7d5 |
| T-004 | Extend command discovery to portable tool root | done | `PORTABLE_TOOL_ROOT/<tool>/<tool>.exe` candidates added |
| T-005 | Add regression for portable binary discovery | done | focused pytest passed |
| T-006 | Update Detailed_PLAN.MD and FINAL_PLAN.md | done | sections 105 and 158 added |
| T-007 | Close quality gate | pending | gate retry after work-command enrichment |
