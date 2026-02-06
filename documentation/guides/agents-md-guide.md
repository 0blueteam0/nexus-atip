# AGENTS.md 가이드

> **목적**: 프로젝트에 AGENTS.md 표준을 도입하는 방법 안내
> **참조**: [Builder.io AGENTS.md Guide](https://www.builder.io/blog/agents-md)

---

## AGENTS.md란?

AGENTS.md는 AI 코딩 에이전트에게 **디렉토리별 맥락**을 제공하는 표준 파일입니다.

### 핵심 특징
- **계층적**: 하위 디렉토리가 상위 규칙 상속
- **로컬 우선**: 더 가까운 AGENTS.md가 우선 적용
- **명시적**: AI가 "추측"하지 않고 규칙 따름

---

## 파일 구조 예시

```
project/
├── AGENTS.md              # 전역 규칙
├── src/
│   ├── AGENTS.md          # src 특화 규칙
│   ├── components/
│   │   └── AGENTS.md      # 컴포넌트 특화 규칙
│   └── utils/
└── tests/
    └── AGENTS.md          # 테스트 특화 규칙
```

---

## 필수 섹션

### 1. 코드 스타일

```markdown
## 코드 스타일

- 들여쓰기: 2 spaces (tabs 금지)
- 따옴표: single quotes
- 세미콜론: 없음
- 최대 라인 길이: 100자
```

### 2. 테스트 요구사항

```markdown
## 테스트 요구사항

- 모든 public 함수에 단위 테스트 필수
- 최소 커버리지: 80%
- 테스트 파일 위치: 동일 디렉토리 `*.test.ts`
```

### 3. 금지 사항

```markdown
## 금지 사항

- `any` 타입 사용 금지
- `console.log` 프로덕션 코드 금지
- 하드코딩된 URL/경로 금지
```

---

## 선택 섹션

### 아키텍처 설명

```markdown
## 아키텍처

이 디렉토리는 Clean Architecture를 따릅니다:
- `domain/`: 비즈니스 로직 (의존성 없음)
- `application/`: 유스케이스
- `infrastructure/`: 외부 연동
- `presentation/`: UI 레이어
```

### 명명 규칙

```markdown
## 명명 규칙

- 컴포넌트: PascalCase (`UserProfile.tsx`)
- 훅: camelCase, `use` 접두사 (`useAuth.ts`)
- 유틸: camelCase (`formatDate.ts`)
- 상수: SCREAMING_SNAKE_CASE (`MAX_RETRY_COUNT`)
```

### 의존성 규칙

```markdown
## 의존성 규칙

- React Query 대신 SWR 사용
- Axios 대신 fetch 사용
- moment.js 대신 date-fns 사용
```

---

## 디렉토리별 예시

### `src/components/AGENTS.md`

```markdown
# Components AGENTS.md

## 컴포넌트 규칙

- 함수형 컴포넌트만 사용
- Props 인터페이스 필수 정의
- 스타일: Tailwind CSS 사용
- 상태 관리: useState/useReducer 우선

## 파일 구조

Button/
├── Button.tsx          # 컴포넌트
├── Button.test.tsx     # 테스트
├── Button.stories.tsx  # Storybook (선택)
└── index.ts            # 재export

## 금지

- class 컴포넌트
- inline styles
- CSS 모듈 (Tailwind 사용)
```

### `src/api/AGENTS.md`

```markdown
# API AGENTS.md

## API 클라이언트 규칙

- 모든 요청은 중앙 클라이언트 통과
- 에러 핸들링 필수 (try-catch)
- 타임아웃: 30초
- 재시도: 3회 (exponential backoff)

## 응답 타입

모든 API 함수는 제네릭 타입 반환:
`Promise<ApiResponse<T>>`

## 금지

- 직접 fetch 호출 (apiClient 사용)
- 하드코딩된 URL (환경 변수 사용)
```

### `tests/AGENTS.md`

```markdown
# Tests AGENTS.md

## 테스트 규칙

- AAA 패턴: Arrange, Act, Assert
- 테스트 설명: 한글 허용
- Mock 최소화 (실제 동작 우선)

## 명명 규칙

describe('[모듈명]', () => {
  it('should [기대 동작] when [조건]', () => {})
})

## 필수 테스트 케이스

- 정상 경로 (happy path)
- 에러 경로 (error path)
- 경계값 (boundary)
- null/undefined 입력
```

---

## CLAUDE.md vs AGENTS.md

| 항목 | CLAUDE.md | AGENTS.md |
|------|-----------|-----------|
| **범위** | Claude Code 전용 | 모든 AI 에이전트 |
| **위치** | 프로젝트 루트 | 모든 디렉토리 가능 |
| **상속** | 없음 | 계층적 상속 |
| **내용** | 도구 설정, 워크플로우 | 코드 스타일, 아키텍처 |

### 공존 방법

```
project/
├── CLAUDE.md         # Claude Code 특화 설정
├── AGENTS.md         # 범용 AI 에이전트 규칙
└── src/
    └── AGENTS.md     # src 특화 규칙
```

---

## 도입 단계

### 1단계: 루트 AGENTS.md 생성
```bash
# 템플릿 복사
cp ~/.claude/templates/AGENTS-template.md ./AGENTS.md
```

### 2단계: 핵심 규칙 정의
- 코드 스타일
- 금지 사항
- 테스트 요구사항

### 3단계: 디렉토리별 확장
- 복잡한 디렉토리에만 추가
- 상속으로 중복 제거

### 4단계: 팀 리뷰
- PR로 규칙 논의
- 점진적 강화

---

## 팁

1. **간결하게**: 규칙이 너무 많으면 무시됨
2. **구체적으로**: "좋은 코드" → "함수당 20줄 이하"
3. **예시 포함**: 규칙 + 코드 예시
4. **업데이트**: 규칙 위반 시 규칙 수정 또는 강화

---

**버전**: 1.0.0
**작성일**: 2026-02-07
