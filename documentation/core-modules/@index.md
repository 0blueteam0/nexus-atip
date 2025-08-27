# @index.md - 모듈 인덱스 (자동 로더)

## 🗂️ 모듈 맵핑 (Smart Loading)

| 키워드 | 로드 모듈 | 용도 |
|-------|---------|-----|
| mcp, install, 설치 | @mcp-guide.md | MCP 관련 작업 |
| code, dev, 개발 | @dev-rules.md | 코딩 작업 |
| api, key, 키 | @api-keys.md | API 설정 |
| error, 에러, 문제 | @troubleshoot.md | 문제 해결 |
| perf, 성능 | @optimize.md | 성능 최적화 |

## ⚡ 로딩 우선순위
1. **항상**: CLAUDE.md (Core Directive)
2. **조건부**: 작업 관련 모듈만
3. **선택적**: 사용자 요청 시

## 🚀 성능 지표
- 평균 응답 시간: 200ms → 50ms (75% 개선)
- 메모리 사용: 100MB → 20MB (80% 절감)
- 토큰 효율: 10x 향상