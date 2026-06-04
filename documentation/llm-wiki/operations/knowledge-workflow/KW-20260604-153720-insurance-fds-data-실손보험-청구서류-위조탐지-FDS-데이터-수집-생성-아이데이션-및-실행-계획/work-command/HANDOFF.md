# WORK-COMMAND HANDOFF

Primary artifacts:
- J:/PortableApps/genai/documentation/llm-wiki/projects/insurance-fds-data/INSURANCE_FDS_DATA_PLAN.md
- J:/PortableApps/genai/documentation/llm-wiki/projects/insurance-fds-data/source_catalog.json
- J:/PortableApps/genai/documentation/llm-wiki/projects/insurance-fds-data/dataset_schema.json
- J:/PortableApps/genai/data/insurance-fds-seed/manifests/insurance_fds_source_manifest.json

Next operator should:
1. Verify source_catalog entries and licenses.
2. Fill FK verified case URLs.
3. Add document renderer and OCR evaluator.
4. Consider Hermes cron/webhook monitoring only after a stable source list exists.
