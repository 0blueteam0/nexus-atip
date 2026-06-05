# Reviews

Reviewed evidence from profile JSONL and manifest. Top old accepted rows included hotel, tourism, food, playground, wallpaper, and stock-like domains despite high line/edge score. This confirmed the root cause: shape-only OpenCV profiling was not semantically safe. The patch ties acceptance to collector verification status and context screening.
