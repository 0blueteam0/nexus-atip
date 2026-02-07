# Minimalist Agent Guide (Pi 철학 기반)

> **출처**: aisparkup.com - Pi 코딩 에이전트 분석
> **핵심**: 4개 도구, 파일 기반 상태, <1000 토큰 시스템 프롬프트
> **목적**: 복잡성을 제거하고 본질에 집중하는 에이전트 설계

---

## 핵심 철학

### "Less is More"

| 기존 접근법 | Pi 접근법 |
|------------|----------|
| 50+ 도구 | **4개 도구** |
| 복잡한 메모리 시스템 | **파일 기반 상태** |
| 긴 시스템 프롬프트 | **<1000 토큰** |
| 다양한 출력 형식 | **텍스트만** |

---

## 4 Essential Tools

Pi 에이전트가 사용하는 핵심 4가지 도구:

```
1. read_file   - 파일 읽기
2. write_file  - 파일 쓰기
3. edit_file   - 파일 수정
4. bash        - 명령어 실행
```

### 왜 4개인가?

- **충분성**: 대부분의 코딩 작업은 이 4개로 해결 가능
- **예측성**: 도구가 적으면 행동이 예측 가능
- **신뢰성**: 도구 조합 오류 감소
- **속도**: 도구 선택 오버헤드 제거

---

## 파일 기반 상태 관리

### 핵심 파일들

| 파일 | 용도 | 예시 |
|------|------|------|
| `TODO.md` | 작업 목록 | 체크박스 리스트 |
| `PLAN.md` | 실행 계획 | 단계별 계획 |
| `STATE.md` | 현재 상태 | 진행 상황 |
| `LOG.md` | 작업 기록 | 타임스탬프 로그 |

### TODO.md 템플릿

```markdown
# TODO

## Current
- [ ] 인증 모듈 구현
- [ ] 테스트 작성

## Completed
- [x] 프로젝트 구조 설정
- [x] 의존성 설치

## Blocked
- [ ] API 키 대기 중 (외부 의존성)
```

### PLAN.md 템플릿

```markdown
# Implementation Plan

## Goal
[명확한 목표 한 문장]

## Steps
1. [첫 번째 단계]
2. [두 번째 단계]
3. [세 번째 단계]

## Current Step
Step 2: [현재 진행 중인 단계]

## Notes
- [중요한 메모]
```

---

## 시스템 프롬프트 설계

### 1000 토큰 이하 규칙

**나쁜 예시** (2000+ 토큰):
```
당신은 전문 소프트웨어 엔지니어입니다. 다음 규칙을 따르세요:
1. 항상 테스트를 작성하세요.
2. 코드 품질을 유지하세요.
3. 문서를 업데이트하세요.
... (수십 가지 규칙)
```

**좋은 예시** (<500 토큰):
```
You are a coding agent.

Tools: read_file, write_file, edit_file, bash

Workflow:
1. Read TODO.md for current task
2. Update PLAN.md before starting
3. Execute task
4. Update TODO.md when done

Rules:
- Test before commit
- One task at a time
- Ask if unclear
```

### 간결한 프롬프트 원칙

1. **역할 한 문장**: "You are a coding agent."
2. **도구 나열**: 사용 가능한 것만 명시
3. **워크플로우 3단계**: 시작, 실행, 완료
4. **규칙 5개 이하**: 핵심만

---

## 구현 예시

### 미니멀 에이전트 설정

```javascript
// minimal-agent-config.js
const config = {
  systemPrompt: `You are a coding agent.
Tools: read_file, write_file, edit_file, bash
Always read TODO.md first. Update it when done.`,

  tools: ['read_file', 'write_file', 'edit_file', 'bash'],

  stateFiles: {
    todo: 'TODO.md',
    plan: 'PLAN.md',
    log: 'LOG.md'
  },

  maxTokens: 4096,
  temperature: 0
};
```

### 세션 시작 스크립트

```bash
#!/bin/bash
# start-minimal-session.sh

# 1. 상태 파일 초기화
touch TODO.md PLAN.md LOG.md

# 2. 현재 상태 로드
cat TODO.md

# 3. Claude 실행
claude-code --system-prompt "$(cat SYSTEM_PROMPT.md)"
```

---

## Claude Code 적용

### 미니멀리스트 settings.json

```json
{
  "model": "claude-sonnet-4-20250514",
  "permissions": {
    "Bash": true,
    "Read": true,
    "Write": true,
    "Edit": true
  },
  "disabledTools": [
    "WebSearch",
    "WebFetch",
    "NotebookEdit"
  ]
}
```

### 미니멀리스트 CLAUDE.md

```markdown
# Minimal Agent Rules

## Tools
Use only: read_file, write_file, edit_file, bash

## State
- Read TODO.md at session start
- Update TODO.md after each task
- Log actions to LOG.md

## Workflow
1. Check TODO.md
2. Pick one task
3. Execute
4. Mark complete
5. Repeat
```

---

## 장단점 분석

### 장점

| 장점 | 설명 |
|------|------|
| **예측 가능성** | 행동 패턴이 일관됨 |
| **디버깅 용이** | 상태가 파일로 투명하게 노출 |
| **세션 연속성** | 파일이 상태를 유지 |
| **비용 효율** | 짧은 프롬프트 = 낮은 토큰 사용 |

### 단점

| 단점 | 해결책 |
|------|--------|
| 웹 검색 불가 | 별도 리서치 세션 분리 |
| 복잡한 분석 제한 | 필요시 도구 일시 추가 |
| IDE 통합 제한 | 파일 기반 워크플로우로 대체 |

---

## 사용 권장 시나리오

### 적합한 경우
- [ ] 명확한 작업 목록이 있는 경우
- [ ] 단일 저장소 작업
- [ ] 리팩토링 / 버그 수정
- [ ] 자동화된 반복 작업 (Ralph Wiggum 루프)

### 부적합한 경우
- [ ] 리서치가 필요한 작업
- [ ] 다중 저장소 작업
- [ ] 복잡한 아키텍처 설계
- [ ] 외부 API 연동 작업

---

## 참조 자료

- **Pi 에이전트 원본**: github.com/badlogic/pi-mono
- **관련 스킬**: ralph-wiggum-loop
- **철학적 배경**: Unix 철학 "Do one thing well"

---

**버전**: 1.0.0
**작성일**: 2026-02-07
**출처**: aisparkup.com 크롤링 인사이트
