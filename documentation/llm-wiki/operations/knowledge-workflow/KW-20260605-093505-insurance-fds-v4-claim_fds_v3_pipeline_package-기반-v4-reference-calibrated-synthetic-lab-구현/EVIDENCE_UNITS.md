# Evidence Units

| command/artifact | exit_code | evidence |
|---|---:|---|
| `PYTHONPATH=. pytest -q && PYTHONPATH=. python run_demo.py` after font fallback | 0 | baseline restored |
| `PYTHONPATH=. pytest tests/test_v4_reference_lab.py -q` after v4 modules | 0 | 3 passed |
| `PYTHONPATH=. pytest -q` final | 0 | 6 passed |
| `PYTHONPATH=. python run_demo.py` final | 0 | v4_lab ok true, quality_gate pass true |
| `outputs/v4_lab/qc_report_v4.json` | n/a | overflow free, critical not truncated, benign not fraud, mask aligned |
| `outputs/v4_lab/reference_profile.v1.json` | n/a | document_count 8, stores_source_pixels false, ocr_text_extracted false |
