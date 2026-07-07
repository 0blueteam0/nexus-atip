# Ontology Edges

| subject | relation | object | evidence |
|---|---|---|---|
| TOOL-TRIVY-001 | installed_as | Red Team Studio/고도화/tools/trivy/trivy.exe | EV-005 |
| TOOL-TRIVY-001 | version | v0.72.0 | EV-006 |
| TOOL-TRIVY-001 | wrapper_sha256 | 5c233d1514d6fd91f7a4f834beb92070f8a9793c71801f7f2149a7b30f90b821 | EV-007 |
| TOOL-TRIVY-001 | pinning_status | hash_match | EV-008 |
| TOOL-TRIVY-001 | execution_preset | portable trivy fs offline scan | EV-008 |
| Trivy sample workspace | contains | package-lock.json with lodash 4.17.20 | EV-009 |
| AGENT-TRIVY-ANALYST-001 | normalizes | Trivy JSON output | EV-011 |
| Trivy result | creates | Evidence candidate | EV-011 |
