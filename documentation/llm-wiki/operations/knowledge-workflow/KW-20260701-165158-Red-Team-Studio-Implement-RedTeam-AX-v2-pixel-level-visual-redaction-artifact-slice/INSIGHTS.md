---
type: insight
status: draft
project: Red-Team-Studio
created: 2026-07-01T16:51:58+09:00
---

# Insights

## 관찰

- Visual evidence SPEC requires both original and redacted artifacts, not only a redaction decision.
- The current UI already sends a browser-computed SHA-256 and image data URL, so backend artifact generation can be added without changing transport.

## 통찰

- A useful intermediate state is a bundle with original/redacted PNG, manifest, hashes, and descriptor links. This is more auditable than a preview-only JSON artifact.
- Without OCR bbox, estimated bands are acceptable only as a review candidate, not as fully automated final redaction.

## 제안

- Add OCR engine/bbox extraction in the next slice so redaction regions become precise.
- Add live browser smoke after backend restart to prove the Report Studio panel renders the new artifact state.

## 적용 가능 범위

- RedTeam AX v2 visual evidence capture, Evidence Card artifacts, Claim-Evidence Matrix, Korean Report v2 image inclusion gates.

## 후속 작업

- OCR engine/version pin.
- precise OCR bbox -> `redaction_regions`.
- browser smoke and report export gate integration for visual evidence approval.

