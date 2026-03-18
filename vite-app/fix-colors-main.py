#!/usr/bin/env python3
"""
Fix hardcoded neon colors in main.js (SVG visualizations, inline styles)
Same Mattermost-inspired professional palette as components.css
"""
import re, os

JS_PATH = os.path.join(os.path.dirname(__file__), 'src', 'main.js')

with open(JS_PATH, 'r', encoding='utf-8') as f:
    js = f.read()

original_len = len(js)

replacements = [
    # --- PRIMARY: neon cyan -> muted blue ---
    ('#00d4ff', '#4A90D9'),
    ('#00D4FF', '#4A90D9'),
    ('#00d4FF', '#4A90D9'),
    ("'rgba(0, 212, 255,", "'rgba(74, 144, 217,"),
    ('"rgba(0, 212, 255,', '"rgba(74, 144, 217,'),
    ('rgba(0, 212, 255,', 'rgba(74, 144, 217,'),
    ('rgba(0,212,255,', 'rgba(74,144,217,'),

    # --- CRITICAL ---
    ('#ff4444', '#E06C75'),
    ('#FF4444', '#E06C75'),
    ('#ff3333', '#E06C75'),
    ('#ff2222', '#E06C75'),
    ('#e74c3c', '#E06C75'),
    ('rgba(255, 68, 68,', 'rgba(224, 108, 117,'),
    ('rgba(255,68,68,', 'rgba(224,108,117,'),

    # --- HIGH ---
    ('#ff8800', '#E5A54B'),
    ('#FF8800', '#E5A54B'),
    ('#ff9900', '#E5A54B'),
    ('#f39c12', '#E5A54B'),
    ('rgba(255, 136, 0,', 'rgba(229, 165, 75,'),
    ('rgba(255,136,0,', 'rgba(229,165,75,'),

    # --- MEDIUM ---
    ('#ffcc00', '#D4B84D'),
    ('#FFCC00', '#D4B84D'),
    ('#ffdd00', '#D4B84D'),
    ('rgba(255, 204, 0,', 'rgba(212, 184, 77,'),
    ('rgba(255,204,0,', 'rgba(212,184,77,'),

    # --- LOW / SUCCESS ---
    ('#44ff44', '#5CB87A'),
    ('#44FF44', '#5CB87A'),
    ('#00ff88', '#5CB87A'),
    ('#00FF88', '#5CB87A'),
    ('#2ecc71', '#5CB87A'),
    ('#22cc66', '#5CB87A'),
    ('rgba(68, 255, 68,', 'rgba(92, 184, 122,'),
    ('rgba(68,255,68,', 'rgba(92,184,122,'),
    ('rgba(0, 255, 136,', 'rgba(92, 184, 122,'),

    # --- BACKGROUNDS ---
    ('#1a1a2e', '#22252B'),
    ('#1A1A2E', '#22252B'),
    ('#0f0f1e', '#1B1D21'),
    ('#0F0F1E', '#1B1D21'),
    ('#0a0a1a', '#181A1E'),
    ('#0A0A1A', '#181A1E'),
    ('#12122a', '#1F2228'),
    ('#111827', '#1E2026'),
    ('#16162e', '#22252B'),
    ('#1e1e3a', '#282C34'),
    ('#1E1E3A', '#282C34'),
    ('#0d1117', '#1B1D21'),
    ('#0f172a', '#1B1D21'),
    ('#1e293b', '#282C34'),
    ('#161b22', '#1E2026'),

    # --- BORDERS ---
    ('#2a2a4a', '#33373F'),
    ('#2A2A4A', '#33373F'),
    ('#333366', '#33373F'),
    ('#3a3a5a', '#3A3E47'),
    ('#3A3A5A', '#3A3E47'),

    # --- TEXT ---
    ('#e0e0e0', '#E1E3E8'),
    ('#E0E0E0', '#E1E3E8'),
    ('#c0c0d0', '#A8ABB3'),
    ('#C0C0D0', '#A8ABB3'),
    ('#8888aa', '#6D707A'),
    ('#8888AA', '#6D707A'),
    ('#a0a0b0', '#8E9099'),
    ('#aabbcc', '#A8ABB3'),

    # --- SURFACE ---
    ('#252545', '#282C34'),
    ('#20203a', '#22252B'),

    # --- ADDITIONAL SVG/chart colors ---
    ('#3498db', '#4A90D9'),
    ('#9b59b6', '#7E6DAF'),  # purple -> muted purple
    ('#1abc9c', '#4AA89D'),  # turquoise -> muted teal
    ('#e67e22', '#E5A54B'),  # orange
    ('#27ae60', '#5CB87A'),  # green
    ('#c0392b', '#E06C75'),  # dark red
    ('#8e44ad', '#7E6DAF'),  # dark purple
    ('#2980b9', '#4A90D9'),  # blue
    ('#16a085', '#4AA89D'),  # dark teal
    ('#d35400', '#CC7832'),  # burnt orange -> warm brown-orange
    ('#f1c40f', '#D4B84D'),  # yellow
]

count = 0
for old, new in replacements:
    n = js.count(old)
    if n > 0:
        js = js.replace(old, new)
        count += n

print(f"[+] {count} color replacements in main.js")

with open(JS_PATH, 'w', encoding='utf-8') as f:
    f.write(js)

print(f"    Original: {original_len} chars")
print(f"    New:      {len(js)} chars")
