# Reviews

## Self review

- The report explicitly states v3 is the wrong basis.
- The report identifies concrete problematic functions in the current v1 generator.
- The proposed architecture prioritizes exact target masks and paired NO lineage.
- Safety boundary is defensive FDS testing with fake values only.

## Risk review

- VLM bbox can hallucinate, so validation must not trust VLM alone.
- Diffusion can drift layout/text, so it is restricted to background repair.
- Real public candidate images remain quarantine due to privacy/license uncertainty.
