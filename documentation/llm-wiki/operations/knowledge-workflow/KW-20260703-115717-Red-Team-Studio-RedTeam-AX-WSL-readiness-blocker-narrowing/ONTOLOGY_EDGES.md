---
type: ontology_edges
status: complete
project: Red Team Studio
created: 2026-07-03T11:57:17+09:00
---

# Ontology Edges

| subject | predicate | object | evidence_id | note |
|---|---|---|---|---|
| Ubuntu-22.04 | has_blocker | wsl_ext4_vhdx_corrupt_or_unreadable | RTA-WSL-20260703 | default distro failed |
| Ubuntu-22.04-AISOC-Rebuild | satisfies | WSL runtime readiness | RTA-WSL-20260703 | selected alternate distro |
| strict live readiness promotion | passed_gate | Docker container runtime | RTA-WSL-20260703 | prior Docker smoke remains passed |
| strict live readiness promotion | passed_gate | WSL runtime readiness | RTA-WSL-20260703 | fallback ready |
| strict live readiness promotion | blocks_on | OpenVAS/ZAP external readiness | RTA-WSL-20260703 | endpoint/vault missing |
