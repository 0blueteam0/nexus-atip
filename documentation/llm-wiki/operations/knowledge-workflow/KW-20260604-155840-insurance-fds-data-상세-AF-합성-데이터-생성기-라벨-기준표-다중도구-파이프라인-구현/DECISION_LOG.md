---
type: decision_log
task_id: KW-20260604-155840-insurance-fds-data-상세-AF-합성-데이터-생성기-라벨-기준표-다중도구-파이프라인-구현
project: insurance-fds-data
task: 상세 AF 합성 데이터 생성기 라벨 기준표 다중도구 파이프라인 구현
created: 2026-06-04T15:58:40+09:00
---

# Decision Log

| time | decision | alternatives | reason | evidence |
|---|---|---|---|---|
|  |  |  |  |  |

## Decision - v1 generator architecture
- 결정: 외부 의존성을 즉시 설치하기보다 pure Python generator로 structured/html/svg/prompt 산출물을 만들고, Playwright/OCR/ComfyUI는 다음 단계 adapter로 붙인다.
- 이유: 현재 환경에서 Tesseract/Poppler/Playwright 등은 PATH에 없고, 우선 라벨 기준과 재현 가능한 manifest를 확정하는 것이 FDS 데이터 파이프라인의 핵심이다.
