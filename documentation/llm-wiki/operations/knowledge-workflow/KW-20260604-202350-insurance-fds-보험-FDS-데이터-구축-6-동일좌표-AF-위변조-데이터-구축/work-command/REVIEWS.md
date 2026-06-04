# REVIEWS

## Self-review checklist

- Requirement matched: AF uses same field bbox as paired NO.
- No shifted box: `overlay_or_shifted_box_used=false` in tamper evidence.
- Pair lineage: AF JSON includes `paired_no_dataset_id`, `paired_no_image_path`, `paired_no_field_json_path`.
- Automated verification: validation JSON checks bbox equality and pixel diff containment.
- Visual verification: contact sheet inspected; no large overlay or shifted box observed.

## Known limitations

- v3.2 is synthetic template data, not OCR-extracted real-image data.
- Geometric scanner/mobile augmentation is intentionally not used in this exact-coordinate version to avoid bbox drift unless transformed bbox is modeled.
