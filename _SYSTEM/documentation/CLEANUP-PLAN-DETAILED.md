# 상세 파일 정리 계획
날짜: 2025-08-27
총 파일 수: 약 500개 이상

## [!] 심각한 중복 발견

### 1. FIX/DEBUG/TEST 관련 BAT 파일 (약 50개+)
- FIX-BASH-*.bat (10개+)
- DEBUG-*.bat (5개+) 
- TEST-*.bat (10개+)
- COMPLETE-*.bat (5개+)
- WSL-*.txt (6개)
- 모두 bash 문제 해결 시도 파일들

### 2. 중복 폴더
- todos/ (최상위에도, ARCHIVE에도 있음)
- data/ 와 ShrimpData/ (중복 기능)
- 여러 cleanup 폴더들 (cleanup-2025-01-21, cleanup-2025-08-21 등)

### 3. 쓸모없는 텍스트 파일들
- EXECUTE-THIS-NOW.txt
- FIX-ALL-ISSUES-CMD.txt
- FIX-ALL-ISSUES-POWERSHELL.txt
- 등등... 모두 임시 지시 파일

## [>>] 분류 결과

### ESSENTIAL (유지 필수) - 15개
```
claude.bat                 # 메인 실행 파일
CLAUDE.md                  # 핵심 지침
package.json               # Node 설정
package-lock.json          # Node 잠금
.bashrc                    # Bash 설정
.bash_profile              # Bash 프로필
shell-snapshots            # 차단용 파일
index.html                 # 웹 인터페이스
load-env-keys.bat          # API 키 로드
```

### ACTIVE (현재 활성) - 20개
```
MAINTAIN-BASH-FIX.bat      # Bash 유지관리
PERMANENT-FIX-SNAPSHOT.bat # 스냅샷 차단
ADD-TO-STARTUP.bat         # 시작 등록
shrimp-*.js (4개)          # Shrimp 포맷터
documentation/             # 모든 문서 (유지)
mcp-servers/               # MCP 서버들 (유지)
systems/                   # 시스템 스크립트 (유지)
```

### ARCHIVE 대상 (이동 필요) - 300개+

#### A. Bash 수정 시도 파일들 (50개+)
```
BASH-ERROR-SOLUTION.txt
BASH-FIX-GUIDE.txt
BASH-FIX-SIMPLE.bat
COMPLETE-BASH-FIX.bat
DEBUG-BASH-PROBLEM.bat
DEBUG-CLAUDE-BASH.bat
FINAL-BASH-FIX.bat
FIX-BASH-*.bat (모든 것)
FIX-BASH-*.txt (모든 것)
WSL-*.txt (모든 것)
```

#### B. 테스트 파일들 (20개+)
```
TEST-*.bat
TEST-*.txt
test-*.bat
direct-test.bat
```

#### C. 임시 Python/JS 파일들 (15개+)
```
add-desktop-commander.py
analyze-timestamp.js
add-utf8-config.js
fix-bash.py
fix-git-bash.py
fix-paths.py
patch-claude-bash.js
trace-bash*.js
```

#### D. 폐기 대상 (100개+)
```
EXECUTE-THIS-NOW.txt
RUN-POWERSHELL-FIX.txt
QUICK-WSL-FIX.txt
INSTALL-DESKTOP-COMMANDER-NOW.txt
catch-popup.ps1
monitor-popup.bat
check-scheduled-tasks.bat
```

### ARCHIVE 폴더 정리
현재 ARCHIVE 폴더도 너무 복잡함:
- cleanup-2025-01-21/ → archive-history/2025-01/
- cleanup-2025-08-21/ (파일 100개+!) → archive-history/2025-08/
- old-directories/ → keep as reference
- deprecated-bat/ → can be deleted
- old-junk-files/ → can be deleted

## [*] 실행 계획

### Step 1: 백업 생성
```batch
mkdir BACKUP-BEFORE-CLEANUP-2025-08-27
xcopy *.* BACKUP-BEFORE-CLEANUP-2025-08-27\ /Y
```

### Step 2: 카테고리별 이동
```batch
REM Bash 관련 파일들
mkdir ARCHIVE\bash-fixes-collection
move *BASH*.bat ARCHIVE\bash-fixes-collection\
move *BASH*.txt ARCHIVE\bash-fixes-collection\
move WSL-*.txt ARCHIVE\bash-fixes-collection\

REM 테스트 파일들  
mkdir ARCHIVE\test-files-collection
move TEST-*.* ARCHIVE\test-files-collection\
move test-*.* ARCHIVE\test-files-collection\

REM 임시 스크립트들
mkdir ARCHIVE\temp-scripts
move fix-*.py ARCHIVE\temp-scripts\
move trace-*.js ARCHIVE\temp-scripts\
```

### Step 3: 최종 구조
```
K:/PortableApps/Claude-Code/
├── claude.bat              [ESSENTIAL]
├── CLAUDE.md               [ESSENTIAL]
├── package.json            [ESSENTIAL]
├── .bashrc                 [ESSENTIAL]
├── shell-snapshots         [BLOCKER FILE]
├── documentation/          [KEEP ALL]
├── mcp-servers/            [KEEP ALL]
├── systems/                [KEEP ACTIVE ONLY]
├── scripts/                [KEEP ACTIVE ONLY]
├── tools/                  [KEEP ALL]
├── ShrimpData/             [KEEP]
├── ARCHIVE/                
│   ├── 2025-08-27-mega-cleanup/
│   │   ├── bash-fixes/     [50+ files]
│   │   ├── test-files/     [20+ files]
│   │   ├── temp-scripts/   [15+ files]
│   │   └── obsolete/       [100+ files]
│   └── [기존 폴더들 정리]
└── temp/                   [KEEP EMPTY]
```

## [!] 예상 결과
- 파일 수: 500개 → 50개 (90% 감소)
- 가독성: 매우 향상
- 유지보수: 훨씬 쉬워짐

---
**확인 필요**: 이 계획대로 진행해도 괜찮을까요?