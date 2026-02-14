# 브랜드 차별화 플레이북 (Brand Differentiation Playbook)

> **목적**: AI 시대에 브랜드 차별화를 유지하기 위한 전략적 가이드
> **대상**: 스타트업 창업자, 제품 관리자, 디자인 리더, 마케팅 담당자
> **최종 업데이트**: 2026-02-04

---

## Executive Summary

AI 도구가 "좋은 디자인"을 모두에게 제공하는 시대,
**"좋은 디자인"은 더 이상 경쟁 우위가 아닙니다.**

새로운 경쟁 우위:
- 독특한 브랜드 아이덴티티
- 문화적 맥락 이해
- 의도적인 "불완전함"
- 인간적 터치

이 플레이북은 AI 동질화를 피하면서 브랜드 차별화를 달성하는 방법을 제시합니다.

---

## 목차

1. [전략적 프레임워크](#1-전략적-프레임워크)
2. [4단계 실행 계획](#2-4단계-실행-계획)
3. [도구별 상세 설정 가이드](#3-도구별-상세-설정-가이드)
4. [디자인 시스템 구축](#4-디자인-시스템-구축)
5. [한국 시장 전략](#5-한국-시장-전략)
6. [조직 역량 구축](#6-조직-역량-구축)
7. [측정 및 모니터링](#7-측정-및-모니터링)

---

## 1. 전략적 프레임워크

### 1.1 AI 시대의 브랜드 가치 재정의

```
┌─────────────────────────────────────────────────────────────┐
│                   브랜드 가치 피라미드                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    ┌───────────┐                            │
│                    │  문화적   │  ← AI가 못하는 것          │
│                    │   공감    │                            │
│                    └─────┬─────┘                            │
│                    ┌─────┴─────┐                            │
│                    │  브랜드   │  ← AI가 어려워하는 것      │
│                    │ 스토리텔링│                            │
│                    └─────┬─────┘                            │
│               ┌──────────┴──────────┐                       │
│               │     시각적 정체성    │  ← AI 도움 가능       │
│               │  (차별화된 디자인)   │    (가이드 필요)      │
│               └──────────┬──────────┘                       │
│          ┌───────────────┴───────────────┐                  │
│          │         기능적 가치           │  ← AI가 잘하는 것 │
│          │    (깔끔한 UI, 작동하는 코드)  │                   │
│          └───────────────────────────────┘                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 차별화 매트릭스

| 차원 | AI 기본값 | 차별화 방향 | 투자 수준 |
|------|----------|------------|----------|
| **색상** | 보라/인디고 | 브랜드 고유 팔레트 | 중간 |
| **타이포** | Inter/시스템 | 커스텀/라이선스 폰트 | 높음 |
| **레이아웃** | 3박스 그리드 | 고유 구조/패턴 | 중간 |
| **톤앤매너** | 친근-평면적 | 브랜드 보이스 | 높음 |
| **문화적 맥락** | 글로벌 평균 | 로컬 특화 | 매우 높음 |


### 1.3 Human-AI 협업 모델

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   [대체 모델] ❌                [증강 모델] ✓               │
│                                                             │
│   Human → AI → Output          Human ↔ AI → Output         │
│                                   ↑         ↓              │
│   "AI가 대신 만든다"             │    반복/개선            │
│   결과: 동질화                   └──────────┘              │
│                                 "AI가 확장한다"            │
│                                 결과: 차별화               │
│                                                             │
│   효과: 1배                      효과: 3배 (연구 결과)     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**핵심 원칙**: AI는 **대체(Replace)**가 아닌 **증강(Augment)** 도구

---

## 2. 4단계 실행 계획

### Phase 1: 기반 구축 (Week 1-2)

**목표**: AI 도구 기본값 탈피, 브랜드 기초 정의

| 액션 | 담당 | 산출물 |
|------|------|--------|
| 브랜드 색상 팔레트 정의 | 디자인 | 5-7개 핵심 색상 HEX 코드 |
| 타이포그래피 선정 | 디자인 | 2-3개 폰트 + 사용 규칙 |
| AI 도구 설정 업데이트 | 개발 | 각 도구별 설정 파일 |
| 금지 패턴 문서화 | 디자인 | 금지 색상/패턴 목록 |

**체크포인트**: 
- [ ] 모든 AI 도구에 커스텀 설정 적용 완료
- [ ] 팀원 전체가 금지 패턴 인지


### Phase 2: 시스템 구축 (Week 3-4)

**목표**: 재사용 가능한 디자인 시스템 구축

| 액션 | 담당 | 산출물 |
|------|------|--------|
| Design Tokens 정의 | 디자인 | tokens.json |
| 컴포넌트 라이브러리 | 개발 | Storybook/컴포넌트 |
| AI 프롬프트 템플릿 | 전체 | 프롬프트 라이브러리 |
| 품질 게이트 정의 | QA | 검증 체크리스트 |

**체크포인트**:
- [ ] Design Tokens JSON 완성
- [ ] 핵심 컴포넌트 10개 이상 문서화
- [ ] AI 프롬프트 템플릿 5개 이상

### Phase 3: 프로세스 통합 (Week 5-6)

**목표**: 일상 워크플로우에 차별화 프로세스 내재화

| 액션 | 담당 | 산출물 |
|------|------|--------|
| 품질 게이트 도입 | 팀 리드 | 리뷰 프로세스 |
| AI 출력 검증 루틴 | QA | 검증 스크립트 |
| 문화적 QA 프로세스 | 마케팅 | 체크리스트 |
| 교육 세션 | 리더십 | 워크샵 자료 |

**체크포인트**:
- [ ] 모든 디자인 산출물이 품질 게이트 통과
- [ ] 팀원 전체 교육 완료

### Phase 4: 최적화 및 확장 (Week 7-8+)

**목표**: 지속적 개선, 측정, 확장

| 액션 | 담당 | 산출물 |
|------|------|--------|
| 차별화 지표 측정 | 마케팅 | 대시보드 |
| A/B 테스트 | 제품 | 테스트 결과 |
| 프로세스 개선 | 전체 | 개선 보고서 |
| 신규 도구 평가 | 개발 | 평가 보고서 |


---

## 3. 도구별 상세 설정 가이드

### 3.1 v0 by Vercel

**기본 동질화 원인**: React + Tailwind + shadcn/ui 기본값, Vercel 미학

**설정 파일**: `src/app/tokens.css`

```css
/* 커스텀 테마 - 보라 계열 완전 대체 */
:root {
  /* Primary - 브랜드 색상으로 교체 */
  --primary: 172 66% 50%;           /* teal-500 대신 예시 */
  --primary-foreground: 0 0% 100%;
  
  /* Background - 따뜻한 톤 */
  --background: 30 6% 98%;          /* 순백 대신 따뜻한 오프화이트 */
  --foreground: 30 6% 10%;
  
  /* Accent - 보라 아닌 대체 */
  --accent: 43 96% 56%;             /* amber-400 */
  --accent-foreground: 0 0% 0%;
  
  /* Radius - 8px 아닌 값 */
  --radius: 0.375rem;               /* 6px */
}
```

**프롬프트 템플릿**:
```
Build a [component type] for [purpose].

Design System:
- Primary: #0D9488 (teal-600)
- Secondary: #475569 (slate-600)
- Accent: #F59E0B (amber-500)
- Background: #FAFAF9 (stone-50)
- Border radius: 6px

Prohibited:
- NO purple, indigo, violet colors (#7C3AED, #6366F1, etc.)
- NO bg-gradient-to-r from-* to-purple-*
- NO backdrop-blur glassmorphism
- NO Inter font

Style: [Clean/Minimal/Bold/Playful] - NOT "tech startup"
```


### 3.2 Bolt.new

**기본 동질화 원인**: Tailwind 기본값, Supabase 통합 패턴

**설정 위치**: 기어 아이콘 → All project settings → Project-specific Knowledge

**Knowledge Document 예시**:
```markdown
# [회사명] Design System

## Brand Identity
- Industry: [산업]
- Target Audience: [타겟]
- Brand Personality: [성격 - 예: Bold, Friendly, Professional]

## Color Palette
| Token | Hex | Usage |
|-------|-----|-------|
| primary | #1E40AF | Buttons, Links |
| secondary | #64748B | Secondary UI |
| accent | #F59E0B | Highlights |
| background | #FAFAF9 | Page background |
| surface | #FFFFFF | Cards, Modals |

## Prohibited
- NEVER use: #7C3AED, #6366F1, #8B5CF6 (purple/indigo)
- NEVER use: gradient backgrounds on buttons
- NEVER use: backdrop-blur effects
- NEVER use: Inter font

## Component Rules
- Buttons: solid colors, rounded-md (6px), no gradients
- Cards: white background, shadow-sm, border-stone-200
- Inputs: border-stone-300, focus:ring-primary
```

**추가 설정**: `.bolt/promptfile` 생성
```
For all designs in this project:
- Follow the design system in Project Knowledge
- Make designs beautiful and unique, not cookie-cutter
- Ask for clarification if brand colors aren't specified
```


### 3.3 Lovable

**기본 동질화 원인**: Claude Sonnet 훈련 편향, shadcn/ui

**설정 위치**: Settings → Manage Knowledge → Add Document

**Knowledge Document 구조**:
```markdown
# [회사명] Brand Guidelines

## 1. Brand Philosophy
[브랜드 미션, 비전, 가치]

## 2. Visual Identity

### 2.1 Color System
Primary Palette:
- Primary: #0EA5E9 (Sky Blue) - Trust, Innovation
- Secondary: #334155 (Slate) - Professionalism

Accent Palette:
- Success: #22C55E
- Warning: #EAB308
- Error: #EF4444

### 2.2 Prohibited Colors
The following are STRICTLY PROHIBITED:
- Purple shades: #7C3AED, #8B5CF6, #A78BFA
- Indigo shades: #6366F1, #4F46E5, #818CF8
- Any gradient from indigo to purple

### 2.3 Typography
- Headings: Plus Jakarta Sans (Bold, Semibold)
- Body: DM Sans (Regular, Medium)
- Code: JetBrains Mono
- DO NOT use Inter font

### 2.4 Component Specifications
Buttons:
- Primary: bg-sky-500 hover:bg-sky-600 text-white
- Padding: px-4 py-2
- Border radius: 6px (rounded-md)
- NO gradients

Cards:
- Background: white
- Border: 1px solid stone-200
- Shadow: shadow-sm
- Border radius: 12px
- NO glassmorphism
```


### 3.4 Cursor

**기본 동질화 원인**: Claude/GPT 훈련 데이터, Tailwind 제안

**설정 파일**: `.cursor/rules/design-system.mdc`

```markdown
# Design System Rules for Cursor

## Global Rules
When generating UI code, ALWAYS follow these rules:

## Color Tokens
```css
:root {
  --color-primary: #0F766E;    /* teal-700 */
  --color-secondary: #475569;   /* slate-600 */
  --color-accent: #D97706;      /* amber-600 */
  --color-background: #FAFAF9;  /* stone-50 */
  --color-surface: #FFFFFF;
}
```

## CSS Class Mappings
Use these exact classes:
- `.btn-primary` → `bg-teal-700 hover:bg-teal-800 text-white rounded-md px-4 py-2`
- `.btn-secondary` → `bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md`
- `.card` → `bg-white shadow-sm rounded-lg border border-stone-200 p-6`
- `.input` → `border-stone-300 rounded-md focus:ring-teal-500`

## PROHIBITED - Never Generate
CSS classes to NEVER use:
- `bg-indigo-*` (any shade)
- `bg-purple-*` (any shade)
- `bg-violet-*` (any shade)
- `from-indigo-*`, `from-purple-*`, `to-indigo-*`, `to-purple-*`
- `backdrop-blur-*` (glassmorphism)
- Font families containing "Inter"

If you're about to use a prohibited pattern, stop and use the alternative from the Color Tokens above.

## Layout Patterns
Prefer:
- 2-column asymmetric layouts over 3-column grids
- Left-aligned hero sections over centered
- Visible borders over heavy shadows

Avoid:
- `grid-cols-3` for feature sections (use 2 or 4)
- Centered text blocks wider than 600px
- Multiple overlapping blur elements
```


### 3.5 Replit Agent

**기본 동질화 원인**: Tailwind + shadcn/ui 기본 통합

**설정 1: TweakCN 테마 에디터**

1. TweakCN 접근 (Replit 내 또는 tweakcn.dev)
2. 커스텀 테마 생성:
   - Primary 색상 변경
   - Radius 값 조정
   - 폰트 설정
3. "My Themes"에 저장
4. 새 프로젝트 생성 시 저장된 테마 적용

**설정 2: replit.md 파일**

프로젝트 루트에 `replit.md` 생성:
```markdown
# Project Design Guidelines

## Design Preferences
This project uses a custom design system. Do NOT use default shadcn/ui colors.

### Colors
- Primary: #2563EB (Blue 600) - NOT indigo
- Secondary: #71717A (Zinc 500)
- Accent: #F97316 (Orange 500)
- Background: #FAFAFA (Zinc 50)

### Constraints
- Rounded corners: 6px maximum (NOT 8px default)
- Shadows: shadow-sm only (NOT shadow-md or higher)
- NO purple, indigo, or violet anywhere
- NO gradient buttons
- NO glassmorphism effects

### Font
- Use system font stack
- If custom font needed: "Plus Jakarta Sans"
- Do NOT use Inter
```

---

## 4. 디자인 시스템 구축

### 4.1 Design Tokens 완전 가이드

**Design Tokens JSON 구조**:
```json
{
  "$schema": "https://design-tokens.org/schema.json",
  "color": {
    "primitive": {
      "teal": {
        "50": { "value": "#F0FDFA" },
        "100": { "value": "#CCFBF1" },
        "500": { "value": "#14B8A6" },
        "600": { "value": "#0D9488" },
        "700": { "value": "#0F766E" }
      },
      "slate": {
        "50": { "value": "#F8FAFC" },
        "500": { "value": "#64748B" },
        "600": { "value": "#475569" },
        "900": { "value": "#0F172A" }
      }
    },
    "semantic": {
      "primary": { "value": "{color.primitive.teal.600}" },
      "primary-hover": { "value": "{color.primitive.teal.700}" },
      "secondary": { "value": "{color.primitive.slate.600}" },
      "background": { "value": "#FAFAF9" },
      "surface": { "value": "#FFFFFF" },
      "text-primary": { "value": "{color.primitive.slate.900}" },
      "text-secondary": { "value": "{color.primitive.slate.500}" }
    }
  },
  "spacing": {
    "xs": { "value": "4px" },
    "sm": { "value": "8px" },
    "md": { "value": "16px" },
    "lg": { "value": "24px" },
    "xl": { "value": "32px" },
    "2xl": { "value": "48px" }
  },
  "radius": {
    "none": { "value": "0px" },
    "sm": { "value": "4px" },
    "md": { "value": "6px" },
    "lg": { "value": "12px" },
    "full": { "value": "9999px" }
  },
  "typography": {
    "fontFamily": {
      "heading": { "value": "'Plus Jakarta Sans', sans-serif" },
      "body": { "value": "'DM Sans', sans-serif" },
      "mono": { "value": "'JetBrains Mono', monospace" }
    }
  }
}
```


### 4.2 AI 도구 통합 방법

**Tokens → AI 도구 연결**:

```
┌─────────────────┐
│  Design Tokens  │
│   (JSON/YAML)   │
└────────┬────────┘
         │
    ┌────┴────┐
    │ 변환기  │
    └────┬────┘
         │
    ┌────┴────────────────────────────┐
    │                                 │
    ▼                                 ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│ v0 Theme │  │ Bolt     │  │ Cursor   │
│ CSS vars │  │ Knowledge│  │ Rules    │
└──────────┘  └──────────┘  └──────────┘
```

**자동 변환 스크립트 예시**:
```javascript
// tokens-to-tailwind.js
const tokens = require('./tokens.json');

function generateTailwindConfig(tokens) {
  return {
    theme: {
      extend: {
        colors: {
          primary: tokens.color.semantic.primary.value,
          secondary: tokens.color.semantic.secondary.value,
          // ...
        },
        borderRadius: {
          sm: tokens.radius.sm.value,
          md: tokens.radius.md.value,
          // ...
        }
      }
    }
  };
}
```

---

## 5. 한국 시장 전략

### 5.1 한국 디자인 정체성 요소

| 요소 | 특징 | 적용 방법 |
|------|------|----------|
| **한옥 미니멀리즘** | 여백의 미, 자연 소재 톤 | 어스톤 팔레트, 넓은 여백 |
| **뉴트로** | 80년대 한국 레트로 | 머스터드, 틸, 복고 타이포 |
| **K-캐릭터 문화** | 감정적 연결, 친근함 | 캐릭터/일러스트 활용 |
| **소프트 맥시멀리즘** | 파스텔, 레이어드 | 부드러운 색상 조합 |


### 5.2 한국 맞춤 도구 선택 가이드

| 용도 | 1순위 도구 | 2순위 | 이유 |
|------|-----------|-------|------|
| 마케팅 콘텐츠 | MiriCanvas | Canva | 한글 폰트 라이선싱 명확 |
| 이미지 생성 | Kakao Karlo | Midjourney | 한국 맥락 이해도 |
| UI/코드 | v0 (설정 후) | Bolt | 커스터마이징 가능 |
| 프로토타입 | Figma | Framer | 팀 협업 |

### 5.3 한글 타이포그래피 전략

**권장 폰트 조합**:

| 용도 | 폰트 | 특징 |
|------|------|------|
| 모던/기술 | Pretendard | 애플 SF Pro 한글 대안 |
| 프리미엄 | 본명조 | 고급스러운 명조체 |
| 친근/캐주얼 | 나눔스퀘어 | 부드러운 느낌 |
| 개성/차별화 | 산돌 커스텀 | 브랜드 전용 |

**폰트 페어링 예시**:
```css
/* 모던 테크 */
--font-heading: 'Pretendard', -apple-system, sans-serif;
--font-body: 'Pretendard', sans-serif;

/* 프리미엄 브랜드 */
--font-heading: '본명조', serif;
--font-body: 'Pretendard', sans-serif;

/* 친근한 서비스 */
--font-heading: '나눔스퀘어 ExtraBold', sans-serif;
--font-body: '나눔스퀘어', sans-serif;
```

### 5.4 한국 문화적 QA 체크리스트

| 체크 | 항목 |
|:----:|------|
| [ ] | 한글 줄바꿈이 자연스러운가? (단어 단위) |
| [ ] | 존댓말/반말 톤이 일관적인가? |
| [ ] | 날짜 형식이 한국식인가? (YYYY년 MM월 DD일) |
| [ ] | 통화 표시가 올바른가? (₩, 원) |
| [ ] | 명절/계절 맥락이 적절한가? |
| [ ] | 한국 문화 요소가 정확한가? (다른 아시아 문화와 혼동 없음) |
| [ ] | 색상이 한국 문화에서 부정적 의미가 없는가? |


---

## 6. 조직 역량 구축

### 6.1 "프롬프트 디자이너" 역할 정의

**Plus X 모델 참고**:

| 역할 | 책임 | 스킬 |
|------|------|------|
| 프롬프트 디자이너 | AI 도구 질문 설계 | 프롬프트 엔지니어링 + 디자인 |
| 브랜드 가드 | 일관성 검증 | 브랜드 가이드라인 전문성 |
| 문화 컨설턴트 | 문화적 맥락 검증 | 로컬 시장 이해 |

**프롬프트 디자이너 업무**:
1. 브랜드 철학 기반 AI 질문 템플릿 개발
2. AI 출력물 품질 분석 및 피드백
3. 디자인 시스템과 AI 도구 연결
4. 팀원 AI 도구 교육

### 6.2 팀 교육 커리큘럼

**Week 1: AI 동질화 인식**
- "AI Slop" 현상 이해
- 금지 패턴 인식 훈련
- 실습: AI 생성물에서 패턴 찾기

**Week 2: 도구 설정**
- 각 AI 도구 커스터마이징
- 프롬프트 템플릿 작성
- 실습: 도구별 설정 적용

**Week 3: 품질 검증**
- 품질 게이트 프로세스
- 검증 체크리스트 활용
- 실습: 피어 리뷰

**Week 4: 지속적 개선**
- 피드백 루프 구축
- 측정 지표 이해
- 실습: 개선 제안



---

## 7. 측정 및 모니터링

### 7.1 핵심 성과 지표 (KPIs)

| 지표 | 측정 방법 | 목표 | 빈도 |
|------|----------|------|------|
| **브랜드 기억률** | 사용자 설문 "이 브랜드 기억하시나요?" | > 30% | 분기별 |
| **AI 인식률** | "AI로 만든 것 같나요?" 설문 | < 10% | 월별 |
| **디자인 일관성 점수** | 내부 감사 (1-10) | > 8 | 월별 |
| **차별화 인식** | "경쟁사와 다르다" 응답률 | > 60% | 분기별 |
| **전환율 변화** | A/B 테스트 | +15% | 지속 |

### 7.2 모니터링 대시보드 구성

```
┌─────────────────────────────────────────────────────────────┐
│                   브랜드 차별화 대시보드                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ AI 인식률   │  │ 브랜드 기억 │  │ 차별화 점수  │      │
│  │    8%  ▼   │  │    34%  ▲   │  │   7.8/10 ▲  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                             │
│  ┌─────────────────────────────────────────────────┐       │
│  │ 금지 패턴 감지 현황 (이번 주)                   │       │
│  │ ▓▓░░░░░░░░ 2건 감지 (목표: 0)                 │       │
│  └─────────────────────────────────────────────────┘       │
│                                                             │
│  ┌─────────────────────────────────────────────────┐       │
│  │ AI 도구 사용 현황                               │       │
│  │ v0: 45%  Bolt: 30%  Lovable: 15%  Other: 10%  │       │
│  └─────────────────────────────────────────────────┘       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 7.3 A/B 테스트 프레임워크

**테스트 유형**:

| 테스트 | 변수 | 측정 지표 |
|--------|------|----------|
| 색상 A/B | AI 기본값 vs 커스텀 | 전환율, 체류 시간 |
| 레이아웃 A/B | 3박스 vs 대안 | 스크롤 깊이, 클릭률 |
| 폰트 A/B | Inter vs 커스텀 | 브랜드 인식, 가독성 |



---

## 부록

### A. 빠른 시작 체크리스트

**오늘 할 일**:
- [ ] 브랜드 색상 3개 이상 HEX 코드 정의
- [ ] 주 사용 AI 도구에 금지 색상 설정
- [ ] 팀에 "보라색 금지" 공유

**이번 주 할 일**:
- [ ] 모든 AI 도구에 커스텀 설정 적용
- [ ] 프롬프트 템플릿 3개 작성
- [ ] 품질 체크리스트 팀 공유

**이번 달 할 일**:
- [ ] Design Tokens JSON 완성
- [ ] 품질 게이트 프로세스 도입
- [ ] 팀 교육 세션 1회

### B. 자주 묻는 질문 (FAQ)

**Q: 보라색이 우리 브랜드 색상인데요?**
A: 보라색이 브랜드 색상이라면 사용하세요. 다만 AI 기본값과 구분되도록:
- 정확한 HEX 값 명시
- 사용 맥락 정의
- 보조 색상으로 차별화

**Q: Inter 폰트가 나쁜 건가요?**
A: Inter는 훌륭한 폰트입니다. 문제는 "모두가 같은 폰트를 쓴다"는 것입니다.
브랜드 차별화가 목표라면 대안을 고려하세요.

**Q: 작은 팀인데 이 모든 걸 해야 하나요?**
A: 아닙니다. 우선순위:
1. (필수) AI 도구에 금지 색상 설정
2. (권장) 브랜드 색상 3개 정의
3. (선택) 풀 디자인 시스템

**Q: 이미 AI 기본값으로 만든 사이트가 있어요**
A: 점진적 개선:
1. 색상부터 변경 (가장 큰 영향)
2. 폰트 교체
3. 레이아웃 개선

### C. 참조 링크

| 문서 | 용도 |
|------|------|
| [AI 디자인 동질화 분석](./ai-design-homogenization-analysis.md) | 현상 이해 |
| [Anti-AI Slop 체크리스트](./anti-ai-slop-checklist.md) | 즉시 적용 |
| [Claude 디자인 규칙](../.claude/rules/design-anti-homogenization.md) | 자동 적용 |


---

## 맺음말

> **"AI가 모두에게 '좋은 디자인'을 제공할 때,
> '좋은 디자인'은 더 이상 경쟁 우위가 아니다.
> 새로운 경쟁 우위는 '나만의 디자인'이다."**

AI 도구는 강력한 생산성 도구입니다. 
하지만 기본값을 그대로 사용하면 경쟁사와 똑같아집니다.

이 플레이북의 핵심:
1. **AI 기본값 거부** - 항상 커스터마이징
2. **제약 명시** - AI에게 무엇을 하지 말아야 하는지 알려주기
3. **Human-AI 협업** - 대체가 아닌 증강
4. **문화적 맥락** - 로컬 시장 이해
5. **지속적 검증** - 품질 게이트와 모니터링

시작은 작게, 하지만 일관되게.
오늘 보라색 하나를 바꾸는 것부터 시작하세요.

---

**문서 버전**: 1.0.0
**작성일**: 2026-02-04
**작성자**: Claude (Anthropic)

---

*이 플레이북은 시작점입니다. 
각 조직의 규모, 산업, 목표에 맞게 조정하세요.
질문이나 피드백은 언제든 환영합니다.*
