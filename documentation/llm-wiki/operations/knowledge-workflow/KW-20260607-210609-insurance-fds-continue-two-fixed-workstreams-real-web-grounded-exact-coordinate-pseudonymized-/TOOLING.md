# Tooling

## Verification commands used

```bash
uvx --from pytest --with pillow pytest tests/test_insurance_fds_real_image_field_inventory.py -q --tb=short
uvx --from pytest --with pillow --with openpyxl --with requests pytest tests/test_insurance_fds_*.py -q --durations=12
```

## Notes

- `python -m pytest` failed because the active Hermes venv has no pytest.
- `uvx` supplied isolated pytest dependencies without modifying the Hermes venv.
