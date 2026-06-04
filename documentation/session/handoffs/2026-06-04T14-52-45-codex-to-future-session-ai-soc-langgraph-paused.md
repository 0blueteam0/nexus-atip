# AI SOC LangGraph 멀티 에이전트 작업 중지/재개 기록

## 상태

- 상태: paused / 추후 진행
- 기록 시각: 2026-06-04T14:52:45+09:00
- 작성자/provider: codex
- 대상 프로젝트: AI_SOC_Agent_Service
- 현재 브랜치: `main`
- push 대상 원격: `agentmon/main` (`https://github.com/0blueteam0/agentmon.git`)

## 마지막 완료 commit

```text
b87d4cdc3f445da363bb5103b2de6daf666b7a70 feat(ai-soc): add replay feedback LangGraph workflow
```

## 사용자가 명시한 진행 방식

- 이 작업은 지금 세션에서 중지한다.
- 나중에 추후 진행한다.
- 다수의 멀티 에이전트와 LangGraph workflow를 하나하나 만들어 본다.
- 사용자가 이후 직접 fine-tuning할 수 있게 산출물을 남긴다.
- 코드 작업에는 아주 자세한 한글 주석/docstring/comment를 남긴다.

## 현재까지 구현된 핵심 산출물

### Replay feedback LangGraph workflow

- `A3Work/AI_SOC_Agent_Service/implementation_seed/scripts/replay_feedback_graph.py`
- `A3Work/AI_SOC_Agent_Service/implementation_seed/tests/test_replay_feedback_graph.py`
- `A3Work/AI_SOC_Agent_Service/implementation_seed/reports/replay_feedback_graph_v1.json`
- `A3Work/AI_SOC_Agent_Service/implementation_seed/reports/replay_feedback_graph_v1.mmd`
- `A3Work/AI_SOC_Agent_Service/implementation_seed/reports/replay_feedback_report_v1.json`
- `A3Work/AI_SOC_Agent_Service/implementation_seed/reports/replay_feedback_graph.stdout.json`

### 문서/프로토콜

- `A3Work/AI_SOC_Agent_Service/implementation_seed/EVALUATION_PROTOCOL.md`
- `A3Work/AI_SOC_Agent_Service/implementation_seed/README.md`
- Knowledge workflow session:
  - `documentation/llm-wiki/operations/knowledge-workflow/KW-20260604-143229-AI_SOC_Agent_Service-Promote-replay-evaluation-agent-to-offline-LangGraph-feedback-graph-with-local-L/`

## 현재 LLM backend 정책

- 운영/온프레미스 목표 backend: `local_on_prem_llm`
- 데모 fallback backend: `oauth_current_session_model`
- 현재 GPT-5.5 계열 모델은 demo fallback 후보로만 기록됨
- 기본 seed/test/artifact 생성에서는 `selected_for_seed=none_dry_run`
- 기본 경로에서는 live LLM call 없음
- 기본 경로에서는 SOC/SIEM/EDR/SOAR/IAM/CMDB connector call 없음
- demo fallback은 redacted/synthetic 입력, human review, no autonomous response 조건에서만 허용

## 마지막 검증 결과

```text
command: python -m unittest discover -s implementation_seed/tests -v
workdir: J:/PortableApps/genai/A3Work/AI_SOC_Agent_Service
result: Ran 45 tests in 0.389s OK
```

```text
command: python tools/knowledge_workflow.py close --session "J:/PortableApps/genai/documentation/llm-wiki/operations/knowledge-workflow/KW-20260604-143229-AI_SOC_Agent_Service-Promote-replay-evaluation-agent-to-offline-LangGraph-feedback-graph-with-local-L"
workdir: J:/PortableApps/genai
result: status OK, failures []
```

## 나중에 재개할 때 먼저 할 일

1. `git fetch agentmon` 후 `main`이 `agentmon/main`의 최신 상태인지 확인한다.
2. 아래 파일을 먼저 읽는다.
   - `A3Work/AI_SOC_Agent_Service/implementation_seed/EVALUATION_PROTOCOL.md`
   - `A3Work/AI_SOC_Agent_Service/implementation_seed/scripts/replay_feedback_graph.py`
   - `A3Work/AI_SOC_Agent_Service/implementation_seed/reports/replay_feedback_report_v1.json`
   - 이 handoff 파일
3. 현재 테스트 기준선을 다시 실행한다.
   - `cd J:/PortableApps/genai/A3Work/AI_SOC_Agent_Service`
   - `python -m unittest discover -s implementation_seed/tests -v`
4. 다음 workflow 후보 중 하나를 선택해 TDD로 시작한다.
   - `analyst_brief_agent`: redacted prompt-contract workflow. local LLM / demo OAuth fallback을 붙이기 가장 적합한 다음 후보.
   - `timeline_investigation_agent`: temporal reasoning benchmark와 timeline assertion 강화.
   - `mitre_context_agent`: retrieval/citation contract 준비.
   - `replay_evaluation_agent`: 실패 case clustering, regression dashboard, module ranking 개선.
5. 새 workflow를 만들 때는 반드시 다음 순서를 지킨다.
   - 실패 테스트 먼저 작성(RED)
   - LangGraph spec JSON 계약 추가
   - node 함수 구현
   - Mermaid artifact 생성
   - report/stdout artifact 생성
   - 상세 한글 주석 추가
   - full test 실행
   - knowledge workflow gate 닫기
   - scoped commit/push

## 중지 사유

사용자가 현재 세션에서는 이 작업을 중지하고, 나중에 추후 진행하겠다고 명시했다. 따라서 새 기능 구현을 더 진행하지 말고, 재개 가능한 기록만 남긴다.
