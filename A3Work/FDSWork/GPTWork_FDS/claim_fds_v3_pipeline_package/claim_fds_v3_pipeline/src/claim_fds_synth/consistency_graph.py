from __future__ import annotations

from dataclasses import dataclass

from .claim_data import ClaimCase


@dataclass(frozen=True)
class ConsistencyEdge:
    """문서 묶음 내부의 방어용 의미 일관성 edge 정의."""

    edge_id: str
    reason_code: str
    left_document: str
    right_document: str
    field: str
    pass_: bool
    expected: int | str
    actual: int | str

    def asdict(self) -> dict:
        return {
            "edge_id": self.edge_id,
            "reason_code": self.reason_code,
            "left_document": self.left_document,
            "right_document": self.right_document,
            "field": self.field,
            "pass": self.pass_,
            "expected": self.expected,
            "actual": self.actual,
        }


def evaluate_bundle_consistency(receipt_claim: ClaimCase, detail_claim: ClaimCase) -> dict:
    """receipt/detail 간 핵심 금액 edge를 평가한다.

    v4에서는 prescription/pharmacy edge가 추가될 수 있도록 같은 schema를 사용한다.
    현재 milestone은 clean은 통과하고, tampered는 의도한 mismatch edge만 실패하게 만든다.
    """

    expected_detail_total = sum(int(row["total_amount"]) for row in detail_claim.detail_rows)
    receipt_total = int(receipt_claim.summary["total_medical_fee"])
    edges = [
        ConsistencyEdge(
            edge_id="edge.receipt_detail.total_medical_fee",
            reason_code="RECEIPT_DETAIL_TOTAL_MISMATCH",
            left_document="medical_receipt",
            right_document="medical_detail_statement",
            field="total_medical_fee",
            pass_=receipt_total == expected_detail_total,
            expected=expected_detail_total,
            actual=receipt_total,
        )
    ]
    failed = [edge.reason_code for edge in edges if not edge.pass_]
    return {
        "schema_version": "consistency_graph.v1",
        "all_pass": not failed,
        "failed_reason_codes": failed,
        "edges": [edge.asdict() for edge in edges],
    }


def make_claim_bundle_metadata(claim: ClaimCase, template_family: dict, claim_pair_id: str) -> dict:
    """leakage 방지를 위해 provider/template/device/claim_pair를 한 그룹으로 묶는다."""

    sampled_profile = template_family.get("sampled_from_profile_id", "profile")
    return {
        "bundle_schema_version": "claim_bundle.v1",
        "claim_pair_id": claim_pair_id,
        "provider_token": claim.provider.name,
        "template_family_id": sampled_profile,
        "device_profile_id": f"scanner_q{template_family['capture_profile']['scanner_quality']}",
        "leakage_group": f"{claim_pair_id}|{claim.provider.name}|{sampled_profile}|scanner_q{template_family['capture_profile']['scanner_quality']}",
    }
