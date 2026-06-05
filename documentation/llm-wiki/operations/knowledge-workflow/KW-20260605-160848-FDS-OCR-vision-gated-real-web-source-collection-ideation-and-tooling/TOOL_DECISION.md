# Tool Decision

- Python OCR/vision packages installed/verified: RapidOCR, EasyOCR, PaddleOCR, img2table, PyMuPDF, transformers, ultralytics, layoutparser, marker-pdf/surya.
- winget external binaries failed with Access is denied, so Tesseract/Poppler/ImageMagick/Java remain missing.
- Collector now uses pre-download URL/title noise gate plus staging OCR/vision gate before raw_images.
