# Decisions

- Keep FK as abstract actual-pattern IDs only; do not store actual forged artifacts or real PII.
- Use AF for synthetic anomaly samples paired with NO golden anchors.
- Use HuggingFace receipt/OCR datasets only for pretraining/adaptation because direct Korean 실손보험 datasets were not found in live queries.
- Use dry-run ComfyUI contract because the local ComfyUI server was not reachable.
