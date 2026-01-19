# Completed Plans

이 폴더는 **구현 완료된 플랜**을 보관합니다.

## 상태 전이
- `in-progress` -> `completed`: 모든 태스크 완료 시 이동
- `completed` -> `archived`: 7일 후 자동 이동 또는 수동 아카이브

## 파일 형식
- 파일명: `[원본 플랜명].md`
- 완료일자가 메타데이터에 기록됨

## 자동화
- ATOS plan-registry.json에서 상태 추적
- watchers.json의 plans-completed 경로 감시
