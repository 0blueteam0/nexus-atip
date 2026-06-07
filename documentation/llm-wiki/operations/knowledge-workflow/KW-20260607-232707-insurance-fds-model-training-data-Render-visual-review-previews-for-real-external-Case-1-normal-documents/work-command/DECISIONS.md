# Decisions

- Keep preview generation separate from training approval.
- Preview images inherit `generated_or_synthetic=false` only because their originals are external non-generated documents; previews are review artifacts, not new source originals.
- Every preview remains `needs_human_visual_review` and `needs_public_blank_form_or_no_pii_confirmation`.
- Vision sanity checks may support review but must not replace source provenance and human verification.

updated_at: 2026-06-07T23:32:03
