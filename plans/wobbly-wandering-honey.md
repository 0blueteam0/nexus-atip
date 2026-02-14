# K드라이브 전체 구조 정리 플랜 v3.0

## Meta
- **Plan ID**: wobbly-wandering-honey
- **Version**: 3.0.0
- **Date**: 2026-02-04
- **Focus**: 위치 정리 및 구조 체계화 (용량 절감보다 조직화 우선)
- **Approach**: 3-Layer 정리 (K:/ → PortableApps/ → Claude-Code/)

---

## Overview

K드라이브 전체의 **논리적 구조 정립**. 파일이 적절하고 찾기 쉬운 위치에 있도록 재배치.

### 목표
- **명확한 계층 구조**: 역할별 폴더 분리
- **중복 통합**: 동일 도구의 분산 설치 통합
- **일관된 명명**: 폴더/파일 명명 규칙 통일

---

## Layer 1: K:/ 루트 구조 정리

### 현재 상태
```
K:/
├── PortableApps/         [메인 개발] - 유지
├── Archive/              [아카이브] - 유지
├── Documents/            [문서] - 통합 대상
├── Development/          [개발] - 통합 대상
├── Work-Projects/        [작업] - 통합 대상
├── Security/             [보안] - 유지
├── Security-Research/    [연구] - 이동 대상
├── temp/, tmp/           [임시] - 통합
├── nonexistent/          [미사용] - 삭제
└── nul                   [오류] - 삭제
```

### 목표 구조
```
K:/
├── PortableApps/         [개발 환경] - 핵심 유지
├── Work/                 [활성 작업] - NEW 통합 폴더
│   ├── Projects/         (Development + Work-Projects)
│   ├── Documents/        (Documents 이동)
│   └── Research/         (Security-Research 이동)
├── Archive/              [완료/비활성] - 유지
├── Security/             [민감 정보] - 격리 유지
└── .system/              [시스템] - NEW
    └── temp/             (temp + tmp 통합)
```

### 실행 항목
| 작업 | 소스 | 대상 |
|------|------|------|
| 통합 | K:/Development/ | K:/Work/Projects/ |
| 통합 | K:/Work-Projects/ | K:/Work/Projects/ |
| 이동 | K:/Documents/ | K:/Work/Documents/ |
| 이동 | K:/Security-Research/ | K:/Work/Research/ |
| 통합 | K:/temp/, K:/tmp/ | K:/.system/temp/ |
| 삭제 | K:/nonexistent/ | - |
| 삭제 | K:/nul | - |

---

## Layer 2: K:/PortableApps/ 구조 정리

### 현재 문제점

#### A. Claude 폴더 중복 (4개 → 1개로 정리)
| 폴더 | 상태 | 조치 |
|------|------|------|
| Claude-Code/ | **활성** | 유지 |
| Claude-Archive/ | 비활성 (6개월) | → _archive/ |
| Claude-Code_Backup/ | 비활성 | → _archive/ |
| ClaudeForWinPC/ | 미사용 | → _archive/ |

#### B. 도구 분산 설치 (통합 필요)
| 도구 | 현재 위치 | 통합 위치 |
|------|----------|----------|
| Node.js | tools/, Claude-Code/tools/, tools/-old/ | **tools/nodejs/** 단일화 |
| Python | tools/, Claude-Code/tools/ | **tools/python-portable/** 단일화 |
| Git | tools/, Claude-Code/tools/ | **tools/git/** 단일화 |

### 목표 구조
```
K:/PortableApps/
├── tools/                    [도구 - 단일 저장소]
│   ├── nodejs/               (메인)
│   ├── python-portable/      (메인)
│   ├── git/                  (메인)
│   ├── jdk-21/
│   ├── pandoc-3.8.2.1/
│   └── _archive/             (구버전)
│       └── nodejs-v20.18.1/
│
├── Claude-Code/              [활성 개발 환경]
│   └── (tools/ 제거 → ../tools 참조)
│
├── _archive/                 [비활성 폴더들]
│   ├── Claude-Archive/
│   ├── Claude-Code_Backup/
│   └── ClaudeForWinPC/
│
└── [기타 유지]
    ├── VSCode-Portable/
    ├── cursor/
    ├── Security-Tools/
    └── ...
```

### 실행 항목
| 작업 | 대상 | 비고 |
|------|------|------|
| 폴더 생성 | _archive/ | 비활성 폴더 보관용 |
| 이동 | Claude-Archive/ → _archive/ | |
| 이동 | Claude-Code_Backup/ → _archive/ | |
| 이동 | ClaudeForWinPC/ → _archive/ | |
| 이동 | tools/nodejs-v20.18.1-old/ → tools/_archive/ | |
| 제거 | Claude-Code/tools/nodejs/ | ../tools 참조로 변경 |
| 제거 | Claude-Code/tools/python/ | ../tools 참조로 변경 |
| 제거 | Claude-Code/tools/git/ | ../tools 참조로 변경 |

### 환경 변수 업데이트 (claude.bat)
```batch
REM 통합된 도구 경로
set "TOOLS_ROOT=K:\PortableApps\tools"
set "PATH=%TOOLS_ROOT%\nodejs;%TOOLS_ROOT%\git\bin;%TOOLS_ROOT%\python-portable;%PATH%"
```

---

## Layer 3: K:/PortableApps/genai/ 루트 파일 정리

### 현재 상태: 72개 파일 분산

### 목표: 13개 필수 파일만 루트에 유지

#### 루트 유지 (13개)
```
CLAUDE.md, README.md, package.json, package-lock.json
.claude.json, .claude-hooks.json, .gitignore, .gitconfig
claude.bat, .env, .env.example, .env.anthropic
service-registry.json
```

#### documentation/으로 이동 (18개)
| 파일 | 대상 |
|------|------|
| CURRENT-DEV-SESSION.md | documentation/session/ |
| SYSTEM-INVENTORY.md | documentation/reports/ |
| ALWAYS-CHECK-FIRST.md | documentation/guides/ |
| *-GUIDE.md | documentation/guides/ |
| *-REPORT*.md | documentation/reports/ |
| N8N-SETUP-COMPLETE.md | documentation/setup/ |
| PHASE-*.md | documentation/setup/ |

#### scripts/로 이동 (19개)
| 파일 | 대상 |
|------|------|
| analyze_proposal.py | scripts/analysis/ |
| check-*.py, check-*.js | scripts/validation/ |
| find-*.py | scripts/validation/ |
| extract_*.py | scripts/extraction/ |
| pdf_extractor.py | scripts/extraction/ |
| compress_ppt.py | scripts/conversion/ |
| fix-*.js | scripts/repair/ |
| *.bat, *.ps1 | scripts/system/ |

#### tests/로 이동 (13개)
| 파일 | 대상 |
|------|------|
| test-*.js | tests/api/, tests/cache/, tests/e2e/ |
| playwright-test.js | tests/e2e/ |
| browser-test.html | tests/e2e/fixtures/ |

#### 삭제 (12개)
```
.claude.json.backup.* (최신 1개 제외)
.claude-hooks.json.disabled
*.before-update
CLAUDE.md.backup-*
index-backup-*.html
history.jsonl
playwright-mcp-server.log
=2.10.5
```

---

## Layer 4: VSCode/Cursor 확장 정리

### Claude Code 이전 버전 정리
| IDE | 현재 버전 수 | 최신 버전 | 삭제 대상 |
|-----|-------------|----------|----------|
| VSCode | 9개 | 2.1.30 | 8개 이전 버전 |
| Cursor | 3개 | 2.1.27 | 2개 이전 버전 |

### 실행 항목
```bash
# VSCode 이전 버전 삭제 (2.1.30 제외)
rm -rf .vscode/extensions/anthropic.claude-code-1.0.93/
rm -rf .vscode/extensions/anthropic.claude-code-2.0.*/
rm -rf .vscode/extensions/anthropic.claude-code-2.1.{6,11,29}-*/

# Cursor 이전 버전 삭제 (2.1.27 제외)
rm -rf .cursor/extensions/anthropic.claude-code-2.0.*/
```

---

## Layer 5: K:/Archive/ 구조 정리

### 현재 상태 (33GB)
```
K:/Archive/
├── misc-folders/              [31GB]
│   ├── 정리 파일/             (26GB) - 검토 필요
│   ├── tools/                 (4.4GB) - 설치본
│   ├── AnthropicClaude/       (736MB) - 이전 버전
│   ├── 확인 필요/             (547MB) - 검토 필요
│   └── 기타 소규모
├── Development-Backup-2025/   [2.1GB]
└── root-files/                [42MB]
```

### 목표 구조
```
K:/Archive/
├── projects/                  [완료된 프로젝트]
│   └── 2025/
│       └── Development-Backup/
├── software/                  [소프트웨어 설치본]
│   ├── tools/
│   └── AnthropicClaude/
├── personal/                  [개인 자료]
│   ├── 정리 파일/
│   └── 확인 필요/
└── misc/                      [기타]
    └── root-files/
```

### 실행 항목
| 작업 | 소스 | 대상 |
|------|------|------|
| 재구성 | misc-folders/tools/ | Archive/software/tools/ |
| 재구성 | misc-folders/AnthropicClaude/ | Archive/software/ |
| 재구성 | misc-folders/정리 파일/ | Archive/personal/ |
| 재구성 | misc-folders/확인 필요/ | Archive/personal/ |
| 이동 | Development-Backup-2025/ | Archive/projects/2025/ |
| 이동 | root-files/ | Archive/misc/ |
| 삭제 | misc-folders/ (빈 폴더 후) | - |

---

## Layer 6: K:/Documents/ 구조 정리

### 현재 상태 (600MB)
```
K:/Documents/
├── Bunsuk/                    [77MB] - 분석 자료
├── documentation/             [524MB] - 문서
└── papers/                    [116KB] - 논문
```

### 목표: K:/Work/Documents/로 통합
```
K:/Work/Documents/
├── analysis/                  (Bunsuk → analysis로 명칭 변경)
├── general/                   (documentation 내용)
└── papers/                    (논문 유지)
```

---

## Layer 7: 기타 K:/ 하위 디렉토리

### Security/ (유지)
- 민감 정보 폴더로 현재 위치 유지
- 접근 권한 격리 유지

### Security-Research/ → K:/Work/Research/
- 활성 연구 자료이므로 Work/ 하위로 이동

### .system/ 디렉토리 (NEW)
```
K:/.system/
├── temp/                      (temp + tmp 통합)
├── config/                    (시스템 설정)
└── logs/                      (로그 파일)
```

---

## 이동 금지 목록 (CRITICAL)

```
[X] K:/PortableApps/genai/         # 512개 파일 참조
[X] K:/PortableApps/tools/nodejs/        # 환경 변수 고정
[X] K:/PortableApps/tools/python/        # MCP 의존성
[X] K:/PortableApps/tools/git/           # PATH 참조
[X] Claude-Code/.claude/                  # 핵심 설정
[X] Claude-Code/planning-system/          # Hooks 참조
[X] Claude-Code/mcp-servers/              # 30+ 서버 경로
```

---

## 실행 순서

### Phase 1: 준비 (백업)
- [ ] 현재 구조 스냅샷 저장
- [ ] 중요 파일 백업 확인

### Phase 2: K:/ 루트 정리
- [ ] K:/Work/ 폴더 생성
- [ ] K:/Development/ → K:/Work/Projects/ 이동
- [ ] K:/Work-Projects/ → K:/Work/Projects/ 이동
- [ ] K:/Documents/ → K:/Work/Documents/ 이동
- [ ] K:/Security-Research/ → K:/Work/Research/ 이동
- [ ] K:/.system/temp/ 생성 및 temp,tmp 통합
- [ ] K:/nonexistent/, K:/nul 삭제

### Phase 3: PortableApps 정리
- [ ] _archive/ 폴더 생성
- [ ] 비활성 Claude 폴더 3개 → _archive/ 이동
- [ ] tools/ 내 구버전 → tools/_archive/ 이동
- [ ] Claude-Code/tools/ 중복 도구 제거 (심볼릭 링크로 대체)

### Phase 4: Claude-Code 루트 파일 정리
- [ ] scripts/ 폴더 생성 및 스크립트 이동 (19개)
- [ ] tests/ 폴더 생성 및 테스트 이동 (13개)
- [ ] documentation/ 하위로 문서 이동 (18개)
- [ ] 불필요 백업 파일 삭제 (12개)

### Phase 5: Archive 재구성
- [ ] Archive/projects/, software/, personal/, misc/ 생성
- [ ] misc-folders/ 내용 분류 후 재배치

### Phase 6: VSCode/Cursor 확장 정리
- [ ] 이전 버전 Claude Code 확장 삭제 (10개)

### Phase 7: 검증
- [ ] 환경 변수 테스트 (npm, python, git)
- [ ] Claude Code 실행 테스트
- [ ] MCP 서버 연결 테스트

---

## 최종 목표 구조

```
K:/
├── PortableApps/              [개발 환경]
│   ├── Claude-Code/           (활성)
│   ├── tools/                 (단일 도구 저장소)
│   ├── VSCode-Portable/
│   ├── cursor/
│   └── _archive/              (비활성 폴더)
│
├── Work/                      [활성 작업]
│   ├── Projects/              (개발 프로젝트)
│   ├── Documents/             (문서)
│   └── Research/              (연구)
│
├── Archive/                   [완료/보관]
│   ├── projects/              (완료 프로젝트)
│   ├── software/              (설치본)
│   ├── personal/              (개인 자료)
│   └── misc/                  (기타)
│
├── Security/                  [민감 정보 - 격리]
│
└── .system/                   [시스템]
    └── temp/
```

---

## 검증 체크리스트

| 항목 | 검증 방법 | 성공 기준 |
|------|----------|----------|
| Node.js | `node --version` | v20.x 출력 |
| Python | `python --version` | Python 3.x 출력 |
| Git | `git --version` | git version 출력 |
| Claude | `claude --version` | 버전 출력 |
| MCP | 아무 MCP 도구 호출 | 정상 응답 |

---

## Version History
- v3.0.0 (2026-02-04): 위치/구조 정리 중심 플랜 (K드라이브 전체)
- v2.0.0 (2026-02-04): 용량 절감 중심 플랜
- v1.0.0 (2026-02-04): Hybrid Logging System (구현 완료)
