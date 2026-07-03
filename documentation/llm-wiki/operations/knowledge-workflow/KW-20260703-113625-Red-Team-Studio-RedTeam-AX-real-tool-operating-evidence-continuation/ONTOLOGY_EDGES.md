---
type: ontology_edges
status: complete
project: Red Team Studio
created: 2026-07-03T11:36:25+09:00
---

# Ontology Edges

| subject | predicate | object | evidence_id | note |
|---|---|---|---|---|
| RedTeam AX ephemeral container runner | clears | Docker image ENTRYPOINT | RTA-RUNTIME-20260703 | Ensures approved argv is authoritative |
| latest_container_runtime_smoke.json | proves | Docker container runtime readiness | RTA-RUNTIME-20260703 | status=passed |
| latest_strict_live_readiness_promotion.json | blocks_on | WSL runtime readiness | RTA-RUNTIME-20260703 | Ubuntu-22.04 start failed |
| latest_strict_live_readiness_promotion.json | blocks_on | OpenVAS/ZAP external readiness | RTA-RUNTIME-20260703 | endpoint/vault refs missing |
| RTA-COMP-015 | remains | partial | RTA-RUNTIME-20260703 | Docker passed; WSL/external/operating closure missing |
