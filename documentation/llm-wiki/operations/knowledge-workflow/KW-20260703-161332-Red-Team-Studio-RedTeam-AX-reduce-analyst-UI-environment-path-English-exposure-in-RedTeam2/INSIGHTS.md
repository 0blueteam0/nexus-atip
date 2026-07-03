---
type: insight
status: complete
project: Red Team Studio
created: 2026-07-03T16:13:32+09:00
---

# Insight

## 관찰

RedTeam2는 Evidence 추적을 강화하면서 화면에 raw path/API 문자열도 함께 늘어났다.

## 통찰

추적성은 데이터 계층과 감사 기록에 남기고, 분석가 화면은 상태와 다음 행동 중심으로 요약해야 초급 운영자 UX와 증거 통제가 동시에 성립한다.

## 제안

다음 browser visual regression은 첫 viewport에서 `J:/`, `/api/redteam`, `source_dir`, `artifact_path`, `stored:`가 보이지 않는지 확인해야 한다.

## 적용 가능 범위

RedTeam2 Report Studio, 운영 closure, service import, toolchain execution panels.

## 후속 작업

관리자 패널에 권한 기반 상세 보기 토글을 만들 경우에도 기본값은 숨김으로 둔다.
