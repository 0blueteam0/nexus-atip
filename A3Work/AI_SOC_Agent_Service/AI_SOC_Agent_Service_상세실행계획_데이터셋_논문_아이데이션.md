---
title: AI SOC Agent Service 상세 실행계획 - 데이터셋/논문/아이데이션 반영
created: 2026-06-02
author: Hermes Codex
project: AI_SOC_Agent_Service
para: Projects
zettel_type: plan
source_paths:
  - J:/PortableApps/genai/A3Work/AI_SOC_Agent_Service/docx
  - J:/PortableApps/genai/A3Work/AI_SOC_Agent_Service/AI_SOC_Agent_Service_상향업데이트_사업제안서.pptx
collected_via:
  - local_docx_pptx_extraction
  - semantic_scholar_api
  - public_web_source_check
  - github_raw_readme_check
evidence_level: mixed_local_docs_and_public_sources
validation_status: draft_verified_with_local_extraction_and_source_reachability
related:
  - MITRE ATT&CK
  - MITRE D3FEND
  - SigmaHQ
  - OTRF Security Datasets
  - Splunk BOTS v3
ontology:
  entities:
    - SOC Agent Platform
    - Evidence Package
    - Agent Assurance
    - CSOP
    - Public Security Dataset
    - Synthetic Dataset
  relations:
    - SOC Agent Platform uses Evidence Package
    - Agent Assurance evaluates Agent Run
    - Public Security Dataset supports Replay Evaluation
    - Synthetic Dataset supports Tool/Policy Gate Testing
graph:
  nodes:
    - id: soc_agent_platform
      label: SOC Agent Platform
    - id: evidence_package
      label: Evidence Package
    - id: agent_assurance
      label: Agent Assurance
    - id: datasets
      label: Public/Synthetic Datasets
  edges:
    - from: datasets
      to: agent_assurance
      label: supplies evaluation cases
    - from: evidence_package
      to: soc_agent_platform
      label: core output
---

# AI SOC Agent Service 상세 실행계획

> 목표: 기존 문서의 v2 방향성인 "SOC 운영 보조 에이전트 플랫폼"을 실제 PoC/MVP/제품화로 옮기기 위한 데이터, 알고리즘, 평가, 아키텍처, 구현 단위 계획을 구체화한다.

## 1. 현재 문서/구조 확인 결과

### 1.1 파일 구조

현재 `J:/PortableApps/genai/A3Work/AI_SOC_Agent_Service`에는 다음 산출물이 있다.

- `AI_SOC_Agent_Service_상향업데이트_사업제안서.pptx`: 13장 사업/제품 제안서.
- `docx/00_업데이트_요약_및_추적성_매트릭스.docx` ~ `docx/21_PoC_및_로드맵_업데이트.docx`: 요구사항, 프로세스, 화면, 기능, 권한, ERD, API, 테스트, 운영, 배포, 기술스택, PoC 로드맵까지 포함한 v2 문서 패키지.
- `_analysis_extracted/`: 본 계획 수립 중 생성한 분석 보조 산출물.
  - `docx_full_text.md`: docx 텍스트 추출본.
  - `docx_index_summary.json`: 문서별 제목/ID 인덱스.
  - `research_sources.json`, `raw_source_snippets.json`: 공개 출처 확인 결과.

### 1.2 기존 문서의 강점

기존 문서는 단순 SIEM 알림 요약 도구가 아니라 다음 구조를 이미 잡고 있다.

1. Agent 포트폴리오 4계층
   - Investigation Agents
   - SOC Operations Agents
   - Response Preparation Agents
   - Agent Assurance Agents
2. 보수적 자동화 원칙
   - 초기에는 Read-only / Draft / Human Review 중심.
   - 고위험 조치인 격리, 계정 잠금, 방화벽 차단, 고객 공식 통보는 자동 실행하지 않음.
3. Evidence Package 중심 운영
   - Required/Collected/Missing/Failed Evidence
   - Entity Context
   - Timeline
   - Reason Code
   - Tool Call Trace
   - Policy/Runbook/Prompt Version
4. 멀티테넌트/CSOP/정책 게이트
   - Tenant Isolation
   - CSOP Version
   - Runbook/Action Catalog/Approval Matrix
   - Tool Gate / Policy Gate / Evidence Gate / Audit Gate
5. 현실적인 90일 PoC와 12개월 로드맵
   - Day 1~30 진단/설정
   - Day 31~60 Shadow 운영
   - Day 61~90 평가/전환판단

### 1.3 보완해야 할 핵심 공백

기존 문서는 제품 구조와 업무 흐름이 강하지만, 실제 AI/ML 제품으로 구현하려면 아래가 더 필요하다.

| 공백 | 왜 중요한가 | 본 계획의 보완 방향 |
|---|---|---|
| 평가셋 설계 | Agent 품질을 주장하려면 정답/근거/재현 기준이 필요 | 공개데이터셋 + 합성 SIEM Alert + 내부 Shadow Case로 3단 평가셋 구성 |
| ML/DL 적용 경계 | 모든 것을 LLM으로 처리하면 비용/환각/감사 리스크 증가 | 규칙/검색/ML/LLM/그래프 알고리즘의 역할 분리 |
| 데이터 정규화 스키마 | SIEM/EDR/Cloud/ITSM 연동이 벤더별로 달라짐 | OCSF/ECS 유사 공통 Alert/Event/Entity 스키마 정의 |
| Agent Assurance 지표 | AgentOps가 화면에만 있으면 검증 불가 | Evidence completeness, faithfulness, policy compliance, human override 등 측정 |
| 합성데이터 생성 절차 | 실제 고객 데이터는 민감하고 초기에 확보가 어렵다 | Atomic Red Team, MITRE Caldera, Sigma, OTRF, BOTS 기반 안전한 lab/replay 데이터 생성 |
| 논문/알고리즘 매핑 | AI 적용 근거와 R&D 우선순위가 필요 | Alert triage, alert clustering, anomaly detection, graph correlation, RAG/LLM guardrail로 분해 |

## 2. 제품 목표 재정의

### 2.1 한 문장 목표

AI SOC Agent Service는 보안관제 분석가를 대체하는 자율 대응 시스템이 아니라, 알림을 사건 단위로 구조화하고, 고객별 CSOP와 증거 기준에 따라 조사 패키지, 판단 후보, 승인 자료, 운영 품질 개선 후보를 생성하는 증거 중심 SOC Agent Platform이다.

### 2.2 PoC/MVP에서 반드시 지켜야 할 범위

PoC/MVP 포함:

- SIEM Alert Intake와 정규화.
- Case 생성/중복/상관 후보.
- Evidence Plan 생성.
- Mock 또는 read-only connector 기반 증거 조회.
- Evidence Package 생성.
- Entity Context와 Timeline 생성.
- Triage Candidate와 Reason Code 생성.
- Ticket Draft와 Approval Package 초안 생성.
- Human Review와 Override Reason 수집.
- Agent Trace, Tool Call, Prompt/Policy/Runbook Version 감사 기록.
- Replay/Shadow 평가.

PoC/MVP 제외:

- 자동 계정 잠금.
- 자동 호스트 격리.
- 자동 방화벽/WAF 차단.
- 고객에게 자동 공식 통보.
- 검증되지 않은 위협 인텔리전스 기반 자동 심각도 상향.
- Cross-tenant entity 검색.

## 3. 공개데이터셋/합성데이터셋 전략

### 3.1 데이터셋을 3계층으로 나눈다

| 계층 | 목적 | 데이터 소스 | 사용 시점 |
|---|---|---|---|
| D1 공개 벤치마크 | 모델/알고리즘 사전 검증 | CICIDS2017/2018, UNSW-NB15, Bot-IoT, TON_IoT, LANL, CERT Insider | PoC Day 1~30 |
| D2 SOC 운영형 공개/CTF 데이터 | Evidence Package와 Timeline/Case 훈련 | OTRF Security Datasets, Splunk BOTS v3, Sigma rules, MITRE ATT&CK | PoC Day 15~60 |
| D3 합성/Replay 데이터 | 고객 환경에 가까운 검증, Policy/Tool Gate 테스트 | Atomic Red Team, MITRE Caldera, lab SIEM, synthetic alert generator | PoC Day 31~90 |
| D4 고객 Shadow 데이터 | 실제 효과 측정 | 익명화된 실제 SIEM/ITSM/EDR read-only 데이터 | PoC Day 61~90 이후 |

### 3.2 공개데이터셋 후보와 역할

| 후보 | 확인 출처 | 데이터 성격 | 이 프로젝트에서의 현실적 용도 | 주의점 |
|---|---|---|---|---|
| CICIDS2017 | Canadian Institute for Cybersecurity 페이지 확인 시 SSL 체인 문제로 직접 검증 실패, 널리 쓰이는 IDS 벤치마크 | 네트워크 트래픽/플로우 기반 공격/정상 라벨 | IDS/Anomaly 모델 baseline, alert simulation | 오래된 데이터. SOC Case/Evidence 문맥은 부족 |
| CSE-CIC-IDS2018 | CIC 페이지 직접 검증은 SSL 체인 문제, 공개 클라우드 IDS 데이터로 알려짐 | 대규모 IDS/플로우 | baseline 확장, cloud-like flow | 실제 SIEM evidence 구조와 다름 |
| UNSW-NB15 | UNSW Research 페이지 HTTP 200 확인 | 현대적 네트워크 공격/정상 데이터 | supervised triage/anomaly baseline | 라벨 기준을 SOC verdict로 그대로 쓰면 안 됨 |
| Bot-IoT | UNSW Research 페이지 HTTP 200 확인 | IoT botnet/DoS/scan 등 | IoT/OT 확장 시나리오, anomaly detection | 일반 기업 SOC와 분포 차이 큼 |
| TON_IoT | UNSW Research 페이지 HTTP 200 확인 | Telemetry/IoT/IIoT | OT/IoT package 후보 검증 | MVP 기본 범위는 아님 |
| LANL Cyber Security Events | LANL Cyber Security Research 페이지 HTTP 200 확인 | 인증/DNS/flow 등 enterprise-scale event | 계정/인증 이상, entity graph, lateral movement 연구 | 라이선스/접근 조건 확인 필요 |
| CERT Insider Threat Dataset | CMU KiltHub 접근 시 202 응답 확인 | 내부자 위협 시나리오 | UEBA/insider risk 후보 | 개인정보/행동 데이터 해석 주의 |
| OTRF Security Datasets | GitHub README 확인. 악성/정상 dataset, ATT&CK/Sigma/Atomic 연계 목표 명시 | replay 가능한 보안 이벤트 | Detection validation, Evidence Package replay, Sigma 매핑 | 데이터별 플랫폼/로그 스키마가 다름 |
| Splunk BOTS v3 | GitHub README 확인. 320.1MB pre-indexed Splunk dataset, 다수 sourcetype 포함 | SOC CTF/실전형 로그 | 가장 MVP에 가까운 Case/Evidence/Timeline 평가셋 | Splunk 중심. OpenSearch/Elastic 변환 필요 |

### 3.3 합성데이터셋 생성 아이디어

합성데이터는 "모델 성능을 부풀리기 위한 가짜 정답"이 아니라, 정책 게이트/툴 실패/증거 누락/감사 재현성을 검증하기 위한 controlled test data로 사용한다.

1. Synthetic Alert Generator
   - 입력: attack_family, tenant_profile, asset_criticality, user_role, time_window, evidence_availability.
   - 출력: normalized_alert, required_evidence, expected_missing_evidence, expected_reason_code, expected_human_review_required.
   - 예: VPN login anomaly, privileged account, impossible travel, approved scanner false positive, noisy rule burst.

2. Atomic Red Team 기반 lab 이벤트
   - Atomic Red Team은 ATT&CK에 매핑된 portable detection test 라이브러리임을 README로 확인.
   - 안전한 내부 lab에서만 실행하고 운영망에서는 실행하지 않는다.
   - 실행 로그를 SIEM으로 수집해 Sigma rule, Evidence Planner, Timeline Builder를 검증한다.

3. MITRE Caldera 기반 adversary emulation
   - MITRE Caldera는 adversary emulation, manual red-team 보조, incident response 자동화를 위한 플랫폼임을 README로 확인.
   - PoC에서는 "공격 자동화"가 아니라 replay/evaluation 데이터 생성을 위한 격리 lab 용도로만 사용한다.
   - high-risk ability는 비활성화하고 allowlist된 benign/low-risk sequence만 사용한다.

4. Sigma rule 기반 alert simulation
   - SigmaHQ는 SIEM용 generic signature format이며 3000개 이상 rule을 제공한다고 README에서 확인.
   - Sigma rule metadata를 이용해 alert family, ATT&CK tactic/technique, required evidence template을 자동 생성한다.

5. OTRF Security Datasets replay
   - OTRF README는 malicious/benign dataset, adversary technique simulation, ATT&CK/Sigma/Atomic 매핑 지원 목표를 명시한다.
   - 실제 Agent Replay 평가에 가장 적합하다.

### 3.4 데이터셋별 평가 태스크 매핑

| 평가 태스크 | 공개데이터 | 합성데이터 | 고객 Shadow |
|---|---|---|---|
| Alert severity baseline | CICIDS/UNSW/Bot-IoT | synthetic normalized alerts | 실제 severity/analyst decision |
| False positive 후보 탐지 | BOTS/OTRF/Sigma | approved scanner, known noisy rule | closed benign cases |
| Evidence completeness | BOTS/OTRF | missing evidence injection | analyst feedback |
| Entity correlation | LANL/BOTS/OTRF | host-user-ip-ioc graph | actual CMDB/IAM/ITSM |
| Timeline correctness | BOTS/OTRF | ordered/unordered event replay | analyst-accepted timeline |
| Policy gate correctness | synthetic first | CSOP exception matrix | approved/rejected action history |
| Prompt injection guard | synthetic adversarial notes | malicious ticket/comment text | red-team only |

## 4. 관련 논문/연구에서 가져올 실용 포인트

### 4.1 확인한 연구/문헌 후보

Semantic Scholar API로 다음 후보를 확인했다.

1. Ghadermazi, Shah, Jajodia, "A Machine Learning and Optimization Framework for Efficient Alert Management in a Cybersecurity Operations Center", ACM DTRAP, 2024.
   - 요지: benign alert 제거, 유사 alert clustering, analyst expertise matching, optimization을 결합해 alert backlog를 줄이는 프레임워크.
   - 프로젝트 적용: L1 queue prioritization, similar-case clustering, analyst assignment 추천.

2. "MCP-Driven RAG Architecture for Automated Alert Triage in Security Operations Centers", 2026.
   - 요지: MCP와 RAG로 CVE, MITRE ATT&CK, incident repository, threat intel을 연결해 explainable alert triage를 수행하는 아키텍처.
   - 주의: 논문 자체가 시뮬레이션 기반이고 production claim이 아님을 명시.
   - 프로젝트 적용: MCP/RAG 방향성은 참고하되, 이 서비스에서는 Tool Gate/Evidence Gate/Human Review를 우선한다.

3. "Multitenant Cybersecurity Operations Center Designed as an Open Cloud Service with Machine Learning Elements", 2025.
   - 요지: Elastic/OpenSearch, container orchestration, Kafka/Spark, tenant-aware case management, ML 요소를 결합한 multitenant SOC blueprint.
   - 프로젝트 적용: 멀티테넌트 격리, open telemetry plane, tenant-scoped alert/case 설계 근거.

4. "AI-optimized SOC playbook for Ransomware Investigation", 2025.
   - 요지: ransomware investigation lifecycle에서 ML/LLM/playbook을 결합해 triage/scoping/summary/recommendation을 자동화하는 방향.
   - 프로젝트 적용: 단, MVP에서는 containment initiation이 아니라 Approval Package와 Manual Action Request까지만 적용.

5. Predictive alert severity scoring 관련 2025 금융 cloud operations 논문 후보.
   - 요지: historical alert, dependency, deployment recency, time-of-day, false positive rate 등 feature로 severity scoring.
   - 프로젝트 적용: SOC/IT Ops 융합 영역의 severity prior, SLA 우선순위 산정에 참고.

### 4.2 알고리즘/R&D 아이데이션

| 영역 | 1차 현실적 접근 | ML/DL 확장 | LLM/Agent 적용 | PoC 우선순위 |
|---|---|---|---|---|
| Alert normalization | schema mapping + rule parser | sequence/field imputation | mapping explanation draft | High |
| Dedup/correlation | deterministic key + time window | clustering, graph connected components | similar case explanation | High |
| Severity/risk scoring | weighted rules: severity, asset, account, IOC, CSOP | XGBoost/LightGBM, calibrated logistic regression | risk reason sentence | High |
| False positive 후보 | CSOP exception + known scanner + historical closure | supervised classifier, isolation forest | Reason Code draft | High |
| Evidence planning | runbook template + alert family | policy learning from historical cases | evidence checklist generation | High |
| Entity context | CMDB/IAM/IOC lookup + graph | graph embedding/GNN later | natural-language context summary | Medium |
| Timeline | timestamp normalization + event ordering | sequence anomaly detection | timeline narrative | High |
| Ticket/report draft | template + Evidence Package | none initially | structured generation with citations | High |
| Detection health | rule hit rate, FP rate, stale/noisy thresholds | drift detection, anomaly detection | tuning recommendation draft | Medium |
| Prompt injection guard | regex/policy + source isolation | classifier later | LLM-as-judge only secondary | High |
| Agent quality eval | deterministic checks + rubric | evaluator model calibration | LLM judge with evidence citations | High |

권장 원칙:

- 분류/점수화는 초기에는 설명 가능한 모델부터 시작한다. XGBoost/LightGBM/logistic regression이 DL보다 현실적이다.
- 그래프는 MVP에서 GNN보다 Neo4j/PostgreSQL graph query/connected components가 먼저다.
- LLM은 verdict 확정자가 아니라 Evidence Package를 읽고 구조화된 초안을 생성하는 역할로 제한한다.
- DL/Transformer는 충분한 내부 replay/shadow 데이터가 생긴 뒤 log anomaly, sequence correlation, entity behavior modeling에 적용한다.

## 5. 목표 아키텍처

### 5.1 핵심 레이어

1. Ingestion & Normalization
   - SIEM/EDR/Cloud/ITSM/CMDB/IAM connector.
   - 공통 스키마: tenant_id, alert_id, source, event_time, entity_refs, alert_family, severity, raw_ref, normalized_fields.

2. Case & Evidence Core
   - Case, CaseAlert, EvidencePackage, EvidenceItem, RequiredEvidence, MissingEvidence, TimelineEvent.
   - Evidence Package는 모든 판단/초안의 단일 근거 단위.

3. Policy & CSOP Layer
   - CSOP Version, Runbook, PolicyRule, ExceptionPolicy, ApprovalMatrix, ActionCatalog.
   - OPA/Rego 또는 Cedar 기반 policy-as-code 검토.

4. Agent Orchestrator
   - LangGraph/Temporal/Celery 또는 자체 DAG/State Machine.
   - AgentPlan, AgentStep, ToolCall, Handoff, Retry, Quarantine.

5. Tool Gateway
   - SIEM query, ITSM ticket, CMDB lookup, IAM lookup, CTI lookup, SOAR dry-run.
   - Tool allowlist, credential scope, rate limit, tenant guard.

6. LLM Gateway/RAG
   - prompt versioning, output schema validation, citation requirement, model routing, token/cost logging.
   - ATT&CK, D3FEND, CSOP, runbook, prior case를 retrieval하되 evidence citation 없이는 결론 금지.

7. Agent Assurance
   - Replay/Shadow evaluator.
   - Evidence quality checker.
   - Prompt injection detector.
   - Policy violation detector.
   - Human override analyzer.

8. SOC Workbench UI
   - Case Workbench, Evidence Detail, Timeline, Entity Graph, Human Review, Agent Trace, AgentOps, Detection/Log Health.

### 5.2 MVP API/데이터 확장 제안

기존 API 문서에 아래 API를 보강할 것을 권장한다.

| API | 목적 |
|---|---|
| `POST /api/v2/evaluation/datasets` | 공개/합성/내부 평가셋 등록 |
| `POST /api/v2/evaluation/replay-runs` | Agent replay 평가 실행 |
| `GET /api/v2/evaluation/replay-runs/{id}/metrics` | replay 품질 지표 조회 |
| `POST /api/v2/synthetic-alerts/generate` | controlled synthetic alert 생성 |
| `POST /api/v2/agent-assurance/redteam-cases` | prompt injection/policy violation 테스트케이스 등록 |
| `GET /api/v2/model-features/{case_id}` | ML feature extraction 결과 조회 |
| `POST /api/v2/feedback/human-overrides` | human override reason 수집 |

## 6. 90일 PoC 상세 실행계획

### Phase 0: 착수 전 1주 - 범위 잠금

목표: PoC를 "AI가 보안관제를 한다"가 아니라 "Evidence Package와 Human Review가 실무 시간을 줄이는지"로 잠근다.

작업:

1. PoC 대상 alert family 3개 선택.
   - 1순위: VPN/login anomaly.
   - 2순위: malware/EDR alert.
   - 3순위: cloud suspicious activity 또는 approved scanner false positive.
2. 대상 connector 범위 확정.
   - SIEM read-only.
   - ITSM draft-only.
   - CMDB/IAM lookup read-only.
   - CTI public lookup read-only.
3. 금지 조치 명시.
   - account lock, host isolation, firewall block, customer notification 자동 실행 금지.
4. 성공 KPI 기준선 합의.
   - Evidence completeness >= 80%.
   - Missing evidence reason coverage >= 90%.
   - Analyst accepted draft >= 50%부터 시작.
   - Unsupported conclusion = 0 허용 목표.
   - Cross-tenant leakage = 0.

산출물:

- PoC Scope Lock.
- Connector Readiness Checklist.
- Evaluation Protocol v0.1.

### Phase 1: Day 1~30 - 데이터/스키마/평가 기반 구축

목표: Agent를 만들기 전에 평가와 데이터 기반을 먼저 만든다.

작업:

1. 공통 Alert/Event/Entity 스키마 정의.
   - 기존 ERD/API를 기준으로 `normalized_alert`, `evidence_item`, `entity_ref`, `timeline_event` JSON schema 작성.
2. 공개데이터셋 inventory 구성.
   - BOTS v3, OTRF, UNSW-NB15, LANL, CERT Insider, CICIDS 후보를 license/access/status 기준으로 표로 관리.
3. Splunk BOTS v3 또는 OTRF 중 1개를 PoC replay seed로 선택.
   - Splunk 환경이 없으면 OTRF + OpenSearch/Elastic 변환 우선.
4. Synthetic Alert Generator v0 작성.
   - VPN anomaly, known scanner FP, missing CMDB, tool timeout, privileged account 케이스 생성.
5. Evaluation metric 정의.
   - evidence_recall, evidence_precision, missing_evidence_accuracy, timeline_order_accuracy, reason_code_accuracy, policy_gate_accuracy, citation_coverage, hallucination_rate, human_override_rate.
6. Baseline 구현.
   - 규칙 기반 Evidence Planner.
   - 규칙 기반 Risk Score.
   - template 기반 Ticket Draft.

Gate:

- 평가셋 100건 이상 준비.
- Synthetic edge case 30건 이상 준비.
- JSON schema validation 통과.
- Evidence Package baseline 생성 가능.

### Phase 2: Day 31~60 - Investigation Agent MVP

목표: 실제 SOC 분석 보조의 최소 가치인 Evidence Package + Timeline + Ticket Draft를 만든다.

작업:

1. Alert Intake Agent.
   - 입력 정규화, 중복 후보, alert family 지정.
2. Evidence Planner Agent.
   - alert family + CSOP + runbook 기반 required evidence 산정.
3. Query & Tool Agent.
   - mock/read-only connector를 통해 evidence 수집.
   - 실패 시 MissingEvidence에 원인 기록.
4. Entity Context Agent.
   - user, host, IP, IOC, asset criticality, prior case 연결.
5. Timeline Builder Agent.
   - evidence timestamp 정렬, causal grouping 후보 작성.
6. Triage Candidate Agent.
   - benign/suspicious/true_positive_candidate/insufficient_evidence 중 후보만 생성.
   - confidence breakdown과 reason code 필수.
7. Ticket Draft Agent.
   - Evidence Package 기반 템플릿 초안 생성.
   - citation 없는 문장은 허용하지 않음.
8. Agent Trace Viewer.
   - plan/step/tool/policy/prompt/evidence trace 저장 및 표시.

Gate:

- Replay 100건에서 Evidence Package 생성 성공률 >= 90%.
- Missing Evidence가 있는 케이스에서 무근거 verdict 확정 0건.
- Human Review 화면에서 analyst가 evidence source를 추적 가능.

### Phase 3: Day 61~90 - Shadow 운영/평가/사업성 판단

목표: 실제 또는 실제와 가까운 데이터에서 분석가 업무 개선 가능성을 검증한다.

작업:

1. Shadow mode 운영.
   - Agent 결과는 실제 티켓/조치에 반영하지 않고 분석가 판단과 비교.
2. Human Feedback 수집.
   - accepted, edited, rejected, escalated, missing_evidence, wrong_reason_code, unsafe_suggestion.
3. Agent Assurance 자동 평가.
   - evidence completeness.
   - policy compliance.
   - output schema adherence.
   - prompt injection handling.
   - tenant isolation.
4. 운영 품질 pack 후보 검증.
   - noisy rule 후보.
   - log health finding.
   - CSOP drift.
   - knowledge debt.
5. Go/Hold/No-Go 판단.
   - Go: Analyst accepted/edit-light >= 60%, critical safety issue 0, evidence completeness >= 85%.
   - Hold: 유용성은 있으나 connector/evidence 부족.
   - No-Go: tenant/safety/evidence failure 반복.

산출물:

- Shadow Result Report.
- Evaluation Metrics Report.
- Business Conversion Proposal.
- 12개월 Roadmap v1.

## 7. 12개월 제품화 로드맵

| 기간 | 목표 | 구현 범위 | 데이터/모델 | 사업 산출물 |
|---|---|---|---|---|
| M1~M3 | PoC/MVP | Investigation Pack + Evidence Package + Human Review | 공개/replay/synthetic + shadow | PoC Report, demo, pilot 제안 |
| M4~M6 | Pilot | SIEM/ITSM/CMDB/IAM connector, CSOP Builder, AgentOps | 고객별 historical case, feedback loop | Pilot 계약, 운영 매뉴얼, SLA |
| M7~M9 | Operations Quality Pack | Detection Health, Log Health, Knowledge Debt, CSOP Drift | rule hit/FP history, log coverage | MSSP/MDR 운영 품질 상품 |
| M10~M12 | Supervised Response Prep | Approval Package, SOAR dry-run, impact/rollback, post-action audit | approved action history, dry-run result | 고급 패키지, compliance/audit report |
| M12+ | 제한 자동화 검토 | 저위험/가역/사전승인 조치만 조건부 자동화 | canary/shadow/replay 충분 데이터 | Automation policy addendum |

## 8. 구현 백로그 - bite-sized 계획

### Track A. 데이터/평가 기반

A1. `evaluation_dataset` 테이블/스키마 추가.
- 필드: dataset_id, source_type, source_name, license_status, schema_type, pii_status, record_count, status.
- 검증: dataset 등록/조회 API 테스트.

A2. `normalized_alert.schema.json` 작성.
- 필수 필드: tenant_id, alert_id, source_system, event_time, alert_family, severity, entities, raw_ref.
- 검증: BOTS/OTRF/synthetic sample 10건 validation.

A3. `evidence_package.schema.json` 작성.
- 필수 필드: required, collected, missing, failed, source_reliability, policy_decision, trace_id.
- 검증: citation 없는 verdict candidate reject.

A4. Synthetic Alert Generator v0 구현.
- 입력 parameter 기반 JSON 생성.
- edge case: missing CMDB, tool timeout, cross-tenant entity, prompt injection note.
- 검증: 30개 fixture 생성 및 schema validation.

A5. Replay Runner v0 구현.
- input: dataset_id + agent_version + policy_version.
- output: run metrics.
- 검증: 100건 replay 실행 로그 생성.

### Track B. Investigation Agent MVP

B1. Alert Intake Agent 구현.
- alert normalization, dedup key, family mapping.
- 테스트: null field, unknown source, duplicate alert.

B2. Evidence Planner Agent 구현.
- rulebook: login_anomaly, malware, cloud_activity.
- 테스트: alert family별 required evidence 목록.

B3. Tool Gateway mock connector 구현.
- SIEM, CMDB, IAM, CTI mock.
- 테스트: success/timeout/not_found/permission_denied.

B4. Query & Tool Agent 구현.
- required evidence별 tool call 계획 생성.
- 테스트: tool failure가 MissingEvidence로 기록되는지.

B5. Entity Context Builder 구현.
- user-host-ip-ioc-case 관계 graph 구성.
- 테스트: cross-tenant entity 차단.

B6. Timeline Builder 구현.
- evidence timestamp normalize/order/group.
- 테스트: timezone, missing timestamp, duplicate event.

B7. Triage Candidate Agent 구현.
- verdict_candidate는 후보만 생성.
- 테스트: evidence 부족 시 insufficient_evidence 강제.

B8. Ticket Draft Agent 구현.
- Evidence Package citation 기반 template 생성.
- 테스트: citation 없는 문장 reject.

### Track C. Policy/Guardrail/Assurance

C1. Tool allowlist policy 구현.
- tenant/source/action/risk_level 기준.
- 테스트: disallowed tool call block.

C2. Evidence Gate 구현.
- minimum required evidence 충족 전 high-confidence verdict 금지.
- 테스트: missing required evidence 케이스.

C3. Prompt Injection Guard v0 구현.
- external text/source isolation, suspicious instruction marker, LLM system instruction conflict detection.
- 테스트: ticket comment에 "ignore previous instructions"류 입력.

C4. Tenant Isolation Guard 구현.
- 모든 query에 tenant_id 필수.
- 테스트: tenant_id 없는 query 실패, 다른 tenant entity 접근 실패.

C5. Agent Trace 저장 구현.
- plan, step, tool call, input hash, output hash, policy decision, prompt version.
- 테스트: replay 시 동일 trace 재현 가능.

C6. Assurance Metrics 구현.
- evidence completeness, schema adherence, policy compliance, citation coverage, hallucination rate, human override rate.
- 테스트: replay metrics report 생성.

### Track D. ML/알고리즘 실험

D1. Rule baseline risk scoring 구현.
- asset criticality, account privilege, alert severity, IOC confidence, business hours, prior cases.
- 검증: 설명 가능한 feature contribution 출력.

D2. Alert clustering baseline 구현.
- deterministic grouping + TF-IDF/MinHash or embedding similarity.
- 검증: 유사 alert 묶음 precision sample review.

D3. Supervised severity/FP classifier 실험.
- 모델: logistic regression, random forest, LightGBM/XGBoost 중 데이터 상황에 맞게 선택.
- 검증: time-split validation, false negative cost-weighted metric.

D4. Graph correlation 실험.
- 우선 connected components/PageRank/community detection.
- GNN은 M6 이후 충분한 graph label이 생긴 뒤 검토.

D5. Log/sequence anomaly 실험.
- 우선 Isolation Forest/LOF/PCA.
- Transformer/DeepLog류는 내부 sequence label과 latency 요구가 명확해진 뒤 검토.

### Track E. UI/운영

E1. Case Workbench MVP.
- Alert, Evidence, Entity, Timeline, Draft, Review 상태를 한 화면에 배치.

E2. Evidence Package Detail.
- Required/Collected/Missing/Failed/Source Reliability/Audit tabs.

E3. Human Review Queue.
- high-risk, low-confidence, privileged account, evidence missing 우선 정렬.

E4. Agent Trace Viewer.
- Agent Step, Tool Call, Policy Decision, Prompt Version 확인.

E5. AgentOps Dashboard.
- success/fail/quarantine/cost/latency/override metrics.

E6. Detection/Log Health Dashboard.
- noisy rule, stale rule, missing log source, CSOP drift 후보.

## 9. 평가 지표

### 9.1 품질 지표

| 지표 | 정의 | MVP 목표 |
|---|---|---|
| Evidence Package 생성 성공률 | alert 입력 후 패키지 생성 완료 | >= 90% |
| Evidence completeness | required evidence 중 collected 또는 justified missing 비율 | >= 80~85% |
| Missing reason coverage | 누락 증거에 원인/후속 조치가 있는 비율 | >= 90% |
| Citation coverage | draft 문장 중 evidence citation 있는 비율 | >= 95% |
| Unsupported conclusion | 근거 없는 결론/권고 | 0 critical |
| Policy gate accuracy | 정책상 차단/허용 판단 정확도 | >= 95% |
| Tenant leakage | 타 tenant 정보 노출 | 0 |
| Human accepted/edit-light | 분석가가 수용하거나 소폭 수정 | PoC >= 50%, Pilot >= 60% |
| Human override rate | 분석가가 핵심 판단을 뒤집은 비율 | 원인 분석용, 단순 낮을수록 좋다고 보지 않음 |
| MTTI reduction | Mean Time To Investigate 절감률 | PoC 측정 후 목표 재설정 |

### 9.2 안전 지표

- 고위험 action 자동 실행 건수: 0.
- 승인 없는 SOAR write action: 0.
- Prompt injection quarantine 누락: 0 critical 목표.
- Tool credential over-scope: 0.
- Audit trace missing: 0 critical 목표.

## 10. 현실적 사업/제품 패키지 아이데이션

### 10.1 Foundation Pack

대상: 데이터 준비도가 낮은 고객.

기능:
- Data readiness assessment.
- Connector inventory.
- Normalized alert schema.
- Evidence Package template.
- CSOP v0.9 작성 보조.

가격/가치 포인트:
- PoC 전 진단 컨설팅 + 플랫폼 온보딩 패키지.
- 고객이 당장 자동화할 준비가 안 되어도 판매 가능.

### 10.2 Investigation Pack

대상: L1 alert fatigue가 큰 MSSP/MDR.

기능:
- Alert intake/correlation.
- Evidence Planner.
- Entity Context.
- Timeline.
- Triage Candidate.
- Ticket Draft.

핵심 KPI:
- 조사 준비 시간 단축.
- 티켓 품질 표준화.
- 누락 증거 감소.

### 10.3 Operations Quality Pack

대상: 룰/로그/CSOP 운영 부채가 큰 고객.

기능:
- Noisy rule finding.
- Log health finding.
- CSOP drift.
- Knowledge debt.
- Monthly SOC quality report.

핵심 KPI:
- 반복 오탐 감소.
- 로그 누락 탐지.
- 고객별 예외/승인 정책 최신화.

### 10.4 AI Assurance Pack

대상: AI 도입 리스크를 우려하는 고객/규제 산업.

기능:
- Agent trace/audit.
- Replay/shadow evaluator.
- Prompt injection guard.
- Evidence quality report.
- Model/prompt/policy version regression.

핵심 KPI:
- AI 결과 감사 재현성.
- 안전한 AI 운영 통제.

### 10.5 Supervised Response Preparation Pack

대상: SOAR가 있거나 고객 승인 프로세스가 명확한 조직.

기능:
- Approval Package.
- SOAR dry-run.
- Impact analysis.
- Rollback/alternative action.
- Manual Action Request.

주의:
- 실행 자동화가 아니라 승인 전 준비 자동화로 판매한다.

## 11. 주요 리스크와 대응

| 리스크 | 영향 | 대응 |
|---|---|---|
| 고객 데이터 부족 | ML 성능 검증 어려움 | 공개/replay/synthetic으로 PoC 시작, shadow에서 실제 분포 보정 |
| 벤더별 로그 스키마 차이 | connector 비용 증가 | OCSF/ECS 유사 normalized schema + adapter pattern |
| LLM hallucination | 잘못된 SOC 판단 | citation gate, evidence gate, unsupported conclusion 차단 |
| 고위험 자동화 사고 | 운영/법적 리스크 | MVP 자동조치 금지, policy/action catalog, approval matrix |
| prompt injection | agent hijack 가능 | source isolation, guard, quarantine, red-team tests |
| 테넌트 경계 우회 | 치명적 보안 사고 | tenant_id mandatory, row-level policy, test case 필수 |
| 평가셋 leakage/overfit | PoC 성능 과장 | public/replay/synthetic/shadow 분리, time-split validation |
| 분석가 불신 | 도입 실패 | evidence-first UI, override reason, transparent trace |

## 12. 즉시 다음 행동

1. 본 계획을 기준으로 `22_데이터셋_및_평가전략.docx` 또는 markdown 정본 문서를 추가한다.
2. `20_기술스택_및_상세설계.docx`에 Evaluation/ML/Assurance API와 데이터셋 관리 구조를 보강한다.
3. `14_테스트_케이스.docx`에 아래 테스트를 추가한다.
   - synthetic prompt injection.
   - cross-tenant entity access.
   - missing evidence no-verdict.
   - citation 없는 ticket draft reject.
   - replay metrics regression.
4. PoC dataset shortlist를 1차 확정한다.
   - 1순위: Splunk BOTS v3 또는 OTRF Security Datasets.
   - 2순위: UNSW-NB15/CICIDS 계열은 모델 baseline용.
   - 3순위: LANL/CERT는 entity/insider 확장용.
5. Synthetic Alert Generator v0를 먼저 만든다.
   - 실제 connector가 없어도 demo와 테스트가 가능해진다.
6. Evaluation Protocol v0.1을 먼저 확정한다.
   - Agent 기능보다 평가 기준이 먼저 있어야 과장된 AI 데모를 막을 수 있다.

## 13. 참고/확인 출처

로컬 문서:

- `docx/00_업데이트_요약_및_추적성_매트릭스.docx`
- `docx/01_아이데이션_전략_업데이트.docx`
- `docx/03_요구사항_정의서.docx`
- `docx/08_기능_정의서.docx`
- `docx/10_ERD.docx`
- `docx/12_API_인터페이스_정의서.docx`
- `docx/14_테스트_케이스.docx`
- `docx/20_기술스택_및_상세설계.docx`
- `docx/21_PoC_및_로드맵_업데이트.docx`
- `AI_SOC_Agent_Service_상향업데이트_사업제안서.pptx`

공개 출처 확인:

- UNSW-NB15 Dataset: https://research.unsw.edu.au/projects/unsw-nb15-dataset
- Bot-IoT Dataset: https://research.unsw.edu.au/projects/bot-iot-dataset
- TON_IoT Datasets: https://research.unsw.edu.au/projects/toniot-datasets
- LANL Comprehensive Multi-Source Cyber-Security Events: https://csr.lanl.gov/data/cyber1/
- CMU CERT Insider Threat Test Dataset: https://kilthub.cmu.edu/articles/dataset/Insider_Threat_Test_Dataset/12841247
- OTRF Security Datasets: https://github.com/OTRF/Security-Datasets
- Splunk BOTS v3: https://github.com/splunk/botsv3
- Atomic Red Team: https://github.com/redcanaryco/atomic-red-team
- MITRE Caldera: https://github.com/mitre/caldera
- SigmaHQ Sigma: https://github.com/SigmaHQ/sigma
- MITRE ATT&CK: https://attack.mitre.org/
- MITRE D3FEND: https://d3fend.mitre.org/

확인 중 제약:

- CICIDS2017/2018 페이지는 SSL certificate chain 문제로 본 실행 환경에서 직접 페이지 확인이 실패했다. 후보에서는 유지하되 실제 사용 전 다운로드/라이선스/무결성 확인이 필요하다.
- arXiv API는 본 작업 중 rate exceeded가 발생해 Semantic Scholar와 공개 웹/GitHub 출처 위주로 확인했다.
