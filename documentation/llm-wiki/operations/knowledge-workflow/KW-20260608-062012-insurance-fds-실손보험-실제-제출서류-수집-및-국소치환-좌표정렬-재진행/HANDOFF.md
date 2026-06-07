# Handoff

Next agent/provider should start from:

- Script: `J:/PortableApps/genai/scripts/insurance_fds_real_submission_cycle.py`
- Tests: `J:/PortableApps/genai/tests/test_insurance_fds_real_submission_cycle.py`
- Output root: `J:/PortableApps/genai/data/insurance-fds-generated/real-submission-bbox-cycle-v0_3`
- Manifest: `J:/PortableApps/genai/data/insurance-fds-generated/real-submission-bbox-cycle-v0_3/manifests/real_submission_bbox_local_substitution_manifest.json`
- Index: `J:/PortableApps/genai/data/insurance-fds-generated/real-submission-bbox-cycle-v0_3/indexes/real_submission_bbox_local_substitution_index.ko.md`

Validated state:

- 4 external-web/public source PDFs promoted.
- 12 field targets extracted.
- 12 NO/AF same-bbox local substitution pairs generated.
- outside-target changed pixels are all 0.
- Targeted test file passes: 5 passed.

Remaining improvement candidates:

1. Add real prescription PDF/image sources.
2. Add true OCR engine path if tesseract/marker is installed in an isolated environment.
3. Improve semantic label-value pairing for no-text-layer scans; current fallback is pixel-structure-based rather than OCR label-aware.
4. Expand Case 4 bundle rules using the generated field inventory.
