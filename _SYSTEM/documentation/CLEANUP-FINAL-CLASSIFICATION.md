# 최종 파일 분류 - 5단계 체계
날짜: 2025-08-27
분류 기준: 의존성 및 연결성 중심

## [*] 5단계 분류 체계

### 1. ESSENTIAL (핵심 - 절대 건드리지 않음)
**정의**: 시스템이 작동하지 않는 파일들
```
claude.bat                  # 메인 실행 파일
CLAUDE.md                   # 핵심 지침 (자주 참조됨)
package.json                # Node 의존성 정의
package-lock.json           # 의존성 잠금
.bashrc                     # Bash 환경 설정
.bash_profile               # Bash 프로필
shell-snapshots             # 폴더 생성 차단 파일 (중요!)
```

### 2. SYSTEM-LINKED (시스템 연결 - 신중히 확인 필요)
**정의**: 다른 시스템/프로세스가 참조할 수 있는 파일들

#### A. MCP 관련 (다른 MCP 서버가 참조 가능)
```
mcp-servers/                # 모든 MCP 서버 (git, kiro, zen 등)
load-env-keys.bat           # API 키 로드 (MCP가 사용)
```

#### B. 자동화 시스템 (Windows 스케줄러/시작프로그램)
```
ADD-TO-STARTUP.bat          # Windows 시작 등록
MAINTAIN-BASH-FIX.bat       # 상태 유지 스크립트
systems/AUTO-STARTUP.bat    # 자동 시작
systems/INSTALL-AUTO-STARTUP.bat
```

#### C. Shrimp Task Manager 연동
```
ShrimpData/                 # Shrimp 데이터
shrimp-formatter.js         # 포맷터
shrimp-reader.js            # 리더
shrimp-pretty.js            # 프리티
shrimp-compact.bat          # 실행 파일
shrimp-view.bat             # 뷰어
```

#### D. 프로젝트 세션 파일 (Claude가 참조)
```
projects/K--PortableApps-Claude-Code/*.jsonl  # 세션 기록
statsig/                    # 통계 데이터
```

#### E. Hook 시스템 (자동 실행)
```
hooks/auto-memory-system.js # 메모리 자동 저장
```

### 3. ACTIVE-TOOLS (현재 활성 도구)
**정의**: 최근에 만들어졌고 실제로 사용중

#### 최근 수정 파일들 (8월 27일)
```
PERMANENT-FIX-SNAPSHOT.bat  # 스냅샷 영구 차단
FILE-CLEANUP-ANALYSIS.md    # 정리 분석 (방금 생성)
CLEANUP-PLAN-DETAILED.md    # 정리 계획 (방금 생성)
AUTO-CLEAN-SNAPSHOTS.bat    # 스냅샷 자동 정리
documentation/ASCII-STYLE-GUIDE.md  # ASCII 가이드
documentation/BASH-PROBLEM-SOLUTION.md
```

#### 유틸리티 스크립트
```
quick.bat                   # 빠른 실행
scripts/optimize.bat        # 최적화
scripts/CLEANUP-SMART.bat   # 스마트 정리
```

### 4. REFERENCE (참조용 - 보관 가치 있음)
**정의**: 현재 안 쓰지만 문서/학습 가치 있음

#### 문서화 폴더 (전체 유지)
```
documentation/              # 모든 문서
├── core-modules/          # 핵심 모듈 문서
├── evidence/              # 증거 자료
├── guides/                # 가이드
└── reports/               # 보고서
```

#### 백업 파일
```
BACKUP-2025-08-21/         # 최근 백업
ESSENTIAL-BACKUP/          # 필수 백업
old/                       # 이전 버전
```

#### 도구 폴더
```
tools/                     # git, nodejs, python
```

### 5. TEMPORARY (임시 - 정리 가능)
**정의**: 테스트/디버그용 일회성 파일

#### Bash 문제 해결 시도 (50개+)
```
BASH-ERROR-SOLUTION.txt
BASH-FIX-GUIDE.txt
BASH-FIX-SIMPLE.bat
bash-no-snapshot.bat
bash.bat (중복)
COMPLETE-BASH-FIX.bat
DEBUG-BASH-PROBLEM.bat
DEBUG-CLAUDE-BASH.bat
FINAL-BASH-FIX.bat
FIX-BASH-*.txt (10개)
FIX-BASH-*.bat (10개)
WSL-*.txt (6개)
fix-bash.ps1
fix-bash.py
fix-git-bash.py
```

#### 테스트 파일 (20개+)
```
TEST-*.bat
TEST-*.txt
test-*.bat
direct-test.bat
REALTIME-DIAGNOSTIC.js
```

#### 팝업 모니터링 (임시)
```
CATCH-POPUP-NOW.bat
START-POPUP-MONITOR.bat
catch-popup.ps1
monitor-popup.bat
check-scheduled-tasks.bat
```

#### 일회성 스크립트
```
add-desktop-commander.py
analyze-timestamp.js
add-utf8-config.js
fix-paths.py
patch-claude-bash.js
trace-bash*.js
verify-utf8.bat
setup-utf8-complete.bat
```

#### 실행 지시 파일들
```
EXECUTE-THIS-NOW.txt
RUN-POWERSHELL-FIX.txt
QUICK-WSL-FIX.txt
INSTALL-DESKTOP-COMMANDER-NOW.txt
FIX-ALL-ISSUES-*.txt
FIX-TIMESTAMP-*.txt
```

### 6. OBSOLETE (폐기 - 삭제 대상)
**정의**: 완전히 쓸모없거나 손상된 파일

#### 빈/무의미한 파일
```
nul                        # 빈 파일
sh.bat                     # 의미 없음
run-trace.bat              # 용도 불명
simple-fix.bat             # 너무 단순
```

#### 중복 디렉토리
```
todos/                     # (ARCHIVE에도 있음)
data/                      # (ShrimpData와 중복)
tmp/                       # 빈 폴더
ClaudeCode/                # 오래된 복사본
```

#### Python 관련 (사용 안함)
```
view-tasks.py              # Python 뷰어 (JS로 대체됨)
install-desktop-commander.bat
```

## [>>] 의존성 체크 결과

### 외부 시스템과 연결된 파일들
1. **Windows 스케줄러**: ADD-TO-STARTUP.bat
2. **MCP 서버들**: mcp-servers/* (다른 MCP가 참조)
3. **Claude CLI**: projects/*.jsonl (세션 데이터)
4. **Shrimp**: ShrimpData/* (태스크 데이터)
5. **Git**: .bashrc, tools/git/*
6. **Node.js**: package.json, node_modules/
7. **API 서비스**: load-env-keys.bat (.env 파일 로드)

### 상호 참조 관계
```
claude.bat 
  → package.json 
  → node_modules/@anthropic-ai/claude-code/
  → .bashrc (bash 실행 시)
  → load-env-keys.bat (API 키)
  
MAINTAIN-BASH-FIX.bat
  → shell-snapshots (체크/생성)
  
systems/*.js
  → CLAUDE.md (참조)
  → patterns.json (있다면)
```

## [*] 안전한 정리 절차

### Phase 1: 백업
```batch
mkdir FULL-BACKUP-2025-08-27
xcopy *.* FULL-BACKUP-2025-08-27\ /E /Y
echo Backup created at %date% %time% > FULL-BACKUP-2025-08-27\README.txt
```

### Phase 2: 임시 파일 이동
```batch
mkdir ARCHIVE\2025-08-27-cleanup\bash-fixes
move *BASH*.bat ARCHIVE\2025-08-27-cleanup\bash-fixes\
move *BASH*.txt ARCHIVE\2025-08-27-cleanup\bash-fixes\
move FIX-*.bat ARCHIVE\2025-08-27-cleanup\bash-fixes\
move WSL-*.txt ARCHIVE\2025-08-27-cleanup\bash-fixes\

mkdir ARCHIVE\2025-08-27-cleanup\tests
move TEST-*.* ARCHIVE\2025-08-27-cleanup\tests\
move test-*.* ARCHIVE\2025-08-27-cleanup\tests\
move *-test.* ARCHIVE\2025-08-27-cleanup\tests\

mkdir ARCHIVE\2025-08-27-cleanup\temp-scripts  
move *.py ARCHIVE\2025-08-27-cleanup\temp-scripts\
move trace-*.js ARCHIVE\2025-08-27-cleanup\temp-scripts\
move catch-*.* ARCHIVE\2025-08-27-cleanup\temp-scripts\
```

### Phase 3: 폐기 파일 이동
```batch
mkdir ARCHIVE\2025-08-27-cleanup\obsolete
move nul ARCHIVE\2025-08-27-cleanup\obsolete\
move sh.bat ARCHIVE\2025-08-27-cleanup\obsolete\
move simple-fix.bat ARCHIVE\2025-08-27-cleanup\obsolete\
rmdir /S /Q tmp
rmdir /S /Q ClaudeCode
```

### Phase 4: ARCHIVE 내부 정리
```batch
REM ARCHIVE 내부도 정리
cd ARCHIVE
mkdir historical\2025-01
move cleanup-2025-01-21\* historical\2025-01\

mkdir historical\2025-08  
move cleanup-2025-08-21\* historical\2025-08\

rmdir /Q deprecated-bat
rmdir /Q old-junk-files
rmdir /Q failed-attempts
```

## [!] 최종 예상 구조
```
K:/PortableApps/Claude-Code/
├── [ESSENTIAL: 7 files]       # 핵심 파일만
├── [SYSTEM-LINKED: 5 folders] # 시스템 연결 폴더
├── documentation/              # 문서 (유지)
├── mcp-servers/               # MCP (유지)  
├── systems/                   # 시스템 스크립트
├── scripts/                   # 유틸리티
├── tools/                     # 도구
├── projects/                  # 세션 데이터
├── ShrimpData/                # Shrimp 데이터
├── ARCHIVE/                   
│   ├── 2025-08-27-cleanup/   # 오늘 정리본
│   │   ├── bash-fixes/        # 50+ files
│   │   ├── tests/             # 20+ files
│   │   ├── temp-scripts/      # 30+ files
│   │   └── obsolete/          # 10+ files
│   ├── historical/            # 과거 정리본
│   └── reference/             # 참조용
└── temp/                      # 임시 (비움)
```

## [?] 체크포인트
- 시스템 연결 파일 확인: ✓
- Windows 스케줄러 관련: ✓
- MCP 의존성: ✓
- API 키 관련: ✓
- 세션 데이터: ✓

---
**준비 완료**: 이제 안전하게 정리 가능합니다!