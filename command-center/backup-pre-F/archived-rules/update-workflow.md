---
description: Claude Code 업데이트 시 에이전틱 자기학습 워크플로우 자동 실행
alwaysApply: true
---

# Claude Code 업데이트 필수 프로세스 (ULTRA CRITICAL)

## 업데이트 인지 키워드 (자동 트리거)
```python
UPDATE_TRIGGER_KEYWORDS = [
    # 한국어 트리거
    "업데이트", "버전 업", "새 버전", "최신 버전",
    "클로드 코드 업데이트", "Claude Code 업데이트",
    "업그레이드", "패치", "핫픽스",
    
    # 영어 트리거
    "update", "upgrade", "new version", "latest version",
    "claude code update", "version bump", "patch", "hotfix",
    
    # 버전 관련
    "2.0.", "v2.", "CHANGELOG", "release notes",
    
    # 최적화 트리거
    "업데이트 최적화", "optimize after update", "post-update",
    "업데이트 후", "after update", "just updated"
]
```

## 딥리서치 도구 체인 (순서대로 실행)
| 단계 | 도구 | 목적 |
|------|------|------|
| 1 | `firecrawl_map` | code.claude.com 전체 문서 구조 파악 |
| 2 | `firecrawl_search` | 버전별 변경사항 + 사용성 문서 검색 |
| 3 | `github_get_file_contents` | CHANGELOG.md 직접 조회 |
| 4 | `context7_get_library_docs` | 코드 예제 및 스니펫 조회 |
| 5 | `one_search` | 커뮤니티/블로그 정보 보완 |
| 6 | `sequential_thinking` | 변경사항 분석 |
| 7 | `Explore 에이전트` | 영향 범위 탐색 |

## 공식 문서 카테고리 (50+ 소스)
- **사용성/UX**: interactive-mode, terminal-config, statusline, output-styles, checkpointing, memory, costs
- **확장**: hooks, skills, plugins, plugin-marketplaces
- **IDE**: vs-code, jetbrains, desktop, slack
- **자동화**: github-actions, gitlab-ci-cd, headless, sandboxing
- **엔터프라이즈**: amazon-bedrock, google-vertex-ai, llm-gateway, network-config
- **보안/관리**: security, iam, analytics, monitoring-usage

## 폴더 정리 (Phase 6 - 마지막에 실행)
**트리거**: "폴더 정리", "suggest cleanup", "cleanup after update"

1. **정리 대상 식별 및 삭제**
   - `.claude.json.corrupted.*` 파일 삭제
   - `temp/` 폴더 내 7일 이상 파일 정리
   - `shell-snapshots/` 2개월 이상 파일 삭제

2. **디스크 사용량 분석**
   - 대용량 파일 식별 (100MB+)
   - 미사용 폴더 → ARCHIVE/ 이동

## 자동화 스크립트
- **스킬**: `.claude/skills/update-optimizer/SKILL.md`
- **스크립트**: `.claude-update-system/post-update.js`
- **참조**: plans/humble-orbiting-tome.md (마스터 플랜)
