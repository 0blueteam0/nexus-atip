---
type: handoff
status: active
project: insurance-fds-data
updated: 2026-06-04T16:50:47+09:00
---

# Handoff

## 현재 상태

## 완료된 것

## 검증된 것

## 아직 위험한 것

## 열린 질문

## 다음 액션

## 반드시 읽을 문서

## 관련 도구와 스크립트

## 다시 논의하지 않아도 되는 결정



## Handoff
- Read scripts/insurance_fds_priority_pipeline.py for priority artifacts.
- Read scripts/insurance_fds_camera_image_generator.py for scanner/phone rendering and metadata generation.
- Main generated manifests: data/insurance-fds-generated/priority-v1/manifests/priority_manifest.json and data/insurance-fds-generated/priority-camera-v1/manifests/camera_image_manifest.json.
- Tests: pytest tests/test_insurance_fds_camera_image_generator.py tests/test_insurance_fds_priority_pipeline.py -q
