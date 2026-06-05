# Quality Gate

- RED observed: quote_url_for_request missing and image_validation_error evidence missing caused tests to fail.
- GREEN observed: collector tests passed after implementation.
- Live probe confirmed Korean-path image URL now downloads without UnicodeEncodeError.
- No AF generation performed from bg2.
