# Decision Log

1. Do not use insurer claim forms as Case 1 originals for this cycle.
   - Decision: exclude by keyword and document_type gate.
   - Reason: user specifically corrected that actual 제출서류 images were not being acquired.

2. Use public official/quasi-official blank forms and public samples only.
   - Decision: `generated_or_synthetic=false`, `actual_document_origin=external_web_or_file` for source records.
   - Reason: avoid real PII while still grounding layouts in external documents.

3. Keep safety labels out of document pixels.
   - Decision: AF/NO labels exist in manifest/contact-sheet captions, not inside document images.
   - Reason: avoid shortcut labels that damage FDS realism.

4. Treat text-layer and no-text-layer PDFs differently.
   - Decision: PyMuPDF word bbox first; image table/text-band fallback second.
   - Reason: real web/public PDFs include both vector text and scanned/image pages.
