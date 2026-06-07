# Decisions

## Restore field inventory script

The missing script represented a real boundary artifact between source/field analysis and AF generation. It was implemented instead of deleting the test or hiding the failure.

## Block unconfirmed values

The MVP detector uses pixel connected components, not OCR. Therefore generated fields default to `manual_review_required` and `blocked_until_value_confirmed`.

## Keep review artifacts separate

Overlay PNGs are review artifacts only. The policy still forbids visible mask/block/submission-invalid/synthetic-only labels inside training images.

## Use isolated test dependencies

The active Hermes venv lacks pytest. `uvx --from pytest` was used with explicit `pillow`, `openpyxl`, and `requests` dependencies to avoid mutating the Hermes runtime.
