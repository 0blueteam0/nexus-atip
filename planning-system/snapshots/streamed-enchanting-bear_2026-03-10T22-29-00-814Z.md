# Plan: 법학 학술지 양식 DOCX 빌드 패키지

## Context

기존 공학 학술지 양식(build_docx_v10.py, B5, 1.1) 번호체계)과 별도로,
**법학 학술지 양식** DOCX 빌더를 신규 생성한다.

법학과 공학 논문은 양식이 근본적으로 다르므로 별도 빌드 스크립트가 필요:

| 항목 | 공학 학술지 (현재) | 법학 학술지 (신규) |
|------|-------------------|-------------------|
| 용지 | B5 (176x250mm) | A4 (210x297mm) |
| 번호체계 | 1. -> 1.1) -> | I. -> 1. -> 가. -> (1) -> (가) |
| 인용방식 | 본문 번호 + 참고문헌 | 각주(footnote) 전면 사용 |
| 법률인용 | 약식 | 정식: "인공지능 기본법 제31조 제1항" |
| 줄간격 | 1.5배 (18.5pt) | 160% (= 1.6배) |
| 본문폰트 | UnBatang 10pt | 바탕(Batang) 11pt |
| 각주폰트 | UnBatang 8pt | 바탕 9pt |
| 여백 | 27/20/27/25mm | 30/30/30/30mm |
| 초록 | 한/영 분리 | 국문초록+영문초록 연속 |
| 참고문헌 | 단일 목록 | 국내/국외 분리, 법령 별도 |
| 표 스타일 | booktabs (수평선만) | booktabs 유지 (학술 표준) |

---

## 생성/수정 파일 (2개 신규 + 2개 수정)

| # | 파일 | 설명 | 예상 라인 |
|---|------|------|----------|
| 1 | `build_legal_journal_docx.py` | 법학 학술지 양식 DOCX 빌더 | ~800 |
| 2 | `.claude/skills/legal-journal-builder/SKILL.md` | 스킬 등록 | ~60 |
| 수정 | `governance_mapper.py` | `build-legal` 서브커맨드 추가 | +10줄 |
| 수정 | `.claude/CLAUDE.md` | 스킬 트리거 등록 | +4줄 |

---

## Phase 1: build_legal_journal_docx.py

### 데이터 소스
- `governance_mapping_db.json` (Single Source of Truth)
- 기존 build_docx_v10.py, build_supplementary_docx_v2.py에서 헬퍼 패턴 재사용

### 법학 학술지 양식 상수

```python
# -- 법학 학술지 스타일 --
FONT_KO = 'Batang'              # 바탕 (법학 표준)
FONT_LATIN = 'Times New Roman'
FONT_SIZE_BODY = Pt(11)         # 본문 11pt
FONT_SIZE_FN = Pt(9)            # 각주 9pt
FONT_SIZE_TABLE = Pt(9)         # 표 9pt
FONT_SIZE_TITLE = Pt(16)
FONT_SIZE_H1 = Pt(14)           # I. 제목
FONT_SIZE_H2 = Pt(12)           # 1. 소제목
FONT_SIZE_H3 = Pt(11)           # 가. 항목
LINE_SPACING_PERCENT = 160       # 줄간격 160%
PAGE = A4 (210x297mm)
MARGINS = 30mm all sides
```

### 번호체계 (법학 학술지 표준)

```
I. 서론                          ← 로마자 대문자 (Level 1)
  1. 연구의 배경                   ← 아라비아 숫자 (Level 2)
    가. 세부항목                   ← 가나다 (Level 3)
      (1) 상세                    ← 괄호 숫자 (Level 4)
        (가) 최하위                ← 괄호 가나다 (Level 5)
```

### 법률 인용 각주 형식

```
1) 인공지능 기본법(법률 제20676호, 2026. 1. 22. 시행) 제31조 제1항.
2) Regulation (EU) 2024/1689 of the European Parliament, Art. 15.
3) 양수열, "AI 규제 프레임워크 비교 연구", 법학연구 제25권 제3호, 2025, 45면.
```

### 문서 구조 (법학 학술지 형식)

```
[표지]
  - 제목 (한글 + 영문)
  - 저자, 소속
  - 국문초록 + 주제어
  - 영문초록 + Keywords

[본문]
  I.  서론
      1. 연구의 배경 및 목적
      2. 연구의 범위 및 방법

  II. LLM 보안위협 분류 체계
      1. OWASP LLM Top 10
      2. OWASP Agentic AI Top 10
      3. CWE/MITRE ATLAS 교차 참조

  III. AI 거버넌스 프레임워크 현황
      1. EU AI Act
      2. 인공지능 기본법
      3. 보조 프레임워크 (GDPR, NIST, ISO)

  IV. 3축 매핑 평가 방법론
      1. 평가 축 정의
      2. 채점 기준
      3. 판정 기준

  V.  매핑 평가 결과 분석
      1. EU AI Act 매핑 결과
        가. LLM Top 10
        나. Agentic AI Top 10
      2. 인공지능기본법 매핑 결과
        가. LLM Top 10
        나. Agentic AI Top 10
      3. 규제 갭 분석

  VI. 교차 검증 및 일관성
      1. 프레임워크 간 교차 검증
      2. 통계적 일관성 검증

  VII. 결론
      1. 연구 결과 요약
      2. 법적·정책적 시사점
      3. 향후 연구 과제

[참고문헌]
  1. 국내 문헌
  2. 국외 문헌
  3. 법령 및 고시
  4. 온라인 자료
```

### 재사용 패턴 (기존 코드에서)

| 기능 | 소스 파일 | 함수/패턴 |
|------|----------|----------|
| 각주 시스템 | `build_docx_v10.py:53-151` | `_ensure_footnotes_part()`, `add_footnote()` |
| 폰트 설정 | `build_supplementary_docx_v2.py:77-100` | `set_run_font()` |
| booktabs 테이블 | `build_supplementary_docx_v2.py` | `add_booktabs_table()` |
| 셀 보더/쉐이딩 | `build_supplementary_docx_v2.py` | `set_cell_border()`, `set_cell_shading()` |
| 폰트 임베딩 | `build_supplementary_docx_v2.py` | `embed_fonts()` |
| verdict 색상코딩 | 두 파일 모두 | COLOR_GREEN/ORANGE/RED |

### 핵심 차이 구현

1. **번호체계**: `LEGAL_NUMBERING` dict로 레벨별 접두사 생성
   ```python
   ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']
   KOREAN_GA = ['가', '나', '다', '라', '마', '바', '사']
   ```

2. **각주 인용**: `add_legal_footnote(paragraph, ref_type, ref_data)`
   - ref_type: 'law_kr', 'law_eu', 'article', 'standard'
   - 법률별 정식 인용문구 자동 생성

3. **참고문헌 분리**: `build_references_section(doc, db)`
   - 국내문헌, 국외문헌, 법령, 온라인자료 4분류

4. **줄간격**: `WD_LINE_SPACING.MULTIPLE` + `Pt(11 * 1.6)` 대신 `line_spacing_rule` 사용

---

## Phase 2: governance_mapper.py 수정

`build-legal` 서브커맨드 추가:

```python
# 기존 build-docx 옆에 추가
sub_build_legal = subparsers.add_parser('build-legal', help='Build legal journal format DOCX')
sub_build_legal.add_argument('--output', '-o', default=None)
sub_build_legal.set_defaults(func=cmd_build_legal)

def cmd_build_legal(args, db):
    from build_legal_journal_docx import build_legal_journal
    output = args.output or 'legal-journal-output.docx'
    build_legal_journal(db, output)
```

---

## Phase 3: 스킬 등록

### `.claude/skills/legal-journal-builder/SKILL.md`

```yaml
name: legal-journal-builder
triggers:
  - "법학 학술지"
  - "법학 양식"
  - "legal journal"
  - "법학 논문 빌드"
  - "legal format build"
tools: Bash, Read, Write, Edit
```

### `.claude/CLAUDE.md` 수정

기존 6종 -> 7종 스킬로 업데이트, legal-journal-builder 항목 추가.

---

## 실행 순서

1. `build_legal_journal_docx.py` 생성 (~800줄)
2. `governance_mapper.py`에 `build-legal` 서브커맨드 추가
3. `.claude/skills/legal-journal-builder/SKILL.md` 생성
4. `.claude/CLAUDE.md` 스킬 등록 업데이트

## 검증

```bash
# 구문 검증
python -m py_compile build_legal_journal_docx.py

# 빌드 테스트
python build_legal_journal_docx.py --output test-legal-output.docx

# CLI 경유 테스트
python governance_mapper.py build-legal --output test-legal-output.docx

# 생성 파일 확인
ls -la test-legal-output.docx
```
