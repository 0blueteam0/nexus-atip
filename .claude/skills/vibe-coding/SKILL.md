---
name: vibe-coding
description: 바이브 코딩 워크플로우 - AI 협업 기반 빠른 개발
user-invocable: true
context: fork
memory: project
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - Bash
---

# Vibe Coding Skill

## 개요
바이브 코딩(Vibe Coding)은 AI와의 자연어 대화를 통해 빠르게 소프트웨어를 구축하는 방법론입니다.
"분위기(vibe)"에 맞춰 코딩하며, AI가 대부분의 코드를 생성합니다.

> "Feel, Don't Overthink - Let AI Handle the Details"

---

## 워크플로우 (4단계)

### 1. SPECIFY - AI 인터뷰
**목적**: 명확한 요구사항 도출

```
[프롬프트 예시]
"나는 [목표]를 달성하고 싶어.
현재 [상황]이고, [제약조건]이 있어.
어떤 질문이 있어?"

[AI 응답 기대]
- 명확화 질문 5-10개
- 범위 확인
- 기술 스택 제안
```

**체크리스트**:
- [ ] 최종 목표 명확화
- [ ] 기술 스택 결정
- [ ] MVP 범위 합의

### 2. ITERATE - 작은 단위 구현
**목적**: 점진적, 반복적 구현

```
[원칙]
- 한 번에 하나의 기능만 요청
- 작동하는 코드 먼저, 최적화는 나중에
- AI가 제안한 코드를 즉시 테스트

[프롬프트 패턴]
"먼저 [기능A]만 구현해줘"
"작동하네! 이제 [기능B] 추가해줘"
"[문제] 발생했어, 수정해줘"
```

**체크리스트**:
- [ ] 각 기능 독립적으로 테스트
- [ ] Git 커밋 자주 (작동 상태마다)
- [ ] 복잡한 기능은 더 작게 분해

### 3. VALIDATE - 검증 (AI 맹신 금지)
**목적**: AI 출력물 검증

```
[필수 검증 항목]
1. 보안: API 키 노출, SQL 인젝션, XSS
2. 성능: 불필요한 루프, 메모리 누수
3. 로직: 엣지 케이스, 에러 핸들링
4. 의존성: 라이선스, 버전 호환성
```

**검증 도구**:
```bash
# 보안 스캔
npm audit / pip-audit

# 타입 체크
tsc --noEmit / mypy

# 테스트
npm test / pytest
```

### 4. DOCUMENT - 프롬프트 로그
**목적**: 재현성 확보

```
[기록 대상]
- 성공한 프롬프트 패턴
- 실패한 접근법 (같은 실수 방지)
- AI가 오해한 요청 (명확화 필요)

[저장 위치]
docs/vibe-log/YYYY-MM-DD.md
```

---

## 도구 체인

| 단계 | 도구 | 용도 |
|------|------|------|
| SPECIFY | AskUserQuestion | 요구사항 인터뷰 |
| SPECIFY | sequential_thinking | 복잡한 요구사항 분석 |
| ITERATE | Desktop Commander | 코드 작성 |
| ITERATE | Bash | 즉시 테스트 |
| VALIDATE | Grep | 보안 패턴 검색 |
| VALIDATE | LSP | 타입/참조 확인 |
| DOCUMENT | Write | 로그 저장 |

---

## 바이브 코딩 vs 전통 개발

| 항목 | 바이브 코딩 | 전통 개발 |
|------|-----------|----------|
| 계획 | 최소화 (AI 인터뷰) | 상세 설계 문서 |
| 구현 | AI 생성 + 검증 | 직접 작성 |
| 테스트 | 즉각적, 반복적 | 개발 후 별도 |
| 문서화 | 프롬프트 로그 | 상세 API 문서 |
| 속도 | 매우 빠름 | 상대적 느림 |
| 적합 대상 | 프로토타입, MVP | 장기 유지보수 |

---

## 주의사항

### DO (권장)
- AI 출력물 항상 검토
- 작은 단위로 작업
- 자주 커밋
- 실패 시 컨텍스트 리셋

### DON'T (금지)
- AI 코드 맹목적 신뢰
- 한 번에 큰 기능 요청
- 보안 검토 생략
- 테스트 없이 배포

---

## 적용 시나리오

**적합**:
- MVP / 프로토타입
- 해커톤
- 개인 프로젝트
- 빠른 PoC

**부적합**:
- 미션 크리티컬 시스템
- 금융/의료 소프트웨어
- 장기 유지보수 필요 프로젝트

---

## 참조

- [Wikipedia: Vibe Coding](https://en.wikipedia.org/wiki/Vibe_coding)
- [Softr Best Practices](https://www.softr.io/blog/vibe-coding-best-practices)
- [Andrej Karpathy 원조 트윗](https://twitter.com/karpathy/status/1886192184808149383)

---

**버전**: 1.0.0
**작성일**: 2026-02-07
