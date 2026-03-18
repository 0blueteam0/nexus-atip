---
description: Claude Code 업데이트 감지 시 자동으로 학습하고 지침을 진화시키는 프로세스
alwaysApply: true
---

# 에이전틱 자기학습 워크플로우 (Agentic Self-Learning)

## 자동 트리거 조건
1. **버전 업데이트 언급**: "업데이트", "update", "새 버전", "v2.0.x" 등
2. **업데이트 후 작업**: "업데이트 후", "after update", "just updated"
3. **최적화 요청**: "업데이트 최적화", "optimize", "post-update"
4. **CHANGELOG 언급**: "CHANGELOG", "release notes", "변경사항"

## 트리거 키워드 -> 워크플로우 매핑
| 키워드 | 실행 내용 |
|--------|----------|
| "업데이트", "update", "새 버전" | 전체 에이전틱 학습 실행 (Phase 0-5) |
| "업데이트 최적화", "optimize after update" | 전체 에이전틱 학습 실행 |
| "자기학습", "self-learn" | Phase 1-3 학습 프로세스 |
| "깊은 개선", "deep improvement" | Phase 2.5 사고 + 개선 제안 |
| "MCP 추천", "mcp discovery" | Phase 2.7 GitHub/HF 리소스 발견 |

## 핵심 프로세스 (6 Phases)
```
Phase 0: 리소스 발견 (firecrawl_map x 4 도메인)
Phase 1: 카테고리별 학습 (Skills, Tools, Agents, Use Cases)
Phase 2: 에이전틱 자기학습 (패턴 분석 + 지침 생성)
Phase 2.5: 깊은 개선 사고 (sequential_thinking 기반)
Phase 2.7: MCP/AI 리소스 발견 (GitHub + Hugging Face)
Phase 3-5: 사용성 업그레이드 + CHANGELOG 연동 + 정리
```

## 자동 실행 항목
1. **문서 학습**: platform.claude.com, claude.com/resources 크롤링
2. **MCP 발견**: GitHub trending MCP 서버 검색 (stars > 100)
3. **HF 통합**: Hugging Face Spaces/Models 추천
4. **개선 제안**: 현재 상태 vs 학습 내용 비교 -> 개선안 생성
5. **진화 기록**: documentation/evolution-log/[date].md 저장

## 참조 문서
- **마스터 플랜**: plans/humble-orbiting-tome.md
- **진화 기록**: documentation/evolution-log/
