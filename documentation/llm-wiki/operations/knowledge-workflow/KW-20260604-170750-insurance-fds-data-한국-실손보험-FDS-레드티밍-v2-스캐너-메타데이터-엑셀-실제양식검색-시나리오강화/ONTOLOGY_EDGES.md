# Ontology Edges

- KoreanInsuranceFDS -> uses -> PublicRealImageCandidate
- PublicRealImageCandidate -> derives -> NO_REAL_DERIVED
- PublicRealImageCandidate -> derives -> AF_REAL_DERIVED
- AF_REAL_DERIVED -> hasScenario -> AF_NAME_ALTERATION / AF_VISIT_DATE_ALTERATION / AF_DIAGNOSIS_TO_HIGH_VALUE / AF_EXPENSIVE_DRUG_INSERTION / AF_TOTAL_AMOUNT_INFLATION / AF_SCANNER_METADATA_MISMATCH
- ScannerFlatbed300DPI -> isCaptureProfileOf -> NO_REAL_DERIVED
- ScannerADF200DPI -> isCaptureProfileOf -> NO_REAL_DERIVED
