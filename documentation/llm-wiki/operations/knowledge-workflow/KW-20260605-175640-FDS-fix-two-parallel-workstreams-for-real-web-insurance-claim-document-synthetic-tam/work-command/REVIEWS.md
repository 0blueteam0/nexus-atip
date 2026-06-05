# Reviews

## Self Review

- Scope has exactly two workstreams: pass.
- User's no mask/block/box/submission-invalid requirement captured: pass.
- User's actual web-source original preference captured: pass.
- Prior records used: pass, via handoffs and docs.
- Test delay grounded in command output: pass.
- AF data not generated in this task: pass.
- Raw PII not collected or stored in this task: pass.

## Risks for future reviewer

1. Older handoff used AF masks/overlays. Future work must distinguish internal label artifacts from visible rendered shortcuts.
2. The missing field inventory script may be an accidental deletion or stale test. Implementation should inspect git history before recreating large logic.
3. The four-file bundle timing excludes the failing field-inventory test, so total duration remains unknown until collection is fixed.
4. Real web-source originals are useful for profiling but cannot be promoted without provenance, privacy, and license gates.
5. Test speed improvements must not remove privacy/source gates or reduce exact-coordinate validation.

## Acceptance review checklist for next task

- `scripts/insurance_fds_real_image_field_inventory.py` exists or the stale test is replaced with documented rationale.
- Full insurance FDS glob collects successfully.
- Generated images contain no visible `합성전용`, `실제 제출불가`, black block, or shortcut mask artifacts.
- Manifest contains provenance and privacy_state.
- Slow tests are marked or split without hiding failures.
