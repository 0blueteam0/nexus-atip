# Evidence Units

## Commands

- command: `python -m pip install pillow`
  - exit_code: 0
  - evidence: Pillow 12.2.0 installed.

- command: `pytest tests/test_insurance_fds_camera_image_generator.py -q` after RED
  - exit_code: 1
  - evidence: 4 failures because `scripts/insurance_fds_camera_image_generator.py` did not exist.

- command: `pytest tests/test_insurance_fds_camera_image_generator.py -q` after implementation
  - exit_code: 0
  - evidence: 4 passed in 28.27s, later 4 passed in 21.42s.

- command: `python scripts/insurance_fds_camera_image_generator.py --source-root data/insurance-fds-generated/demo-v1 --output data/insurance-fds-generated/camera-v1 --variants-per-document 3 --seed 20260604`
  - exit_code: 0
  - evidence: `{"camera_manifest": "data\insurance-fds-generated\camera-v1\manifests\camera_image_manifest.json", "items": 48}`

- command: manifest inspection with PIL through project Python
  - exit_code: 0
  - evidence: 48 items, NO 24, AF 24, first image 1400x1600, AF positive masks 24, contracts exist 2.

- command: `pytest tests/test_insurance_fds_synthetic_generator.py tests/test_insurance_fds_camera_image_generator.py -q`
  - exit_code: 0
  - evidence: 8 passed in 22.97s.

- command: `pytest tests -q`
  - exit_code: 2
  - evidence: unrelated collection errors for `tests/test_hermes_kanban_langgraph_flow.py` and `tests/test_shrimp_hermes_bridge.py` import modules.

## Public URL reachability

Verified via urllib status checks:

- https://github.com/qcf-568/DocTamper -> 200
- https://github.com/clovaai/cord -> 200
- https://guillaumejaume.github.io/FUNSD/ -> 200
- https://www.cs.cmu.edu/~aharley/rvl-cdip/ -> 200/final redirected to adamharley.com
- https://github.com/fcakyon/midv500 -> 200
- https://github.com/PaddlePaddle/PaddleOCR -> 200
- https://github.com/comfyanonymous/ComfyUI -> 200/final Comfy-Org/ComfyUI
- https://github.com/lllyasviel/ControlNet -> 200
- https://github.com/clovaai/donut -> 200
- https://rrc.cvc.uab.es/?ch=13 -> SSL certificate verify failed in urllib environment; still listed as follow-up via official access path.
