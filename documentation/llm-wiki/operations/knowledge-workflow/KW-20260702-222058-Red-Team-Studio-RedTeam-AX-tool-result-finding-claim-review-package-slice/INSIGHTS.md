---
type: insight
status: draft
project: Red Team Studio
created: 2026-07-02T22:20:58+09:00
---

# Insight

## 관찰

도구 결과 분석 브리프는 Evidence Card 승인 전 단계에서도 Finding 후보와 보고서 Claim 후보를 만들 수 있지만, 해당 후보를 곧바로 Finding 또는 보고서 문장으로 승격하면 unsupported claim 위험이 생긴다. 이번 조각은 생성과 승격을 분리해 후보는 보존하고, 승인 전 후보는 `hold_unsupported_claim` 상태로 묶었다.

## 통찰

RedTeam AX의 종료 조건은 "증거 없는 Finding 0건"과 "unsupported claim 0건"이므로, 자동화가 필요한 지점은 결과 생성이 아니라 사람 검토 큐로 보내는 구조다. LLM 분석은 요약과 후보화까지 수행하고, Evidence 승인 및 severity 2인 검토가 끝나기 전까지 보고서 삽입은 명시적으로 금지해야 한다.

## 제안

다음 단계는 `/api/redteam/v2/findings` 실제 생성 API에 같은 보류 정책을 연결하고, severity 2인 승인 이벤트가 있어야 Claim-Evidence Matrix와 한국어 보고서 문장으로 승격되는 승격 게이트를 추가하는 것이다.

## 적용 가능 범위

이 패턴은 npm audit, nuclei, trivy, OpenVAS, ZAP 같은 도구 결과뿐 아니라 MCP 실행 결과와 LLM 에이전트 분석 결과에도 적용할 수 있다. 모든 외부 입력은 instruction이 아니라 evidence candidate로 취급한다.

## 후속 작업

Docker/WSL/OpenVAS/ZAP 실제 엔드포인트와 vault 참조 검증이 완료되면, 이번 review package의 held candidate가 ready candidate로 전환되는 positive-path 샘플을 추가해야 한다.
