# Tooling

## Commands

```bash
uvx --from pytest --with pillow pytest tests/test_insurance_fds_real_image_field_inventory.py -q --tb=short
uvx --from pytest --with pillow --with openpyxl --with requests pytest tests/test_insurance_fds_*.py -q --durations=12
powershell.exe -NoProfile -ExecutionPolicy Bypass -File J:/PortableApps/genai/handoff.ps1 provider
powershell.exe -NoProfile -ExecutionPolicy Bypass -File J:/PortableApps/genai/handoff.ps1 "insurance-fds-field-inventory" "..."
```

## Notes

`uvx` was chosen because `python -m pytest` failed in the active Hermes venv with `No module named pytest`.
