# DECISION_LOG

1. Do not overwrite v3.1; create `insurance-fds-field-pseudonymized-v3.2-exact-coordinate-overwrite`.
2. Use paired pristine template images for v3.2 to guarantee pixel-level same-layout behavior.
3. Record `paired_no_dataset_id`, `paired_no_image_path`, and `paired_no_field_json_path` in every AF JSON.
4. Validate all pairs with bbox equality and pixel diff containment.
5. Update the reusable FDS data engineering skill with the exact-coordinate AF rule.
