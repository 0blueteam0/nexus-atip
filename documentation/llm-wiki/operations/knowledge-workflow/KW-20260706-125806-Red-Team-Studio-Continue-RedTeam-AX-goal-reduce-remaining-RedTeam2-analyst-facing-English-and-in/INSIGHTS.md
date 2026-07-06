# Insights

- The RedTeam2 UI already had Korean domain framing, but internal execution vocabulary leaked through tool IDs, raw API endpoints, queue/action labels, and agent registry names.
- A display-only translation layer is the lowest-risk path for reducing analyst confusion because it does not alter persistence, API contracts, tool trust registry IDs, or evidence linkage.
- Fresh browser verification mattered because a prior Vite/HMR session produced stale DOM evidence; restarting the dev server produced the authoritative post-change result.
- Remaining suspicious tokens are lower than before but not zero; future work should classify which are acceptable product/domain terms and which are still default analyst-facing leaks.
