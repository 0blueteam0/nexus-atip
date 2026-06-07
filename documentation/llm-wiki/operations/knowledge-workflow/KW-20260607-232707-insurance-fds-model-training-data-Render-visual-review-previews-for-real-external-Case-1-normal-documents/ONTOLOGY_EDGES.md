# Ontology Edges

- RealExternalDocumentManifest -> produces -> VisualReviewPreviewManifest
- VisualReviewPreviewManifest -> includes -> FirstPagePreviewImage
- FirstPagePreviewImage -> requires -> HumanVisualReview
- VisualReviewPreviewManifest -> excludes -> GeneratedSyntheticDocuments
- HumanVisualReview -> gates -> OCRKIEFieldCoordinateExtraction
