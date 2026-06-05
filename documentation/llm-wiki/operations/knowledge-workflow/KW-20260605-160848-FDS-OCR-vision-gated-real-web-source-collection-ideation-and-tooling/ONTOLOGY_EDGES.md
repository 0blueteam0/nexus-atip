# Ontology Edges

- search_query -> search_result_page
- search_result_page -> page_asset_candidate
- page_asset_candidate -> staging_image
- staging_image -> ocr_signal
- staging_image -> vision_shape_signal
- ocr_signal + vision_shape_signal -> raw_image_candidate
- rejected_signal -> rejected_image
