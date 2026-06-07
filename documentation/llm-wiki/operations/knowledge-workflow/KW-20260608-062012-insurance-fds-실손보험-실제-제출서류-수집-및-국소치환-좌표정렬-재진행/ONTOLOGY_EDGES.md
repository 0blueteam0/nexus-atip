# Ontology Edges

- source: `insurance_fds_real_submission_cycle.py`
  relation: `generates`
  target: `real_submission_bbox_local_substitution_manifest.json`
- source: `REAL-SUB-0001`
  relation: `is_document_type`
  target: `pharmacy_receipt`
- source: `REAL-SUB-0002`
  relation: `is_document_type`
  target: `medical_receipt`
- source: `REAL-SUB-0003`
  relation: `is_document_type`
  target: `medical_detail_statement`
- source: `field_record.value_bbox_px`
  relation: `anchors`
  target: `same_bbox_local_substitution_pair`
- source: `same_bbox_local_substitution_pair`
  relation: `verified_by`
  target: `outside_target_changed_pixels == 0`
