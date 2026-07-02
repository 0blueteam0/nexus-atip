---
type: insight
status: draft
project: Red Team Studio
created: 2026-07-02T22:32:00+09:00
---

# Insight

## 관찰

기존 `create_finding()`와 2인 severity 승인 정책은 이미 있었지만, tool result review candidate에서 해당 API로 이어지는 안전한 호출 경로가 별도로 없었다.

## 통찰

후보 패키지는 snapshot이므로 시간이 지나면 Evidence 승인 상태가 오래될 수 있다. Promotion 시점에는 backend Evidence store의 승인 상태를 다시 확인해야 한다.

## 제안

다음 구현은 promotion 후 Claim-Evidence Matrix draft를 생성하되, Finding approval과 report validation이 끝나기 전까지 보고서 문장 삽입을 계속 막아야 한다.

## 적용 가능 범위

Nuclei, OpenVAS, Trivy, SCA, npm audit, OWASP ZAP뿐 아니라 future MCP/LLM agent result candidate에도 같은 pattern을 적용할 수 있다.

## 후속 작업

실제 조직 OpenVAS/ZAP endpoint와 Docker/WSL readiness가 해결되면 approved Evidence positive path를 운영 산출물로 재실행한다.
