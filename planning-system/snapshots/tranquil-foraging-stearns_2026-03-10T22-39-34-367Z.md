# Claude-Code → genai 폴더 복사 마이그레이션 플랜

## Context

`K:\PortableApps\Claude-Code` (24GB)를 `K:\PortableApps\genai`로 rename 시도 시 "다른 프로세스가 파일을 사용 중" 에러가 반복 발생. rename 대신 **robocopy로 복사** 후 원본을 나중에 삭제하는 방식으로 전환한다.

현재 상태:
- `Claude-Code/`: 24GB, 전체 프로젝트 파일 + .git 포함
- `genai/`: 286MB, Claude Code 실행에 필요한 기본 config만 존재 (현재 Claude Code 세션이 이 폴더에서 실행 중)

## 플랜

### Step 1: robocopy 복사 스크립트 생성

`K:\PortableApps\copy-to-genai.bat` 파일을 생성한다.

```bat
@echo off
chcp 65001 >nul 2>&1
title Claude-Code → genai Copy Migration

echo ============================================
echo  Claude-Code → genai robocopy 복사
echo ============================================

robocopy "K:\PortableApps\Claude-Code" "K:\PortableApps\genai" /E /R:1 /W:1 /MT:8 /XJ /XO /NFL /NDL
set ROBO_EXIT=%errorlevel%

if %ROBO_EXIT% LSS 8 (
    echo [+] 복사 성공 (exit code: %ROBO_EXIT%)
) else (
    echo [!] 복사 중 일부 에러 발생 (exit code: %ROBO_EXIT%)
)

echo.
echo [2] 경로 참조 마이그레이션 실행...
cd /d "K:\PortableApps\genai"
node migrate-to-genai.js

echo.
echo 완료. genai 폴더에서 Claude Code를 재시작하세요.
pause
```

핵심 robocopy 플래그:
- `/E` : 하위 폴더 포함 전체 복사
- `/R:1 /W:1` : 잠긴 파일은 1회만 재시도 후 스킵 (안정성 확보)
- `/MT:8` : 8스레드 병렬 복사
- `/XJ` : junction/symlink 제외
- `/XO` : genai에 이미 있는 **더 새로운 파일은 덮어쓰지 않음** (현재 세션의 config 보호)

### Step 2: 별도 CMD 창에서 스크립트 실행

현재 Claude Code 세션을 종료할 필요 없이, **별도 CMD 창**에서 `copy-to-genai.bat` 실행. robocopy는 소스 파일을 읽기만 하므로 잠긴 파일도 대부분 복사 가능.

### Step 3: 경로 참조 수정

복사 완료 후, 이미 존재하는 `migrate-to-genai.js` 스크립트가 파일 내부의 `Claude-Code` → `genai` 경로 참조를 자동 치환한다.

### Step 4: 검증

복사 후 확인 사항:
- `K:\PortableApps\genai\claude.bat` 존재 확인
- `K:\PortableApps\genai\.env` 존재 확인
- `K:\PortableApps\genai\.git\config` 존재 확인
- genai에서 Claude Code 재시작 테스트

### Step 5: 원본 삭제 (나중에)

모든 검증 후, 재부팅하거나 모든 프로세스 종료 후 `Claude-Code` 폴더 삭제:
```
rmdir /S /Q "K:\PortableApps\Claude-Code"
```

## 수정 대상 파일

- `K:\PortableApps\copy-to-genai.bat` (새로 생성)

## 재사용하는 기존 도구

- `K:\PortableApps\Claude-Code\migrate-to-genai.js` — 파일 내 경로 참조 치환 스크립트 (복사 후 genai 안에서 실행)

## 검증 방법

1. robocopy 종료 코드 확인 (8 미만이면 성공)
2. genai 폴더 사이즈가 ~24GB로 증가 확인 (`du -sh /k/PortableApps/genai`)
3. 핵심 파일 존재 확인 (claude.bat, .env, .git, CLAUDE.md)
4. genai에서 `claude.bat`로 Claude Code 세션 시작 → 정상 동작 확인
