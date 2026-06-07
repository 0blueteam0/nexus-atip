# Evidence Units

## RED

```
PYTHONPATH=. uv run --with pytest pytest tests/test_insurance_fds_five_case_coverage.py -q
ModuleNotFoundError: No module named 'scripts.insurance_fds_five_case_coverage'
```

## GREEN

```
PYTHONPATH=. uv run --with pytest pytest tests/test_insurance_fds_five_case_coverage.py -q
5 passed in 0.07s
```

## Matrix generation

```
python scripts/insurance_fds_five_case_coverage.py --taxonomy data/insurance-fds-generated/taxonomy/five_case_taxonomy_v0_2.json --output data/insurance-fds-generated/taxonomy/five_case_coverage_matrix_v0_2.json
ok: true, case_count: 5, missing_case_families: []
```

## Regression

```
PYTHONPATH=. uv run --with pytest --with pillow pytest tests/test_insurance_fds_five_case_coverage.py tests/test_insurance_fds_four_case_coverage.py tests/test_insurance_fds_real_image_field_inventory.py tests/test_insurance_fds_real_image_pinpoint_overwrite.py -q
13 passed in 0.35s
```
