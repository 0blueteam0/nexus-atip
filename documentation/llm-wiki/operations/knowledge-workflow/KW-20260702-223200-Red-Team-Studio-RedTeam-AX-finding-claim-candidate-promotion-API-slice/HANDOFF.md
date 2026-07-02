---
type: handoff
status: active
project: Red Team Studio
updated: 2026-07-02T22:32:00+09:00
---

# Handoff

## 변경 요약

Tool result Finding/Claim review package를 API로 조회하고, 후보별로 governed promote-finding을 요청하는 backend path를 추가했다. 승인 전 후보는 blocked이고, 승인된 Evidence store record가 있을 때만 기존 `create_finding()`을 호출한다.

## 읽을 파일

- `projects/ai-agentic-soc/runtime/redteam_v2_models.py`
- `projects/ai-agentic-soc/runtime/redteam_v2_api_router.py`
- `projects/ai-agentic-soc/tests/test_redteam_v2_api_router.py`
- `projects/ai-agentic-soc/soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js`

## 검증

- `pytest tests/test_redteam_v2_api_router.py -q`: 54 passed
- `redteam_ax_accepted_gate_manifest.py`: 24 accepted gates, 24 passed, 0 failed

## 남은 위험

실제 운영 후보 전체에 대해 Evidence 승인, Finding severity 2인 승인, report claim validation이 끝난 것은 아니다. Docker/WSL/OpenVAS/ZAP 실제 readiness blocker도 여전히 남아 있다.

## 현재 상태

## 완료된 것

## 검증된 것

## 아직 위험한 것

## 열린 질문

## 다음 액션

## 반드시 읽을 문서

## 관련 도구와 스크립트

## 다시 논의하지 않아도 되는 결정
