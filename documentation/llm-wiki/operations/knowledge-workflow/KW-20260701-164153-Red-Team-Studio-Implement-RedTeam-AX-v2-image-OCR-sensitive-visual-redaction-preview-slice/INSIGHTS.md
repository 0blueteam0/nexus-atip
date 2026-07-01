---
type: insight
status: draft
project: Red-Team-Studio
created: 2026-07-01T16:41:53+09:00
---

# Insights

## 관찰

- Visual evidence needs the same untrusted-data treatment as scanner output. OCR text can contain prompt-injection language, secrets, and misleading conclusions.
- Existing sanitizer and artifact archive patterns were sufficient for a preview slice.

## 통찰

- The useful minimum preview contract is not OCR extraction; it is a durable artifact containing source hash, sanitized OCR text, redaction actions, claim limitations, and human review state.
- Report Studio needs to show the analyst why visual evidence cannot directly become a finding: screenshot-only claims are blocked until corroborated by log, ticket, or tool-output evidence.

## 제안

- Keep the preview endpoint as the stable contract when adding OCR engines later.
- Add pixel-level redacted image generation only after image processing dependency/version pinning is settled.

## 적용 가능 범위

- RedTeam AX v2 Evidence Card, Claim-Evidence Matrix, Report Studio `레드팀 분석2`, and Korean Report v2 evidence controls.

## 후속 작업

- Integrate OCR engine with version/hash pinning.
- Generate redacted image artifact and link `original_artifact_path`/`redacted_artifact_path`.
- Run live browser smoke on `127.0.0.1:5177` against `127.0.0.1:8765`.

