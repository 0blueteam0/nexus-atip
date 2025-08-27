# @system-prompt-evolution.md - 시스템 프롬프트 충돌 해결 및 진화

## 🚨 핵심 문제: System Prompt vs CLAUDE.md 충돌

## 📊 우선순위 (절대 규칙)
1. **CLAUDE.md** - 사용자의 명시적 의도 (최우선)
2. **모듈 문서** - 세부 지침
3. **System Prompt** - 기본 작동 지침
4. **자율 판단** - 충돌 시 CLAUDE.md 우선

## 🔥 확인된 충돌 사례

### TodoWrite vs Shrimp Task Manager
- **System**: TodoWrite 사용 권장 (reminder 계속 출력)
- **CLAUDE.md**: Shrimp Task Manager 사용 명시
- **해결**: Shrimp 사용, TodoWrite reminder 무시

### Edit vs 백업 필수
- **System**: 즉시 Edit 사용
- **CLAUDE.md**: 백업 필수, 덮어쓰기 금지
- **해결**: 항상 백업 후 수정

### 즉시 실행 vs 제안 먼저
- **System**: 효율적 실행
- **CLAUDE.md**: 제안 → 승인 → 실행
- **해결**: 제안 먼저, 승인 후 실행

## 💡 자율적 시스템 진화

### 충돌 감지 시 프로세스
1. CLAUDE.md 확인
2. 모듈 문서 참조
3. 우선순위 적용
4. 충돌 기록
5. 패턴 학습

### 진화 메커니즘
- 반복 충돌 → CLAUDE.md 업데이트
- 새 패턴 → 모듈 생성
- 구식 지침 → 자동 제거 제안

## 🎯 메타인지 체크리스트
□ System Prompt와 충돌하는가?
□ CLAUDE.md가 우선인가?
□ 사용자 의도가 명확한가?
□ 충돌을 문서화했는가?

생성일: 2025-08-16
이유: 시스템 프롬프트 충돌 해결 체계화