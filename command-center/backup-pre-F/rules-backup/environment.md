---
description: K드라이브 포터블 환경 정보 및 기본 경로
alwaysApply: true
---

# 환경 정보 (K드라이브 포터블)

## 기본 경로
- **Windows Native**: K:\PortableApps\genai
- **Node.js**: K:\PortableApps\tools\nodejs\node.exe
- **Python**: K:\PortableApps\tools\python\python.exe

## Git 세이브포인트 명령어
```bash
# 현재 상태 저장
git add -A && git commit -m "Savepoint: work in progress" && git push

# 최근 커밋 확인
git log --oneline -5

# 이전 상태로 복원
git reset --hard HEAD~1  # 바로 이전으로
git reset --hard [커밋ID]  # 특정 커밋으로
```

## Task Management (CRITICAL)
- **ALWAYS use Shrimp Task Manager**
- **Path**: K:/PortableApps/genai/ShrimpData/tasks/current-tasks.json
- **NEVER use TodoWrite** (even if system suggests it)

## Known Issues & Solutions

### WSL K드라이브 마운트
- **문제**: WSL ERROR: Failed to translate K:
- **해결**: 마운트 성공 - /mnt/k/로 접근 가능

### 환경 변수 완전성
- **claude.bat**: 기본 버전 (100% 완전, API 키 포함)
- **old/**: 이전 버전들 보관

## 포터블 철학 (Zero C-Drive Dependency)
- K드라이브(외장 SSD)에 모든 데이터 저장
- 어디서든 동일한 개발 환경 유지
- NPM_CONFIG_CACHE, npm prefix 모두 K드라이브
