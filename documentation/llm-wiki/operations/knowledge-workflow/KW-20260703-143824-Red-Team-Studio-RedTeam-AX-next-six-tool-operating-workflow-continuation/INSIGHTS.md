---
type: insight
status: draft
project: Red-Team-Studio
created: 2026-07-03T14:38:24+09:00
---

# Insight

## 관찰
`launch-readiness`는 도구별 버튼 상태를 알려주지만, 초급 운영자에게는 service import, artifact import, governed runner, install readiness가 별도 개념으로 흩어져 보인다.

## 통찰
필수 6개 도구를 하나의 work order로 묶으면 실제 실행을 자동화하지 않고도 운영 흐름을 크게 단순화할 수 있다. OpenVAS/ZAP는 active scan이 아니라 read-only service import로 안내해야 안전 경계를 유지한다.

## 제안
다음 slice는 이 work order를 실제 운영 case에서 사용해 각 row가 실제 Evidence 후보와 closure gate로 이어지는지 검증해야 한다.

## 적용 가능 범위
RedTeam AX v2 Report Studio RedTeam2, governed toolchain execution, scanner service import, artifact manifest import, completion audit workflow.

## 후속 작업
실제 조직 endpoint/vault, 실제 6개 도구 산출물, 승인자 identity, Evidence/Finding/Report/export/completion gate를 준비한다.
