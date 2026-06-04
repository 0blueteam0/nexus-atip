# Ontology Edges

- insurance_fds_data -> has_dataset_layer -> NO_normal_documents
- insurance_fds_data -> has_dataset_layer -> FK_public_forgery_labels
- insurance_fds_data -> has_dataset_layer -> AF_synthetic_documents
- medical_receipt -> cross_checks_with -> medical_detail_statement
- prescription -> cross_checks_with -> pharmacy_receipt
- diagnosis_certificate -> cross_checks_with -> admission_discharge_certificate
- claim_form -> cross_checks_with -> payment_account
- document_image -> has_signal -> layout_font_compression_anomaly
- claim_network -> has_node -> hospital/pharmacy/account/device/policy/claim/document
