# Claude Code Skills 생성 가이드

## Skills란?
특정 작업에 특화된 지침과 도구 권한을 정의하는 모듈입니다.

## 디렉토리 구조
```
.claude/skills/
├── skill-name/
│   └── SKILL.md
├── another-skill/
│   └── SKILL.md
```

## SKILL.md 형식

### 필수 YAML Frontmatter
```yaml
---
name: skill-identifier
description: "트리거 조건 및 용도 설명 (최대 1024자)"
allowed-tools: "Read, Write, Grep, WebSearch"
---
```

### 본문 구조
```markdown
# Skill 이름

## 목적
이 스킬이 해결하는 문제

## 트리거 키워드
- "keyword1"
- "keyword2"

## 실행 워크플로우
### Phase 1: [단계명]
[상세 지침]

## 출력 형식
[예상 출력 포맷]
```

## 권장 도구 조합

| 스킬 유형 | 권장 도구 |
|-----------|----------|
| 코드 분석 | Read, Grep, Glob |
| 문서 작성 | Read, Write, WebSearch |
| 파일 관리 | filesystem, desktop-commander |
| 웹 리서치 | WebSearch, firecrawl, context7 |
| 데이터 처리 | sqlite, Read, Write |

## 예시: 코드 리뷰 스킬
```yaml
---
name: code-reviewer
description: "코드 리뷰 요청 시 호출. 품질, 보안, 성능 관점 분석."
allowed-tools: "Read, Grep, Glob"
---

# Code Reviewer

## 분석 항목
1. 코드 품질 (가독성, 구조)
2. 보안 취약점
3. 성능 이슈
4. 베스트 프랙티스 준수
```

## 마켓플레이스
- Skills: https://skillsmp.com/
- Awesome: https://github.com/hesreallyhim/awesome-claude-code
