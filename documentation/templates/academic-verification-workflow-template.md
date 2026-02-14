# 학술 논문 검증 워크플로우 템플릿 (Academic Paper Verification Workflow Template)

> **용도**: 학술 논문 검증 시 참고용 제네릭 워크플로우
> **버전**: v1.0.0 (2025-12-18)
> **기반**: 실제 AI 보안 논문 검증 경험에서 추출

---

## 1. 5단계 검증 워크플로우 (Core Workflow)

### Step 1: 검증 대상 식별 (Claim Extraction)
```yaml
Tools: [Read, Grep]
Action: 논문에서 검증 필요 항목 추출
Target:
  - 정량적 주장 (%, 배수, 수치)
  - 인용 문헌 참조 (\cite{})
  - 데이터 테이블
  - 프레임워크/표준 참조
Output: 검증 체크리스트
```

**실행 패턴:**
```bash
# 수치 패턴 검색
Grep "\\d+%" sections/
Grep "\\d+\\.\\d+x" sections/

# 인용 추출
Grep "\\cite{" sections/
```

### Step 2: 딥리서치 검증 (Deep Research Verification)
```yaml
Tools: [firecrawl_search, one_search, paper-search-mcp]
Action: 각 주장에 대해 원본 출처 검색
Output: 검증 결과 매핑
```

### Step 3: 원본 대조 (Source Comparison)
```yaml
Tools: [firecrawl_scrape, WebFetch]
Action: 원본 문서와 논문 내용 직접 비교
Check:
  - 수치 일치 여부
  - 맥락 정확성
  - 인용 범위 적절성
Output: 불일치 목록
```

### Step 4: 심층 분석 (Sequential Analysis)
```yaml
Tools: [sequential_thinking]
Action: 검증 결과 종합 분석
Analysis:
  - 조작/오류 vs 단순 실수 판별
  - 심각도 평가
  - 수정 방안 도출
Output: 분석 보고서
```

### Step 5: 검증 보고서 생성 (Report Generation)
```yaml
Action: 최종 검증 보고서 작성
Format: 아래 출력 형식 참조
Output: verification-report.md
```

---

## 2. 심각도 기준 (Severity Criteria)

| 등급 | 기준 | 예시 | 조치 |
|------|------|------|------|
| **Critical** | 핵심 주장 근거 부재/조작 | 테스트 안 된 데이터 추가, 명백한 오인용 | 즉시 삭제 |
| **High** | 중요 수치 출처 불명 | 통계 데이터 출처 없음 | 출처 추가 또는 삭제 |
| **Medium** | 부수적 정보 불일치 | 버전 번호 차이, 명명 규칙 불일치 | 수정 |
| **Low** | 형식적 오류 | 연도 오타, 오탈자 | 수정 |

---

## 3. 검증 쿼리 템플릿 (Query Templates)

### 3.1 데이터셋 검증
```
"[Dataset Name] dataset official source download"
"[Dataset Name] [Author] [Year] dataset"
"[Dataset Name] benchmark official"
```

### 3.2 논문 인용 검증
```
"[Paper Title] [Venue] [Year] PDF"
"[First Author] [Short Title] [Year]"
"[Paper Title] original paper"
```

### 3.3 프레임워크/표준 검증
```
"[Framework Name] official documentation [Year]"
"[Standard Name] official release version"
"OWASP [Project Name] official"
"MITRE [Framework] latest version"
"[Organization] [Framework] official URL"
```

### 3.4 통계 수치 검증
```
"[Claim]% [Context] source study"
"[Metric] benchmark results [Year]"
"[Statistic] methodology original"
```

---

## 4. 흔한 오류 유형 (Common Error Patterns)

| 오류 유형 | 탐지 방법 | 검증 쿼리 | 조치 |
|----------|----------|----------|------|
| 수치 오인용 | 원본 논문 직접 확인 | "[Author] [Paper] Table [N]" | 삭제 또는 수정 |
| 테스트 안 된 항목 추가 | 원본 실험 섹션 확인 | "[Paper] experiments models tested" | 삭제 |
| 드래프트 vs 공식 버전 | 공식 URL 확인 | "[Framework] official release [Year]" | 최신 버전으로 수정 |
| 출처 없는 통계 | 방법론 섹션 유무 확인 | Grep: "methodology" | 방법론 추가 또는 삭제 |
| 내부 불일치 | Grep 전체 검색 | "[수치] OR [대체 수치]" | 통일 |
| 2차 인용 | "as cited in" 패턴 검색 | 원본 직접 확인 | 원본으로 교체 |
| BibTeX 연도 오류 | 원본 출판 정보 확인 | "[Paper] [Venue] publication date" | 수정 |

---

## 5. 검증 보고서 출력 형식 (Report Format)

```markdown
# 논문 검증 보고서: [논문 제목]

## 검증 요약
| # | 검증 대상 | 결과 | 상태 |
|---|----------|------|------|
| 1 | [항목] | [검증됨/조작됨/오류] | [OK/FAIL] |

## 검증 성공률: X/Y (Z%)

## 심각한 문제 (Critical/High Issues)
### 문제 N: [제목]
- **위치**: [파일:라인]
- **현재 내용**: [인용]
- **원본 확인**: [검증 결과]
- **심각도**: [Critical/High/Medium/Low]
- **권장 조치**: [수정 방안]

## 수정 권장 사항
### 즉시 삭제 권장 (Must Remove)
1. [항목] - 이유: [근거]

### 수정/보완 필요 (Must Fix)
1. [항목] - 방안: [구체적 수정 방법]

### 방법론 추가 필요 (Add Methodology)
1. [항목] - 필요 내용: [상세]

## 수정 후 학술적 엄밀성 판단
| 논문 | 수정 전 | 수정 후 | 판단 |
|------|---------|---------|------|
| [논문명] | [위험/양호] | [충분/불충분] | [상세] |

### 최종 판단: [충분함/불충분함]
```

---

## 6. 검증 체크리스트 구조 (Checklist Structure)

### 6.1 정량적 주장 (Quantitative Claims)
- [ ] 모든 백분율(%)에 출처 있음
- [ ] 모든 배수(Nx)에 출처 있음
- [ ] 자체 분석 수치에 방법론 명시

### 6.2 데이터 테이블 (Data Tables)
- [ ] 원본 논문과 수치 일치
- [ ] 테스트된 항목만 포함
- [ ] 추가 컬럼에 출처/방법론 명시

### 6.3 인용 (Citations)
- [ ] 원본 논문 직접 확인
- [ ] BibTeX 메타데이터 정확 (연도, 학회, 저자)
- [ ] 인용 맥락이 원본 의도와 일치

### 6.4 프레임워크/표준 참조 (Framework References)
- [ ] 버전 번호 정확
- [ ] 공식 명명 규칙 준수
- [ ] 공식 URL 유효

### 6.5 내부 일관성 (Internal Consistency)
- [ ] Abstract ↔ Introduction ↔ Conclusion 일치
- [ ] 수치 중복 언급 일관성
- [ ] 용어 일관성

---

## 7. 도구 체이닝 패턴 (Tool Chaining)

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

## 8. 적용 예시 (Application Examples)

### 예시 1: 정량적 주장 검증
```
발견: "공격 성공률 87%"
→ Step 1: Grep "87%" sections/
→ Step 2: firecrawl_search "87% attack success rate [cited paper]"
→ Step 3: 원본 논문에서 수치 직접 확인
→ Step 4: 일치 여부 판단
→ Step 5: 불일치 시 삭제 또는 수정 권장
```

### 예시 2: 데이터 테이블 검증
```
발견: 비교 테이블에 여러 모델 포함
→ Step 1: 테이블 캡션에서 출처 확인
→ Step 2: 원본 논문 검색
→ Step 3: 원본 테이블과 셀 단위 비교
→ Step 4: 테스트되지 않은 모델 추가 여부 확인
→ Step 5: 조작 발견 시 원본 데이터로 교체 권장
```

---

## 버전 히스토리
- v1.0.0 (2025-12-18): 초기 버전 - AI 보안 논문 검증 경험에서 추출
