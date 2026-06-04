# ONTOLOGY_EDGES

- insurance_fds_dataset -> has_version -> insurance-fds-field-pseudonymized-v3.2-exact-coordinate-overwrite
- AF_EXACT_COORD -> paired_with -> NO_EXACT_COORD
- AF_EXACT_COORD -> overwrites -> same_field_bbox
- same_field_bbox -> validates_against -> pixel_diff_containment
- pair_manifest -> records -> no_af_lineage
- exact_coordinate_validation -> verifies -> no_shifted_box_policy
