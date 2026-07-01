---
type: insight
status: complete
project: Red Team Studio
created: 2026-07-01T16:04:49+09:00
updated: 2026-07-01T16:18:00+09:00
---

# Insight

## 관찰

ToolHub registry만으로는 Evidence 품질이 부족하다. 도구별 parser가 있어야 LLM 분석 에이전트가 최소한의 공통 구조를 받고, Claim-Evidence Matrix로 이어질 수 있다.

## 통찰

Parser는 “취약점 확정기”가 아니라 “candidate item extractor”로 유지해야 한다. 이 구분이 unsupported claim 0건이라는 종료 조건을 지키는 핵심이다.

## 제안

다음 slice에서는 parser schema를 JSON Schema로 분리하고, parser fixture corpus를 늘리는 것이 실제 설치 자동화보다 더 안정적인 다음 단계다.

## 적용 가능 범위

Nuclei, Trivy, npm audit, OWASP ZAP, OpenVAS, SCA 및 향후 추가 도구.

## 후속 작업

File upload parser input, schema artifacts, broader fixtures, sandbox runner.
