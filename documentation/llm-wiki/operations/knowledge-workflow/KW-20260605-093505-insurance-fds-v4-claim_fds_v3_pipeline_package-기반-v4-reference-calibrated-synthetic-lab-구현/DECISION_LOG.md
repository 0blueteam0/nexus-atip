# Decision Log

1. Keep v3 behavior passing before feature work.
2. Add font fallback rather than changing generator.yaml defaults, so Linux behavior remains compatible.
3. Store only reference statistics, not source pixels/OCR text.
4. Treat folded/crumpled/torn as benign document condition by default.
5. Generate v4 lab under `outputs/v4_lab/` to avoid breaking existing v3 output contracts.
