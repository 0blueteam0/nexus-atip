# Feedback

## User requirement alignment

The implementation preserves the user's fixed requirements:

- no visible masks in training images
- no block/redaction shortcuts in training images
- no `합성전용` or `실제 제출불가` labels in training images
- exact-coordinate pseudonymization remains gated behind field inventory
- real-web originals remain provenance inputs, not automatically promoted training data

## Follow-up feedback needed later

Before moving from inventory to actual generation, the user may need to choose whether OCR/KIE should be implemented first with a local OCR engine, a VLM-assisted review tool, or a manual review JSON ingestion path.
