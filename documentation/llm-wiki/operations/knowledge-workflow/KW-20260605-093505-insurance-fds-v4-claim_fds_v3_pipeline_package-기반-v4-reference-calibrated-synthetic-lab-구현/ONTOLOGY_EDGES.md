# Ontology Edges

- insurance-fds-v4 -> uses -> reference_profile.v1
- reference_profile.v1 -> informs -> template_family.v1
- template_family.v1 -> samples -> synthetic_renderer_profile
- claim_bundle -> contains -> medical_receipt
- claim_bundle -> contains -> medical_detail_statement
- tampered_receipt -> violates -> RECEIPT_DETAIL_TOTAL_MISMATCH
- benign_document_condition -> is_not -> fraud_label
- tamper_mask -> aligns_with -> changed_field_bbox
