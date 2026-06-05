# Worklog

## Commands and evidence

| step | command | exit_code | artifact_path | verified_at | result |
|---|---|---:|---|---|---|
| baseline-1 | `PYTHONPATH=. python run_demo.py && PYTHONPATH=. pytest -q` | 1 | terminal output | 2026-06-05T09:35+09:00 | dependency blocker: numpy missing |
| install | `python -m pip install -r requirements.txt pytest` | 0 | requirements.txt | 2026-06-05T09:36+09:00 | dependencies installed |
| baseline-2 | `PYTHONPATH=. python run_demo.py && PYTHONPATH=. pytest -q` | 1 | terminal output | 2026-06-05T09:37+09:00 | font path blocker found |
| font-test | `PYTHONPATH=. pytest -q && PYTHONPATH=. python run_demo.py` | 0 | outputs/qc_report.json | 2026-06-05T09:38+09:00 | v3 behavior restored |
| v4-red | `PYTHONPATH=. pytest tests/test_v4_reference_lab.py -q` | 2 | tests/test_v4_reference_lab.py | 2026-06-05T09:40+09:00 | missing v4 modules produced expected red state |
| v4-green | `PYTHONPATH=. pytest tests/test_v4_reference_lab.py -q` | 0 | src/claim_fds_synth/v4_lab.py | 2026-06-05T09:44+09:00 | v4 tests passed |
| final-test | `PYTHONPATH=. pytest -q` | 0 | terminal output | 2026-06-05T09:49+09:00 | 6 passed |
| final-demo | `PYTHONPATH=. python run_demo.py` | 0 | outputs/v4_lab/qc_report_v4.json | 2026-06-05T09:50+09:00 | v4_lab ok true and quality_gate pass true |

## Changed artifacts

- `src/claim_fds_synth/layout.py`: Windows Korean font fallback.
- `src/claim_fds_synth/montage.py`: reuse font fallback.
- `src/claim_fds_synth/reference_profiler.py`: safe reference statistics only.
- `src/claim_fds_synth/template_family.py`: profile-based synthetic template sampler.
- `src/claim_fds_synth/consistency_graph.py`: bundle edge reason codes.
- `src/claim_fds_synth/quality_gate.py`: v4 quality gate checks.
- `src/claim_fds_synth/v4_lab.py`: v4 lab orchestrator and JSONL/splits output.
- `tests/test_v4_reference_lab.py`: TDD coverage.
- `run_demo.py`: v4 output generation hook.
- `README.md`: usage and limitations.
- `V4_REFERENCE_CALIBRATION_NOTES.md`: fidelity strategy and Hermes reasoning notes.
