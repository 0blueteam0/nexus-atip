#!/usr/bin/env python3
"""
Round 5: Fix remaining vivid/neon colors in main.js
Targets color arrays (collColors, tacticColors, iocColors, sectorColors, etc.)
and inline ternary rgba expressions that survived earlier bulk fixes.
"""
import re, os

JS_PATH = os.path.join(os.path.dirname(__file__), 'src', 'main.js')

with open(JS_PATH, 'r', encoding='utf-8') as f:
    js = f.read()

original_len = len(js)

# === HEX COLOR REPLACEMENTS ===
hex_replacements = [
    # Vivid purples -> muted purple
    ('#cc66ff', '#7E6DAF'),
    ('#CC66FF', '#7E6DAF'),
    ('#aa88ff', '#8E7EBF'),
    ('#AA88FF', '#8E7EBF'),
    ('#aaaaff', '#8E9099'),
    ('#AAAAFF', '#8E9099'),

    # Vivid cyan/blue -> muted blue
    ('#66ccff', '#5B9EE4'),
    ('#66CCFF', '#5B9EE4'),
    ('#88ccff', '#6BA8D9'),
    ('#88CCFF', '#6BA8D9'),
    ('#8888ff', '#7E6DAF'),
    ('#8888FF', '#7E6DAF'),

    # Vivid pink/rose -> muted rose
    ('#ff66aa', '#C97085'),
    ('#FF66AA', '#C97085'),
    ('#ff44aa', '#C97085'),
    ('#FF44AA', '#C97085'),
    ('#ffaaaa', '#C9A0A0'),
    ('#FFAAAA', '#C9A0A0'),

    # Vivid teal/green -> muted teal
    ('#66ffcc', '#4AA89D'),
    ('#66FFCC', '#4AA89D'),
    ('#44ffcc', '#4AA89D'),
    ('#44FFCC', '#4AA89D'),

    # Vivid green -> muted green
    ('#88ff88', '#5CB87A'),
    ('#88FF88', '#5CB87A'),

    # Vivid red -> muted red
    ('#ff6688', '#E06C75'),
    ('#FF6688', '#E06C75'),
    ('#ff6666', '#E06C75'),
    ('#FF6666', '#E06C75'),
    ('#ff8888', '#E06C75'),
    ('#FF8888', '#E06C75'),
    ('#ff6644', '#E06C75'),
    ('#FF6644', '#E06C75'),

    # Vivid orange/amber -> muted amber
    ('#ffaa44', '#E5A54B'),
    ('#FFAA44', '#E5A54B'),
    ('#ffaa66', '#E5A54B'),
    ('#FFAA66', '#E5A54B'),
]

count = 0
for old, new in hex_replacements:
    n = js.count(old)
    if n > 0:
        js = js.replace(old, new)
        count += n
        print(f"  {old} -> {new} ({n}x)")

print(f"[+] Hex replacements: {count}")

# === QUANTUM-BLUE VARIABLE RENAME ===
qb_count = 0
n = js.count('var(--quantum-blue,')
if n > 0:
    js = js.replace('var(--quantum-blue,', 'var(--accent-primary,')
    qb_count += n
n = js.count('var(--quantum-blue)')
if n > 0:
    js = js.replace('var(--quantum-blue)', 'var(--accent-primary)')
    qb_count += n
print(f"[+] quantum-blue -> accent-primary: {qb_count}")

# === OLD NEON RGBA IN BORDERS ===
border_count = 0
n = js.count('rgba(42,42,74,')
if n > 0:
    js = js.replace('rgba(42,42,74,', 'rgba(51,55,63,')
    border_count += n
n = js.count('rgba(42, 42, 74,')
if n > 0:
    js = js.replace('rgba(42, 42, 74,', 'rgba(51, 55, 63,')
    border_count += n
print(f"[+] Old border rgba: {border_count}")

# === INLINE TERNARY NEON RGBA ===
ternary_count = 0

# Neon green rgba(68,255,68) -> muted green rgba(92,184,122)
for old, new in [
    ('rgba(68,255,68,', 'rgba(92,184,122,'),
    ('rgba(68, 255, 68,', 'rgba(92, 184, 122,'),
]:
    n = js.count(old)
    if n > 0:
        js = js.replace(old, new)
        ternary_count += n

# Neon yellow rgba(255,204,0) -> muted yellow rgba(212,184,77)
for old, new in [
    ('rgba(255,204,0,', 'rgba(212,184,77,'),
    ('rgba(255, 204, 0,', 'rgba(212, 184, 77,'),
]:
    n = js.count(old)
    if n > 0:
        js = js.replace(old, new)
        ternary_count += n

# Neon red rgba(255,68,68) -> muted red rgba(224,108,117)
for old, new in [
    ('rgba(255,68,68,', 'rgba(224,108,117,'),
    ('rgba(255, 68, 68,', 'rgba(224, 108, 117,'),
]:
    n = js.count(old)
    if n > 0:
        js = js.replace(old, new)
        ternary_count += n

# Neon orange rgba(255,136,0) -> muted amber rgba(229,165,75)
for old, new in [
    ('rgba(255,136,0,', 'rgba(229,165,75,'),
    ('rgba(255, 136, 0,', 'rgba(229, 165, 75,'),
]:
    n = js.count(old)
    if n > 0:
        js = js.replace(old, new)
        ternary_count += n

# Neon cyan rgba(0,212,255) -> muted blue rgba(74,144,217)
for old, new in [
    ('rgba(0,212,255,', 'rgba(74,144,217,'),
    ('rgba(0, 212, 255,', 'rgba(74, 144, 217,'),
]:
    n = js.count(old)
    if n > 0:
        js = js.replace(old, new)
        ternary_count += n

# Muted text rgba(136,136,170) -> neutral rgba(109,112,122)
for old, new in [
    ('rgba(136,136,170,', 'rgba(109,112,122,'),
    ('rgba(136, 136, 170,', 'rgba(109, 112, 122,'),
]:
    n = js.count(old)
    if n > 0:
        js = js.replace(old, new)
        ternary_count += n

# Neon green rgba(0,255,136) -> muted green rgba(92,184,122)
for old, new in [
    ('rgba(0,255,136,', 'rgba(92,184,122,'),
    ('rgba(0, 255, 136,', 'rgba(92, 184, 122,'),
]:
    n = js.count(old)
    if n > 0:
        js = js.replace(old, new)
        ternary_count += n

print(f"[+] Inline ternary rgba: {ternary_count}")

# === WRITE ===
with open(JS_PATH, 'w', encoding='utf-8') as f:
    f.write(js)

total = count + qb_count + border_count + ternary_count
print(f"\n[=] Round 5 complete: {total} total replacements")
print(f"    Original: {original_len} chars")
print(f"    New:      {len(js)} chars")
