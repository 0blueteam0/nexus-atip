# INSIGHTS

- JSON bbox equality alone is insufficient if AF and NO are separately rendered or separately geometrically transformed.
- For exact-coordinate AF data, AF should be derived by copying the paired NO source image and rewriting only the original field bbox.
- The manifest must encode pair lineage, not just prefix and document type.
- Pixel diff outside bbox is a practical guard against accidental overlays, shifted boxes, or full-image render drift.
