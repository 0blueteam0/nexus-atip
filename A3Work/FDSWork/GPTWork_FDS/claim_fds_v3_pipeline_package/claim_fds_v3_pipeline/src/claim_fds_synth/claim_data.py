from __future__ import annotations

from dataclasses import dataclass, asdict
from typing import Dict, List
import random


def won(n: int) -> str:
    return f"{int(n):,}"


FAKE_PROVIDERS = [
    ("가람모의의료센터", "000-00-00000", "서울특별시 중구 샘플로 00", "02-0000-0000", "김모의"),
    ("비전테스트의원", "111-11-11111", "경기도 성남시 실험로 11", "031-000-1111", "박검증"),
    ("라온합성클리닉", "222-22-22222", "부산광역시 해운대구 비식별로 22", "051-000-2222", "이합성"),
]

CHARGE_ITEMS = [
    ("진 찰 료", "consultation_fee"),
    ("입원료 1인실", "hospitalization_room_1p"),
    ("입원료 2ㆍ3인실", "hospitalization_room_2_3p"),
    ("입원료 4인실 이상", "hospitalization_room_4p_plus"),
    ("식대", "meal"),
    ("투약 및 조제료 - 행위료", "medication_dispense_service_fee"),
    ("투약 및 조제료 - 약품비", "medication_dispense_drug_fee"),
    ("주사료 - 행위료", "injection_service_fee"),
    ("주사료 - 약품비", "injection_drug_fee"),
    ("마취료", "anesthesia_fee"),
    ("처치 및 수술료", "treatment_surgery_fee"),
    ("검사료", "lab_test_fee"),
    ("영상진단료", "imaging_diagnosis_fee"),
    ("방사선치료료", "radiation_therapy_fee"),
    ("치료재료대", "medical_material_fee"),
    ("재활 및 물리치료료", "rehab_physical_therapy_fee"),
    ("정신요법료", "psychotherapy_fee"),
    ("전혈 및 혈액성분제제료", "blood_component_fee"),
    ("CT 진단료", "ct_fee"),
    ("MRI 진단료", "mri_fee"),
    ("PET 진단료", "pet_fee"),
    ("초음파 진단료", "ultrasound_fee"),
    ("보철ㆍ교정료", "prosthodontics_orthodontics_fee"),
    ("제증명수수료", "certificate_fee"),
    ("선별급여", "selective_benefit"),
    ("65세 이상 등 정액", "elderly_flat_amount"),
    ("정액수가(요양병원)", "convalescent_hospital_flat_amount"),
    ("정액수가(완화의료)", "hospice_flat_amount"),
    ("질병군 포괄수가", "drg_bundled_payment"),
    ("기타", "other"),
]

DETAIL_ITEM_NAMES = [
    ("AA154", "초진진찰료", "진찰료"),
    ("D3021", "말초혈액검사", "검사료"),
    ("D6620", "C-반응성단백", "검사료"),
    ("K1020", "처치료-창상소독", "처치 및 수술료"),
    ("J0010", "주사료-정맥내", "주사료"),
    ("M0110", "물리치료-표층열", "재활 및 물리치료료"),
    ("R0001", "방사선 단순촬영", "영상진단료"),
    ("P0002", "투약 및 조제-행위", "투약 및 조제료"),
    ("Z1000", "진료확인서", "제증명수수료"),
]


@dataclass
class Provider:
    name: str
    business_no: str
    address: str
    phone: str
    representative: str
    provider_type: str = "의원급ㆍ보건기관"


@dataclass
class ClaimCase:
    claim_id: str
    patient_name: str
    patient_registration_no: str
    treatment_start: str
    treatment_end: str
    issue_date: str
    department: str
    receipt_no: str
    provider: Provider
    charge_rows: List[dict]
    summary: Dict[str, int]
    detail_rows: List[dict]

    def asdict(self) -> dict:
        d = asdict(self)
        return d


def generate_claim(seed: int = 20260604) -> ClaimCase:
    rng = random.Random(seed)
    provider_tuple = FAKE_PROVIDERS[seed % len(FAKE_PROVIDERS)]
    provider = Provider(*provider_tuple)
    patient_names = ["홍샘플", "김비식", "이모의", "박테스트", "최가명"]
    depts = ["정형외과", "내과", "이비인후과", "피부과", "신경외과"]
    patient_name = patient_names[seed % len(patient_names)]
    treatment_start = "2026-06-03"
    treatment_end = "2026-06-03"
    issue_date = "2026-06-03"
    patient_registration_no = f"SYN-{rng.randint(100000, 999999)}"
    receipt_no = f"26-06-{rng.randint(1000, 9999)}"
    department = depts[seed % len(depts)]

    # Detail rows: realistic-ish amounts while keeping all identifiers synthetic.
    detail_rows: List[dict] = []
    for idx, (code, name, category) in enumerate(DETAIL_ITEM_NAMES):
        qty = rng.choice([1, 1, 1, 2])
        unit = rng.choice([4100, 6200, 8500, 11300, 15100, 19800, 23400])
        total = qty * unit
        # Route some items to noncovered or full patient payment to create useful consistency checks.
        covered_patient = 0
        covered_corp = 0
        full_patient = 0
        noncovered = 0
        if category == "제증명수수료":
            noncovered = total
        elif idx in {3, 5}:
            full_patient = int(round(total / 100) * 100)
        else:
            covered_patient = int(round(total * 0.3 / 100) * 100)
            covered_corp = total - covered_patient
        detail_rows.append({
            "treatment_date": treatment_start,
            "category": category,
            "code": code,
            "name": name,
            "quantity": qty,
            "unit_price": unit,
            "covered_partial_patient_payment": covered_patient,
            "covered_corporation_payment": covered_corp,
            "full_patient_payment": full_patient,
            "noncovered_payment": noncovered,
            "total_amount": covered_patient + covered_corp + full_patient + noncovered,
        })

    # Aggregate detail rows into official-style receipt categories.
    aggregates = {key: {"covered_partial_patient_payment": 0, "covered_corporation_payment": 0, "full_patient_payment": 0, "noncovered_payment": 0} for _, key in CHARGE_ITEMS}
    category_to_key = {
        "진찰료": "consultation_fee",
        "검사료": "lab_test_fee",
        "처치 및 수술료": "treatment_surgery_fee",
        "주사료": "injection_service_fee",
        "재활 및 물리치료료": "rehab_physical_therapy_fee",
        "영상진단료": "imaging_diagnosis_fee",
        "투약 및 조제료": "medication_dispense_service_fee",
        "제증명수수료": "certificate_fee",
    }
    for row in detail_rows:
        key = category_to_key.get(row["category"], "other")
        for amount_key in aggregates[key]:
            aggregates[key][amount_key] += int(row[amount_key])

    charge_rows: List[dict] = []
    for item_label, key in CHARGE_ITEMS:
        vals = aggregates[key]
        total = sum(vals.values())
        charge_rows.append({
            "label": item_label,
            "key": key,
            **vals,
            "calculation_detail": "" if total == 0 else "일자별 세부내역 참조",
        })

    covered_patient_total = sum(r["covered_partial_patient_payment"] for r in charge_rows)
    corp_total = sum(r["covered_corporation_payment"] for r in charge_rows)
    full_patient_total = sum(r["full_patient_payment"] for r in charge_rows)
    noncovered_total = sum(r["noncovered_payment"] for r in charge_rows)
    cap_excess = 0
    total_medical_fee = covered_patient_total + corp_total + full_patient_total + noncovered_total
    insurer_corporation_total = corp_total + cap_excess
    patient_burden_total = (covered_patient_total - cap_excess) + full_patient_total + noncovered_total
    prepaid_amount = 0
    amount_due = patient_burden_total - prepaid_amount
    paid_by_card = amount_due
    paid_by_cash_receipt = 0
    paid_by_cash = 0
    paid_total = paid_by_card + paid_by_cash_receipt + paid_by_cash
    unpaid_amount = amount_due - paid_total
    summary = {
        "covered_partial_patient_total": covered_patient_total,
        "covered_corporation_total": corp_total,
        "full_patient_total": full_patient_total,
        "noncovered_total": noncovered_total,
        "cap_excess": cap_excess,
        "total_medical_fee": total_medical_fee,
        "insurer_corporation_total": insurer_corporation_total,
        "patient_burden_total": patient_burden_total,
        "prepaid_amount": prepaid_amount,
        "amount_due": amount_due,
        "paid_by_card": paid_by_card,
        "paid_by_cash_receipt": paid_by_cash_receipt,
        "paid_by_cash": paid_by_cash,
        "paid_total": paid_total,
        "unpaid_amount": unpaid_amount,
    }
    return ClaimCase(
        claim_id=f"SYN-CLAIM-{seed}",
        patient_name=patient_name,
        patient_registration_no=patient_registration_no,
        treatment_start=treatment_start,
        treatment_end=treatment_end,
        issue_date=issue_date,
        department=department,
        receipt_no=receipt_no,
        provider=provider,
        charge_rows=charge_rows,
        summary=summary,
        detail_rows=detail_rows,
    )
