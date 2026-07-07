---
type: insight
status: draft
project: Red-Team-Studio
created: 2026-07-07T09:09:51+09:00
---

# Insight

## 관찰

- RedTeam2 본문을 한국어화해도 공통 Report Studio 헤더와 탭이 영어로 남으면 사용자는 여전히 제품/내부 용어를 먼저 보게 된다.
- `RBAC`는 권한 모델의 표준 약어지만 초급 분석가 화면에서는 `권한 정책`이 더 즉시 이해된다.

## 통찰

- 사용자 화면 copy와 감사/데이터 traceability 용어는 분리해야 한다. 기본 화면은 한국어 업무 표현, backend payload와 audit artifact는 표준 ID/API 용어를 유지하는 구조가 적합하다.

## 제안

- 다음 slice는 전역 내비게이션과 legacy report template의 남은 영어를 같은 방식으로 정리한다.
- DOM inventory에서 old phrase count와 replacement phrase count를 함께 저장해 UI copy 변경을 재현 가능하게 유지한다.

## 적용 가능 범위

- RedTeam2 default analyst DOM, Report Studio common header/tabs, frontend sanity copy inventory.

## 후속 작업

- 관리자 확장 패널과 legacy report template은 별도 pass로 다룬다.
- 실제 운영 산출물 기반 Evidence/Finding/Matrix/Report/export/completion gate proof는 별도 운영 E2E로 확보한다.
