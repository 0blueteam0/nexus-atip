# Feedback

User feedback incorporated into the fixed scope:

1. Remove masks, blocks, synthetic-only boxes, and actual-submission-invalid labels from document images.
2. Use anonymization/pseudonymization only.
3. Do not add useless values.
4. Prefer proper original documents from real web-source images as the reference basis.
5. Continue the previous insurance claim document synthetic/tampered data work together with the prior mass-test delay/RCA work.
6. Fix the next work into two parallel scopes before proceeding.

Interpretation used for implementation:

- Visible artifacts are banned inside generated image pixels.
- Separate non-visual label artifacts may still exist only when needed for model supervision or QA, but they must not be composited into the image.
- Web originals are reference/profiling sources, not automatically clean training data.
- Any real-source promotion requires provenance, privacy review, and raw-value non-retention.
