---
type: decision_log
status: complete
---

# Decision Log

| id | decision | rationale | impact |
|---|---|---|---|
| D-001 | Add coverage fields to collection response instead of changing collection success semantics | Existing two-tool smoke collection is valid as a partial workflow; the final goal needs a separate full-coverage gate | Preserves compatibility while exposing incomplete six-tool state |
| D-002 | Use all `ANALYSIS_TOOL_PROFILES` as the required default tool set | The user explicitly named Nuclei, OpenVAS, Trivy, SCA, npm audit, and OWASP ZAP | Completion readiness aligns with stated goal |
| D-003 | Keep goal completion blocked | Real OpenVAS/ZAP service imports and real operating closure are still missing | Avoids unsupported completion claim |
