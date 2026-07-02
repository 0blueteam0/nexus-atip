# RedTeam AX Tool Result Analysis Brief

- status: `tool_result_analysis_ready`
- executed_tool_count: `5`
- supported_evidence_count: `5`
- blocked_tool_count: `9`
- SCA decision: `근거 패키지 검토 가능`

## Evidence Pack
- `TOOL-NPM-AUDIT-001` npm audit 의존성 점검: evidence `EV-3F909D05B57E` result `NR-DC3B6E1FCB39` run `TRUN-77FE6F0A5B82`
- `TOOL-NUCLEI-001` Nuclei 웹 취약점 템플릿 점검: evidence `EV-A30D4FB6719E` result `NR-C201CD8C8C7B` run `TRUN-F518066A571D`
- `TOOL-TRIVY-001` Trivy 컨테이너/의존성 점검: evidence `EV-870929768413` result `NR-7C63E029DF06` run `TRUN-A31DA5082610`
- `TOOL-OPENVAS-001` OpenVAS 취약점 스캐너: evidence `EV-D7BD7B9A8973` result `NR-11BA199117E4` run `TRUN-E77FB10BE35F`
- `TOOL-ZAP-001` OWASP ZAP 웹 보안 점검: evidence `EV-4C1D04FC83C9` result `NR-1C666FD6FBDD` run `TRUN-624E0E8A8CB0`

## Blocked Items
- `TOOL-OPENVAS-001` OpenVAS 취약점 스캐너: `blocked_service_or_cli_not_installed` - gvm-cli/OpenVAS service is not present in this Windows session; read-only credential contract remains proved separately.
- `TOOL-ZAP-001` OWASP ZAP 웹 보안 점검: `blocked_service_or_cli_not_installed` - zap-cli/ZAP daemon is not present in this Windows session; read-only credential contract remains proved separately.
- `DOCKER-CONTAINER-RUNTIME` DOCKER-CONTAINER-RUNTIME: `blocked_daemon_unavailable` - Docker CLI is installed but Docker Desktop daemon reports unable to start.
- `TOOL-OPENVAS-001` OpenVAS 취약점 스캐너: `blocked` - blocked
- `TOOL-ZAP-001` OWASP ZAP 웹 보안 점검: `blocked` - blocked
- `OpenVAS` OpenVAS: `blocked` - REDTEAM_AX_OPENVAS_READONLY_REPORT_ENDPOINT_missing
- `OpenVAS` OpenVAS: `blocked` - REDTEAM_AX_OPENVAS_VAULT_REF_missing
- `OWASP ZAP` OWASP ZAP: `blocked` - REDTEAM_AX_ZAP_READONLY_ALERT_ENDPOINT_missing
- `OWASP ZAP` OWASP ZAP: `blocked` - REDTEAM_AX_ZAP_VAULT_REF_missing

## Claim-Evidence Matrix Candidates
- `CLAIM-TOOL-RUN-GOVERNED` 승인된 도구 실행 흐름에서 일부 도구 결과가 정규화되었습니다. support `supported`
- `CLAIM-HIGH-RISK-SCANNERS-BLOCKED` OpenVAS/ZAP 등 고위험 또는 외부 서비스 의존 도구는 준비 조건이 없으면 차단 상태로 남습니다. support `supported`
