# Decision Log

- Rejected first automatic Bing batch because visual/source inspection showed irrelevant images.
- Used curated Bing browser DOM candidates as the current real-image source catalog.
- Kept all public real candidates under NO prefix but with quarantine review flags, not final clean training approval.
- Generated AF derivatives from real candidates using synthetic overlays and masks for defensive redteam evaluation.
