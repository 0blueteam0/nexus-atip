# Decisions

- Default profiler acceptance requires `collection_status=downloaded_quarantine_ocr_vision_pass`.
- `--allow-legacy-downloads` exists only for explicit audit/diagnostic use, not normal dataset curation.
- Negative web context such as hotel, travel, stock, wallpaper, Pinterest, YouTube thumbnail, logo, icon, food, profile, and similar terms forces reject.
- Mask/overlay images are not deliverable artifacts; changed field information is metadata only.
