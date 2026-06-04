# Handoff

Next operator should inspect:
- scripts/insurance_fds_priority_pipeline.py
- scripts/insurance_fds_camera_image_generator.py
- tests/test_insurance_fds_priority_pipeline.py
- tests/test_insurance_fds_camera_image_generator.py

Verification command:
pytest tests/test_insurance_fds_camera_image_generator.py tests/test_insurance_fds_priority_pipeline.py -q
Observed exit_code: 0, output: 9 passed in 31.52s.
