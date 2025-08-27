# Bash Shell-Snapshots 문제 해결 보고서

## 📋 문제 개요
**날짜**: 2025-08-27  
**환경**: Windows 11, K드라이브 포터블 환경, Claude Code CLI

### 증상
1. Bash 명령 실행 시마다 `shell-snapshots` 폴더에 임시 파일 생성
2. 에러 메시지 반복: `Bash environment configured`
3. 한글 입력 문제 및 포커스 손실
4. 빠른 터미널 팝업으로 작업 방해

### 근본 원인
Claude Code가 매 Bash 명령 실행마다 셸 환경 스냅샷을 생성하는 메커니즘

---

## 🔍 문제 분석 과정

### 1단계: 에러 메시지 추적
```bash
# 발견된 문제
/k/PortableApps/Claude-Code/shell-snapshots/snapshot-bash-1756277500079-845q4u.sh: No such file or directory
```
- `.bashrc`의 echo 문이 반복 출력됨
- 스냅샷 파일이 계속 생성/삭제됨

### 2단계: 원인 파악
```javascript
// claude-code/cli.js 내부 코드 (1423행)
`Creating shell snapshot for ${B} (${A})`
k$0(YQ(),"shell-snapshots")  // 스냅샷 폴더 생성
```
- Claude Code 내부적으로 셸 환경 캡처를 위해 스냅샷 생성
- `BASH_EXECUTION_STRING` 환경변수에서 확인

### 3단계: 핵심 발견
- **집중 포인트**: 스냅샷 폴더 생성 자체를 차단하면 문제 해결
- **해결 아이디어**: 폴더 대신 같은 이름의 파일을 만들어 차단

---

## ✅ 최종 해결책

### 핵심 해결 방법: 폴더 생성 차단
```batch
@echo off
REM 1. 기존 스냅샷 폴더 삭제
rmdir /S /Q "K:\PortableApps\Claude-Code\shell-snapshots" 2>nul

REM 2. 같은 이름의 파일 생성 (폴더 생성 차단)
echo This file prevents snapshot folder creation > "K:\PortableApps\Claude-Code\shell-snapshots"

REM 3. 읽기 전용 설정 (선택사항)
attrib +R "K:\PortableApps\Claude-Code\shell-snapshots"
```

### 보조 해결 방법
1. **.bashrc 정리**: echo 문 제거
2. **환경변수 설정**: 
   - `CLAUDE_CODE_SHELL=cmd.exe`
   - `BASH_ENV=` (빈값)

---

## 🎯 해결의 핵심 포인트

### 무엇에 집중했나?
1. **증상이 아닌 원인에 집중**
   - ❌ 스냅샷 파일을 주기적으로 삭제 → 임시방편
   - ✅ 스냅샷 생성 자체를 차단 → 근본 해결

2. **창의적 해결법 적용**
   - Windows 파일시스템 특성 활용
   - 같은 이름의 파일이 있으면 폴더를 만들 수 없음
   - 단순하지만 효과적인 차단 메커니즘

3. **최소한의 변경**
   - Claude Code 소스 수정 없음
   - 시스템 설정 변경 최소화
   - 되돌리기 쉬운 해결책

---

## 📊 결과

### Before
```
K:\PortableApps\Claude-Code\shell-snapshots\
├── snapshot-bash-1756277247137-v78vvq.sh
├── snapshot-bash-1756277500079-845q4u.sh
└── ... (계속 생성됨)
```

### After
```
K:\PortableApps\Claude-Code\shell-snapshots  (파일, 46 bytes)
```
- 더 이상 스냅샷 생성 안 됨
- Bash 명령 정상 실행
- 에러 메시지 없음

---

## 💡 교훈

1. **문제의 본질 파악이 중요**
   - 표면적 증상: 스냅샷 파일이 쌓임
   - 실제 문제: 스냅샷 메커니즘 자체

2. **시스템 제약을 활용한 해결**
   - OS 파일시스템 규칙 활용
   - 복잡한 패치 대신 단순한 차단

3. **영구적 vs 임시적 해결책**
   - 임시: 주기적 정리 스크립트
   - 영구: 생성 자체를 차단

---

## 🔧 유지 관리

### 상태 확인 스크립트
```batch
@echo off
if exist "K:\PortableApps\Claude-Code\shell-snapshots" (
    dir /a-d "K:\PortableApps\Claude-Code\shell-snapshots" >nul 2>&1
    if %errorlevel% == 0 (
        echo [OK] Blocker file exists
    )
)
```

### 자동 복구 (선택사항)
- `MAINTAIN-BASH-FIX.bat` 실행으로 상태 유지
- Windows 시작 시 자동 실행 가능

---

## 📝 요약

**핵심 해결 전략**: "문제를 고치려 하지 말고, 문제가 발생할 수 없게 만들어라"

- 스냅샷 파일 삭제 ❌ → 스냅샷 폴더 생성 차단 ✅
- 복잡한 환경변수 조작 ❌ → 단순한 파일시스템 트릭 ✅
- Claude Code 소스 수정 ❌ → 외부에서 우회 ✅

**결과**: 완벽하게 작동하며 영구적인 해결책 구현 완료