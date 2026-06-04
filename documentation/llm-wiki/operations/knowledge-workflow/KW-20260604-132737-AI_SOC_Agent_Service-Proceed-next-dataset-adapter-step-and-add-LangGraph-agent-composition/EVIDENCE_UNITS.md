# Evidence Units

```json
[
  {
    "command": "python -m ensurepip --upgrade && python -m pip install --upgrade pip && python -m pip install langgraph && python - <<'PY' ...",
    "exit_code": 0,
    "artifact_path": "Python environment",
    "verified_at": "2026-06-04T13:xx+09:00",
    "summary": "Installed langgraph and verified StateGraph import."
  },
  {
    "command": "python -m unittest implementation_seed.tests.test_otrf_contract_builder implementation_seed.tests.test_langgraph_agent_composition -v",
    "exit_code": 1,
    "artifact_path": "implementation_seed/tests",
    "summary": "RED: missing new modules."
  },
  {
    "command": "python implementation_seed/scripts/otrf_contract_builder.py > implementation_seed/reports/otrf_contract_builder.stdout.json && python implementation_seed/scripts/langgraph_agent_composition.py > implementation_seed/reports/langgraph_agent_composition.stdout.json && python -m unittest implementation_seed.tests.test_otrf_contract_builder implementation_seed.tests.test_langgraph_agent_composition -v && python -m unittest discover -s implementation_seed/tests -v && python -m py_compile implementation_seed/scripts/*.py implementation_seed/tests/*.py",
    "exit_code": 0,
    "artifact_path": "implementation_seed/reports",
    "summary": "Generated OTRF/LangGraph reports, 6 targeted tests OK, 34 full tests OK, py_compile OK."
  }
]
```
