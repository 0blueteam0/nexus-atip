# Insights

The user's proposed direction is sound for the larger foreground lane: define modules first, then wire them into LangGraph-style node ownership and execution assurance. This keeps ideation from becoming vague architecture prose because each module must name inputs, outputs, safety gates, candidate backends, and concrete graph nodes.

Key design insight: replay evaluation should be modeled as a module, but not as an online response node in the current investigation graph. It is an offline feedback loop for go/hold/no-go and next-seed expansion.
