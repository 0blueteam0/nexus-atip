# Insights

- Root cause 1: previous collection was not reliably constrained to actual hospital/pharmacy submission evidence; this cycle added explicit seed filtering that rejects insurer claim forms and promotes only target document types.
- Root cause 2: prior local substitution could not guarantee exact locality because text was drawn directly on the full image; patch-canvas paste now guarantees outside-target diff remains zero.
- Root cause 3: PyMuPDF word bbox works only for text-layer PDFs. Scanned/image PDFs need a fallback; this cycle adds rendered-pixel table-line/text-band bbox detection.
- Network instability remains for some public sources. Cache fallback prevents successful external downloads from being lost in later runs.
