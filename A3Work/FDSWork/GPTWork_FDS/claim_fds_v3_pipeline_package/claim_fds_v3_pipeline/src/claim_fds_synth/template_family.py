from __future__ import annotations

import random


def _clamp(value: float, low: int, high: int) -> int:
    return max(low, min(high, int(round(value))))


def sample_template_family(reference_profile: dict, seed: int = 0) -> dict:
    """참조 통계에서 안전한 synthetic template family 파라미터를 샘플링한다.

    실제 이미지를 그대로 베끼지 않고, 여백/종이톤/스캔 강도 같은 분포만 반영한다.
    이렇게 해야 충실도는 높이면서도 실제 병원 서류 복제 위험을 피할 수 있다.
    """

    rng = random.Random(seed)
    agg = reference_profile.get("aggregate", {})
    gray = agg.get("gray_mean", {}).get("median", 238) or 238
    coverage = agg.get("foreground_coverage_ratio", {}).get("median", 0.82) or 0.82
    left_margin = agg.get("left_margin_ratio", {}).get("median", 0.055) or 0.055

    # 기존 v3 A4 렌더러에 무리 없이 주입 가능한 범위로 제한한다.
    margin = _clamp(95 + left_margin * 420 + rng.uniform(-10, 10), 70, 170)
    tone = _clamp(gray + rng.uniform(8, 16), 238, 253)
    line_darkness = _clamp(85 - coverage * 18 + rng.uniform(-5, 5), 52, 95)
    return {
        "schema_version": "template_family.v1",
        "synthetic_only": True,
        "sampled_from_profile_id": reference_profile.get("profile_id", "unknown"),
        "rendering": {
            "page_tone_rgb": [tone, tone, max(230, tone - 5)],
            "margin_px": margin,
            "line_darkness": line_darkness,
            "table_density_hint": "dense_official_receipt_like" if coverage > 0.70 else "medium_statement_like",
        },
        "capture_profile": {
            "scanner_quality": rng.choice([72, 76, 78, 82]),
            "mobile_shadow_strength": round(rng.uniform(0.08, 0.18), 3),
            "fold_crumple_allowed": True,
            "torn_edge_max_depth_px": rng.choice([18, 24, 30]),
            "benign_condition_default_label": "benign_document_condition",
        },
        "safety": {
            "real_logo_allowed": False,
            "real_provider_identifier_allowed": False,
            "visible_public_sample_mark": True,
            "internal_marking_policy": "registry_provenance_not_pixel_shortcut",
        },
    }
