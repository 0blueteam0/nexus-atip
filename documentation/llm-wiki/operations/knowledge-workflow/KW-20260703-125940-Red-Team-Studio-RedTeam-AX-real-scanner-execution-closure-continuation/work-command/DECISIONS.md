# Decisions

| id | decision | reason | outcome |
|---|---|---|---|
| WC-D-001 | Preserve existing `collected` status for partial workflows | Partial collection is valid progress and existing tests depend on it | Added separate `completion_gate_ready` |
| WC-D-002 | Default required tools to all analysis tool profiles | The user named exactly the six profiles in the registry | Coverage includes Nuclei, OpenVAS, Trivy, SCA, npm audit, OWASP ZAP |
| WC-D-003 | Do not run scanners in this slice | The work was a boundary and reporting control change | No active scan or network execution occurred |

These decisions keep the product moving toward real execution closure without overstating completion.
