# Ontology Edges

- Case1NormalClaimDocumentCollection -> uses -> OfficialExternalPublicBlankForms
- OfficialExternalPublicBlankForms -> excludes -> GeneratedSyntheticDocuments
- RealExternalDocumentManifest -> records -> sha256
- RealExternalDocumentManifest -> requires -> HumanVisualReview
- Case3LocalTamperGrounding -> should_reference -> Case1RealExternalFieldStructure
- Case5NewGenerationGrounding -> should_reference -> Case1RealExternalDocumentContracts
