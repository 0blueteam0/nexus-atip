# Claude Code 추천 플러그인 및 리소스

> **목적**: 커뮤니티에서 검증된 플러그인, 스킬, 서브에이전트 큐레이션
> **출처**: GitHub Awesome 리스트, HackerNews 토론
> **최종 업데이트**: 2026-02-07

---

## 필수 참조 레포지토리

| 레포지토리 | Stars | 설명 |
|-----------|-------|------|
| [awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code) | 342+ | Skills, Hooks, Plugins 공식 큐레이션 |
| [claude-code-plugins-plus-skills](https://github.com/jeremylongshore/claude-code-plugins-plus-skills) | - | 270+ 플러그인, 739 스킬 |
| [awesome-claude-code-subagents](https://github.com/VoltAgent/awesome-claude-code-subagents) | - | 100+ 전문 서브에이전트 |
| [claude-code-showcase](https://github.com/ChrisWiles/claude-code-showcase) | - | 종합 설정 예제 |

---

## 추천 플러그인

### Tier 1: 필수 설치

| 플러그인 | 용도 | 링크 |
|---------|------|------|
| **ralph-wiggum** | 반복적 자기개선 루프 | GitHub |
| **hookify** | 마크다운 기반 규칙 강제 | GitHub |
| **firecrawl plugin** | 웹 데이터 추출 강화 | GitHub |
| **context7** | 최신 API 문서 참조 | MCP 내장 |

### Tier 2: 상황별 권장

| 플러그인 | 적합한 상황 |
|---------|------------|
| **git-commit-helper** | 자동 커밋 메시지 생성 |
| **code-reviewer** | PR 자동 리뷰 |
| **test-generator** | 테스트 코드 자동 생성 |
| **doc-generator** | API 문서 자동화 |

---

## 추천 스킬

### 개발 생산성

| 스킬 | 용도 |
|------|------|
| `vibe-coding` | 바이브 코딩 워크플로우 |
| `python-c-binding` | pybind11 바인딩 생성 |
| `code-review` | 코드 리뷰 자동화 |
| `test-writer` | 테스트 케이스 생성 |

### 연구/분석

| 스킬 | 용도 |
|------|------|
| `academic-paper-verifier` | 논문 검증 |
| `deep-research` | 심층 리서치 |
| `multi-ai-deliberation` | 다중 AI 협의 |

---

## 추천 서브에이전트

### 탐색/분석

| 에이전트 | 용도 |
|---------|------|
| `file_explorer` | 파일 시스템 탐색 |
| `code_analyzer` | 코드 분석 |
| `reference_lookup` | 외부 참조 검색 |

### 전문 작업

| 에이전트 | 용도 |
|---------|------|
| `native-binding-expert` | Python-C 바인딩 |
| `security-auditor` | 보안 취약점 분석 |
| `performance-optimizer` | 성능 최적화 |

---

## Hooks 베스트 프랙티스

### 추천 Hook 설정

```json
{
  "hooks": {
    "pre-commit": {
      "enabled": true,
      "command": "npm run lint && npm run test"
    },
    "post-tool-call": {
      "enabled": false,
      "note": "성능 영향 있으므로 필요 시만 활성화"
    },
    "TeammateIdle": {
      "enabled": true,
      "note": "Agent Teams 사용 시"
    }
  }
}
```

### Hook 우선순위

1. **session-restore**: 세션 상태 복원
2. **planning-workflow-start**: 플랜 보호
3. **pre-commit**: 코드 품질 검증

---

## MCP 서버 추천

### 필수 (이미 설치됨)

| 서버 | 용도 |
|------|------|
| desktop-commander | 파일 작업 |
| edit-file-lines | 정밀 편집 |
| github | GitHub 연동 |
| firecrawl | 웹 스크래핑 |

### 추천 추가 설치

| 서버 | 용도 | 설치 복잡도 |
|------|------|-----------|
| **supabase** | DB 연동 | 중 |
| **playwright** | 브라우저 자동화 | 중 |
| **sequential-thinking** | 심층 분석 | 낮음 |

---

## 설정 예시

### .claude/settings.json

```json
{
  "model": "claude-opus-4-5-20251101",
  "permissions": {
    "mcp__desktop-commander__*": true,
    "mcp__edit-file-lines__*": true,
    "mcp__github__*": true
  },
  "skills": [
    "vibe-coding",
    "python-c-binding"
  ],
  "agents": [
    "native-binding-expert"
  ]
}
```

---

## 설치 가이드

### 플러그인 설치

```bash
# 플러그인 목록 확인
claude plugins list

# 플러그인 설치 (예시)
claude plugins install ralph-wiggum

# 설치된 플러그인 확인
claude plugins installed
```

### 스킬 추가

```bash
# 스킬 폴더 생성
mkdir -p .claude/skills/my-skill

# SKILL.md 작성
touch .claude/skills/my-skill/SKILL.md

# 스킬 확인
claude skills list
```

---

## 커뮤니티 리소스

### 공식 채널

- [Claude Code Docs](https://code.claude.com/docs)
- [Anthropic Discord](https://discord.gg/anthropic)
- [GitHub Discussions](https://github.com/anthropics/claude-code/discussions)

### 비공식 채널

- [HackerNews Claude Code](https://news.ycombinator.com/item?id=46743908)
- [Reddit r/ClaudeAI](https://reddit.com/r/ClaudeAI)

---

## 주의사항

1. **공식 지원 여부 확인**: 커뮤니티 플러그인은 공식 지원 아님
2. **보안 검토**: 설치 전 코드 리뷰
3. **버전 호환성**: Claude Code 버전과 호환 확인
4. **성능 영향**: 과도한 플러그인은 성능 저하 유발

---

**버전**: 1.0.0
**작성일**: 2026-02-07
