# DECISIONS

## D1: Create v3.2 instead of editing v3.1 artifacts in place

Reason: v3.1 artifacts have different assumptions and should remain reproducible. v3.2 explicitly names the coordinate contract.

## D2: AF is created from paired NO image copy

Reason: The user requires the same source/template layout and same coordinates. Copying NO and overwriting only the target bbox is stronger than separately rendering AF.

## D3: Pixel diff containment is a quality gate

Reason: JSON equality alone cannot catch shifted boxes, whole-image render drift, or accidental overlays.

## D4: Real public images remain future work for OCR/KIE exact coordinates

Reason: Current validated v3.2 is synthetic standard-template gold-label data. Real-image coordinate extraction needs OCR/KIE and privacy review before pseudonymized overwrite.
