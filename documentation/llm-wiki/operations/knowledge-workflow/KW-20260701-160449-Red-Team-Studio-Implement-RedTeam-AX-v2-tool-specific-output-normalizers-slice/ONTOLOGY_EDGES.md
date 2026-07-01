---
type: ontology_edges
status: complete
project: Red Team Studio
created: 2026-07-01T16:04:49+09:00
updated: 2026-07-01T16:18:00+09:00
---

# Ontology Edges

| subject | predicate | object | evidence_id | note |
|---|---|---|---|---|
| Nuclei output | normalizes_to | scanner_finding_candidate | EU-REDTEAM-AX-PARSER-NORMALIZERS-20260701 | JSON/JSONL parser |
| Trivy output | normalizes_to | sca_vulnerability_candidate | EU-REDTEAM-AX-PARSER-NORMALIZERS-20260701 | JSON parser |
| npm audit output | normalizes_to | sca_vulnerability_candidate | EU-REDTEAM-AX-PARSER-NORMALIZERS-20260701 | JSON parser |
| OWASP ZAP output | normalizes_to | scanner_finding_candidate | EU-REDTEAM-AX-PARSER-NORMALIZERS-20260701 | JSON parser |
| OpenVAS output | normalizes_to | scanner_finding_candidate | EU-REDTEAM-AX-PARSER-NORMALIZERS-20260701 | XML parser |
| Parser item | has_property | trusted_as_instruction=false | EU-REDTEAM-AX-PARSER-NORMALIZERS-20260701 | prompt injection guard |
