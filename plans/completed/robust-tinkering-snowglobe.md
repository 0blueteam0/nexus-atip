# Claude Code Skills System Implementation Plan
# Claude Code 스킬 시스템 구현 계획

## Overview / 개요

**[목적]** K드라이브 Claude Code 환경에 범용 개발 스킬 시스템 구축
**[위치]** `K:/PortableApps/Claude-Code/.claude/skills/`
**[구조]** 완전 구조 (SKILL.md + scripts/ + templates/ + references/)

---

## 1. Directory Structure / 디렉토리 구조

```
.claude/skills/
├── README.md                      # Skills system documentation
├── base-skill/                    # [Template] Reference for new skills
│   ├── SKILL.md
│   ├── scripts/
│   │   └── .gitkeep
│   ├── templates/
│   │   └── output-template.md
│   └── references/
│       └── best-practices.md
├── code-reviewer/                 # [Core] Code quality & security
│   ├── SKILL.md
│   ├── scripts/
│   │   └── analyze-complexity.js
│   ├── templates/
│   │   └── review-report.md
│   └── references/
│       └── security-checklist.md
├── debugger/                      # [Core] Systematic debugging
│   ├── SKILL.md
│   ├── scripts/
│   │   └── collect-diagnostics.js
│   ├── templates/
│   │   └── rca-template.md
│   └── references/
│       └── debugging-patterns.md
├── refactorer/                    # [Core] Code improvement
│   ├── SKILL.md
│   ├── scripts/
│   │   └── detect-smells.js
│   ├── templates/
│   │   └── refactor-plan.md
│   └── references/
│       └── design-patterns.md
├── test-writer/                   # [Extended] Test generation
│   ├── SKILL.md
│   ├── scripts/
│   │   └── coverage-analyzer.js
│   ├── templates/
│   │   ├── unit-test.md
│   │   └── integration-test.md
│   └── references/
│       └── testing-strategies.md
└── documentation-writer/          # [Extended] Doc generation
    ├── SKILL.md
    ├── scripts/
    │   └── extract-signatures.js
    ├── templates/
    │   ├── readme-template.md
    │   ├── api-docs-template.md
    │   └── tutorial-template.md
    └── references/
        └── documentation-standards.md
```

---

## 2. SKILL.md Specifications / 스킬 파일 사양

### 2.1 Base Template (base-skill/SKILL.md)

```yaml
---
name: base-skill
description: |
  Template skill demonstrating proper structure and format.
  Use this as a reference when creating new skills.
  Copy this directory and modify for your specific use case.
license: MIT
metadata:
  version: "1.0.0"
  author: "K-Drive Claude Code"
  category: template
  tags: [template, reference, starter]
---

# Base Skill Template

## Purpose / 목적
This is a template skill that demonstrates the proper structure.

## When to Use / 사용 시점
Copy this skill when creating new skills.

## Instructions / 지침
1. Copy the entire `base-skill/` directory
2. Rename to your skill name (lowercase, hyphens)
3. Update SKILL.md frontmatter (name, description)
4. Customize instructions and examples
5. Add scripts/templates as needed

## Output Format / 출력 형식
- Use ASCII only (no emojis)
- Include Korean translations where helpful
- Follow xAI tags: [작업], [목적], [방법], [완료], [영향]

## Examples / 예제
[Include concrete input/output examples]
```

### 2.2 Code Reviewer (code-reviewer/SKILL.md)

```yaml
---
name: code-reviewer
description: |
  Reviews code for quality, security vulnerabilities, performance issues, and best practices.
  Use when: reviewing PRs, checking code quality, security audits, finding bugs,
  analyzing code changes, or asking for code review.
  Triggers: "review code", "check quality", "security review", "PR review", "find bugs"
allowed-tools: [Read, Grep, Glob, Bash]
license: MIT
metadata:
  version: "1.0.0"
  category: development
  tags: [code-review, security, quality, best-practices]
---

# Code Reviewer / 코드 리뷰어

## Instructions / 지침

### Review Process / 리뷰 프로세스
1. **[작업] Scan Structure**: Identify files, dependencies, architecture
2. **[작업] Security Check**: OWASP Top 10, injection, XSS, auth issues
3. **[작업] Quality Analysis**: Complexity, duplication, naming, patterns
4. **[작업] Performance**: N+1 queries, memory leaks, inefficient algorithms
5. **[작업] Best Practices**: Language idioms, framework conventions

### Severity Levels / 심각도
- **CRITICAL**: Security vulnerabilities, data loss risks
- **HIGH**: Bugs, logic errors, performance issues
- **MEDIUM**: Code smells, maintainability concerns
- **LOW**: Style issues, minor improvements

### Output Format / 출력 형식
```
## Code Review Report / 코드 리뷰 보고서

### Summary / 요약
- Files reviewed: X
- Issues found: Y (Critical: A, High: B, Medium: C, Low: D)

### Critical Issues / 중요 이슈
[Issue description, file:line, recommendation]

### Recommendations / 권장사항
[Prioritized list of improvements]
```

## Examples / 예제

### Input
```javascript
const query = "SELECT * FROM users WHERE id = " + userId;
db.execute(query);
```

### Output
- **[CRITICAL] SQL Injection** at line 1
- **[방법]** Use parameterized queries: `db.execute("SELECT * FROM users WHERE id = ?", [userId])`
```

### 2.3 Debugger (debugger/SKILL.md)

```yaml
---
name: debugger
description: |
  Systematically debugs and fixes code issues using root cause analysis.
  Use when: debugging errors, fixing crashes, analyzing stack traces,
  troubleshooting issues, or investigating unexpected behavior.
  Triggers: "debug", "fix error", "stack trace", "crash", "troubleshoot", "why is this"
allowed-tools: [Read, Grep, Glob, Bash]
license: MIT
metadata:
  version: "1.0.0"
  category: development
  tags: [debugging, troubleshooting, rca, error-fixing]
---

# Debugger / 디버거

## Instructions / 지침

### Debugging Process / 디버깅 프로세스
1. **[작업] Reproduce**: Understand and reproduce the issue
2. **[작업] Gather Data**: Collect logs, stack traces, environment info
3. **[작업] Hypothesize**: Form hypotheses about root cause
4. **[작업] Test**: Verify hypotheses systematically
5. **[작업] Fix**: Implement and verify the fix
6. **[작업] Prevent**: Add tests/guards to prevent recurrence

### Root Cause Analysis Template / 근본 원인 분석
```
## RCA Report / 근본 원인 분석 보고서

### Problem Statement / 문제 정의
[Clear description of the issue]

### Timeline / 타임라인
[When did it start, what changed]

### Root Cause / 근본 원인
[The actual cause, not symptoms]

### Fix Applied / 적용된 수정
[What was changed and why]

### Prevention / 예방책
[How to prevent recurrence]
```

## Examples / 예제

### Input
"TypeError: Cannot read property 'map' of undefined"

### Output
- **[작업]** Trace data flow to find where array becomes undefined
- **[방법]** Add null check or default value: `(items || []).map(...)`
- **[영향]** Prevents crash, maintains expected behavior
```

### 2.4 Refactorer (refactorer/SKILL.md)

```yaml
---
name: refactorer
description: |
  Improves code structure, readability, and maintainability using proven patterns.
  Use when: refactoring code, cleaning up, improving structure, extracting functions,
  simplifying logic, or applying design patterns.
  Triggers: "refactor", "clean up", "improve code", "extract", "simplify", "make cleaner"
allowed-tools: [Read, Write, Edit, Grep, Glob]
license: MIT
metadata:
  version: "1.0.0"
  category: development
  tags: [refactoring, clean-code, design-patterns, maintainability]
---

# Refactorer / 리팩토러

## Instructions / 지침

### Refactoring Principles / 리팩토링 원칙
1. **Small Steps**: Make incremental changes
2. **Test First**: Ensure tests exist before refactoring
3. **One Thing**: Each refactoring addresses one concern
4. **Verify**: Run tests after each change

### Common Refactorings / 일반적인 리팩토링
- Extract Function/Method
- Rename for Clarity
- Remove Duplication (DRY)
- Simplify Conditionals
- Replace Magic Numbers
- Introduce Parameter Object

### Output Format / 출력 형식
```
## Refactoring Plan / 리팩토링 계획

### Current Issues / 현재 문제점
[Identified code smells]

### Proposed Changes / 제안 변경사항
1. [Change 1 - reason]
2. [Change 2 - reason]

### Before/After / 변경 전후
[Code comparison]

### Risk Assessment / 위험 평가
[Potential breaking changes]
```
```

### 2.5 Test Writer (test-writer/SKILL.md)

```yaml
---
name: test-writer
description: |
  Generates comprehensive tests including unit, integration, and e2e tests.
  Use when: writing tests, increasing coverage, creating mocks, testing edge cases,
  or setting up test infrastructure.
  Triggers: "write tests", "unit test", "coverage", "mock", "test this", "add tests"
allowed-tools: [Read, Write, Edit, Grep, Glob, Bash]
license: MIT
metadata:
  version: "1.0.0"
  category: testing
  tags: [testing, unit-tests, integration, coverage, mocking]
---

# Test Writer / 테스트 작성자

## Instructions / 지침

### Test Strategy / 테스트 전략
1. **Understand**: Analyze the code to be tested
2. **Identify Cases**: Happy path, edge cases, error cases
3. **Structure**: Arrange-Act-Assert pattern
4. **Mock**: Isolate dependencies appropriately
5. **Cover**: Aim for meaningful coverage, not just numbers

### Test Types / 테스트 유형
- **Unit Tests**: Single function/method isolation
- **Integration Tests**: Component interactions
- **E2E Tests**: Full user flows

### Naming Convention / 명명 규칙
```
describe('[Unit/Feature]', () => {
  it('should [expected behavior] when [condition]', () => {
    // Arrange
    // Act
    // Assert
  });
});
```
```

### 2.6 Documentation Writer (documentation-writer/SKILL.md)

```yaml
---
name: documentation-writer
description: |
  Generates clear, comprehensive technical documentation.
  Use when: writing docs, creating READMEs, documenting APIs, writing tutorials,
  or explaining how to use code.
  Triggers: "write docs", "readme", "api docs", "tutorial", "document this", "how to use"
allowed-tools: [Read, Write, Edit, Grep, Glob]
license: MIT
metadata:
  version: "1.0.0"
  category: documentation
  tags: [documentation, readme, api-docs, tutorials, technical-writing]
---

# Documentation Writer / 문서 작성자

## Instructions / 지침

### Documentation Types / 문서 유형
1. **README**: Project overview, quick start, installation
2. **API Docs**: Endpoints, parameters, responses, examples
3. **Tutorials**: Step-by-step guides with explanations
4. **Reference**: Complete technical specifications

### Quality Standards / 품질 기준
- Clear, concise language
- Code examples for every concept
- Consistent formatting
- Up-to-date with code
- Bilingual (Korean/English) where appropriate

### README Template / README 템플릿
```markdown
# Project Name

## Overview / 개요
[What it does, why it exists]

## Quick Start / 빠른 시작
[Minimal steps to get running]

## Installation / 설치
[Detailed installation steps]

## Usage / 사용법
[Examples and explanations]

## API Reference / API 참조
[If applicable]

## Contributing / 기여
[How to contribute]
```
```

---

## 3. Implementation Sequence / 구현 순서

### Phase 1: Foundation (1-2 hours)
1. Create `.claude/skills/` directory
2. Create `README.md` with system documentation
3. Implement `base-skill/` template

### Phase 2: Core Skills (2-3 hours)
4. Implement `code-reviewer/` skill
5. Implement `debugger/` skill
6. Implement `refactorer/` skill

### Phase 3: Extended Skills (1-2 hours)
7. Implement `test-writer/` skill
8. Implement `documentation-writer/` skill

### Phase 4: Supporting Files (1-2 hours)
9. Create scripts for each skill
10. Create templates for each skill
11. Create reference documents

### Phase 5: Verification (30 minutes)
12. Test skill activation with sample queries
13. Verify CLAUDE.md compliance

---

## 4. Critical Files to Read Before Implementation

| File | Purpose |
|------|---------|
| `.claude/agents/code-reviewer.md` | Existing pattern to align with |
| `.claude/commands/` | Command patterns for output format |
| `workflows/master-workflows.json` | Workflow integration points |
| `CLAUDE.md` | Rules compliance verification |

---

## 5. Activation Keywords / 활성화 키워드

| Skill | Primary Triggers | Secondary Triggers |
|-------|------------------|-------------------|
| code-reviewer | review code, PR review | check quality, find bugs, security review |
| debugger | debug, fix error | stack trace, crash, troubleshoot |
| refactorer | refactor, clean up | improve code, simplify, extract |
| test-writer | write tests, unit test | coverage, mock, test this |
| documentation-writer | write docs, readme | api docs, tutorial, document this |

---

## 6. CLAUDE.md Compliance Checklist

- [x] Korean display protocol (bilingual output)
- [x] xAI tags ([작업], [목적], [방법], [완료], [영향])
- [x] ASCII only (no emojis)
- [x] Desktop Commander preference for file operations
- [x] 30-line chunk writing rule
- [x] Shrimp task manager for tracking

---

## 7. Expected Outcomes / 예상 결과

**[영향]**
1. **Consistency**: Standardized approach to common development tasks
2. **Automation**: Scripts handle repetitive analysis
3. **Quality**: Templates ensure professional output
4. **Integration**: Skills work with existing agents/commands/workflows
5. **Extensibility**: base-skill template enables easy skill creation

---

## 8. Total Estimated Time: 6-9 hours
