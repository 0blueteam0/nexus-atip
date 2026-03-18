# Planning Context (자동 로드)

## 세션 시작 시 필수 확인
1. `node planning-system/restore.js --all` 실행
2. 활성 플랜 있으면 plans/ACTIVE-PLAN.md 참조
3. 플랜 작업 시 checkpoint.js로 상태 업데이트

## 플랜 상태 파일
| 파일 | 용도 |
|------|------|
| `plans/*-progress.json` | 진행 상황 데이터 |
| `plans/ACTIVE-PLAN.md` | 즉시 참조용 현재 상태 |
| `planning-log/daily/` | 일일 작업 로그 |

## 플랜 관리 명령어
```bash
# 상태 확인
node planning-system/restore.js --all

# 태스크 완료
node planning-system/checkpoint.js --plan <planId> --task <taskId> --status completed

# Phase 완료
node planning-system/checkpoint.js --plan <planId> --phase <phaseId> --status completed

# 테스트
node planning-system/checkpoint.js --test
```

## Claude 행동 규칙
1. **세션 시작 시**: 플랜 상태 자동 확인 (hook 통해 실행됨)
2. **작업 중**: 태스크 완료 시 checkpoint.js로 상태 업데이트
3. **Phase 전환**: phase 완료 시 자동 Git 커밋
4. **플랜 언급 시**: plans/ACTIVE-PLAN.md 참조 후 응답

## 관련 파일
- `planning-system/restore.js` - 상태 복원
- `planning-system/checkpoint.js` - 상태 저장 + Git 커밋
- `.claude-hooks.json` - 훅 설정 (planning-restore, planning-persist)
