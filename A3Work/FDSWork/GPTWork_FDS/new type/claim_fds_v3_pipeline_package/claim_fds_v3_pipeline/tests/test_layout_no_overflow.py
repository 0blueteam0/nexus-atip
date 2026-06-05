from pathlib import Path
import yaml
from claim_fds_synth.claim_data import generate_claim
from claim_fds_synth.renderer import Renderer
from claim_fds_synth.qc import validate_medical_receipt_semantics


def test_medical_receipt_no_overflow():
    root = Path(__file__).resolve().parents[1]
    cfg = yaml.safe_load((root / "config/generator.yaml").read_text(encoding="utf-8"))
    claim = generate_claim(seed=cfg["seed"])
    result = Renderer(cfg).render_medical_receipt(claim)
    assert len(result.audit.overflow_records()) == 0


def test_detail_statement_no_overflow():
    root = Path(__file__).resolve().parents[1]
    cfg = yaml.safe_load((root / "config/generator.yaml").read_text(encoding="utf-8"))
    claim = generate_claim(seed=cfg["seed"])
    result = Renderer(cfg).render_detail_statement(claim)
    assert len(result.audit.overflow_records()) == 0


def test_clean_semantics_pass():
    claim = generate_claim(seed=20260604)
    assert validate_medical_receipt_semantics(claim)["all_pass"]
