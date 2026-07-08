---
type: evidence_unit
status: draft
id:
project: Red Team Studio
created: 2026-07-08T09:45:51+09:00
---

# Evidence Unit

## Claim

## Source

- source_type:
- path_or_url:
- command:
- exit_code:
- collected_at:

## Evidence

## Confidence

## Limits

## Related Decisions

# Evidence Units

| id | evidence | result |
| --- | --- | --- |
| EV-SEMGREP-SOURCE-001 | PyPI search/open for Semgrep 1.168.0 and Semgrep CE page | Latest release and Windows pip install path confirmed. |
| EV-SEMGREP-INSTALL-001 | `python -m venv ...semgrep_1.168.0_venv`; `python -m pip install semgrep==1.168.0` | Exit 0, installed in isolated tool venv. |
| EV-SEMGREP-HASH-001 | `Get-FileHash .../semgrep.exe` | SHA256 `e491cc3b210a71e650140da5b5d2661183cbc44b9e6b20bc31624dd5dc975ab4`. |
| EV-SEMGREP-VERSION-001 | `semgrep.exe --version` | `1.168.0`, exit 0. |
| EV-SEMGREP-SCAN-001 | `semgrep scan --quiet --config rules/redteam_ax_print_observation.yml --json input/sample_helper.py` | Exit 0, JSON result with one local training observation. |
| EV-VENV-RESTORE-001 | Project `.venv` Semgrep uninstall and dependency restore; `pip check` | Semgrep-introduced conflicts removed; remaining warnings are pre-existing `flare-floss/python-fx` dependency warnings. |
| EV-TEST-001 | `py_compile runtime/redteam_v2_models.py` | Exit 0. |
| EV-TEST-002 | selected `unittest` for presets/execution/normalizers | 3 tests OK. |
| EV-TEST-003 | frontend runtime and launch readiness contracts | Both passed. |
| EV-SMOKE-001 | TestClient governed execution Semgrep+Bandit | `executed_count=2`, `collected_count=2`, agents `TOOL-SEMGREP-001`, `TOOL-BANDIT-001`. |
