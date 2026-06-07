# Decision Log

## D1: Restore missing script instead of changing test

Decision: Implement `scripts/insurance_fds_real_image_field_inventory.py`.

Reason: The test describes a valid Workstream A/B boundary artifact. Deleting or xfail-ing it would hide the collection blocker and weaken the field-inventory gate.

## D2: Keep values unconfirmed by default

Decision: Pixel-based regions are emitted with `manual_review_required` and `blocked_until_value_confirmed`.

Reason: OCR-free dark-pixel inventory is not equivalent to confirmed OCR/KIE extraction. AF/tamper generation must remain blocked until values are reviewed or confirmed.

## D3: Use uvx for pytest

Decision: Use `uvx --from pytest` with explicit dependencies instead of installing pytest into the Hermes venv.

Reason: The active Hermes venv is provider/runtime-sensitive; isolated test deps avoid unintended environment mutation.
