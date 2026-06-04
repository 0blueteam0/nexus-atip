# Tooling

- Python/Pillow used for deterministic image rendering and metadata artifacts.
- HuggingFace public REST API used because hf CLI and huggingface_hub package were unavailable.
- Tesseract and pytesseract unavailable; OCR report records engine_probe instead of fabricated recognition.
- ComfyUI local server unavailable; generated and checked dry-run ComfyUI contract only.
- pytest used for RED/GREEN verification.
