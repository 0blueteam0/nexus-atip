# Evidence Units

## RED

```
PYTHONPATH=. uv run --with pytest pytest tests/test_insurance_fds_five_case_coverage.py -q
3 failed, 6 passed
KeyError: high_fidelity_quality_policy
KeyError: korean_directory_prefix
```

## GREEN / regression

```
PYTHONPATH=. uv run --with pytest --with pillow pytest tests/test_insurance_fds_five_case_coverage.py tests/test_insurance_fds_four_case_coverage.py tests/test_insurance_fds_real_image_field_inventory.py tests/test_insurance_fds_real_image_pinpoint_overwrite.py -q
16 passed in 0.35s
```

## Web search collection summary

- Case 1 source candidates: 20 search results.
- Case 2 tool source candidates: 20 search results.
- Artifacts created under five-case-dataset-ko.
