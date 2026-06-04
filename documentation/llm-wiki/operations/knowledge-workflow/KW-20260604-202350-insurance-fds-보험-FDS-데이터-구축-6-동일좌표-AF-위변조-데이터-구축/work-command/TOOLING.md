# TOOLING

## Tools used

- `session_search`: retrieved prior #6 context.
- `skill_view`: loaded FDS and TDD workflows.
- `write_file`: wrote test, generator, and report files.
- `terminal`: ran RED/GREEN tests, generated dataset, executed validation, and closed knowledge workflow.
- `read_file`: inspected v3.1 generator/tests and v3.2 validation artifacts.
- `vision_analyze`: visually inspected contact sheet.
- `skill_manage`: patched reusable FDS skill.

## Commands

- `pytest tests/test_insurance_fds_exact_coordinate_pipeline.py -q`
- `python scripts/insurance_fds_exact_coordinate_pipeline.py --template-cases 8`
- `pytest tests/test_insurance_fds_exact_coordinate_pipeline.py tests/test_insurance_fds_field_pseudonymized_pipeline.py tests/test_insurance_fds_public_image_collector.py tests/test_insurance_fds_real_image_redteam_generator.py tests/test_insurance_fds_camera_image_generator.py tests/test_insurance_fds_priority_pipeline.py tests/test_insurance_fds_synthetic_generator.py -q`
