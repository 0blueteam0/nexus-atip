# DECISIONS

| decision | reason | result |
|---|---|---|
| Separate collection from execution | Avoid rerunning tools when the user only wants result visibility and evidence creation | `collect-results` reads stored artifacts only |
| Keep Evidence as candidate | Tool output alone is not a confirmed vulnerability | Finding/Claim path remains gated |
| Add Korean UI controls | User asked for beginner-oriented Korean frontend copy | Added result collection button and table |
