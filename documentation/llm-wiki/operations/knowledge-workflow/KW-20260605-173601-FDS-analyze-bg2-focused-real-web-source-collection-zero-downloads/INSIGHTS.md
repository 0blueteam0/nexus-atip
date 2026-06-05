# Insights

- bg2 zero-download is mostly a source-quality/deep-extraction issue, not a reason to relax OCR/vision gates.
- Many candidates are page-only search results; the next collector increment should extract actual document/PDF assets from page candidates more deeply.
- The one UnicodeEncodeError was a real collector bug and is fixed by percent-encoding URL parts before urllib Request.
- Empty evidence for invalid images made PermissionError diagnosis hard; future runs will retain error type/message in metadata only.
