# 학술 논문 작성 가이드라인 (Academic Writing Guidelines)

## 핵심 원칙: 학술적 엄밀성 (Academic Rigor)

> **"모든 주장은 검증 가능해야 하며, 모든 수치는 출처가 있어야 한다."**

3개 AI 보안 논문 검증 경험(2025-12-18)에서 도출된 실전 가이드라인.

---

## 1. 출처 명시 규칙 (Citation Rules)

### 1.1 정량적 주장

#### [!] 필수: 모든 수치에 출처
```latex
% ❌ BAD - 출처 없는 수치
RAG systems show 3.2x higher incident rates.
The attack success rate is 87%.

% ✅ GOOD - 출처 명시
RAG systems show 3.2x higher incident rates~\cite{source2024}.

% ✅ GOOD - 자체 분석 명시
Our analysis of 600K samples shows 87\% success rate\footnote{
  Methodology: We systematically analyzed the HackAPrompt dataset,
  categorizing 600,000+ adversarial prompts by attack sophistication.
}.
```

#### 자체 분석 수치 표기법
```latex
% 방법론 섹션 필요
\subsection{Analysis Methodology}
We derived our metrics from systematic analysis of [Dataset]
using the following criteria: [상세 기술]

% 본문에서 참조
As shown in our analysis (Section~\ref{sec:methodology}),
the success rate varies from 12\% to 89\% depending on...
```

### 1.2 간접 인용 금지

```latex
% ❌ BAD - 2차 인용
Greshake~\cite{greshake2023} reports 87\% success rate
(as cited in Smith~\cite{smith2024}).

% ✅ GOOD - 직접 확인 후 인용
According to our review of Greshake et al.~\cite{greshake2023},
the study demonstrates indirect prompt injection vulnerabilities
in LLM-integrated applications.

% ✅ GOOD - 확인 불가 시 솔직히 기술
While some studies report high success rates for prompt injection
attacks, the original methodology varies significantly.
```

### 1.3 인용 정확성 체크리스트
- [ ] 원본 논문을 직접 읽었는가?
- [ ] 인용된 수치가 원본과 일치하는가?
- [ ] 인용 맥락이 원본 의도와 일치하는가?
- [ ] BibTeX 메타데이터가 정확한가? (연도, 학회, 저자)

---

## 2. 데이터 테이블 규칙 (Table Rules)

### 2.1 원본 데이터 정확성

#### [!] 절대 금지 사항
```yaml
금지:
  - 테스트되지 않은 모델 추가
  - 원본에 없는 수치 삽입
  - 임의의 Detection/Difficulty 컬럼 추가
  - 다른 논문 데이터 혼합
```

#### 실제 오류 사례 (2025-12-18 발견)
```latex
% ❌ 조작된 테이블 (실제 발견)
GPT-4 + Contriever & 5 & 88.7\% & Low \\
Claude-3 + BGE & 5 & 91.2\% & Low \\      % Claude-3: 테스트 안됨!
Llama-3 + E5 & 10 & 85.3\% & Medium \\    % Llama-3: 테스트 안됨!

% ✅ 원본 데이터 (PoisonedRAG USENIX 2025)
GPT-4 (Black-box) & Contriever & 97\% \\
GPT-4 (White-box) & Contriever & 99\% \\
GPT-3.5 (Black-box) & Contriever & 92\% \\
LLaMA-2-7B & Contriever & 97\% \\
```

### 2.2 컬럼 추가 시 규칙
```latex
% 원본에 없는 컬럼 추가 시 반드시 명시
\begin{table}
\caption{Attack Effectiveness Comparison}
\label{tab:attacks}
\begin{tabular}{lccc}
Model & ASR & Detection$^*$ \\  % $^*$ 표시
\end{tabular}
\footnotetext{$^*$Detection difficulty estimated by authors
based on attack pattern complexity analysis.}
\end{table}
```

### 2.3 테이블 검증 프로세스
```
1. 원본 논문 PDF 확보
2. 원본 테이블 직접 확인
3. 모든 셀 값 1:1 대조
4. 모델명/버전 정확성 확인
5. 불일치 시 원본 값으로 수정
```

---

## 3. 프레임워크/표준 참조 규칙 (Framework References)

### 3.1 버전 명시 필수
```latex
% ✅ GOOD - 버전 명시
OWASP LLM Top 10 (v2.0, 2025)~\cite{owasp2025llm}
MITRE ATLAS v5.1.1~\cite{mitre2025atlas}
NIST AI RMF 1.0~\cite{nistairf2024}

% ❌ BAD - 버전 없음
OWASP Top 10 for LLM~\cite{owasp}
```

### 3.2 공식 명명 규칙 준수
```latex
% ❌ BAD - 드래프트/구버전 명명 (2025-12-18 발견)
AGENTIC01: Agentic Prompt Injection
AGENTIC02: Unsafe Code Generation

% ✅ GOOD - 공식 발표 버전 (2025년 12월 기준)
ASI01: Agent Goal Hijack
ASI02: Tool Misuse
ASI03: Identity \& Privilege Abuse
```

### 3.3 공식 URL 검증
```yaml
검증 순서:
  1. 공식 웹사이트 확인
  2. 발표 날짜 확인
  3. 버전 번호 대조
  4. 내용 변경 여부 확인

주요 공식 URL:
  - OWASP LLM: owasp.org/www-project-top-10-for-large-language-models/
  - OWASP Agentic: genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/
  - MITRE ATLAS: atlas.mitre.org
  - NIST AI RMF: nist.gov/itl/ai-risk-management-framework
```

---

## 4. 내부 일관성 규칙 (Consistency Rules)

### 4.1 수치 일관성
```latex
% ❌ BAD - 섹션 간 불일치 (실제 발견)
% 01-introduction.tex
We provide detailed analysis of 15 distinct attack vectors

% 03-taxonomy.tex
Our taxonomy comprises 18 distinct attack vectors

% ✅ GOOD - 전체 통일
% 모든 파일에서 동일한 수치 사용
We identify 18 distinct attack vectors across...
```

### 4.2 용어 일관성
```latex
% 용어집 정의 (논문 초반)
\newcommand{\numvectors}{18}
\newcommand{\numthreats}{8}
\newcommand{\datasetsize}{600,000+}

% 본문에서 사용
We analyze \datasetsize{} samples across \numvectors{} attack vectors.
```

### 4.3 일관성 검증 방법
```bash
# Grep으로 수치 검색
grep -rn "15 distinct\|18 distinct" sections/
grep -rn "3\.2x\|3.2 times" sections/

# 모든 결과가 동일한지 확인
```

---

## 5. 흔한 오류 및 방지법 (Common Errors)

| # | 오류 유형 | 예시 | 방지법 |
|---|----------|------|--------|
| 1 | 수치 오인용 | 87% → 다른 논문 수치 | 원본 직접 확인 |
| 2 | 테이블 조작 | 테스트 안 된 모델 추가 | 원본 테이블만 사용 |
| 3 | 버전 불일치 | 드래프트 vs 공식 버전 | 공식 URL 확인 |
| 4 | 내부 불일치 | 15 vs 18 벡터 | Grep 전체 검색 |
| 5 | 출처 없는 통계 | "~40%의 공격이..." | 출처 추가 또는 삭제 |
| 6 | 2차 인용 | "as cited in..." | 원본 직접 확인 |
| 7 | 연도 오류 | 2023→2021 | BibTeX 메타 검증 |

### 실제 수정 사례 (2025-12-18)
```yaml
발견된 문제:
  - PoisonedRAG 테이블: Claude-3/Llama-3 미테스트 → 원본 데이터로 교체
  - 87% Greshake 인용: 다른 논문 수치 오인용 → 삭제
  - 3.2x RAG 인시던트: 출처 없음 → 삭제
  - 15→18 공격 벡터: 내부 불일치 → 18로 통일
  - RobustBench 연도: 2023→2021 수정

결과:
  - 검증 성공률: 27% → 100%
```

---

## 6. 검증 필수 항목 체크리스트

### 6.1 정량적 주장
- [ ] 모든 백분율(%)에 출처 있음
- [ ] 모든 배수(Nx)에 출처 있음
- [ ] 자체 분석 수치에 방법론 명시

### 6.2 데이터 테이블
- [ ] 원본 논문과 수치 일치
- [ ] 테스트된 모델만 포함
- [ ] 추가 컬럼에 출처/방법론 명시

### 6.3 프레임워크 참조
- [ ] 버전 번호 정확
- [ ] 공식 명명 규칙 준수
- [ ] 공식 URL 유효

### 6.4 내부 일관성
- [ ] Abstract ↔ Body ↔ Conclusion 일치
- [ ] 수치 중복 언급 일관성
- [ ] 용어 일관성

### 6.5 BibTeX
- [ ] 연도 정확
- [ ] 학회/저널 정확
- [ ] 저자명 정확

---

## 7. 검증 워크플로우

```
작성 완료
    ↓
academic-paper-verifier 스킬 실행
    ↓
검증 결과 분석
    ↓
[실패 항목] → 수정 또는 삭제
    ↓
재검증
    ↓
100% 통과 확인
    ↓
제출 준비
```

---

## 8. 심각도 기준 (Severity Criteria)

| 등급 | 기준 | 예시 | 조치 |
|------|------|------|------|
| Critical | 핵심 주장 근거 부재/조작 | 테스트 안 된 모델 추가 | 즉시 삭제 |
| High | 중요 수치 출처 불명 | 통계 데이터 출처 없음 | 출처 추가 또는 삭제 |
| Medium | 부수적 정보 불일치 | 버전 번호 차이 | 수정 |
| Low | 형식적 오류 | 연도 오타 | 수정 |

---

## 버전 히스토리
- v1.0.0 (2025-12-18): 초기 버전 - 3개 AI 보안 논문 검증 경험 기반
