---
type: tool_decision
status: draft
project: insurance-fds-data
task: 상세 AF 합성 데이터 생성기 라벨 기준표 다중도구 파이프라인 구현
created: 2026-06-04T15:58:40+09:00
---

# Tool Decision

## 작업 목표

## 필요한 능력

## 후보 도구 비교

| 도구 | 장점 | 단점 | 기존 도구와 결합 | 판정 |
|---|---|---|---|---|
| 후보 1 |  |  |  |  |
| 후보 2 |  |  |  |  |
| 후보 3 |  |  |  |  |
| 후보 4 |  |  |  |  |
| 후보 5 |  |  |  |  |

## 선택한 도구 또는 도구 체인

## 선택 이유

## 버린 대안과 이유

## 실패 시 fallback

## 실제 사용 결과

## 다음 재사용 규칙


## Tool decision update
- 사용: Python stdlib generator, pytest, delegate_task research worker.
- 보류: MCP native config 변경은 Hermes restart가 필요하고 현재 구현에는 불필요해 문서화만 수행.
- 다음 단계에서 Playwright/SQLite/OCR/ComfyUI MCP adapter를 단계적으로 연결하는 것이 안전하다.
