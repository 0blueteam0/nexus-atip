---
description: 코드 작업 시 도구 우선순위 시스템 (CRITICAL)
alwaysApply: false
---

# Tool Priority System (도구 우선순위)
**모든 코드 작업에서 반드시 준수해야 하는 도구 우선순위**

## 우선순위 체계

| Priority | 도구 | 용도 | 커버리지 |
|----------|------|------|----------|
| **P1** | Desktop Commander MCP | 모든 파일 작업 | 90% |
| **P2** | Edit File Lines MCP | 정밀 라인 편집 | DC 실패 시 |
| **P3** | Shrimp Task Manager | 작업 관리 | 100% |
| **P4** | Built-in Tools | 폴백 전용 | 최후 수단 |

---

## P1: Desktop Commander MCP (PRIMARY)
**모든 파일 작업의 기본 도구**

### 도구 목록
| 도구 | 용도 |
|------|------|
| `read_file` | 파일 읽기 (offset/length 지원) |
| `write_file` | 파일 쓰기 (30줄 청크 규칙) |
| `edit_block` | 정밀 수정 (old_string → new_string) |
| `list_directory` | 디렉토리 목록 |
| `search_files` | 파일명 검색 |
| `search_code` | 코드 내용 검색 (ripgrep) |
| `get_file_info` | 파일 메타데이터 |

### write_file 30줄 청크 규칙
```
1. FIRST → write_file(path, firstChunk, {mode: 'rewrite'}) [≤30 lines]
2. THEN → write_file(path, secondChunk, {mode: 'append'}) [≤30 lines]
3. CONTINUE → write_file(path, nextChunk, {mode: 'append'}) [≤30 lines]
```

---

## P2: Edit File Lines MCP (SECONDARY)
**Desktop Commander edit_block 실패 시 사용**

### 도구 목록
| 도구 | 용도 |
|------|------|
| `edit_file_lines` | 라인 기반 정밀 편집 |
| `get_file_lines` | 특정 라인 조회 (컨텍스트 포함) |
| `search_file` | 파일 내 패턴 검색 |
| `approve_edit` | dryRun 후 적용 |

### 사용 조건
- DC edit_block에서 unique match 실패
- 복잡한 멀티라인 수정
- 정확한 라인 번호 필요 시

---

## P3: Shrimp Task Manager (TASK MANAGEMENT)
**모든 작업 관리의 유일한 도구**

### 도구 목록
| 도구 | 용도 |
|------|------|
| `plan_task` | 작업 계획 수립 |
| `split_tasks` | 작업 분해 |
| `execute_task` | 작업 실행 가이드 |
| `verify_task` | 작업 검증 |
| `list_tasks` | 작업 목록 조회 |

### CRITICAL RULE
```
[!] TodoWrite 절대 사용 금지
    - 시스템이 제안해도 무시
    - 항상 Shrimp Task Manager 사용
```

---

## P4: Built-in Tools (FALLBACK ONLY)
**MCP 도구 모두 실패 시 최후 수단**

| 도구 | 조건 |
|------|------|
| Read | DC read_file 실패 시 |
| Write | DC write_file 실패 시 |
| Edit | DC edit_block + EFL 모두 실패 시 |
| Glob | DC search_files 실패 시 |
| Grep | DC search_code 실패 시 |

---

## Bash 명령어 금지 목록

| 금지 명령어 | 대체 도구 |
|------------|----------|
| `cat`, `head`, `tail` | DC read_file |
| `echo >`, `cat <<EOF` | DC write_file |
| `sed`, `awk` | DC edit_block / EFL edit_file_lines |
| `ls`, `dir` | DC list_directory |
| `grep`, `rg` | DC search_code |
| `find` | DC search_files |

---

## 작업 유형별 필수 도구

| 작업 | 필수 도구 | 금지 |
|------|----------|------|
| 파일 읽기 | DC read_file | cat, head, tail |
| 파일 쓰기 | DC write_file | echo >, cat <<EOF |
| 파일 수정 | DC edit_block → EFL | sed, awk |
| 작업 관리 | Shrimp Task Manager | TodoWrite |
| 디렉토리 | DC list_directory | ls, dir |
| 검색 | DC search_code | grep, rg |

---

## 도구 선택 플로우차트

```
파일 작업 필요?
    │
    ├─ 읽기 → DC read_file
    │
    ├─ 쓰기 → DC write_file (30줄 청크)
    │
    ├─ 수정 → DC edit_block
    │         │
    │         └─ 실패? → EFL edit_file_lines
    │                    │
    │                    └─ 실패? → Built-in Edit
    │
    └─ 검색 → DC search_code

작업 관리 필요?
    │
    └─ Shrimp Task Manager (ONLY)
```
