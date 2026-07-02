# TASKS

| task | status | evidence |
|---|---|---|
| Inspect existing collection approval and static finding promotion flows | done | `redteam_v2_models.py`, `reports.js`, pytest file |
| Add collection approved Evidence to Finding draft API | done | `/toolchain-result-collections/{collection_id}/promote-findings` |
| Add regression for unapproved block and approved draft creation | done | `test_v2_toolchain_collect_results_normalizes_all_runs_and_creates_evidence_candidates` |
| Add Korean RedTeam2 UI button and result table | done | `Finding 초안 생성` controls in `reports.js` |
| Update plans, LLM Wiki, completion audit, sanity anchors | done | Slice 82 and RTA-COMP-024 |
| Run accepted gate | done | accepted gate 24/24 passed |
