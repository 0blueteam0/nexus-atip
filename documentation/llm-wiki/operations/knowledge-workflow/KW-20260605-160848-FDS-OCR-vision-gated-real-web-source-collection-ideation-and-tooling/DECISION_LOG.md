# Decision Log

- Default collector verification mode is ocr_vision.
- Images are first written to staging_images and only accepted images move to raw_images.
- Pre-download gate rejects obvious panda/person/profile/banner/stock/logo/icon assets.
- Raw OCR text is not stored by default.
