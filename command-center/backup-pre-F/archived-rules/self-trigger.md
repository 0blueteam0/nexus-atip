# Self-Triggered Loading (STL)

## 개요
키워드 감지 → 리소스 자동 로드 (세션 내 중복 방지)

## 작동 원리
1. **입력 분석**: 사용자/Claude 출력에서 키워드 감지
2. **중복 확인**: LoadTracker로 세션 내 이미 로드된 리소스 스킵
3. **자동 로드**: 매칭된 리소스 자동 로드 (스킬, 명령어, 워크플로우)

## 구성 요소
| 파일 | 역할 |
|------|------|
| `atos/load-tracker.js` | 세션 내 중복 로드 방지 (Singleton) |
| `atos/unified-triggers.json` | 키워드 → 리소스 매핑 정의 |
| `atos/context-analyzer.js` | analyzeAnyText() STL 핵심 함수 |

## 트리거 소스
| 소스 | 설명 |
|------|------|
| `user` | 사용자 입력 |
| `claude_plan` | Claude 계획 출력 |
| `claude_impl` | Claude 구현 출력 |
| `file` | 파일 내용 분석 |

## LoadTracker API
```javascript
const { tracker } = require('./atos/load-tracker');

tracker.isLoaded('skill:update-optimizer');  // 이미 로드 여부
tracker.markLoaded('skill:update-optimizer', 'skill', 'user');  // 로드 마킹
tracker.getSessionStats();  // 세션 통계
tracker.reset();  // 세션 리셋
```

## Self-Trigger Pipeline
| 구성요소 | 설명 |
|----------|------|
| `atos/self-trigger/index.js` | 오케스트레이터 |
| `atos/self-trigger/loop-guard.js` | 3-Layer 무한루프 방지 |
| `atos/self-trigger/phase-detector.js` | Plan/Implement/Execute 페이즈 감지 |
| `atos/self-trigger/trigger-profiles.json` | 페이즈별 트리거 프로필 |

## CLI
```bash
node atos/index.js self-trigger "검색해보겠습니다"
```
