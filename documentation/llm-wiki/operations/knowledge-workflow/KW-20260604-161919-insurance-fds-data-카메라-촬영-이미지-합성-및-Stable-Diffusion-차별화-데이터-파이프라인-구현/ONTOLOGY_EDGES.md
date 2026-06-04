# Ontology Edges

- insurance_fds -> requires -> claim_document_image_data
- claim_document_image_data -> includes -> camera_captured_document
- camera_captured_document -> has_metadata -> submission_channel
- AF_camera_image -> has_supervision -> tamper_mask
- tamper_mask -> projected_from -> structured_forensic_annotations
- stable_diffusion_contract -> controls -> image_diversification
- image_diversification -> must_preserve -> synthetic_no_real_pii
- ocr_roundtrip -> evaluates -> camera_image_quality
