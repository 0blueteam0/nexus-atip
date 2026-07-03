# Tool Decision

| need | selected | reason |
|---|---|---|
| Locate UI | `rg` | Fast search over frontend and sanity contracts |
| Edit source | `apply_patch` | Scoped edits to existing file style |
| Verify frontend syntax | `node --check` | Direct JavaScript syntax check without starting app |
| Verify UI contract | sanity scripts | Existing project-specific Korean UI contract |
| Verify API behavior | targeted pytest | Confirms backend coverage data still behaves |

No scanner execution or network action was needed for this UI visibility slice.
