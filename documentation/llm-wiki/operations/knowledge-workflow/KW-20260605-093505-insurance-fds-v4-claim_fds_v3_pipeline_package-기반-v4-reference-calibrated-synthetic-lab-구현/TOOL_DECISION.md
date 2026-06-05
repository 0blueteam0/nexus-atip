# Tool Decision

- Used local filesystem inspection rather than web search because all artifacts were provided locally.
- Used pytest/TDD because v4 must preserve existing passing behavior.
- Used reference profiling without OCR to keep the workflow defensive and privacy-safe.
- Used vision only on generated contact/montage for high-level visual traits; no real text transcription was retained.
