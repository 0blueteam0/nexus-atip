# Insights

1. The correct continuation point is `real-image-redteam-v1`, not v3.
2. Current v1 has correct public-real-image lineage but wrong AF editing mechanics.
3. Models should locate and verify fields; deterministic code should perform the actual edit.
4. Diffusion/FLUX/SDXL should be constrained to background repair only, never full document regeneration or text generation.
5. MVP should begin with amount/date/receipt-number fields because they have strong OCR/regex anchors.
