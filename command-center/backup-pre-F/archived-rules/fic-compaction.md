# FIC (Frequent Intentional Compaction)

## 개요
ACE-FCA 기반 컨텍스트 40-60% 활용률 유지를 위한 전략적 압축 시스템

## 자동 트리거
- 컨텍스트 60% 초과 시 자동 compaction
- 단계 전환 시 이전 단계 정보 압축

## Compaction 대상
| # | 대상 | 압축 방법 |
|---|------|----------|
| 1 | 파일 검색 결과 | 경로만 유지 (상위 20개) |
| 2 | 코드 흐름 | 핵심 함수 시그니처만 유지 |
| 3 | 편집 기록 | 최종 상태만 유지 (최근 5개) |
| 4 | 테스트 로그 | 실패/경고만 유지 |
| 5 | JSON blob | 스키마만 추출 |

## 4-Stage Pipeline
```
Specify → Explore → Plan → Implement
```

1. **Specify**: 요구사항 명확화 (Goal, Scope, Success Criteria)
2. **Explore**: Sub-agent 컨텍스트 격리 탐색
3. **Plan**: Human Review (레버리지 0.8)
4. **Implement**: Focused Context 순차 실행

## Human Leverage 원칙
| 단계 | Leverage | 설명 |
|------|----------|------|
| Research | 0.9 | 최고 레버리지 - 방향 결정 |
| Plan | 0.8 | 높음 - 아키텍처 결정 |
| Implement | 0.3 | 낮음 - 코드 리뷰 |

## 관련 파일
- `atos/fic-manager.js` - FIC 코어 로직
- `atos/pipeline-manager.js` - 4-Stage 파이프라인
- `atos/subagent-config.js` - Sub-agent 프로필
