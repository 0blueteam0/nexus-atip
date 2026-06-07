# Insights

- The previous mass-test blocker was not primarily slowness; it was a collection-time missing script.
- The active Hermes venv lacks pytest, so isolated `uvx --from pytest` is the least invasive verification path for this workspace.
- Row projection alone is fragile for document images with table borders because vertical borders connect many rows. Connected-component filtering is a better OCR-free MVP for field inventory.
- Workstream A and B share a useful boundary artifact: field inventory. It supports provenance/privacy gates while also unblocking tests.
