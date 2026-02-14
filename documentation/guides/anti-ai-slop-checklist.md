# Anti-AI Slop 체크리스트

> **목적**: AI 디자인 동질화("AI Slop", "Purple Problem") 방지를 위한 실행 가능한 체크리스트
> **대상**: 디자이너, 개발자, 제품 관리자
> **최종 업데이트**: 2026-02-04

---

## 빠른 참조 (Quick Reference)

### 즉시 확인 사항 (30초 체크)
- [ ] 보라색/인디고 계열이 주 색상인가? → **변경 필요**
- [ ] Inter 폰트를 사용하는가? → **대안 검토**
- [ ] 글래스모피즘 배경이 있는가? → **제거 고려**
- [ ] 3박스 피처 그리드인가? → **레이아웃 변경**
- [ ] "다른 AI 생성 사이트와 구분되는가?" → **핵심 질문**

---

## 1. 즉시 실행 (Today)

### 1.1 색상 점검

| 체크 | 항목 | 조치 |
|:----:|------|------|
| [ ] | 주 색상이 `#6366f1` (indigo-500) 또는 유사한가? | 브랜드 색상으로 교체 |
| [ ] | `bg-gradient-to-r from-indigo to-purple` 패턴? | 그라데이션 제거 또는 단색 |
| [ ] | Aurora/글로우 배경 효과? | 단순한 배경으로 교체 |
| [ ] | 색상이 Tailwind 기본 팔레트에서만 왔는가? | 커스텀 색상 정의 |

**권장 대체 색상 팔레트**:
```css
/* AI 기본값 대신 사용할 색상 */
--primary-teal: #0F766E;      /* teal-700 */
--primary-emerald: #059669;   /* emerald-600 */
--primary-amber: #D97706;     /* amber-600 */
--primary-rose: #E11D48;      /* rose-600 */
--primary-sky: #0284C7;       /* sky-600 */
```

### 1.2 타이포그래피 점검

| 체크 | 항목 | 조치 |
|:----:|------|------|
| [ ] | Inter 폰트만 사용하는가? | 브랜드에 맞는 폰트로 교체 |
| [ ] | 시스템 폰트 스택만 사용하는가? | 최소 1개 커스텀 폰트 추가 |
| [ ] | 한글 폰트가 Noto Sans KR 기본값인가? | Pretendard, 본고딕 등 검토 |

**권장 폰트 조합**:
```css
/* 글로벌 */
--font-heading: 'Plus Jakarta Sans', sans-serif;
--font-body: 'DM Sans', sans-serif;

/* 한국어 */
--font-heading-kr: 'Pretendard', sans-serif;
--font-body-kr: 'Pretendard', sans-serif;
```

### 1.3 레이아웃 점검

| 체크 | 항목 | 조치 |
|:----:|------|------|
| [ ] | 3박스 피처 그리드 (grid-cols-3)? | 2열, 4열, 비대칭 검토 |
| [ ] | 중앙 정렬 히어로 섹션? | 좌측 정렬, 분할 레이아웃 검토 |
| [ ] | 8px 둥근 모서리 (rounded-lg)? | 4px, 12px, 또는 0px 검토 |
| [ ] | `backdrop-blur` 글래스모피즘? | 불투명 배경으로 교체 |


---

## 2. 단기 실행 (This Week)

### 2.1 도구별 설정 체크리스트

#### v0 by Vercel
| 체크 | 항목 |
|:----:|------|
| [ ] | `src/app/tokens.css` 커스텀 테마 파일 생성 |
| [ ] | Design Mode에서 색상 팔레트 변경 |
| [ ] | 프롬프트에 "NO purple, NO indigo" 명시 |

#### Bolt.new
| 체크 | 항목 |
|:----:|------|
| [ ] | Project Settings → Project-specific Knowledge 설정 |
| [ ] | `.bolt/promptfile` 커스텀 규칙 추가 |
| [ ] | 스타일 영역 Lock 기능 활용 |

#### Lovable
| 체크 | 항목 |
|:----:|------|
| [ ] | Settings → Manage Knowledge에 브랜드 가이드 추가 |
| [ ] | 금지 색상 목록 명시적 포함 |
| [ ] | 컴포넌트 스타일 규칙 문서화 |

#### Cursor
| 체크 | 항목 |
|:----:|------|
| [ ] | `.cursor/rules/design-system.mdc` 파일 생성 |
| [ ] | 금지 CSS 클래스 목록 추가 |
| [ ] | 권장 패턴 정의 |

#### Replit Agent
| 체크 | 항목 |
|:----:|------|
| [ ] | TweakCN에서 커스텀 테마 생성 및 저장 |
| [ ] | `replit.md` 디자인 규칙 추가 |


### 2.2 프롬프트 엔지니어링 체크리스트

| 체크 | 기법 | 예시 |
|:----:|------|------|
| [ ] | **네거티브 제약** | "NO purple gradients, NO glassmorphism" |
| [ ] | **색상 명시** | "Primary: #059669, Secondary: #78716C" |
| [ ] | **토큰 테이블** | 디자인 토큰을 JSON/표로 제공 |
| [ ] | **참조 거부** | "Do NOT reference Vercel, Linear, Stripe aesthetics" |
| [ ] | **스타일 명시** | "Style: Brutalist / Swiss / Retro" |

**프롬프트 템플릿**:
```
Design a [component/page].

## Required
- Primary color: [HEX]
- Secondary color: [HEX]
- Border radius: [Npx]
- Font: [Font Name]

## Prohibited
- NO purple, indigo, violet colors
- NO gradients on buttons
- NO glassmorphism/backdrop-blur
- NO Inter font

## Style Reference
[Optional: 특정 브랜드나 스타일 참조]
```

---

## 3. 중기 실행 (This Month)

### 3.1 디자인 시스템 구축

| 체크 | 단계 | 설명 |
|:----:|------|------|
| [ ] | **Primitive Tokens 정의** | 색상, 간격, 폰트 크기 등 기본 값 |
| [ ] | **Semantic Tokens 생성** | primary-action, success-state 등 의미 부여 |
| [ ] | **JSON 형식 저장** | 크로스 플랫폼 호환성 |
| [ ] | **AI 파이프라인 통합** | 모든 AI 도구에 토큰 제공 |

**디자인 토큰 예시**:
```json
{
  "color": {
    "primary": { "value": "#0F766E" },
    "secondary": { "value": "#475569" },
    "background": { "value": "#FAFAF9" },
    "surface": { "value": "#FFFFFF" }
  },
  "spacing": {
    "xs": { "value": "4px" },
    "sm": { "value": "8px" },
    "md": { "value": "16px" },
    "lg": { "value": "24px" }
  },
  "radius": {
    "sm": { "value": "4px" },
    "md": { "value": "6px" },
    "lg": { "value": "12px" }
  }
}
```

### 3.2 품질 게이트 시스템

| 레벨 | 기준 | 검토자 | 체크포인트 |
|------|------|--------|-----------|
| **L1 - 자동** | 기술 스펙 | AI 검증 | 색상 코드, 클래스명 검사 |
| **L2 - 빠른** | 브랜드 정렬 | 1명 휴먼 | "브랜드와 일치하는가?" |
| **L3 - 전체** | 전략적 중요도 | 팀 + 이해관계자 | 비즈니스 임팩트 검토 |

### 3.3 AI 출력 검증 체크리스트

| 체크 | 검증 항목 |
|:----:|----------|
| [ ] | AI 첫 출력물을 그대로 사용하지 않았는가? |
| [ ] | 최소 3회 이상 반복/수정했는가? |
| [ ] | 브랜드 가이드라인과 대조했는가? |
| [ ] | 경쟁사와 시각적으로 차별화되는가? |
| [ ] | "AI로 만든 것 같다"는 느낌이 없는가? |


---

## 4. 장기 실행 (This Quarter)

### 4.1 조직 역량 구축

| 체크 | 항목 | 담당 |
|:----:|------|------|
| [ ] | "프롬프트 디자이너" 역할 정의 | 리더십 |
| [ ] | AI 도구 사용 가이드라인 수립 | 디자인팀 |
| [ ] | 브랜드 일관성 모니터링 프로세스 | QA |
| [ ] | 문화적 맥락 검증 체크리스트 (한국 시장) | 마케팅 |

### 4.2 장기 모니터링 지표

| 지표 | 측정 방법 | 목표 |
|------|----------|------|
| 브랜드 기억률 | 사용자 설문 | > 30% |
| "AI 느낌" 피드백 | 사용자 테스트 | < 10% |
| 디자인 다양성 점수 | 내부 평가 | > 7/10 |
| 경쟁사 차별화 인식 | 시장 조사 | "확실히 다름" |

---

## 5. 한국 시장 특화 체크리스트

### 5.1 도구 선택

| 체크 | 항목 |
|:----:|------|
| [ ] | 마케팅 콘텐츠에 MiriCanvas 사용 고려 |
| [ ] | 이미지 생성에 Kakao Karlo 사용 고려 |
| [ ] | 글로벌 도구 사용 시 한국 맥락 검증 추가 |

### 5.2 타이포그래피

| 체크 | 항목 |
|:----:|------|
| [ ] | 한글 전용 폰트 선정 (Pretendard, 본고딕 등) |
| [ ] | 영문+한글 페어링 검토 |
| [ ] | 폰트 라이선싱 확인 |

### 5.3 문화적 검증

| 체크 | 검증 항목 |
|:----:|----------|
| [ ] | 한국 문화 요소가 정확하게 표현되었는가? |
| [ ] | 동아시아 다른 나라와 구분되는가? |
| [ ] | 한국 사용자가 "한국다움"을 느끼는가? |
| [ ] | 명절/계절 맥락이 적절한가? |

---

## 6. AI Tells 탐지 체크리스트

### 6.1 색상 AI Tells

| 체크 | 패턴 | 탐지 방법 |
|:----:|------|----------|
| [ ] | 보라-파란 그라데이션 | `from-indigo` 또는 `from-purple` 검색 |
| [ ] | Magic Blue (#5E6AD2) | 색상 코드 검색 |
| [ ] | Aurora 배경 | `blur(100px)` + 여러 원형 검색 |

### 6.2 레이아웃 AI Tells

| 체크 | 패턴 | 탐지 방법 |
|:----:|------|----------|
| [ ] | 글래스모피즘 | `backdrop-blur` 검색 |
| [ ] | 3박스 그리드 | `grid-cols-3` 패턴 검색 |
| [ ] | 8px 모서리 | `rounded-lg` (0.5rem) 검색 |

### 6.3 코드 레벨 검사

```bash
# 금지 패턴 검색 스크립트
grep -r "bg-indigo\|bg-purple\|bg-violet" src/
grep -r "from-indigo\|from-purple\|to-purple" src/
grep -r "backdrop-blur" src/
grep -r "font-family.*Inter" src/
```

---

## 7. 프롬프트 예시 라이브러리

### 7.1 랜딩 페이지

```
Create a landing page for [product].

Colors:
- Primary: #0F766E (teal)
- Secondary: #475569 (slate)
- Background: #FAFAF9 (warm white)

Layout:
- Hero: Left-aligned text with right image
- Features: 2x2 grid (not 3 columns)
- Border radius: 6px (not 8px)

Prohibited:
- NO purple, indigo, violet
- NO gradients
- NO glassmorphism
- NO Inter font
```

### 7.2 대시보드

```
Design a dashboard for [use case].

Design System:
- Primary: #2563EB (blue-600)
- Neutral: #64748B (slate-500)
- Success: #16A34A (green-600)
- Warning: #D97706 (amber-600)
- Error: #DC2626 (red-600)

Components:
- Cards: white background, shadow-sm, rounded-md (6px)
- Buttons: solid colors, no gradients, rounded-md
- Charts: use primary color family, not rainbow

Prohibited:
- NO purple accent colors
- NO dark mode by default
- NO glassmorphism sidebar
```

### 7.3 모바일 앱

```
Design a mobile app UI for [purpose].

Brand:
- Primary: #EA580C (orange-600)
- Background: #FFFBEB (amber-50)
- Text: #292524 (stone-800)

Style:
- Warm, friendly, approachable
- NOT cold tech startup aesthetic
- Rounded corners: 12px for cards, 8px for buttons

Typography:
- Headings: SF Pro Display Bold
- Body: SF Pro Text Regular

Prohibited:
- NO blue-purple color schemes
- NO glassmorphism
- NO dark gradients
```

---

## 8. 검증 스코어카드

| 카테고리 | 점수 (1-5) | 기준 |
|----------|-----------|------|
| **색상 차별화** | ___ | 5: 완전 커스텀, 1: Tailwind 기본값 |
| **타이포그래피** | ___ | 5: 브랜드 폰트, 1: Inter/시스템 폰트 |
| **레이아웃 독창성** | ___ | 5: 고유 구조, 1: 3박스 그리드 |
| **브랜드 일관성** | ___ | 5: 완벽 정렬, 1: 불일치 |
| **AI 티 안남** | ___ | 5: 수작업 같음, 1: 명백한 AI |
| **문화적 적합성** | ___ | 5: 완벽 맞춤, 1: 문화 무관 |

**총점**: ___ / 30

| 총점 | 등급 | 조치 |
|------|------|------|
| 25-30 | A | 출시 가능 |
| 20-24 | B | 경미한 수정 |
| 15-19 | C | 중요 수정 필요 |
| < 15 | D | 재작업 필요 |


---

## 9. 참조 링크

### 도구 설정 문서
- [v0 Design Systems](https://v0.dev/docs/design-systems)
- [Bolt.new Prompting](https://bolt.new/docs/prompting)
- [Lovable Knowledge](https://docs.lovable.dev/knowledge)
- [Cursor Rules](https://cursor.sh/docs/rules)

### 추가 자료
- [AI Design Homogenization Analysis](./ai-design-homogenization-analysis.md)
- [Brand Differentiation Playbook](./brand-differentiation-playbook.md)

---

**문서 버전**: 1.0.0
**작성일**: 2026-02-04
**작성자**: Claude (Anthropic)

---

*이 체크리스트는 시작점입니다. 각 조직의 브랜드와 맥락에 맞게 조정하세요.*
