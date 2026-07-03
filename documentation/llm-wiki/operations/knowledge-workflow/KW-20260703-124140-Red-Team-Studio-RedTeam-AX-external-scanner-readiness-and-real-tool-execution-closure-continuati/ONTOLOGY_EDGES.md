---
type: ontology_edges
status: draft
project: Red Team Studio
created: 2026-07-03T12:41:40+09:00
---

# Ontology Edges

| subject | predicate | object | evidence_id | note |
|---|---|---|---|---|
| ToolCredentialAuthorization | validates | endpoint_ref_diagnostics | RTA-COMP-055 | OpenVAS/ZAP pre-live setup |
| endpoint_ref_diagnostics | blocks | embedded credentials | RTA-COMP-055 | no credential-in-URL |
| endpoint_ref_diagnostics | blocks | secret query keys | RTA-COMP-055 | no api_key/token/password query |
| endpoint_ref_diagnostics | blocks | mutating path terms | RTA-COMP-055 | no scan/start/delete/write endpoint |
| external scanner readiness | remains blocked by | missing organization endpoint/vault refs | RTA-COMP-015 | not goal complete |
