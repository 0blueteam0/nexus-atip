# Attention 메커니즘의 AI 보안 취약점 연구 계획

## 프로젝트 개요
- **주제**: "Attention Is All You Need" 논문의 Attention 메커니즘이 AI 성능에는 효과적이나 AI 보안에는 왜 위험한지 논리적 분석
- **형식**: 학술 연구 논문 (송영해 논문 양식, 기여도 테이블 제외)
- **참고 프레임워크**:
  - OWASP LLM Top 10
  - **OWASP Agentic AI Top 10 (2024.12 신규)**
  - MITRE ATLAS
- **분량**: 8-10페이지 (간결하게)

---

## 연구팀 페르소나

### 1. 지도교수
- AI 보안 및 NLP 전문가
- 연구 방향 검증, 학술적 기준 감독

### 2. 논문 팀
- 보안 전문가: OWASP/MITRE 분석
- NLP 연구원: Attention 메커니즘 분석

### 3. 학생 연구자 (사용자)
- 연구논문 최초 작성자

---

## 핵심 연구 가설 (2개로 축소)

### H1: Data-Instruction Conflation 가설
Self-Attention이 데이터와 명령어를 동등하게 처리하여 구분 실패

### H2: Context Window Exploitation 가설
긴 컨텍스트 윈도우가 악성 명령어 은닉 공간 제공

---

## 취약점 분류 체계 (V1-V3 핵심만)

| 분류 | 취약점 | OWASP LLM | Agentic AI | Attention 연관성 |
|------|--------|-----------|------------|------------------|
| V1 | Prompt Injection | LLM01 | AAI003 | Self-Attention 균등 처리 |
| V2 | Context Hijacking | LLM02 | AAI006 | Context Window 악용 |
| V3 | Agent Manipulation | - | AAI001, AAI007 | Multi-Agent Attention 흐름 |

---

## OWASP Agentic AI Top 10 (2024.12) 핵심 항목

| ID | 취약점명 | Attention 연관성 |
|----|----------|------------------|
| AAI001 | Agent Authorization Hijacking | Attention 기반 권한 결정 조작 |
| AAI003 | Goal & Instruction Manipulation | Prompt Injection과 직결 |
| AAI006 | Memory & Context Manipulation | Context Window 취약점 |
| AAI007 | Multi-Agent Orchestration Exploit | Agent 간 Attention 흐름 악용 |

---

## 논문 구조 (8-10페이지)

### 1. Abstract (0.5페이지)
- 연구 목적, 주요 발견

### 2. Introduction (1페이지)
- Attention 메커니즘의 성공과 보안 우려
- 연구 질문 정의

### 3. Background (2페이지)
- 3.1 Attention 메커니즘 개요
- 3.2 OWASP LLM & Agentic AI Top 10
- 3.3 MITRE ATLAS 개요

### 4. Security Analysis (3페이지)
- 4.1 V1: Prompt Injection과 Attention
- 4.2 V2: Context Hijacking
- 4.3 V3: Agentic AI 취약점

### 5. Discussion & Conclusion (1.5페이지)
- 발견의 의미
- 한계점 및 미래 연구

### 6. References (1페이지)
- 15-20개 핵심 논문

---

## 필수 참고 논문 (8개로 축소)

1. **Vaswani et al. (2017)** - Attention Is All You Need
2. **Goodfellow et al. (2015)** - FGSM
3. **Perez & Ribeiro (2022)** - HackAPrompt
4. **Greshake et al. (2023)** - LLM-Integrated App Attacks
5. **Zou et al. (2023)** - Universal Adversarial Attacks
6. **Wei et al. (2024)** - Jailbroken
7. **OWASP (2024)** - LLM Top 10 & Agentic AI Top 10
8. **MITRE (2024)** - ATLAS Framework

---

## 로컬 리소스

- `transformer-security-analysis/` - 기존 분석 자료
- `ai-security-report.md` - OWASP/MITRE 매핑

---

## 진행 상태

### Phase 1: 자료 수집 [완료]
- [x] 로컬 자료 탐색
- [x] OWASP LLM Top 10 리서치
- [x] OWASP Agentic AI Top 10 리서치 (2024.12)
- [x] MITRE ATLAS 리서치

### Phase 2: 논문 작성 [진행 예정]
- [ ] Introduction 작성
- [ ] Background 작성
- [ ] Security Analysis 작성
- [ ] Discussion & Conclusion 작성

---

*최종 업데이트: 2025-01-11 - 8-10페이지 간소화 버전*
