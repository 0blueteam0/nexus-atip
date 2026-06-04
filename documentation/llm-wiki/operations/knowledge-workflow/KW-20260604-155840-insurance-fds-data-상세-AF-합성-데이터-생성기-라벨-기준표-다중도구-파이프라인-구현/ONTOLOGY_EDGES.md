---
type: ontology_edges
status: draft
project: insurance-fds-data
created: 2026-06-04T15:58:40+09:00
---

# Ontology Edges

| subject | predicate | object | evidence_id | note |
|---|---|---|---|---|
|  |  |  |  |  |


## Ontology edges - insurance FDS synthetic data
- insurance_fds_data -> uses -> synthetic_document_generator
- synthetic_document_generator -> emits -> structured_json
- synthetic_document_generator -> emits -> html_template
- synthetic_document_generator -> emits -> svg_template
- synthetic_document_generator -> emits -> diffusion_prompt_pack
- AF_AMOUNT_INFLATION -> detected_by -> business_rule_engine
- AF_CROSSDOC_DATE_CONFLICT -> detected_by -> temporal_consistency_checker
- AF_FONT_LAYOUT_ANOMALY -> detected_by -> image_forensic_model
- insurance_claim_group -> guarded_by -> split_leakage_policy

verified_at: 2026-06-04T16:13:10+09:00
