"""Generate official addendum documents for AI SOC test and tech design docs.

The generator uses only local metadata-only reports. It does not download public
datasets or connect to production SOC systems.
"""

from __future__ import annotations

import html
import json
import re
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
PROJECT_ROOT = ROOT.parent
DEFAULT_REPORTS = ROOT / "reports"
DEFAULT_OUT_DIR = PROJECT_ROOT
DOCX_DIR = PROJECT_ROOT / "docx"


def utc_now() -> str:
    """Return an ISO-8601 UTC timestamp without microseconds."""
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def load_json(path: Path) -> dict[str, Any]:
    """Load a UTF-8 JSON object from disk."""
    with path.open("r", encoding="utf-8") as fp:
        data = json.load(fp)
    if not isinstance(data, dict):
        raise ValueError(f"JSON root must be object: {path}")
    return data


def build_test_matrix_rows(case_spec_plan: dict[str, Any], replay_metrics: dict[str, Any]) -> list[dict[str, str]]:
    """Build doc14-ready test matrix rows from case specs and replay metrics."""
    rows: list[dict[str, str]] = []
    for index, spec in enumerate(case_spec_plan["case_specs"], start=1):
        prefix = f"A14-PUB-{index:03d}"
        rows.append(
            {
                "test_id": prefix,
                "source_id": spec["source_id"],
                "test_category": "metadata_case_spec",
                "scenario": spec["scenario"],
                "expected_result": "expected_evidence와 expected_guardrails가 case spec에 보존된다.",
                "automation_level": "unit",
                "evidence_path": "implementation_seed/reports/dataset_case_spec_plan_v0.json",
            }
        )
        rows.append(
            {
                "test_id": f"{prefix}-DL-BLOCK",
                "source_id": spec["source_id"],
                "test_category": "download_guardrail",
                "scenario": f"{spec['source_id']} public dataset download remains blocked before approval.",
                "expected_result": "download_allowed=false, requires_manual_ingestion=true",
                "automation_level": "unit",
                "evidence_path": "implementation_seed/reports/dataset_case_spec_plan_v0.json",
            }
        )
    rows.extend(
        [
            {
                "test_id": "A14-RPL-001",
                "source_id": "synthetic-v0",
                "test_category": "replay_quality_gate",
                "scenario": "Replay Runner v1 evaluates synthetic Evidence Package fixtures with dataset plan attached.",
                "expected_result": replay_metrics["go_decision"]["decision"],
                "automation_level": "replay",
                "evidence_path": "implementation_seed/reports/replay_metrics_v1.json",
            },
            {
                "test_id": "A14-RPL-002",
                "source_id": "synthetic-v0",
                "test_category": "tenant_guardrail",
                "scenario": "Cross-tenant policy test must not leak tenant data.",
                "expected_result": f"tenant_leakage_count={replay_metrics['summary']['tenant_leakage_count']}",
                "automation_level": "replay",
                "evidence_path": "implementation_seed/reports/replay_metrics_v1.json",
            },
            {
                "test_id": "A14-RPL-003",
                "source_id": "synthetic-v0",
                "test_category": "unsupported_conclusion_guardrail",
                "scenario": "Missing evidence must not produce unsupported high-confidence conclusion.",
                "expected_result": f"unsupported_conclusion_count={replay_metrics['summary']['unsupported_conclusion_count']}",
                "automation_level": "replay",
                "evidence_path": "implementation_seed/reports/replay_metrics_v1.json",
            },
        ]
    )
    return rows


def build_technical_design_sections(case_spec_plan: dict[str, Any], replay_metrics: dict[str, Any]) -> dict[str, list[dict[str, str]]]:
    """Build doc20-ready component, data-flow, and API contract sections."""
    return {
        "components": [
            {
                "name": "DatasetRegistry",
                "responsibility": "dataset_manifest.json을 검증하고 replay/case spec plan을 생성한다.",
                "input": "dataset_manifest.schema.json, dataset_manifest.json",
                "output": "dataset_replay_plan_v0.json, dataset_case_spec_plan_v0.json",
                "guardrail": "download_allowed=false와 production_connection_allowed=false를 유지한다.",
            },
            {
                "name": "PublicDatasetAdapter",
                "responsibility": "public source metadata를 raw ingestion 전 case spec으로 변환한다.",
                "input": "manifest source.case_templates",
                "output": "metadata_stub case specs",
                "guardrail": "requires_manual_ingestion=true, adapter_mode=metadata_stub",
            },
            {
                "name": "ReplayRunner v1",
                "responsibility": "Evidence Package fixture metrics와 dataset plan을 결합해 Go/Hold/No-Go를 산출한다.",
                "input": "fixtures/*.evidence_package.json, dataset_manifest.json",
                "output": "replay_metrics_v1.json",
                "guardrail": f"current_decision={replay_metrics['go_decision']['decision']}",
            },
            {
                "name": "SyntheticAlertGenerator",
                "responsibility": "controlled SOC alert/evidence fixture를 생성한다.",
                "input": "scenario profiles",
                "output": "normalized alert and evidence package fixtures",
                "guardrail": "prompt injection, cross-tenant, missing evidence 시나리오를 포함한다.",
            },
        ],
        "data_flow": [
            {
                "from": "Dataset Manifest",
                "to": "DatasetRegistry",
                "data": "source metadata, execution policy, case templates",
                "control": "schema validation",
            },
            {
                "from": "DatasetRegistry",
                "to": "PublicDatasetAdapter",
                "data": f"{case_spec_plan['summary']['enabled_public_sources']} enabled public sources",
                "control": "metadata-only conversion",
            },
            {
                "from": "PublicDatasetAdapter",
                "to": "Case Spec Plan",
                "data": f"{case_spec_plan['summary']['case_specs']} case specs",
                "control": "download blocked",
            },
            {
                "from": "Evidence Fixtures",
                "to": "ReplayRunner v1",
                "data": f"{replay_metrics['summary']['total_cases']} synthetic cases",
                "control": "schema and assurance metrics",
            },
            {
                "from": "ReplayRunner v1",
                "to": "Go/Hold/No-Go Report",
                "data": replay_metrics["go_decision"]["decision"],
                "control": "tenant leakage and unsupported conclusion gates",
            },
        ],
        "api_contracts": [
            {
                "contract": "DatasetRegistry.build_case_spec_plan()",
                "request": "dataset manifest path",
                "response": "schema_version, summary, case_specs[]",
                "failure_mode": "schema validation error or missing source field",
            },
            {
                "contract": "PublicDatasetAdapter.to_case_specs()",
                "request": "public source object",
                "response": "metadata_stub case spec list",
                "failure_mode": "ValueError when source_type is not public",
            },
            {
                "contract": "ReplayRunner.run()",
                "request": "fixture directory and optional dataset_manifest",
                "response": "metrics, summary, go_decision, optional dataset_plan",
                "failure_mode": "schema validation failure for malformed evidence package",
            },
        ],
    }


def _table(headers: list[str], rows: list[list[str]]) -> str:
    lines = ["| " + " | ".join(headers) + " |", "| " + " | ".join(["---"] * len(headers)) + " |"]
    lines.extend("| " + " | ".join(str(cell).replace("\n", " ") for cell in row) + " |" for row in rows)
    return "\n".join(lines)


def render_test_matrix_markdown(rows: list[dict[str, str]]) -> str:
    """Render doc14 addendum markdown."""
    table_rows = [
        [row["test_id"], row["source_id"], row["test_category"], row["scenario"], row["expected_result"], row["automation_level"]]
        for row in rows
    ]
    return "\n".join(
        [
            "---",
            "title: AI SOC Agent Service 14 테스트 케이스 보강 매트릭스",
            "created: 2026-06-02",
            "project: AI_SOC_Agent_Service",
            "para: Projects",
            "zettel_type: test_matrix",
            "validation_status: executable_seed_verified",
            "---",
            "",
            "# 14. 테스트 케이스 보강 매트릭스",
            "",
            "## 목적",
            "",
            "본 문서는 기존 `14_테스트_케이스.docx`에 병합할 Agent Assurance, Dataset Manifest, Replay Runner v1 테스트 케이스 보강안이다.",
            "",
            "## 테스트 매트릭스",
            "",
            _table(["test_id", "source_id", "category", "scenario", "expected", "automation"], table_rows),
            "",
            "## 병합 원칙",
            "",
            "- 공개데이터셋 다운로드 테스트는 실제 다운로드가 아니라 `download_allowed=false` 검증으로 수행한다.",
            "- ML score는 verdict가 아니라 evidence signal로만 검증한다.",
            "- tenant leakage와 unsupported conclusion은 No-Go gate로 유지한다.",
        ]
    )


def render_technical_design_markdown(sections: dict[str, list[dict[str, str]]]) -> str:
    """Render doc20 addendum markdown."""
    component_rows = [
        [item["name"], item["responsibility"], item["input"], item["output"], item["guardrail"]]
        for item in sections["components"]
    ]
    flow_rows = [[item["from"], item["to"], item["data"], item["control"]] for item in sections["data_flow"]]
    contract_rows = [
        [item["contract"], item["request"], item["response"], item["failure_mode"]]
        for item in sections["api_contracts"]
    ]
    return "\n".join(
        [
            "---",
            "title: AI SOC Agent Service 20 기술스택 및 상세설계 보강",
            "created: 2026-06-02",
            "project: AI_SOC_Agent_Service",
            "para: Projects",
            "zettel_type: technical_design_addendum",
            "validation_status: executable_seed_verified",
            "---",
            "",
            "# 20. 기술스택 및 상세설계 보강",
            "",
            "## 목적",
            "",
            "본 문서는 기존 `20_기술스택_및_상세설계.docx`에 병합할 DatasetRegistry, PublicDatasetAdapter, ReplayRunner v1 구조 보강안이다.",
            "",
            "## 컴포넌트",
            "",
            _table(["component", "responsibility", "input", "output", "guardrail"], component_rows),
            "",
            "## 데이터 흐름",
            "",
            _table(["from", "to", "data", "control"], flow_rows),
            "",
            "## API/함수 계약",
            "",
            _table(["contract", "request", "response", "failure_mode"], contract_rows),
            "",
            "## 보안/운영 경계",
            "",
            "- public dataset adapter는 metadata_stub 단계이며 원시 데이터 다운로드를 수행하지 않는다.",
            "- production SOC connector는 이 seed에 포함하지 않는다.",
            "- 고위험 대응 조치는 Human Review 이후에도 별도 승인 workflow가 필요하다.",
        ]
    )


def write_addendum_markdown(
    rows: list[dict[str, str]],
    sections: dict[str, list[dict[str, str]]],
    out_dir: Path = DEFAULT_OUT_DIR,
) -> dict[str, Path]:
    """Write doc14/doc20 markdown addenda and return their paths."""
    out_dir.mkdir(parents=True, exist_ok=True)
    test_path = out_dir / "AI_SOC_Agent_Service_14_테스트케이스_보강매트릭스.md"
    tech_path = out_dir / "AI_SOC_Agent_Service_20_기술스택_상세설계_보강.md"
    test_path.write_text(render_test_matrix_markdown(rows), encoding="utf-8")
    tech_path.write_text(render_technical_design_markdown(sections), encoding="utf-8")
    return {"test_matrix": test_path, "technical_design": tech_path}


def _docx_paragraph(text: str, style: str | None = None, bold: bool = False) -> str:
    ppr = f'<w:pPr><w:pStyle w:val="{style}"/></w:pPr>' if style else ""
    rpr = "<w:rPr><w:b/></w:rPr>" if bold else ""
    return f"<w:p>{ppr}<w:r>{rpr}<w:t>{html.escape(text, quote=False)}</w:t></w:r></w:p>"


def _docx_table(headers: list[str], rows: list[list[str]]) -> str:
    def row(cells: list[str], header: bool = False) -> str:
        return "<w:tr>" + "".join(
            "<w:tc><w:tcPr><w:tcW w:w=\"2200\" w:type=\"dxa\"/></w:tcPr>"
            + _docx_paragraph(cell, bold=header)
            + "</w:tc>"
            for cell in cells
        ) + "</w:tr>"

    borders = (
        "<w:tblPr><w:tblBorders>"
        "<w:top w:val=\"single\" w:sz=\"4\"/><w:left w:val=\"single\" w:sz=\"4\"/>"
        "<w:bottom w:val=\"single\" w:sz=\"4\"/><w:right w:val=\"single\" w:sz=\"4\"/>"
        "<w:insideH w:val=\"single\" w:sz=\"4\"/><w:insideV w:val=\"single\" w:sz=\"4\"/>"
        "</w:tblBorders></w:tblPr>"
    )
    return "<w:tbl>" + borders + row(headers, True) + "".join(row(item) for item in rows) + "</w:tbl>"


def _markdown_body_to_docx_xml(markdown: str) -> str:
    if markdown.startswith("---"):
        parts = markdown.split("---", 2)
        markdown = parts[2].strip() if len(parts) >= 3 else markdown
    xml_parts: list[str] = []
    pending_table: list[list[str]] = []

    def flush_table() -> None:
        nonlocal pending_table
        if pending_table:
            xml_parts.append(_docx_table(pending_table[0], pending_table[1:]))
            pending_table = []

    for raw in markdown.splitlines():
        line = raw.strip()
        if not line:
            flush_table()
            continue
        if line.startswith("|") and line.endswith("|"):
            cells = [cell.strip() for cell in line.strip("|").split("|")]
            if all(re.fullmatch(r"-+", cell.replace(" ", "")) for cell in cells):
                continue
            pending_table.append(cells)
            continue
        flush_table()
        if line.startswith("# "):
            xml_parts.append(_docx_paragraph(line[2:], "Heading1", True))
        elif line.startswith("## "):
            xml_parts.append(_docx_paragraph(line[3:], "Heading2", True))
        elif line.startswith("### "):
            xml_parts.append(_docx_paragraph(line[4:], "Heading3", True))
        else:
            xml_parts.append(_docx_paragraph(line))
    flush_table()
    section = '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>'
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'
        + "".join(xml_parts)
        + section
        + "</w:body></w:document>"
    )


def write_docx_from_markdown(markdown_path: Path, docx_path: Path) -> Path:
    """Write a minimal DOCX from markdown using only Python stdlib."""
    markdown = markdown_path.read_text(encoding="utf-8")
    docx_path.parent.mkdir(parents=True, exist_ok=True)
    styles = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:rPr><w:rFonts w:ascii="Malgun Gothic" w:eastAsia="Malgun Gothic"/><w:sz w:val="18"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:rPr><w:b/><w:sz w:val="32"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:rPr><w:b/><w:sz w:val="26"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/><w:basedOn w:val="Normal"/><w:rPr><w:b/><w:sz w:val="22"/></w:rPr></w:style>
</w:styles>'''
    with zipfile.ZipFile(docx_path, "w", zipfile.ZIP_DEFLATED) as archive:
        archive.writestr(
            "[Content_Types].xml",
            '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>''',
        )
        archive.writestr(
            "_rels/.rels",
            '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>''',
        )
        archive.writestr(
            "word/_rels/document.xml.rels",
            '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>''',
        )
        archive.writestr("word/document.xml", _markdown_body_to_docx_xml(markdown))
        archive.writestr("word/styles.xml", styles)
    return docx_path


def main() -> int:
    case_spec_plan = load_json(DEFAULT_REPORTS / "dataset_case_spec_plan_v0.json")
    replay_metrics = load_json(DEFAULT_REPORTS / "replay_metrics_v1.json")
    rows = build_test_matrix_rows(case_spec_plan, replay_metrics)
    sections = build_technical_design_sections(case_spec_plan, replay_metrics)
    markdown_paths = write_addendum_markdown(rows, sections, DEFAULT_OUT_DIR)
    docx_paths = {
        "test_matrix_docx": write_docx_from_markdown(
            markdown_paths["test_matrix"], DOCX_DIR / "14_테스트케이스_보강매트릭스.docx"
        ),
        "technical_design_docx": write_docx_from_markdown(
            markdown_paths["technical_design"], DOCX_DIR / "20_기술스택_상세설계_보강.docx"
        ),
    }
    output = {
        "generated_at": utc_now(),
        "markdown": {key: str(path) for key, path in markdown_paths.items()},
        "docx": {key: str(path) for key, path in docx_paths.items()},
        "test_rows": len(rows),
        "components": len(sections["components"]),
    }
    print(json.dumps(output, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
