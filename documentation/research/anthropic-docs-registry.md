# Anthropic 공식 문서 딥 리서치 레지스트리

**목적**: Claude Code 시스템 개선을 위한 공식 문서 탐색 기록 및 추적
**최초 생성**: 2025-12-19
**마지막 업데이트**: 2025-12-19

---

## 1. 크롤링 완료된 문서 (Crawled Documents)

### 1.1 code.claude.com (Claude Code CLI 문서)

| URL | 카테고리 | 핵심 발견 | 상태 |
|-----|---------|----------|------|
| /docs/en/hooks | Hooks | 12종 Hook 타입, matcher 패턴, prompt/command 타입 | ✅ 완료 |
| /docs/en/skills | Skills | SKILL.md 포맷, allowed-tools, frontmatter 규격 | ✅ 완료 |
| /docs/en/mcp | MCP | 설정 포맷, 스코프(local/project/user), 전송방식 | ✅ 완료 |
| /docs/en/interactive-mode | UX | 대화형 모드 설정 | ✅ 완료 |
| /docs/en/terminal-config | UX | 터미널 설정 | ✅ 완료 |
| /docs/en/checkpointing | Memory | 체크포인트 시스템 | ✅ 완료 |
| /docs/en/memory | Memory | 메모리 관리 | ✅ 완료 |
| /docs/en/costs | Usage | 비용 추적 | ✅ 완료 |

### 1.2 platform.claude.com (Agent SDK 문서)

| URL | 카테고리 | 핵심 발견 | 상태 |
|-----|---------|----------|------|
| /agent-sdk/hooks | SDK Hooks | Python/TypeScript 훅 API | ✅ 완료 |
| /agent-sdk/skills | SDK Skills | SDK 스킬 통합 | ✅ 완료 |
| /agent-sdk/tools | SDK Tools | 도구 정의 및 사용 | ✅ 완료 |

### 1.3 context7 (코드 예제)

| 라이브러리 | 버전 | 내용 | 상태 |
|-----------|------|------|------|
| claude-code | latest | 워크플로우 패턴, 코드 스니펫 | ✅ 완료 |

---

## 2. 핵심 발견 사항 (Key Findings)

### 2.1 Hooks (12종 공식 타입)

```
PreToolUse        - 도구 실행 전
PostToolUse       - 도구 실행 후 (성공)
PostToolUseFailure - 도구 실행 후 (실패)
UserPromptSubmit  - 사용자 프롬프트 제출 시
Stop              - 중지 시
SubagentStart     - 서브에이전트 시작
SubagentStop      - 서브에이전트 종료
PreCompact        - 컴팩트 전
PermissionRequest - 권한 요청 시
SessionStart      - 세션 시작
SessionEnd        - 세션 종료
Notification      - 알림
```

### 2.2 공식 Hook 설정 포맷

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node script.js"
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "node backup.js"
          }
        ]
      }
    ]
  }
}
```

### 2.3 Prompt-Based Hooks (LLM 기반)

```json
{
  "type": "prompt",
  "prompt": "Analyze if this edit follows project conventions..."
}
```

### 2.4 Hook 출력 포맷

```json
{
  "continue": true,
  "hookSpecificOutput": { ... }
}
```
- Exit code 0: 성공, 계속 진행
- Exit code 2: 블로킹, 작업 중단

### 2.5 Skills YAML Frontmatter

```yaml
---
name: skill-name
description: Brief description (max 1024 chars)
allowed-tools: Read, Grep, Glob
---
# Skill Instructions
```

---

## 3. 미탐색 문서 목록 (Uncrawled - 향후 리서치 대상)

### 3.1 code.claude.com 미탐색 예상

| URL 패턴 | 예상 내용 | 우선순위 |
|---------|----------|----------|
| /docs/en/plugins | 플러그인 시스템 | HIGH |
| /docs/en/plugin-marketplaces | 플러그인 마켓플레이스 | HIGH |
| /docs/en/vs-code | VS Code 통합 | MEDIUM |
| /docs/en/jetbrains | JetBrains 통합 | MEDIUM |
| /docs/en/desktop | Desktop 앱 | MEDIUM |
| /docs/en/slack | Slack 통합 | LOW |
| /docs/en/github-actions | GitHub Actions CI/CD | HIGH |
| /docs/en/gitlab-ci-cd | GitLab CI/CD | MEDIUM |
| /docs/en/headless | Headless 모드 | HIGH |
| /docs/en/sandboxing | 샌드박싱 | HIGH |
| /docs/en/amazon-bedrock | Bedrock 통합 | LOW |
| /docs/en/google-vertex-ai | Vertex AI 통합 | LOW |
| /docs/en/llm-gateway | LLM Gateway | MEDIUM |
| /docs/en/network-config | 네트워크 설정 | MEDIUM |
| /docs/en/security | 보안 가이드 | HIGH |
| /docs/en/iam | IAM 설정 | MEDIUM |
| /docs/en/analytics | 분석 | LOW |
| /docs/en/monitoring-usage | 사용량 모니터링 | LOW |
| /docs/en/output-styles | 출력 스타일 | MEDIUM |
| /docs/en/statusline | 상태줄 설정 | LOW |

### 3.2 platform.claude.com 미탐색 예상

| URL 패턴 | 예상 내용 | 우선순위 |
|---------|----------|----------|
| /agent-sdk/agents | 에이전트 정의 | HIGH |
| /agent-sdk/subagents | 서브에이전트 | HIGH |
| /agent-sdk/memory | 메모리 관리 | MEDIUM |
| /agent-sdk/streaming | 스트리밍 | MEDIUM |
| /agent-sdk/error-handling | 에러 처리 | MEDIUM |

### 3.3 기타 소스

| 소스 | URL | 내용 | 상태 |
|------|-----|------|------|
| GitHub Releases | github.com/anthropics/claude-code | CHANGELOG, 버전별 변경사항 | 🔄 부분 |
| Community Blogs | - | 커뮤니티 베스트 프랙티스 | ❌ 미탐색 |
| Discord/Forum | - | 사용자 경험, 팁 | ❌ 미탐색 |

---

## 4. Gap 분석 요약 (Current vs Official)

| 영역 | 현재 점수 | 주요 Gap |
|------|----------|----------|
| **Hooks** | 60/100 | 비표준 포맷, matcher 미사용 |
| **Skills** | 85/100 | 대체로 표준 준수, frontmatter 검증 필요 |
| **MCP** | 90/100 | 표준 준수, 확장 양호 |
| **ATOS** | N/A | 공식 외 혁신 확장 |

### 4.1 Hooks Gap 상세

| 항목 | 공식 | 현재 | 조치 |
|------|------|------|------|
| 최상위 키 | Hook 타입명 | 커스텀 이름 | 마이그레이션 필요 |
| Matcher | `matcher: "패턴"` | 없음 | 추가 필요 |
| Type 명시 | `type: "command"` | 암묵적 | 명시 필요 |
| 트리거명 | SessionStart | session-start | 변환 필요 |

---

## 5. 향후 리서치 가이드

### 5.1 다음 리서치 시 실행할 단계

```bash
# 1. 이 레지스트리 확인
cat documentation/research/anthropic-docs-registry.md

# 2. 미탐색 문서 우선순위 HIGH부터 크롤링
# - /docs/en/plugins
# - /docs/en/github-actions
# - /docs/en/headless
# - /docs/en/sandboxing
# - /docs/en/security

# 3. 발견 내용 이 파일에 추가

# 4. Gap 분석 업데이트
```

### 5.2 크롤링 도구 체인

```
1. firecrawl_map     - 사이트 구조 파악
2. firecrawl_search  - 특정 주제 검색
3. firecrawl_scrape  - 페이지 상세 크롤링
4. crawl4ai_scrape   - 백업 크롤러
5. context7          - 코드 예제 조회
6. one_search        - 커뮤니티 정보 보완
```

### 5.3 리서치 트리거 키워드

다음 키워드 입력 시 이 레지스트리 참조:
- "딥 리서치", "deep research"
- "공식 문서", "official docs"
- "Anthropic 문서", "anthropic documentation"
- "Hook 표준", "Skills 표준"
- "시스템 개선", "system improvement"

---

## 6. 변경 이력 (Changelog)

| 날짜 | 작업 | 담당 |
|------|------|------|
| 2025-12-19 | 최초 생성, 12종 Hook 문서화, Gap 분석 | Claude |

---

## 7. 관련 파일

| 파일 | 설명 |
|------|------|
| plans/nested-sauteeing-meteor.md | 상세 Gap 분석 플랜 |
| .claude-hooks.json | 현재 Hook 설정 (마이그레이션 대상) |
| .claude/settings.local.json | 표준 Hook 설정 (생성 예정) |
| .claude/skills/*/SKILL.md | 스킬 정의 파일 |

---

**[!] 향후 리서치 시 이 파일을 먼저 확인하여 중복 작업 방지**
