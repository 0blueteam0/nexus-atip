# Work-command Handoff

## For next agent/provider

읽을 파일:

- `documentation/analysis/insurance-fds-camera-image-data-differentiation.ko.md`
- `scripts/insurance_fds_camera_image_generator.py`
- `tests/test_insurance_fds_camera_image_generator.py`
- `data/insurance-fds-generated/camera-v1/manifests/camera_image_manifest.json`

재현 명령:

```bash
python scripts/insurance_fds_camera_image_generator.py --source-root data/insurance-fds-generated/demo-v1 --output data/insurance-fds-generated/camera-v1 --variants-per-document 3 --seed 20260604
pytest tests/test_insurance_fds_synthetic_generator.py tests/test_insurance_fds_camera_image_generator.py -q
```

다음 구현 후보:

- OCR roundtrip scoring script.
- ComfyUI workflow API JSON generation from contract.
- FK public case abstraction generator.
