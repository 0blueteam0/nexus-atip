#!/usr/bin/env python3
"""
Round 6: Fix ALL remaining vivid/neon colors in main.js
Catches: hex colors in arrays, ternary RGB string fragments, gradients
"""
import re, os

JS_PATH = os.path.join(os.path.dirname(__file__), 'src', 'main.js')

with open(JS_PATH, 'r', encoding='utf-8') as f:
    js = f.read()

original_len = len(js)

# === HEX COLOR REPLACEMENTS ===
hex_replacements = [
    # Vivid amber/orange
    ('#ffaa00', '#E5A54B'),
    ('#FFAA00', '#E5A54B'),
    ('#ff9933', '#CC7832'),
    ('#FF9933', '#CC7832'),
    ('#ff9966', '#CC7832'),
    ('#FF9966', '#CC7832'),
    ('#ffbb55', '#D4B84D'),
    ('#FFBB55', '#D4B84D'),
    ('#ffbb00', '#D4B84D'),
    ('#FFBB00', '#D4B84D'),

    # Vivid yellow-green
    ('#ffdd44', '#D4B84D'),
    ('#FFDD44', '#D4B84D'),
    ('#ddcc00', '#B8A840'),
    ('#DDCC00', '#B8A840'),
    ('#ccff44', '#8EA854'),
    ('#CCFF44', '#8EA854'),
    ('#aadd22', '#7EAF5C'),
    ('#AADD22', '#7EAF5C'),
    ('#88dd00', '#7EAF5C'),
    ('#88DD00', '#7EAF5C'),
    ('#aaff44', '#8EA854'),
    ('#AAFF44', '#8EA854'),
    ('#99ff66', '#7EAF5C'),
    ('#99FF66', '#7EAF5C'),

    # Vivid red/red-orange
    ('#ff5533', '#D4705A'),
    ('#FF5533', '#D4705A'),
    ('#ff5544', '#D4705A'),
    ('#FF5544', '#D4705A'),
    ('#ff7722', '#CC7832'),
    ('#FF7722', '#CC7832'),
    ('#ff7744', '#CC7832'),
    ('#FF7744', '#CC7832'),
    ('#ff4466', '#E06C75'),
    ('#FF4466', '#E06C75'),

    # Vivid green
    ('#66dd44', '#5CB87A'),
    ('#66DD44', '#5CB87A'),
    ('#33cc66', '#4AA89D'),
    ('#33CC66', '#4AA89D'),
    ('#44ee44', '#5CB87A'),
    ('#44EE44', '#5CB87A'),
    ('#88ddaa', '#7EAF8E'),
    ('#88DDAA', '#7EAF8E'),
    ('#44ffaa', '#4AA89D'),
    ('#44FFAA', '#4AA89D'),

    # Vivid blue/cyan
    ('#00bbff', '#4A90D9'),
    ('#00BBFF', '#4A90D9'),
    ('#00aaff', '#4A90D9'),
    ('#00AAFF', '#4A90D9'),
    ('#44aaff', '#5B9EE4'),
    ('#44AAFF', '#5B9EE4'),

    # Vivid purple/pink
    ('#aa66ff', '#7E6DAF'),
    ('#AA66FF', '#7E6DAF'),
    ('#ff44cc', '#C97085'),
    ('#FF44CC', '#C97085'),
    ('#dd88cc', '#B08AA0'),
    ('#DD88CC', '#B08AA0'),
]

count = 0
for old, new in hex_replacements:
    n = js.count(old)
    if n > 0:
        js = js.replace(old, new)
        count += n
        print(f"  {old} -> {new} ({n}x)")

print(f"[+] Hex replacements: {count}")

# === TERNARY RGB STRING FRAGMENT REPLACEMENTS ===
# These are RGB values used as string components in template literal ternaries
# e.g., '255,68,68' in rgba(${...? '255,68,68' : ...}, 0.15)
rgb_replacements = [
    ("'255,68,68'", "'224,108,117'"),
    ("'255,136,0'", "'229,165,75'"),
    ("'255,204,0'", "'212,184,77'"),
    ("'68,255,68'", "'92,184,122'"),
    ("'0,212,255'", "'74,144,217'"),
    ("'136,136,170'", "'109,112,122'"),
    ("'204,102,255'", "'126,109,175'"),
]

rgb_count = 0
for old, new in rgb_replacements:
    n = js.count(old)
    if n > 0:
        js = js.replace(old, new)
        rgb_count += n
        print(f"  {old} -> {new} ({n}x)")

print(f"[+] RGB string fragments: {rgb_count}")

# === WRITE ===
with open(JS_PATH, 'w', encoding='utf-8') as f:
    f.write(js)

total = count + rgb_count
print(f"\n[=] Round 6 complete: {total} total replacements")
print(f"    Original: {original_len} chars")
print(f"    New:      {len(js)} chars")
