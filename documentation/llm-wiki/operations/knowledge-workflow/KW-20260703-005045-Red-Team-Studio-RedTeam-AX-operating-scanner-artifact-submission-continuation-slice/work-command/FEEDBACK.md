# Feedback

## Operator-Facing Notes

- The UI expects JSON manifest syntax. Invalid JSON shows a Korean warning and does not call the API.
- The manifest must contain at least two artifacts; use inline single-tool file import for one-off evidence.
- Each artifact should include a workspace-accessible `source_path` and exact SHA-256 digest.
- Import success only means file integrity and governed storage passed. It is not Evidence approval, Finding approval, or report completion.

## Follow-Up Feedback To Capture

- Whether operators need a manifest builder/helper that computes SHA-256 from selected files.
- Whether the UI should offer downloadable manifest templates for the six standard scanner tools.
