# Evidence Units

## RED test

```yaml
command: python -m unittest implementation_seed.tests.test_replay_feedback_graph -v
workdir: J:/PortableApps/genai/A3Work/AI_SOC_Agent_Service
exit_code: 1
observed: ModuleNotFoundError: No module named 'replay_feedback_graph'
verified_at: 2026-06-04T14:32+09:00
```

## Targeted GREEN test

```yaml
command: python -m unittest implementation_seed.tests.test_replay_feedback_graph -v
workdir: J:/PortableApps/genai/A3Work/AI_SOC_Agent_Service
exit_code: 0
observed: Ran 4 tests in 0.031s OK
verified_at: 2026-06-04T14:40+09:00
```

## Full relevant test suite

```yaml
command: python -m unittest discover -s implementation_seed/tests -v
workdir: J:/PortableApps/genai/A3Work/AI_SOC_Agent_Service
exit_code: 0
observed: Ran 45 tests in 0.343s OK
verified_at: 2026-06-04T14:38+09:00
```

## Artifact consistency check

```yaml
command: python inline JSON assertions over replay_feedback_report_v1.json, replay_feedback_graph_v1.json, agent_module_catalog_v1.json
workdir: J:/PortableApps/genai/A3Work/AI_SOC_Agent_Service
exit_code: 0
observed:
  graph_id: ai_soc_replay_feedback_langgraph_seed_v1
  decision: go_for_next_seed
  default_backend: local_on_prem_llm
  demo_fallback: oauth_current_session_model
  live_llm_called: false
verified_at: 2026-06-04T14:38+09:00
```

## Generated artifacts

```yaml
artifacts:
  - J:/PortableApps/genai/A3Work/AI_SOC_Agent_Service/implementation_seed/reports/replay_feedback_graph_v1.json
  - J:/PortableApps/genai/A3Work/AI_SOC_Agent_Service/implementation_seed/reports/replay_feedback_graph_v1.mmd
  - J:/PortableApps/genai/A3Work/AI_SOC_Agent_Service/implementation_seed/reports/replay_feedback_report_v1.json
  - J:/PortableApps/genai/A3Work/AI_SOC_Agent_Service/implementation_seed/reports/replay_feedback_graph.stdout.json
```
