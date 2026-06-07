# Evidence Units

## E1: targeted tests

- command: `PYTHONPATH=. uv run --with pytest --with pymupdf --with pillow python -m pytest tests/test_insurance_fds_real_submission_cycle.py -q`
- exit_code: 0
- result: `5 passed in 0.95s`
- verified_at: 2026-06-08T06:xx+09:00

## E2: real generation cycle

- command: `PYTHONPATH=. uv run --with pymupdf --with pillow python scripts/insurance_fds_real_submission_cycle.py --output-root "data/insurance-fds-generated/real-submission-bbox-cycle-v0_3"`
- exit_code: 0
- validation.ok: true
- source_count: 4
- field_target_count: 12
- pair_count: 12
- outside_target_changed_pixels: all 0
- document_types: `medical_detail_statement`, `medical_receipt`, `pharmacy_receipt`
- artifact_path: `J:/PortableApps/genai/data/insurance-fds-generated/real-submission-bbox-cycle-v0_3`

## E3: generated manifest/index/contact sheet

- manifest: `J:/PortableApps/genai/data/insurance-fds-generated/real-submission-bbox-cycle-v0_3/manifests/real_submission_bbox_local_substitution_manifest.json`
- index: `J:/PortableApps/genai/data/insurance-fds-generated/real-submission-bbox-cycle-v0_3/indexes/real_submission_bbox_local_substitution_index.ko.md`
- contact_sheet: `J:/PortableApps/genai/data/insurance-fds-generated/real-submission-bbox-cycle-v0_3/indexes/real_submission_bbox_local_substitution_contact_sheet.png`

## E4: visual inspection

- tool: `vision_analyze`
- result: contact sheet shows 약제비 계산서ㆍ영수증, 진료비 계산서ㆍ영수증, 진료비 세부산정내역서 previews plus NO/AF local substitutions. No visible AF/합성/제출불가 shortcut labels inside document pixels; labels appear only in the contact sheet captions outside document images.
