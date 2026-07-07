---
type: work_command_record
task_id: KW-20260707-122829-Red-Team-Studio-Continue-RedTeam-AX-expanded-redteam-tool-install-discovery-catalog
project: Red Team Studio
task: Continue RedTeam AX expanded redteam tool install discovery catalog
created: 2026-07-07T12:28:30+09:00
source_package: K:/wiki/work command
---

# TASKS

## Original Request
사용자는 RedTeam AX를 실제 승인 기반 레드팀 운영 플랫폼으로 고도화하면서, Nuclei/OpenVAS/Trivy/ZAP 같은 초기 도구에 머물지 말고 레드팀 도구를 계속 공식 출처 기반으로 찾아 설치 관련 응답과 온보딩을 이어가라고 지시했다. 또한 설치된 도구는 프론트엔드 버튼에서 실행 가능해야 하고, 실행 결과는 Evidence Card와 Claim-Evidence Matrix로 추적되어야 한다.

## Task
이번 조각은 아직 자동 실행 ToolProfile로 승격하지 않은 추가 레드팀 도구 후보를 공식 출처 기반 설치 후보 카탈로그로 편입하는 작업이다. Amass, ffuf, Nmap, Gitleaks를 먼저 후보로 추가하고, API 응답과 보고서 스튜디오 화면이 후보를 표시하도록 연결한다. 후보는 실행 명령이 아니라 설치/온보딩 검토 대상이며, 승인 정책과 정규화기, Evidence 매핑이 마련된 뒤에만 실행 버튼으로 승격된다.

## Status
Completed for this slice. Product code, frontend renderer, backend contract test, frontend sanity contract, Detailed_PLAN.MD, FINAL_PLAN.md were updated. The full RedTeam AX goal remains open because actual installation, wrapper pinning, frontend executable buttons for these new tools, and live result collection are subsequent milestones.

## Execution Control
All added tools are marked as install/onboarding candidates only. `commands_executed_by_api` is false, `trusted_as_instruction` is false, and the API policy text states that candidates are not executable until ToolProfile, guardrail, wrapper, normalizer, and Evidence mapping are approved. This preserves ROE/HITL/guardrail boundaries.

## Tools
Official-source browsing was used for candidate grounding: ProjectDiscovery Nuclei, Aqua Trivy, OWASP ZAP, Greenbone/OpenVAS, OWASP Amass, ffuf, Nmap, and Gitleaks. Local verification used Python compile, Node syntax check, pytest contract test, frontend sanity scripts, and git diff check.

## Verification
Verified with exit_code 0: Python compile for redteam models/API router, `node --check` for reports.js, pytest `test_v2_tool_install_readiness_exposes_operator_run_install_plans`, frontend runtime readiness sanity, frontend launch readiness sanity, and `git diff --check` on the modified files.
