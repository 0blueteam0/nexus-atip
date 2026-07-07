# Ontology Edges

| subject | relation | object | evidence |
|---|---|---|---|
| TOOL-NPM-AUDIT-001 | wrapper_status | hash_match | EV-001 |
| TOOL-NPM-AUDIT-001 | acceptable_exit_code | 1 | EV-004, EV-005 |
| npm_audit_workspace | contains | package-lock.json lodash 4.17.20 | EV-002 |
| governed_runner | uses_working_dir | npm_audit_workspace | EV-005 |
| AGENT-NPM-AUDIT-ANALYST-001 | normalizes | npm audit JSON | EV-006 |
| npm audit result | creates | Evidence candidate | EV-006 |
