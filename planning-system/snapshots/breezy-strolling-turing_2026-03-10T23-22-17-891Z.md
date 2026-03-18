# AI 디자인 동질화 현상 심층 분석 및 방지 전략

## 목표
AI 생성 디자인의 동질화 현상("AI Slop", "Purple Problem")에 대한 심층 분석, 문서화, 방지방안 수립

**범위**: Full (분석 + 체크리스트 + Claude 규칙 + 플레이북)
**추가 조사**: 도구별 우회 방법 + 한국 시장 맥락

---

## 1. 현상 분석 및 의견

### 1.1 현상은 실제인가? — 확실히 그렇다

| 지표 | 데이터 | 출처 |
|------|--------|------|
| "AI Slop" 언급 증가 | 2025년 9배 증가 | IndexBox |
| AI 생성 웹페이지 비율 | 74.2% (2025.04) | Ahrefs |
| AI 콘텐츠 부정적 인식 | 54% | Meltwater |
| Adam Wathan 사과문 조회수 | 130만+ | X/Twitter |

### 1.2 핵심 의견: "통계적 평균의 함정"

**근본적 문제**: LLM은 "취향"이 없다. 오직 "통계적 상관관계"만 있다.

> "When you ask an AI to 'build a landing page' without specific constraints, you get the statistical median of training data. And that median is purple." — prg.sh

**피드백 루프의 악순환**:
```
Tailwind 기본값 (indigo-500) → 개발자 사용 증가
    → AI 훈련 데이터에 반영 → AI가 "표준"으로 학습
    → 더 많은 보라색 생성 → 사이클 강화
```

### 1.3 비즈니스 임팩트 분석

| 신호 | 암묵적 메시지 |
|------|-------------|
| "AI로 만든 것 같은" 느낌 | "디자인 투자 여력/의지 없음" |
| 모두 같은 도구, 같은 방식 | "차별화된 가치 없음" |
| AI 첫 출력물 그대로 수용 | "고객 경험 깊이 고민 안 함" |
| 진입 장벽 0 증명 | "곧 사라질 수 있는 서비스" |

---

## 2. 기술적 원인 5가지

### 2.1 훈련 데이터 편향 (Training Data Bias)
- Tailwind CSS: 주당 3,110만 다운로드 (Bootstrap의 12.5배)
- shadcn/ui: 85.5K GitHub stars, "LLM의 기본 UI 라이브러리"

### 2.2 확률 모델의 한계 (Probabilistic Limitations)
- LLM은 "가장 가능성 높은" 토큰 선택
- Mode Collapse: 꼬리 분포(희귀 디자인) 소멸

### 2.3 도구 수렴 (Tool Convergence)
| 도구 | 기반 | 동질화 벡터 |
|------|------|------------|
| v0 (Vercel) | React + Tailwind + shadcn/ui | 컴포넌트 스타일 동일 |
| Bolt.new | Supabase 통합 | 아키텍처 패턴 동일 |
| Lovable | Claude Sonnet | 동일 훈련 편향 |

### 2.4 프레임워크 전파 (Framework Propagation)
- Tailwind 기본 팔레트: indigo-500, violet-600, purple-700
- shadcn/ui: 동일 CSS 변수 (--primary, --background)

### 2.5 인지적 고착 효과 (Cognitive Fixation)
- CHI 2024 연구: AI 사용 시 아이디어 수/다양성/독창성 감소
- 장기 효과: ChatGPT 없이도 동질화된 창작 패턴 지속

---

## 3. "AI Tells" — 즉시 인식 가능한 패턴

| 카테고리 | 패턴 |
|----------|------|
| **색상** | 보라-파란 그라데이션, Magic Blue (#5E6AD2), Aurora 배경 |
| **타이포** | Inter 폰트 (4,140억 회 접근), 시스템 Sans-serif |
| **레이아웃** | 글래스모피즘, 3박스 그리드, 8px 둥근 모서리 |
| **분위기** | "친근하지만 평면적", "미래지향적" 톤 |

---

## 4. 도구별 구체적 우회 방법 (NEW)

### 4.1 v0 by Vercel

**Method 1: Custom Design System Registry**
```
src/app/tokens.css → 커스텀 테마로 덮어쓰기
globals.css → 색상 팔레트, 타이포, 간격 수정
```

**Method 2: Design Mode 색상 조정**
- v0 Design Mode에서 직접 디자인 시스템 생성
- Light/Dark 모드 프리뷰

**프롬프트 기법**:
```
Build a multi-step form wizard.
Use: emerald green (#059669) as primary, warm gray (#78716C) as secondary.
NO purple or indigo colors. NO gradients.
```

### 4.2 Bolt.new

**Project Prompts 설정**:
- 기어 아이콘 → All project settings → Project-specific Knowledge
- `.bolt/promptfile` 수정

**스타일 주입 예시**:
```
For all designs: make them beautiful, not cookie cutter.
Use Tailwind CSS + shadcn/ui.
NO purple gradients. Primary color: #1E40AF (royal blue).
Stock photos from Unsplash where appropriate.
```

**Lock 기능**: 스타일된 영역 보호

### 4.3 Lovable

**Knowledge Base 설정**:
- Settings → Manage Knowledge
- 브랜드 가이드라인 문서 추가

**Knowledge Document 예시**:
```markdown
## Design System
Primary: #0EA5E9 (Sky Blue)
Secondary: #334155 (Slate)
NO purple, NO indigo, NO blue-purple gradients

## Style Rules
- Buttons: rounded-md, no gradients, solid colors
- Cards: subtle shadow (shadow-sm), white background
```

### 4.4 Replit Agent

**TweakCN 테마 에디터**:
- 커스텀 테마 생성 및 저장
- 향후 앱에 원클릭 적용

**replit.md 설정**:
```markdown
## Design Preferences
- Primary color: #2563EB
- Avoid: purple, indigo, default shadcn colors
- Style: Professional, minimal, no gradients
```

### 4.5 Cursor + Claude

**.cursor/rules/design-system.mdc**:
```markdown
# Design System Rules

## Color Palette
- Primary: #0F766E (Teal)
- NEVER use: indigo, purple, violet, bg-indigo-*, bg-purple-*

## CSS Classes
- .btn-primary { @apply bg-teal-600 hover:bg-teal-700 }
```

### 4.6 Framer / Figma AI

**Figma Make Guidelines**:
- `guidelines/Guidelines.md` 파일 생성
- 브랜드 색상, 사용 규칙, 컴포넌트 패턴 정의

**AI Brand Guide 플러그인**:
- 디자인 파일 → 브랜드 가이드 자동 생성

---

## 5. 한국 시장 맥락 (NEW)

### 5.1 한국 디자인 트렌드 vs AI 기본값

| 한국 트렌드 | 특징 | AI 도구 문제 |
|------------|------|-------------|
| **한옥 미니멀리즘** | 자연 소재, 부드러운 어스톤 | 서양 미니멀리즘으로 대체 |
| **뉴트로 (New + Retro)** | 80년대 한국 미학, 머스터드/틸 | 서양 빈티지로 대체 |
| **K-퀼크 캐릭터 문화** | 카카오프렌즈, 라인프렌즈 | 글로벌 훈련 데이터에 미반영 |
| **소프트 맥시멀리즘** | 소르벳 파스텔, 절충주의 | 서양 맥시멀리즘과 상이 |

### 5.2 한국 AI 디자인 도구

| 도구 | 특징 | 동질화 리스크 |
|------|------|-------------|
| **MiriCanvas** | 한국 템플릿, 명확한 폰트 라이선싱 | 낮음 (한국 맞춤) |
| **Kakao Karlo** | 한국어 최적화, 3억 이미지 훈련 | 낮음 |
| **v0/Bolt/Lovable** | 글로벌 도구 | 높음 (서양 기본값) |

**MiriCanvas 통계**:
- 사용자: 16억 명 (2025)
- AI 기능 사용자: 496만 명
- 매출: 780억 원 (2024)

### 5.3 한국 디자이너 커뮤니티 반응

**Interbrand Korea 사례**:
> "AI가 만든 '한국을 보여줘' 영상 — 시각적 품질은 높지만, 한국 관광공사 피드백: '이게 정말 한국을 대표할 수 있나? 동아시아 다른 나라 문화와 구분이 안 된다'"

**Toss 디자인팀 접근법**:
> "좋은 시스템은 AI가 상당히 유능한 결과를 내놓게 한다. 미래에는 인간이 시스템을 만들고, AI가 그 시스템을 사용해 제품을 만든다."

### 5.4 한국 브랜드 차별화 전략

**Plus X "프롬프트 디자이너" 역할**:
- 브랜드 철학 기반 AI 질문 설계
- 디자인 언어 일관성 보장
- AI 출력 품질 분석/개선

### 5.5 한국 타이포그래피 고려사항

| 폰트 회사 | 특징 |
|----------|------|
| **산돌** | 한국 #1, LG EI Headline (iF 어워드 2025) |
| **윤디자인** | Fonco Jockey — AI 폰트 검색 ("겨울에 맞는 폰트") |
| **Monotype** | 2025 타입 트렌드 리포트 한/영 동시 발행 |

### 5.6 한국 시장 통계

| 지표 | 수치 |
|------|------|
| AI 사용 인구 | 30.7% (2025 후반) |
| 6개월 성장률 | +4.8%p (세계 최고) |
| ChatGPT 구독 | 글로벌 2위 (미국 다음) |
| AI 투자 계획 | 715억 달러 (5개년) |

---

## 6. 방지 전략 종합

### 6.1 디자인 시스템 우선 접근법
```
1. Primitive Tokens 정의 (기본 색상, 간격, 폰트)
2. Semantic Tokens 생성 (primary-action, success-state)
3. JSON 형식으로 저장 (크로스 플랫폼)
4. AI 생성 파이프라인에 통합
```

### 6.2 Universal Anti-Pattern 프롬프트

**Constraint-Based**:
```
Prohibit purple, indigo, and blue-purple gradients.
Use earth tones: #78350F (brown), #D97706 (amber), #F5F5DC (cream).
```

**Negative Prompts**:
- "NO purple gradients"
- "Avoid default Tailwind colors"
- "No bg-indigo-* or bg-purple-* classes"

**Token Tables**:
```
Design Tokens:
--color-primary: #0891B2
--color-secondary: #64748B
--radius-default: 8px
```

### 6.3 품질 게이트 시스템

| 레벨 | 기준 | 검토 |
|------|------|------|
| 1 - 자동 | 기술 스펙 | AI 검증 |
| 2 - 빠른 | 브랜드 정렬 | 1명 휴먼 |
| 3 - 전체 | 전략적 중요도 | 팀 + 이해관계자 |

### 6.4 한국 시장 특화 전략

1. **한국 우선 도구 사용**: MiriCanvas, Karlo > v0/Bolt/Lovable
2. **타이포그래피 투자**: 한국 폰트가 핵심 차별화 요소
3. **"프롬프트 디자이너" 역할 도입**: Plus X 모델
4. **커스텀 디자인 시스템**: Toss 접근법
5. **문화적 QA**: AI 출력의 문화적 정확성 검증

---

## 7. 구현 계획

### Task 1: 분석 문서 작성
- **파일**: `documentation/guides/ai-design-homogenization-analysis.md`
- **내용**: 현상 분석, 기술적 원인, 통계 데이터, 한국 시장 맥락, 출처

### Task 2: 체크리스트 작성
- **파일**: `documentation/guides/anti-ai-slop-checklist.md`
- **내용**: 즉시/중기/장기 액션, 도구별 설정, 프롬프트 예시

### Task 3: Claude 규칙 추가
- **파일**: `.claude/rules/design-anti-homogenization.md`
- **내용**: 디자인 작업 시 자동 적용될 방지 규칙

### Task 4: 플레이북 작성
- **파일**: `documentation/guides/brand-differentiation-playbook.md`
- **내용**: 기업용 브랜드 차별화 전략, 도구별 우회 방법

---

## 8. 산출물 구조

```
documentation/guides/
├── ai-design-homogenization-analysis.md    # 현상 분석 (15,000자+)
├── anti-ai-slop-checklist.md               # 즉시 적용 체크리스트
└── brand-differentiation-playbook.md       # 브랜드 차별화 플레이북

.claude/rules/
└── design-anti-homogenization.md           # Claude 자동 적용 규칙
```

---

## 9. 검증 방법

```bash
# 문서 생성 확인
ls documentation/guides/ai-design-*.md
ls documentation/guides/anti-ai-slop-*.md
ls documentation/guides/brand-differentiation-*.md

# Claude 규칙 적용 확인
cat .claude/rules/design-anti-homogenization.md

# 규칙 자동 로드 테스트
# (디자인 관련 작업 시 규칙이 적용되는지 확인)
```

---

## 10. 핵심 인사이트 요약

1. **AI는 취향이 없다** — 통계적 상관관계만 있음
2. **피드백 루프가 문제를 악화** — AI 생성물이 훈련 데이터가 됨
3. **Model Collapse 진행 중** — 소수 디자인 패턴 소멸
4. **해결책은 "제약"** — AI에게 기본값 대신 명시적 규칙 제공
5. **Human-AI 협업** — 대체가 아닌 증강이 3배 효과적
6. **한국 시장 특수성** — 글로벌 도구는 문화적 뉘앙스 놓침
7. **한국 도구 우선** — MiriCanvas, Karlo가 한국 맥락에 적합

---

## 출처 요약

### 학술 논문
- CHI 2024: AI 이미지 생성기의 디자인 고착 효과
- Nature: 재귀적 AI 훈련 시 모델 붕괴
- arXiv: LLM의 인지적 다양성 동질화 효과

### 산업 분석
- prg.sh: 왜 AI는 같은 보라색 그라데이션 웹사이트를 만드는가
- Medium: The Purple Problem
- DEV Community: 100개 Vibe-Coded 웹사이트 분석

### 도구 문서
- v0 Design Systems Documentation
- Bolt.new Prompting Tips
- Lovable Custom Knowledge Documentation
- Cursor Directory Rules for Design
- Figma Make Guidelines

### 한국 시장
- Magazine Hankyung: AI와 디자인 혁신
- Toss Tech: AI 시대의 디자이너
- Unicorn Factory: MiriCanvas 글로벌 론칭
- Korea Herald: AI 채택률

---

## Phase 1 완료 (문서 작성)

- [x] Task 1: 분석 문서 (26.5KB)
- [x] Task 2: 체크리스트 (11.2KB)
- [x] Task 3: Claude 규칙 (6.0KB)
- [x] Task 4: 플레이북 (26.2KB)

---

## Phase 2: 자동화 시스템 구축 (NEW)

### 목표
문서화된 규칙을 **실제 코드 레벨에서 강제**하는 자동화 시스템 구축

### Task 5: Design Tokens 중앙 관리 시스템

**파일 구조**:
```
design-system/
├── tokens.json              # 중앙 토큰 정의
├── prohibited-patterns.json # 금지 패턴 목록
├── converters/
│   ├── to-tailwind.js       # → tailwind.config.js
│   ├── to-css-vars.js       # → CSS 변수
│   └── to-v0-theme.js       # → v0 테마 형식
└── README.md                # 사용 가이드
```

**tokens.json 구조**:
- color.primitive: 기본 색상값
- color.semantic: 의미론적 색상
- color.prohibited: 금지 색상 목록
- spacing, radius, typography

### Task 6: 금지 패턴 Lint 스크립트

**파일**: `design-system/lint-design.js`

**검사 대상**:
- CSS 파일: 금지 색상 HEX 코드
- Tailwind 클래스: bg-indigo-*, bg-purple-*, bg-violet-*
- 글래스모피즘: backdrop-blur 과다 사용
- Inter 폰트 단독 사용

**출력 형식**:
```
[ERROR] src/components/Button.tsx:15
  └─ 금지 패턴: bg-indigo-500
  └─ 대안: bg-teal-600 (--color-primary)
```

### Task 7: Pre-commit Hook

**파일**: `.husky/pre-commit` 또는 `hooks/pre-commit`

**동작**:
1. 스테이징된 파일 중 CSS/TSX/JSX 필터
2. lint-design.js 실행
3. 금지 패턴 발견 시 커밋 차단
4. 대안 제시 후 수정 유도

### Task 8: Claude Hook 통합

**파일**: `.claude-hooks.json` 수정

**동작**:
1. `PostToolResult` 훅: Edit/Write 후 자동 검사
2. 금지 패턴 생성 시 경고 + 대안 제시
3. 디자인 관련 파일만 대상

---

## Phase 2 산출물 구조

```
design-system/
├── tokens.json
├── prohibited-patterns.json
├── lint-design.js
├── converters/
│   ├── to-tailwind.js
│   ├── to-css-vars.js
│   └── to-v0-theme.js
└── README.md

.husky/
└── pre-commit              # Git hook

.claude-hooks.json          # 수정 (design-lint 추가)
```

---

## Phase 2 검증 방법

```bash
# 1. Lint 스크립트 테스트
node design-system/lint-design.js test/sample-with-purple.css
# 예상: 금지 패턴 감지 + 대안 출력

# 2. Pre-commit Hook 테스트
echo "bg-indigo-500" > test.css && git add test.css && git commit -m "test"
# 예상: 커밋 차단

# 3. 토큰 변환 테스트
node design-system/converters/to-tailwind.js
# 예상: tailwind.config.js 생성
```

---

**플랜 상태**: Phase 2 완료, Phase 3 추가

---

## Phase 3: 이모지 동질화 패턴 추가 (NEW)

### 연구 결과 요약

**핵심 발견**: 이모지 과다 사용은 AI 생성 콘텐츠의 주요 탐지 지표 중 하나

#### 통계적 증거 (Washington Post 연구, 2025)

| 지표 | 데이터 | 출처 |
|------|--------|------|
| ChatGPT 이모지 사용률 | **70%** 메시지에 이모지 포함 | Washington Post |
| ✅ 체크마크 사용 빈도 | 인간보다 **11배** 더 자주 사용 | Washington Post |
| 분석 데이터 규모 | 328,744개 메시지 (gpt-4o) | May 2024 - July 2025 |

#### AI가 선호하는 이모지 패턴

| 카테고리 | 이모지 | 맥락 |
|----------|--------|------|
| **확인/완료** | ✅ ☑️ ✔️ | 불릿 포인트 대체, 목록 항목 |
| **강조/흥분** | 🔥 💡 🚀 🎉 ✨ | 제목, 핵심 포인트 |
| **지능/분석** | 🧠 💭 🤔 | 설명, 분석 섹션 |
| **긍정/격려** | 😊 🙌 👍 💪 | 결론, 마무리 |

#### Wikipedia "AI 글쓰기 징후" 가이드 포함 항목

- 섹션 헤딩에 이모지 장식
- 불릿 포인트를 이모지로 대체
- 톡페이지 댓글에서 특히 두드러짐
- "zhuzhed up by emoji" (이모지로 치장된) 패턴

#### 사용자 불만 (OpenAI Community)

> "🔥💡✅🚀🎉 같은 불필요하고 유치한 이모지의 최근 범람이 극도로 산만하고 좌절감을 준다. 대화가 5-10세 수준으로 격하된 느낌."

#### OpenAI의 대응 (2025.12)

- ChatGPT 설정에 "이모지 사용량" 조절 옵션 추가
- More / Default / Less 선택 가능
- Personalization 메뉴에서 설정

---

### 3.1 이모지 동질화 패턴 분류

#### A. 구조적 패턴 (Structural)

| 패턴 | 예시 | 문제점 |
|------|------|--------|
| **이모지 불릿** | ✅ 항목1 ✅ 항목2 | 이메일/문서에서 부자연스러움 |
| **제목 장식** | 🚀 시작하기 | 과도한 시각적 자극 |
| **섹션 구분** | 📋 개요 / 💡 팁 | 일관성 없는 사용 |

#### B. 감정적 패턴 (Emotional)

| 패턴 | 예시 | 문제점 |
|------|------|--------|
| **과잉 긍정** | Let's do this! ✨ | 공허한 열정 |
| **가짜 친근함** | 도움이 되었으면 해요 😊 | 비개인적 |
| **동기부여 클리셰** | You've got this! 💪🔥 | 진정성 부족 |

#### C. 반복 패턴 (Repetitive)

| 패턴 | 예시 | 탐지 방법 |
|------|------|----------|
| **동일 이모지 연속** | ✅✅✅ | 3개 이상 연속 |
| **모든 항목 동일** | 모든 불릿에 ✅ | 다양성 부족 |
| **클로징 고정** | 모든 응답 끝에 ✨ | 패턴 반복 |

---

### 3.2 구현 계획

#### Task 9: 이모지 패턴 금지 목록 추가

**파일**: `design-system/prohibited-patterns.json` 수정

```json
{
  "emoji": {
    "structural": {
      "description": "구조적 이모지 패턴",
      "patterns": [
        "^[✅☑️✔️🔲] ",           // 이모지 불릿
        "^[🚀💡🔥✨📋🎯] [A-Z]",  // 제목 장식
        "[✅🔥💡🚀🎉✨]{3,}"       // 3개 이상 연속
      ],
      "severity": "warning"
    },
    "overuse": {
      "description": "이모지 과다 사용",
      "threshold": {
        "perParagraph": 3,
        "perDocument": 10,
        "consecutiveLimit": 2
      },
      "severity": "warning"
    },
    "prohibited": {
      "description": "전문 문서에서 금지",
      "contexts": ["email", "report", "documentation"],
      "patterns": ["😊", "🙌", "💪", "🎉"],
      "severity": "error"
    }
  }
}
```

#### Task 10: lint-design.js에 이모지 검사 추가

**추가 기능**:
1. 이모지 밀도 계산 (이모지 수 / 단어 수)
2. 연속 이모지 감지
3. 불릿 포인트 이모지 패턴 감지
4. 문서 타입별 임계값 적용

**출력 예시**:
```
[WARN] content/blog-post.md:15
  Pattern: ✅ 이모지 불릿 패턴
  Message: AI 동질화 패턴 감지 - 이모지를 불릿으로 사용
  Alternative: 일반 불릿 (-, *, 1.) 사용 권장

[WARN] content/blog-post.md
  Pattern: 이모지 과다 사용
  Message: 문서 내 이모지 15개 (임계값: 10)
  Density: 3.2% (권장: 1% 미만)
```

#### Task 11: Claude 규칙 업데이트

**파일**: `.claude/rules/design-anti-homogenization.md` 수정

추가 섹션:
```markdown
## [EMOJI] 이모지 사용 규칙 (CRITICAL)

### 금지 패턴
- 이모지를 불릿 포인트로 사용 금지 (✅ 항목 형식)
- 제목에 이모지 장식 금지 (🚀 Getting Started)
- 3개 이상 연속 이모지 금지
- 전문 문서에서 감정 이모지 금지 (😊 🙌 💪)

### 허용 조건
- 사용자가 명시적으로 이모지 사용 요청
- 마케팅/SNS 콘텐츠 (명시된 경우)
- 코드 내 주석이 아닌 UI 텍스트

### 대안 제시
| 금지 | 대안 |
|------|------|
| ✅ 완료 | - 완료 (불릿) |
| 🚀 시작 | ## 시작하기 (헤딩) |
| Let's go! 🔥 | 시작합니다. |
```

#### Task 12: 분석 문서 업데이트

**파일**: `documentation/guides/ai-design-homogenization-analysis.md` 수정

추가 섹션: "이모지 동질화 패턴" (2,000자+)
- 통계적 증거
- 패턴 분류
- 탐지 방법
- 출처

---

### 3.3 검증 방법

```bash
# 1. 이모지 패턴 테스트 파일 생성
cat > test/sample-with-emoji.md << 'EOF'
# 🚀 프로젝트 시작하기

✅ 환경 설정
✅ 의존성 설치
✅ 테스트 실행

시작해봅시다! 🔥🔥🔥

도움이 되었으면 해요 😊
EOF

# 2. Lint 실행
node design-system/lint-design.js test/sample-with-emoji.md
# 예상: 이모지 패턴 경고 3개+

# 3. 정상 파일 테스트
cat > test/sample-clean-emoji.md << 'EOF'
# 프로젝트 시작하기

- 환경 설정
- 의존성 설치
- 테스트 실행

시작합니다.
EOF

node design-system/lint-design.js test/sample-clean-emoji.md
# 예상: 경고 없음
```

---

### 3.4 출처

| 출처 | 내용 | 링크 |
|------|------|------|
| Washington Post | ChatGPT 이모지 사용 통계 | [Link](https://www.washingtonpost.com/technology/interactive/2025/how-detect-chatgpt-em-dash/) |
| RTE Brainstorm | AI 텍스트 탐지 방법 | [Link](https://www.rte.ie/brainstorm/2025/1128/1545935-chatgpt-ai-writing-text-detection-words-phrases-emojis/) |
| Wikipedia | AI 글쓰기 징후 | [Link](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing) |
| Stack Overflow | The AI Ick | [Link](https://stackoverflow.blog/2025/12/23/the-ai-ick) |
| OpenAI Community | 이모지 과다 사용 불만 | [Link](https://community.openai.com/t/excessive-emoji-tsunami-in-chatgpt-conversations/1112668) |
| The Field Guide to AI Slop | AI Slop 패턴 분석 | [Link](https://www.ignorance.ai/p/the-field-guide-to-ai-slop) |

---

## Phase 3 요약

| Task | 파일 | 내용 |
|------|------|------|
| Task 9 | `prohibited-patterns.json` | 이모지 금지 패턴 추가 |
| Task 10 | `lint-design.js` | 이모지 검사 기능 추가 |
| Task 11 | `design-anti-homogenization.md` | Claude 규칙 업데이트 |
| Task 12 | `ai-design-homogenization-analysis.md` | 분석 문서 업데이트 |

---

**플랜 상태**: Phase 3 확정
**실행 준비 완료**
