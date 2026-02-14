# 학술 논문 작성 워크플로우 (Academic Paper Workflow)

## 개요
3개 AI 보안 논문 작성 경험(2025-12-18)을 기반으로 체계화된 학술 논문 작성 프로세스.

---

## 1. 연구 설계 단계 (Research Design)

### 1.1 주제 선정
```yaml
Tools: [firecrawl_search, paper-search-mcp, one_search]
Actions:
  - 최신 동향 조사 (최근 2년 논문)
  - 기존 연구 갭 분석
  - 기여점(Contribution) 명확화
Output: 연구 주제 및 범위 정의서
```

**검색 쿼리 예시:**
```
"[Topic] survey 2024 2025"
"[Topic] state of the art"
"[Topic] open problems challenges"
```

### 1.2 문헌 조사
```yaml
Tools: [paper-search-mcp, search_arxiv, search_semantic]
Actions:
  - 핵심 논문 50+ 수집
  - 인용 관계 분석
  - BibTeX 자동 생성
Output: references.bib (정리된 참고문헌)
```

**논문 검색 소스:**
| 소스 | 용도 | 도구 |
|------|------|------|
| arXiv | 최신 프리프린트 | search_arxiv |
| Semantic Scholar | 인용 분석 | search_semantic |
| Google Scholar | 광범위 검색 | search_google_scholar |
| ACM/IEEE | 학회 논문 | search_crossref |

### 1.3 연구 프레임워크 설계
```yaml
Actions:
  - 연구 질문(RQ) 3-5개 정의
  - 방법론 선택 (Survey/Empirical/Framework)
  - 평가 기준 설정
Output: 연구 설계 문서
```

---

## 2. 논문 구조 설계 (Paper Structure)

### 2.1 표준 구조 (IEEEtran 기준)
```
paper/
├── main.tex              # 메인 파일
├── references.bib        # BibTeX 참고문헌
├── sections/
│   ├── 00-abstract.tex   # 초록 (150-250 words)
│   ├── 01-introduction.tex   # 서론 + 기여점
│   ├── 02-background.tex     # 배경/관련연구
│   ├── 03-methodology.tex    # 방법론/분류체계
│   ├── 04-analysis.tex       # 분석/결과
│   ├── 05-discussion.tex     # 논의
│   ├── 06-related-work.tex   # 관련 연구
│   └── 07-conclusion.tex     # 결론
├── tables/
│   └── *.tex             # 테이블 분리
└── figures/
    └── *.pdf/*.png       # 그림 파일
```

### 2.2 다국어 지원 구조
```
sections/       # 영문 (Primary)
sections-ko/    # 한국어 (번역)

# 동기화 규칙:
# - 영문 수정 → 한국어 동기화
# - 섹션 번호/구조 일치 유지
```

### 2.3 섹션별 가이드라인

| 섹션 | 분량 | 핵심 내용 |
|------|------|----------|
| Abstract | 150-250 words | 문제, 방법, 결과, 의의 |
| Introduction | 1-2 pages | RQ, 기여점(3-5개), 논문 구조 |
| Background | 1-2 pages | 필수 개념, 프레임워크 |
| Methodology | 2-3 pages | 접근법, 분류체계, 평가방법 |
| Analysis | 3-5 pages | 핵심 발견, 테이블, 데이터 |
| Discussion | 1-2 pages | 시사점, 한계, 미래 연구 |
| Conclusion | 0.5-1 page | 요약, 핵심 메시지 |

---

## 3. 콘텐츠 작성 (Content Writing)

### 3.1 정량적 주장 규칙
```latex
% [!] 모든 수치에 출처 필수
% BAD - 출처 없음
The attack success rate is 87%.

% GOOD - 인용 명시
The attack success rate reaches 87%~\cite{source2024}.

% GOOD - 자체 분석 명시
Our analysis shows 87% success rate\footnote{
  Derived from HackAPrompt dataset analysis of 600K samples.
}.
```

### 3.2 인용 규칙
```yaml
금지사항:
  - 2차 인용 (as cited in...)
  - 미확인 논문 인용
  - 수치 오인용

필수사항:
  - 원본 논문 직접 확인
  - BibTeX 정확성 검증
  - 인용 맥락 정확성
```

### 3.3 테이블 작성 규칙
```yaml
원칙:
  - 원본 데이터만 사용
  - 테스트 안 된 항목 추가 금지
  - 원본에 없는 컬럼 추가 시 명시

검증방법:
  - 원본 논문 테이블 직접 비교
  - 수치 일치 확인
  - 모델명/버전 정확성 확인
```

---

## 4. 검증 단계 (Verification)

### 4.1 자체 검증 (academic-paper-verifier 스킬)
```yaml
Trigger: "논문 검증", "paper verification"
Workflow:
  1. 검증 대상 식별 (Grep: \d+%, \cite{})
  2. 딥리서치 검증 (firecrawl_search, paper-search-mcp)
  3. 원본 대조 (firecrawl_scrape, WebFetch)
  4. 심층 분석 (sequential_thinking)
  5. 보고서 생성
```

### 4.2 교차 검증 체크리스트
- [ ] Abstract ↔ Introduction 일치
- [ ] Introduction ↔ Conclusion 일치
- [ ] 수치 중복 언급 일관성
- [ ] 공격 벡터/위협 수 일관성
- [ ] 테이블 캡션과 내용 일치
- [ ] 그림 참조 정확성

### 4.3 검증 실패 시 조치
```yaml
Critical (핵심 주장 문제):
  - 즉시 삭제 또는 출처 추가

High (중요 수치 문제):
  - 방법론 각주 추가 또는 삭제

Medium (부수적 정보):
  - 수정 또는 보완

Low (형식적 오류):
  - 단순 수정
```

---

## 5. 최종 점검 (Final Review)

### 5.1 LaTeX 빌드 검증
```bash
# 빌드 순서
pdflatex main.tex
bibtex main
pdflatex main.tex
pdflatex main.tex

# 경고 확인
grep -i "warning\|error" main.log
```

### 5.2 제출 전 체크리스트
- [ ] 모든 검증 항목 통과 (100%)
- [ ] 페이지 제한 준수
- [ ] 익명화 완료 (필요시)
- [ ] 참고문헌 형식 일관성
- [ ] 그림/테이블 해상도 충분
- [ ] 저작권 준수 확인

### 5.3 최종 검토 도구
```yaml
Grammar: Grammarly, LanguageTool
Style: write-good, proselint
LaTeX: ChkTeX, lacheck
References: biber --validate
```

---

## 6. 워크플로우 다이어그램

```
[주제 선정] → [문헌 조사] → [구조 설계]
     ↓              ↓            ↓
[RQ 정의] ← [갭 분석] ← [핵심 논문]
     ↓
[콘텐츠 작성] → [자체 검증] → [수정]
     ↓              ↓           ↑
[교차 검증] ← [검증 실패] ──────┘
     ↓
[최종 점검] → [LaTeX 빌드] → [제출]
```

---

## 7. 도구 체이닝 패턴

### 7.1 문헌 조사 체인
```
search_arxiv("[topic]")
  → search_semantic("[key paper]")
  → download_arxiv("[paper_id]")
  → read_arxiv_paper("[paper_id]")
```

### 7.2 검증 체인
```
Grep("\\d+%", "sections/")
  → firecrawl_search("[claim] source")
  → firecrawl_scrape("[source_url]")
  → sequential_thinking("[analysis]")
```

### 7.3 수정 체인
```
Read("[file.tex]")
  → Edit("[old]", "[new]")
  → Grep("[pattern]", ".") # 일관성 확인
```

---

## 버전 히스토리
- v1.0.0 (2025-12-18): 초기 버전 - 3개 AI 보안 논문 경험 기반
