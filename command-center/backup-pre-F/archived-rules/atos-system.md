# ATOS (Autonomous Tool Orchestration System)

## 개요
ATOS는 도구 오케스트레이션 시스템으로, 자동 도구 선택 및 실행을 관리합니다.

## 핵심 구성요소
| 파일 | 역할 |
|------|------|
| `atos/index.js` | 메인 오케스트레이터 |
| `atos/tool-registry.json` | 도구 레지스트리 |
| `atos/recommendation-engine.js` | 도구 추천 엔진 |
| `atos/execution-monitor.js` | 실행 모니터링 |
| `atos/feedback-loop.js` | 피드백 루프 |

## 자동 도구 선택 로직
```
사용자 입력 분석 → 도구 레지스트리 조회 → 최적 도구 선택 → 실행 → 피드백 수집
```

## 도구 우선순위
1. Desktop Commander (파일 작업)
2. Edit File Lines (정밀 편집)
3. Shrimp Task Manager (작업 관리)
4. Built-in Tools (폴백)

## CLI 사용법
```bash
node atos/index.js [command] [options]
```

## 관련 파일
- `atos/config/` - 설정 파일
- `atos/usage-stats.json` - 사용 통계
- `atos/plan-registry.json` - 플랜 레지스트리
