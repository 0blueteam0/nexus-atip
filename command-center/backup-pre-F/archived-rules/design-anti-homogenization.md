# Design Anti-Homogenization Rules (디자인 동질화 방지 규칙)

> **목적**: AI 생성 디자인의 동질화("AI Slop", "Purple Problem") 방지
> **적용**: 모든 디자인/UI/CSS 관련 작업에 자동 적용
> **우선순위**: CRITICAL

---

## [!!] 자동 적용 조건

다음 키워드 감지 시 이 규칙 자동 활성화:
- 디자인, 랜딩 페이지, UI, 컴포넌트, 스타일
- Tailwind, CSS, shadcn, 색상, 폰트
- design, landing page, component, style, color

---

## [CRITICAL] 금지 패턴 (Prohibited Patterns)

### 색상 금지 목록
```
[X] indigo-* 계열 (특히 indigo-500, indigo-600)
[X] purple-* 계열 (특히 purple-500, purple-700)
[X] violet-* 계열
[X] 보라-파란 그라데이션 (from-indigo-* to-purple-*)
[X] Magic Blue (#5E6AD2) 및 유사 색상
[X] Aurora/글로우 배경 효과
```

### 레이아웃 금지 목록
```
[X] backdrop-blur 글래스모피즘 (과도한 사용)
[X] 3박스 피처 그리드 (grid-cols-3) 기본 패턴
[X] 중앙 정렬 히어로 + 보라 그라데이션 조합
```

### 타이포그래피 금지 목록
```
[X] Inter 폰트 단독 사용 (명시적 요청 없이)
[X] 시스템 폰트만 사용 (차별화 없이)
```

---

## [REQUIRED] 필수 행동 규칙

### 1. 디자인 작업 시작 전 확인

디자인/UI 작업 요청 시 반드시 확인:
```
1. 사용자가 브랜드 색상을 지정했는가?
   → 없으면: "브랜드 색상이 있으신가요?" 질문
   
2. 특정 스타일 참조가 있는가?
   → 없으면: 3가지 대안 스타일 제안 (보라 계열 제외)
   
3. 한국 시장 대상인가?
   → 한국이면: 한글 폰트 + 문화적 맥락 고려
```

### 2. 색상 선택 시 필수 대안 제시

보라/인디고 대신 제안할 색상 팔레트:
```css
/* 권장 대체 색상 */
--alt-teal: #0F766E;      /* 신뢰, 안정 */
--alt-emerald: #059669;   /* 성장, 자연 */
--alt-amber: #D97706;     /* 따뜻함, 에너지 */
--alt-sky: #0284C7;       /* 기술, 혁신 (보라 아님) */
--alt-rose: #E11D48;      /* 열정, 활력 */
--alt-slate: #475569;     /* 전문성, 중립 */
```

### 3. 레이아웃 다양성 확보

3박스 그리드 대신 제안:
```
- 2열 비대칭 (2/3 + 1/3)
- 4열 균등 (작은 카드)
- 지그재그 (좌우 교대)
- 벤토 그리드 (다양한 크기)
- 카드 캐러셀 (가로 스크롤)
```

---

## [PROMPT] 프롬프트 엔지니어링 규칙

### AI 도구 사용 시 필수 포함 사항

v0, Bolt, Lovable 등 AI 도구 프롬프트 작성 시:
```
## Required (항상 포함)
- Primary color: [HEX 명시]
- NO purple, indigo, violet colors

## Prohibited (금지 목록)
- NO gradients on buttons
- NO glassmorphism (unless specifically requested)
- NO Inter font (unless specifically requested)
```

### 네거티브 프롬프트 필수 사용

디자인 요청 시 금지 사항 명시적 포함:
```
Prohibited:
- purple (#7C3AED, #8B5CF6, etc.)
- indigo (#6366F1, #4F46E5, etc.)
- bg-gradient-to-r from-indigo to-purple
- backdrop-blur glassmorphism
```

---

## [KR] 한국 시장 특화 규칙

### 한국 대상 프로젝트 감지 시

키워드: 한국, Korea, 한글, Korean, 국내
```
1. 한글 폰트 권장: Pretendard, 본고딕, Noto Sans KR
2. MiriCanvas, Karlo 도구 언급
3. 문화적 QA 체크리스트 제안
4. 서양 미니멀리즘 → 한옥 미니멀리즘 고려
```

### 한글 타이포그래피 기본값
```css
--font-kr-heading: 'Pretendard', sans-serif;
--font-kr-body: 'Pretendard', sans-serif;
/* Noto Sans KR은 기본값이므로 차별화 시 다른 폰트 권장 */
```

---

## [QA] 자동 검증 체크포인트

### 디자인 출력 전 자동 검증

CSS/Tailwind 코드 생성 시 자동 스캔:
```javascript
// 금지 패턴 탐지
const PROHIBITED_PATTERNS = [
  /bg-indigo-[4-6]00/,
  /bg-purple-[4-7]00/,
  /bg-violet-[4-6]00/,
  /from-indigo.*to-purple/,
  /from-purple.*to-indigo/,
  /backdrop-blur-(?:md|lg|xl)/,
  /font-family.*Inter/
];

// 탐지 시 경고 및 대안 제시
```

### 경고 메시지 형식
```
[!] AI 동질화 패턴 감지: {pattern}
    → 대안: {alternative}
    → 참조: documentation/guides/anti-ai-slop-checklist.md
```

---

## [STYLE] 권장 스타일 가이드

### 버튼 스타일
```css
/* 권장 */
.btn-primary {
  @apply bg-teal-600 hover:bg-teal-700 text-white rounded-md;
  /* 단색, 그라데이션 없음 */
}

/* 금지 */
.btn-primary {
  @apply bg-gradient-to-r from-indigo-500 to-purple-600;
  /* 보라 그라데이션 */
}
```

### 카드 스타일
```css
/* 권장 */
.card {
  @apply bg-white shadow-sm rounded-lg border border-stone-200;
  /* 미니멀, 글래스모피즘 없음 */
}

/* 금지 */
.card {
  @apply bg-white/10 backdrop-blur-md border-white/20;
  /* 글래스모피즘 과용 */
}
```

### 둥근 모서리
```css
/* 권장: 다양한 값 사용 */
--radius-sm: 4px;   /* 작은 요소 */
--radius-md: 6px;   /* 버튼 */
--radius-lg: 12px;  /* 카드 */

/* 경고: 모든 곳에 8px(rounded-lg) 사용 시 동질화 */
```

---

## [EMOJI] 이모지 사용 규칙 (CRITICAL)

**AI 생성 콘텐츠의 핵심 탐지 지표 중 하나**

> 통계: ChatGPT는 70% 메시지에 이모지 포함, 체크마크(✅) 사용 빈도 인간 대비 11배 (Washington Post, 2025)

### 금지 패턴

| 패턴 | 예시 | 문제점 |
|------|------|--------|
| **이모지 불릿** | ✅ 항목1 ✅ 항목2 | 전문 문서에 부적절, AI 특유 패턴 |
| **제목 장식** | 🚀 시작하기 | 과도한 시각적 자극 |
| **연속 이모지 3개+** | 🔥🔥🔥 | 가짜 열정, 신뢰도 저하 |
| **감정 이모지** | 😊 🙌 💪 | 과도한 친근함, 비전문적 |
| **하이프 이모지** | 🔥 💯 🚀 ✨ | 과장된 표현, AI 특유 패턴 |

### 허용 조건

다음 경우에만 이모지 사용 허용:
```
1. 사용자가 명시적으로 이모지 사용 요청
2. 마케팅/SNS 콘텐츠 (명시된 경우)
3. UI 텍스트 (코드 주석이 아닌)
4. 슬랙/메신저 대화 (비공식 채널)
```

### 대안 제시

| 금지 | 대안 |
|------|------|
| ✅ 완료 | - 완료 (dash 불릿) |
| 🚀 시작 | ## 시작하기 (일반 헤딩) |
| Let's go! 🔥 | 시작합니다. (평서문) |
| Hope this helps! ✨ | 도움이 되셨길 바랍니다. |

### 자동 검증

이모지 밀도 임계값:
```
- 단락당: 최대 3개
- 문서당: 최대 10개
- 밀도: 1% 미만 (이모지수/단어수)
- 연속: 최대 2개
```

검증 도구: `node design-system/lint-design.js [file]`

---

## [REF] 참조 문서

| 문서 | 경로 | 용도 |
|------|------|------|
| 분석 보고서 | `documentation/guides/ai-design-homogenization-analysis.md` | 현상 이해 |
| 체크리스트 | `documentation/guides/anti-ai-slop-checklist.md` | 즉시 적용 |
| 플레이북 | `documentation/guides/brand-differentiation-playbook.md` | 전략 수립 |

---

## [EXCEPTION] 예외 조건

다음 경우 이 규칙 완화 가능:
1. 사용자가 **명시적으로** 보라/인디고 색상 요청
2. 기존 브랜드 가이드에 보라 계열이 포함된 경우
3. Twitch, Discord 등 보라가 브랜드 색상인 서비스 클론

예외 적용 시 로그:
```
[*] 디자인 동질화 방지 규칙 예외 적용
    사유: {reason}
    요청: {user_request}
```

---

**규칙 버전**: 2.0.0
**적용일**: 2026-02-04
**업데이트**: Phase 3 - 이모지 동질화 패턴 추가
**관리자**: CLAUDE.md 자동 로드

---

*이 규칙은 .claude/rules/ 폴더에서 자동 로드됩니다.*
