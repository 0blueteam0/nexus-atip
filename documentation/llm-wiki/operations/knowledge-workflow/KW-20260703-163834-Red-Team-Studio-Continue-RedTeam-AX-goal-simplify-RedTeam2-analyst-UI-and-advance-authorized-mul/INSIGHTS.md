---
type: insight
status: draft
project: Red-Team-Studio
created: 2026-07-03T16:38:34+09:00
---

# Insight

## 관찰

- RedTeam2의 기존 복합 도구 영역은 사용자가 보기에 실행 목록을 나열하는 단계처럼 보였다.
- 분석가가 필요한 것은 실행 ID나 계획 ID가 아니라 결과 후보, 심각도 분포, Evidence 상태, 다음 승인 행동이다.

## 통찰

- 실행 상세는 감사 추적에 필요하지만 분석 화면의 주된 정보가 되면 UX가 목표와 어긋난다.
- 같은 backend traceability를 유지하면서도 frontend projection을 바꾸면 분석가용 화면과 관리자/감사용 화면을 분리할 수 있다.

## 제안

- RedTeam2 첫 화면은 `분석 결과 수집·검토 워크플로우`를 중심으로 유지한다.
- 실행/진행 상세 표는 접거나 관리자/감사용 위치로 더 이동하는 후속 UI 개선을 검토한다.

## 적용 가능 범위

- RedTeam AX Report Studio RedTeam2 composite toolchain result workflow.

## 후속 작업

- 실제 브라우저 회귀 검증.
- 실제 운영 6개 도구 산출물로 Evidence/Finding/Matrix/Report/export gate까지 E2E 실행.
