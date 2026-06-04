# Tool Decision

- `browser_navigate`/`browser_console`: used because image search results needed DOM extraction; Google Images failed with decode error, Bing Images worked.
- `requests`/PIL: used for reproducible image download and PNG metadata insertion.
- `openpyxl`: installed because the user explicitly requested Excel organization.
- `vision_analyze`: used to inspect contact sheets for relevance/noise.
- TDD via pytest: used for collector and redteam generator behavior.
