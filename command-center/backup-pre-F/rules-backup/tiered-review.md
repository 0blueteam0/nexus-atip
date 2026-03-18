# Tiered Code Review (단계별 코드 리뷰)

## 개요
PR 리스크 수준에 따른 차등 리뷰 프로세스

---

## 리뷰 플로우

```
[PR Created]
     │
     ▼
┌──────────────┐
│ AI Pre-Review│
│ - Lint       │
│ - Security   │
│ - Complexity │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Risk Tier    │
│ Assessment   │
└──────┬───────┘
       │
   ┌───┼───┐
   ▼   ▼   ▼
[Low] [Med] [High]
   │   │   │
   ▼   ▼   ▼
[AI ] [AI+1] [Full ]
[OK ] [Human] [Team ]
```

---

## Risk Tier 분류

### Tier 1: Low Risk (낮음)
**조건**:
- 문서 변경만
- 테스트 코드만
- 설정 파일 (비밀번호 제외)
- 파일 1-2개

**리뷰 프로세스**:
- AI 자동 검사 통과 시 승인
- Human 리뷰 선택적


### Tier 2: Medium Risk (중간)
**조건**:
- 기존 기능 수정
- 새 유틸/헬퍼 추가
- 파일 3-10개
- 내부 API 변경

**리뷰 프로세스**:
- AI 자동 검사 필수
- Human 리뷰 1명 필수
- 테스트 커버리지 확인

### Tier 3: High Risk (높음)
**조건**:
- 아키텍처 변경
- 인증/인가 관련
- 데이터베이스 스키마 변경
- 외부 API 변경
- 파일 10개 이상
- 보안 관련 코드

**리뷰 프로세스**:
- AI 자동 검사 필수
- Human 리뷰 2명 이상
- 시니어/테크리드 승인 필수
- 보안 스캔 필수

---

## AI Pre-Review 체크리스트

### 자동 검사 항목
| 항목 | 도구 | 실패 시 |
|------|------|--------|
| Lint | ESLint/Pylint | 블로킹 |
| Type Check | TypeScript/mypy | 블로킹 |
| Security | Semgrep/Bandit | 경고/블로킹 |
| Complexity | Cyclomatic | 경고 |
| Test Coverage | Jest/Pytest | 경고 |


---

## Risk 판단 기준

### 자동 High Risk 플래그
- `auth`, `login`, `password` 파일 변경
- `security`, `crypto` 관련 변경
- `.env`, `secrets` 파일 변경
- `migration`, `schema` 변경
- `package.json` 의존성 추가

### 자동 Low Risk 플래그
- `README.md`, `*.md` 만 변경
- `*.test.ts`, `*.spec.js` 만 변경
- `comments` 만 변경

---

## 리뷰 효율화

### AI 리뷰 자동화
```
PR 생성 시:
1. Lint/Format 자동 실행
2. 테스트 자동 실행
3. 보안 스캔 자동 실행
4. Risk Tier 자동 분류
5. 리뷰어 자동 할당 (Tier 기반)
```

### 리뷰 시간 가이드
| Tier | 목표 시간 |
|------|----------|
| Low | 즉시 (AI 승인) |
| Medium | 4시간 이내 |
| High | 1일 이내 |

---

**버전**: 1.0.0
