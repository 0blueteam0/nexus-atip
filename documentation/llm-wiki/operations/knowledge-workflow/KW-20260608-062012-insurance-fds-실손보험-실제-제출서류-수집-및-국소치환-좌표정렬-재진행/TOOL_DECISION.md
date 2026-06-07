# Tool Decision

- `uv run --with pymupdf --with pillow`: chosen for lightweight PDF rendering and image operations without altering the active Hermes venv.
- PyMuPDF word extraction: chosen for text-layer PDFs where label/value bbox can be grounded in PDF coordinates.
- PIL pixel analysis fallback: chosen because tesseract/pytesseract were not installed; fallback still derives coordinates from rendered document pixels rather than arbitrary ratios.
- `pytest`: used for regression gates. Network-dependent test was converted to deterministic local fake-PDF test; real web collection remains verified by the explicit generation command and manifest.
- `vision_analyze`: used for final visual inspection of contact sheet.
