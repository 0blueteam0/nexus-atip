# MCP/A2A 보안 논문 v2 수정 계획

## Context

교수님 피드백을 반영하여 기말과제 논문을 해외 저널 투고 수준으로 개선한다.
현재 논문은 IEEEtran 컨퍼런스 포맷(6페이지, 12개 참고문헌)으로,
Computers & Security (Elsevier) 저널 기준(15-20페이지, 30+ 참고문헌)에 미달한다.

**핵심 문제 5가지**:
1. 기존 연구와의 차별점이 불명확
2. 기여(contribution) 유형이 모호 (분석 논문인데 실험 논문처럼 읽힘)
3. 저널 포맷/분량 부족
4. 실증적 보완 자료 부재 (PoC, 시나리오, 정교한 매핑 테이블)
5. 문장 구조가 정책 문서 톤 (기술 논문 톤 필요)

**목표**: 새 디렉토리에 v2 논문 생성 (기존 v1 유지)

---

## 원본 파일 위치

| 파일 | 역할 |
|------|------|
| `security-hub/mcp-a2a-security-paper/main-ko.tex` | v1 LaTeX 메인 |
| `security-hub/mcp-a2a-security-paper/sections-ko/*.tex` | v1 섹션 6개 |
| `security-hub/mcp-a2a-security-paper/references.bib` | v1 참고문헌 12개 |
| `security-hub/MCP-A2A-Security-Paper-KR.md` | v1 마크다운 원본 (MCPTox 데이터, CVE 부록 포함) |
| `workspaces/research/projects/papers/ai-security-sci-2025/references.bib` | 확장용 참고문헌 45+ |
| `workspaces/research/projects/papers/ai-security-sci-2025/research-data/*.json` | OWASP/MITRE/통합 위협 데이터 |
| `workspaces/research/projects/papers/ai-security-sci-2025/tables/*.tex` | 재사용 가능 테이블 |

---

## 새 논문 구조 (v1 -> v2 변경사항)

### v2 디렉토리: `security-hub/mcp-a2a-security-paper-v2/`

```
mcp-a2a-security-paper-v2/
├── main-ko.tex                 # Elsevier elsarticle 포맷
├── references.bib              # 확장 (12 -> 30+)
├── sections-ko/
│   ├── 01-introduction.tex     # [대폭 수정] 차별점, RQ, 기여 명시
│   ├── 02-background.tex       # [확장] 관련연구 + 연구 갭 분석
│   ├── 03-methodology.tex      # [신규] 독립 방법론 섹션
│   ├── 04-mcp-analysis.tex     # [보강] CVE 공격 흐름, MCPTox 데이터
│   ├── 05-a2a-analysis.tex     # [보강] Agent Card 위조 시나리오
│   ├── 06-cross-protocol.tex   # [신규] 핵심 기여 - 프로토콜 교차 분석
│   ├── 07-defense.tex          # [소폭 수정] 우선순위 매트릭스 추가
│   └── 08-discussion.tex       # [수정] RQ 기반 구조화
├── figures/
│   ├── mcp-architecture.tex    # v1 재사용
│   ├── a2a-architecture.tex    # v1 재사용
│   ├── combined-attack.tex     # [신규] A2A+MCP 복합 공격 흐름
│   └── trust-chain.tex         # [신규] 신뢰 체인 전파 모델
├── tables/
│   ├── owasp-unified.tex       # [신규] 통합 OWASP 매핑
│   ├── comparative.tex         # [신규] MCP vs A2A 비교
│   └── defense-priority.tex    # [신규] 방어 우선순위
└── appendices/
    ├── cve-details.tex         # v1 부록 확장
    └── agent-card-forgery.tex  # [신규] 위조 시나리오
```

---

## 섹션별 수정 계획

### 1. Introduction (대폭 수정)

**피드백 #1, #2 대응**

현재 문제: 단순 소개 수준, 차별점 불명확

수정 내용:
- **1.1 연구 동기**: A2A/MCP가 각각 수평/수직 통신을 담당하며 함께 Agentic AI의 핵심 인프라를 형성
- **1.2 연구 갭 및 차별점** [신규]:
  - 기존 LLM 보안 연구는 단일 모델 위협에 집중
  - A2A와 MCP를 같은 보안 프레임워크로 비교한 연구 부재
  - MCP는 실제 CVE 존재 vs A2A는 구조적 위험 분석 -- 이 비대칭성 자체가 분석 기여
- **1.3 연구 질문** [신규]:
  - RQ1: MCP(수직)와 A2A(수평)의 고유한 위협 프로파일은?
  - RQ2: OWASP Agentic AI Top 10으로 프로토콜별 위협이 어떻게 매핑되는가?
  - RQ3: A2A+MCP 상호작용에서 어떤 새로운 위협이 발생하는가?
  - RQ4: 개별 및 복합 위협에 대응하는 방어 전략은?
- **1.4 연구 기여**: 4가지 기여 명시 (비교 프레임워크, 통합 위협 매핑, 복합 공격 시나리오, 방어 아키텍처)

### 2. Background and Related Work (확장)

현재: 1페이지 / 목표: 3.5페이지

수정 내용:
- MCP/A2A 아키텍처 설명 확장 (v0.2 보안 메커니즘 테이블 포함)
- 관련 연구 체계적 정리: Greshake 2023, Zhan 2024, MCPTox 등
- **2.6 연구 갭 분석** [신규]: 기존 논문 vs 본 논문 비교 테이블

### 3. Methodology (완전 신규)

**피드백 #2 대응 - 분석 논문임을 솔직하게 인정**

- **3.1 연구 설계**: "structured security analysis" 명시
- **3.2 체계적 문헌 고찰**: PRISMA 준용, 검색 전략/선정 기준
- **3.3 위협 모델링**: STRIDE + OWASP Agentic AI Top 10 결합
- **3.4 검증 접근법**: 시나리오 기반 분석 (실험이 아님을 명시)
- **3.5 방법론 한계**: 실제 환경 테스트 미수행 솔직 고백

### 4. MCP Security Analysis (보강)

현재에서 추가할 것:
- 각 CVE별 단계별 공격 흐름 (전제조건 -> 공격 -> 영향 -> 패치)
- MCPTox 공격 성공률 테이블 (마크다운 원본에서 가져옴)
- Tool Poisoning 분류 체계: 설명 기반 / 파라미터 기반 / 체인 공격
- 공급망 위협: Invariant Labs 악성 패키지 사례 분석
- 정교한 OWASP 매핑 (단순 목록 -> 심각도/근거 품질 포함)

### 5. A2A Security Analysis (보강)

**피드백 #4a 대응**

현재에서 추가할 것:
- **Agent Card 위조 시나리오** [신규]: 5단계 공격 흐름
  1. 공격자 악성 도메인 설정
  2. 위조된 Agent Card 생성 (유효해 보이는 capabilities)
  3. DNS를 통한 클라이언트 에이전트 유인
  4. 서명 검증 부재로 신뢰 획득
  5. 악성 태스크 위임 수락
- **신뢰 체인 전파 모델**: 4-에이전트 시나리오로 신뢰 약화 시각화
- Capability Confusion 상세 분석

### 6. Cross-Protocol Threat Analysis (완전 신규 -- 핵심 기여)

**피드백 #1(차별점), #4b(복합 시나리오), #4c(OWASP 매핑) 모두 대응**

- **6.1 비교 분석 프레임워크**: MCP vs A2A를 근거 유형, 공격 표면, 신뢰 모델, 인증, 위협 범주 등 다차원 비교 테이블
- **6.2 A2A+MCP 복합 공격 시나리오** [핵심]:
  1. 공격자가 위조 Agent Card로 악성 A2A 에이전트 생성
  2. 정상 에이전트가 A2A로 연결, 위조 카드 신뢰
  3. 악성 에이전트가 태스크 위임 수락
  4. MCP Tool Poisoning 페이로드로 도구 호출
  5. Confused Deputy로 악성 명령 실행
  6. A2A 채널로 데이터 유출
- **6.3 통합 OWASP 매핑 테이블**: 10개 범주 x {MCP 발현, A2A 발현, 복합 위험} 교차 매핑
- **6.4 공통점과 차이점 분석**: 신뢰/신원 문제는 공통, 구현 버그 vs 설계 수준 위험은 차이
- **6.5 프로토콜 상호작용 위험**: 두 프로토콜 결합 시에만 존재하는 고유 위협

### 7. Defense Recommendations (소폭 수정)

추가 사항:
- 6절 복합 공격 시나리오에 대응하는 교차 프로토콜 방어
- 우선순위 매트릭스 (P0/P1/P2/P3)

### 8. Discussion and Conclusion (수정)

구조 변경:
- RQ1~RQ4에 대한 답변으로 발견사항 구조화
- 실무 시사점 (학계뿐 아니라 실무자를 위한 함의)
- 확장된 한계점 (A2A 분석이 구조적/이론적임을 명시)
- 구체적 후속 연구 제안

---

## 참고문헌 확장 계획

v1(12개) -> v2(30+개)로 확장

| 출처 | 가져올 참고문헌 | 용도 |
|------|---------------|------|
| v1 references.bib | 12개 전체 유지 | 기본 |
| ai-security-sci-2025/references.bib | 15-20개 선별 | LLM 보안, 프레임워크 |
| 추가 검색 필요 | 5-8개 | A2A 관련, 최신 MCP 연구 |

---

## 실행 순서 (6 Phase)

### Phase 1: 인프라 (1 태스크)
- v2 디렉토리 구조 생성
- v1에서 재사용 파일 복사 (figures, 기본 references)
- main-ko.tex elsarticle 포맷 설정

### Phase 2: 기반 섹션 (3 태스크)
- 3절 Methodology 신규 작성
- 1절 Introduction 전면 재작성
- 2절 Background 확장

### Phase 3: 분석 섹션 (3 태스크)
- 4절 MCP Analysis 보강
- 5절 A2A Analysis 보강 + 위조 시나리오
- 6절 Cross-Protocol 신규 작성 (핵심)

### Phase 4: 종합 섹션 (2 태스크)
- 7절 Defense 수정
- 8절 Discussion/Conclusion 재작성

### Phase 5: 테이블/도표/참고문헌 (3 태스크)
- 신규 테이블 3개 작성
- TikZ 도표 2개 신규 작성
- references.bib 확장 (30+ 항목)

### Phase 6: 품질 (1 태스크)
- 문장 스타일 점검: 짧은 문장, 주장-근거-의미 구조
- LaTeX 컴파일 가능 여부 확인

---

## 사용자 결정사항

### 추가 연구 범위: 4가지 모두 포함
1. Agent Card 위조 시나리오 -> 5절에 포함
2. A2A+MCP 복합 공격 시나리오 -> 6.2절 (핵심 기여)
3. 정교한 OWASP 매핑 테이블 -> 6.3절
4. MCP CVE 재현 분석 -> 4.2절 확장

### 작성 언어: 한영 병행
- `sections-ko/` : 한국어 버전
- `sections-en/` : 영어 버전
- 한국어 먼저 완성 후 영어 번역/적응

이에 따라 디렉토리 구조 확장:
```
mcp-a2a-security-paper-v2/
├── main-ko.tex           # 한국어 메인
├── main-en.tex           # 영어 메인
├── references.bib        # 공용 (30+)
├── sections-ko/          # 한국어 8개 섹션
├── sections-en/          # 영어 8개 섹션
├── figures/              # 공용 TikZ 도표
├── tables/               # 공용 테이블
└── appendices/           # 공용 부록
```

---

## 검증 방법

1. **구조 검증**: 한영 각 8개 섹션 (총 16 파일) 작성 완료 확인
2. **피드백 대응 검증**:
   - 차별점: 1.2절에 명시적 novelty statement 존재
   - 기여 유형: 3.1절에 "structured security analysis" 명시
   - 실증 보완 4가지:
     - 4.2절: CVE 공격 흐름 재현 분석
     - 5절: Agent Card 위조 시나리오
     - 6.2절: A2A+MCP 복합 공격 시나리오
     - 6.3절: 10x3 OWASP 교차 매핑 테이블
3. **분량 검증**: 15-20페이지 범위
4. **참고문헌**: 30개 이상
5. **LaTeX 컴파일**: 한영 모두 오류 없이 빌드

---

## 주의사항

- v1 파일 수정 금지 (새 디렉토리에서 작업)
- OWASP 명칭 통일: AGENTIC01~10 사용 (ASI01 아님)
- MCPTox 참고문헌(arXiv:2503.xxxxx) 검증 필요 -- 불완전한 ID
- kotex + elsarticle 호환성 테스트 필요 (실패 시 article 클래스 폴백)
- 영어 문장 스타일: 짧은 문장, Claim-Evidence-Significance 구조, 기술 논문 톤
