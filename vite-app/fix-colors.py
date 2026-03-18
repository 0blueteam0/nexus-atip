#!/usr/bin/env python3
"""
NEXUS ATIP V2.0 - Comprehensive Color Palette Overhaul
Replaces AI-slop neon cyberpunk colors with Mattermost-inspired professional palette.

Design principles from Mattermost:
- Warm neutral dark backgrounds (not blue-black)
- Muted, accessible accent colors
- Subtle borders with low contrast
- No glow/neon effects
- Clean, professional aesthetic
"""
import re, sys, os

CSS_PATH = os.path.join(os.path.dirname(__file__), 'src', 'styles', 'components.css')

with open(CSS_PATH, 'r', encoding='utf-8') as f:
    css = f.read()

original_len = len(css)

# ============================================================
# PHASE 1: Insert :root design tokens at top (Mattermost-inspired)
# ============================================================
ROOT_BLOCK = """
/* ===== NEXUS Design Tokens (Mattermost-inspired Professional Palette) ===== */
:root {
  /* Backgrounds - warm neutral darks, NOT blue-blacks */
  --bg-base: #1B1D21;
  --bg-surface: #1F2228;
  --bg-card: #22252B;
  --bg-elevated: #282C34;
  --bg-sidebar: #1E2026;
  --bg-hover: #2C3039;
  --bg-active: #32363F;

  /* Borders - subtle, low contrast */
  --border-default: #33373F;
  --border-subtle: #2A2D35;
  --border-focus: #4A90D9;

  /* Text - warm whites, not blue-tinted */
  --text-primary: #E1E3E8;
  --text-secondary: #A8ABB3;
  --text-muted: #6D707A;
  --text-disabled: #4A4D55;

  /* Primary accent - muted blue (Mattermost-like) */
  --accent-primary: #4A90D9;
  --accent-primary-hover: #5B9EE4;
  --accent-primary-subtle: rgba(74, 144, 217, 0.12);

  /* Severity palette - softer, more professional */
  --severity-critical: #E06C75;
  --severity-critical-bg: rgba(224, 108, 117, 0.10);
  --severity-high: #E5A54B;
  --severity-high-bg: rgba(229, 165, 75, 0.10);
  --severity-medium: #D4B84D;
  --severity-medium-bg: rgba(212, 184, 77, 0.10);
  --severity-low: #5CB87A;
  --severity-low-bg: rgba(92, 184, 122, 0.10);
  --severity-info: #4A90D9;
  --severity-info-bg: rgba(74, 144, 217, 0.10);

  /* Status */
  --status-success: #5CB87A;
  --status-warning: #E5A54B;
  --status-error: #E06C75;
  --status-info: #4A90D9;

  /* Shadows - soft, no colored glows */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.25);
  --shadow-md: 0 2px 8px rgba(0,0,0,0.30);
  --shadow-lg: 0 4px 16px rgba(0,0,0,0.35);
  --shadow-card-hover: 0 4px 12px rgba(0,0,0,0.3);
}

"""

# Insert after the opening comment block
css = css.replace(
    '/* ===== Animations ===== */',
    ROOT_BLOCK + '/* ===== Animations ===== */',
    1
)

# ============================================================
# PHASE 2: Bulk color replacements
# ============================================================

replacements = [
    # --- PRIMARY ACCENT: neon cyan -> muted blue ---
    ('#00d4ff', '#4A90D9'),
    ('#00D4FF', '#4A90D9'),
    ('rgba(0, 212, 255,', 'rgba(74, 144, 217,'),
    ('rgba(0,212,255,', 'rgba(74,144,217,'),

    # --- SEVERITY: CRITICAL ---
    ('#ff4444', '#E06C75'),
    ('#FF4444', '#E06C75'),
    ('rgba(255, 68, 68,', 'rgba(224, 108, 117,'),
    ('rgba(255,68,68,', 'rgba(224,108,117,'),
    ('#e74c3c', '#E06C75'),

    # --- SEVERITY: HIGH ---
    ('#ff8800', '#E5A54B'),
    ('#FF8800', '#E5A54B'),
    ('rgba(255, 136, 0,', 'rgba(229, 165, 75,'),
    ('rgba(255,136,0,', 'rgba(229,165,75,'),
    ('#f39c12', '#E5A54B'),

    # --- SEVERITY: MEDIUM ---
    ('#ffcc00', '#D4B84D'),
    ('#FFCC00', '#D4B84D'),
    ('rgba(255, 204, 0,', 'rgba(212, 184, 77,'),
    ('rgba(255,204,0,', 'rgba(212,184,77,'),

    # --- SEVERITY: LOW / SUCCESS ---
    ('#44ff44', '#5CB87A'),
    ('#44FF44', '#5CB87A'),
    ('rgba(68, 255, 68,', 'rgba(92, 184, 122,'),
    ('rgba(68,255,68,', 'rgba(92,184,122,'),
    ('#2ecc71', '#5CB87A'),
    ('#00ff88', '#5CB87A'),

    # --- BACKGROUNDS: blue-blacks -> warm neutral darks ---
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
    ('rgba(42, 42, 74,', 'rgba(51, 55, 63,'),

    # --- TEXT: blue-tinted -> warm neutral ---
    ('#e0e0e0', '#E1E3E8'),
    ('#E0E0E0', '#E1E3E8'),
    ('#c0c0d0', '#A8ABB3'),
    ('#C0C0D0', '#A8ABB3'),
    ('#8888aa', '#6D707A'),
    ('#8888AA', '#6D707A'),
    ('#a0a0b0', '#8E9099'),
    ('#aabbcc', '#A8ABB3'),

    # --- SURFACE COLORS ---
    ('#252545', '#282C34'),
    ('#20203a', '#22252B'),

    # --- CSS Variable fallbacks ---
    ('var(--quantum-blue, #4A90D9)', 'var(--accent-primary, #4A90D9)'),
    ('var(--quantum-blue,', 'var(--accent-primary,'),
    ('--quantum-blue', '--accent-primary'),
]

count = 0
for old, new in replacements:
    n = css.count(old)
    if n > 0:
        css = css.replace(old, new)
        count += n

print(f"[+] Phase 2: {count} color replacements applied")

# ============================================================
# PHASE 3: Remove/reduce glow effects
# ============================================================

# Remove neon text-shadow glows (keep basic text shadows)
glow_count = 0

# Remove text-shadow with colored glows
def reduce_text_shadow(m):
    global glow_count
    glow_count += 1
    return 'text-shadow: none;'

# Only target neon glow text-shadows (with rgba or hex colors that had neon)
css = re.sub(
    r'text-shadow:\s*0\s+0\s+\d+px\s+(?:rgba\([^)]+\)|#[0-9a-fA-F]{6})\s*(?:,\s*0\s+0\s+\d+px\s+(?:rgba\([^)]+\)|#[0-9a-fA-F]{6})\s*)*;',
    reduce_text_shadow,
    css
)

# Reduce box-shadow glow effects: keep only structural shadows, remove colored glows
def simplify_box_shadow(m):
    global glow_count
    shadow_str = m.group(0)
    # If it has a colored glow pattern (0 0 Npx rgba), simplify it
    if 'rgba(74, 144, 217,' in shadow_str or 'rgba(224, 108, 117,' in shadow_str:
        glow_count += 1
        # Keep only the structural shadow part (the one with Y offset)
        structural = re.findall(r'0\s+\d+px\s+\d+px\s+rgba\(0\s*,\s*0\s*,\s*0\s*,[^)]+\)', shadow_str)
        if structural:
            return f'box-shadow: {structural[0]};'
        return 'box-shadow: var(--shadow-sm);'
    return shadow_str

css = re.sub(
    r'box-shadow:\s*[^;]+;',
    simplify_box_shadow,
    css
)

print(f"[+] Phase 3: {glow_count} glow effects removed/reduced")

# ============================================================
# PHASE 4: Update pulse-glow animation to use soft shadow
# ============================================================
css = css.replace(
    '0%, 100% { box-shadow: 0 0 0 0 rgba(74, 144, 217, 0); }',
    '0%, 100% { box-shadow: var(--shadow-sm); }'
)
css = css.replace(
    '50% { box-shadow: 0 0 8px 2px rgba(74, 144, 217, 0.15); }',
    '50% { box-shadow: var(--shadow-md); }'
)

# ============================================================
# PHASE 5: Replace card-bg/border-color variable fallbacks
# ============================================================
css = re.sub(r'var\(--card-bg,\s*#[0-9a-fA-F]+\)', 'var(--bg-card, #22252B)', css)
css = re.sub(r'var\(--border-color,\s*#[0-9a-fA-F]+\)', 'var(--border-default, #33373F)', css)
css = re.sub(r'var\(--surface-card,\s*#[0-9a-fA-F]+\)', 'var(--bg-card, #22252B)', css)
css = re.sub(r'var\(--surface-1,\s*#[0-9a-fA-F]+\)', 'var(--bg-surface, #1F2228)', css)
css = re.sub(r'var\(--text-muted,\s*#[0-9a-fA-F]+\)', 'var(--text-muted, #6D707A)', css)
css = re.sub(r'var\(--text-primary,\s*#[0-9a-fA-F]+\)', 'var(--text-primary, #E1E3E8)', css)
css = re.sub(r'var\(--text-secondary,\s*#[0-9a-fA-F]+\)', 'var(--text-secondary, #A8ABB3)', css)

print(f"[+] Phase 5: CSS variable fallbacks updated")

# ============================================================
# PHASE 6: Fix remaining severity variable references
# ============================================================
css = re.sub(r'var\(--severity-critical,\s*#[0-9a-fA-F]+\)', 'var(--severity-critical, #E06C75)', css)
css = re.sub(r'var\(--severity-high,\s*#[0-9a-fA-F]+\)', 'var(--severity-high, #E5A54B)', css)
css = re.sub(r'var\(--severity-medium,\s*#[0-9a-fA-F]+\)', 'var(--severity-medium, #D4B84D)', css)
css = re.sub(r'var\(--severity-low,\s*#[0-9a-fA-F]+\)', 'var(--severity-low, #5CB87A)', css)
css = re.sub(r'var\(--severity-info,\s*#[0-9a-fA-F]+\)', 'var(--severity-info, #4A90D9)', css)

print(f"[+] Phase 6: Severity variable fallbacks updated")

# ============================================================
# Write result
# ============================================================
with open(CSS_PATH, 'w', encoding='utf-8') as f:
    f.write(css)

new_len = len(css)
print(f"\n[=] Complete!")
print(f"    Original: {original_len} chars")
print(f"    New:      {new_len} chars")
print(f"    Delta:    +{new_len - original_len} chars (design tokens added)")
