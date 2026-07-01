---
type: insight
status: complete
project: Red Team Studio
created: 2026-07-01T15:31:03+09:00
updated: 2026-07-01T16:21:00+09:00
---

# Insight

## 관찰

Case RBAC는 단순 조회 API만 있을 때는 policy source가 감사 증적으로 강하게 검증되지 않는다. CRUD가 들어오면 저장형 policy artifact와 actor_context metadata가 반드시 같은 판단 함수를 공유해야 한다.

## 통찰

RedTeam AX의 안전성은 "승인 여부"뿐 아니라 "어떤 정책 출처가 승인자를 유효하게 만들었는가"를 증거화하는 데 달려 있다. `case_policy_artifact`를 actor_context에 남기는 것은 나중에 Claim-Evidence Matrix와 감사 trail을 연결할 때 핵심 증거가 된다.

## 제안

다음 slice에서는 external IdP adapter도 같은 구조를 따라 `auth_provider`, `auth_strength`, `case_policy_source`, `group_sync_source`를 분리해 저장해야 한다.

## 적용 가능 범위

ToolAction approval, Evidence approval, Finding severity approval, Report export approval 전체.

## 후속 작업

- 중앙 사용자/그룹 sync artifact schema 설계.
- IdP token validation 실패/만료/role drift 예외 케이스 테스트.
