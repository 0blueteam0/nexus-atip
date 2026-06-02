"""Create 22_데이터셋_및_평가전략.docx using only Python stdlib OOXML.

python-docx is intentionally not required because the project has a local `docx/`
directory that can shadow the external package and this workflow avoids installs.
"""

from __future__ import annotations

import html
import zipfile
from pathlib import Path

BASE = Path("J:/PortableApps/genai/A3Work/AI_SOC_Agent_Service")
OUT = BASE / "docx" / "22_데이터셋_및_평가전략.docx"


def esc(text: str) -> str:
    return html.escape(str(text), quote=False)


def paragraph(text: str, style: str | None = None, bold: bool = False, size: int | None = None) -> str:
    ppr = f"<w:pPr><w:pStyle w:val=\"{style}\"/></w:pPr>" if style else ""
    rpr_parts = []
    if bold:
        rpr_parts.append("<w:b/>")
    if size:
        rpr_parts.append(f"<w:sz w:val=\"{size}\"/>")
    rpr = f"<w:rPr>{''.join(rpr_parts)}</w:rPr>" if rpr_parts else ""
    return f"<w:p>{ppr}<w:r>{rpr}<w:t>{esc(text)}</w:t></w:r></w:p>"


def heading(text: str, level: int = 1) -> str:
    style = {1: "Heading1", 2: "Heading2", 3: "Heading3"}.get(level, "Heading1")
    return paragraph(text, style=style, bold=True)


def bullet(text: str) -> str:
    return paragraph("- " + text)


def table(headers: list[str], rows: list[list[str]]) -> str:
    def row(cells: list[str], header: bool = False) -> str:
        cell_xml = ""
        for cell in cells:
            cell_xml += "<w:tc><w:tcPr><w:tcW w:w=\"2400\" w:type=\"dxa\"/></w:tcPr>" + paragraph(cell, bold=header) + "</w:tc>"
        return "<w:tr>" + cell_xml + "</w:tr>"

    borders = (
        "<w:tblPr><w:tblBorders>"
        "<w:top w:val=\"single\" w:sz=\"4\"/><w:left w:val=\"single\" w:sz=\"4\"/>"
        "<w:bottom w:val=\"single\" w:sz=\"4\"/><w:right w:val=\"single\" w:sz=\"4\"/>"
        "<w:insideH w:val=\"single\" w:sz=\"4\"/><w:insideV w:val=\"single\" w:sz=\"4\"/>"
        "</w:tblBorders></w:tblPr>"
    )
    return "<w:tbl>" + borders + row(headers, True) + "".join(row(r) for r in rows) + "</w:tbl>"


def document_xml() -> str:
    body = []
    body.append(paragraph("22. 데이터셋 및 평가전략", bold=True, size=40))
    body.append(paragraph("AI SOC Agent Platform v2 - PoC/MVP Evaluation & Dataset Strategy"))
    body.append(table(["항목", "내용"], [
        ["문서버전", "v0.1 추가본"],
        ["기준일", "2026-06-02"],
        ["작성목적", "보안관제 AI 에이전트 PoC/MVP의 데이터셋, 합성데이터, 평가, ML/알고리즘 적용 전략 정의"],
    ]))

    body.append(heading("1. 전략 요약"))
    body.append(paragraph("본 문서는 기존 AI SOC Agent Service v2 문서 패키지의 보강 문서이다. 목표는 자동 대응이 아니라 Evidence Package, Human Review, Agent Assurance를 검증 가능한 형태로 만들기 위한 데이터셋/평가전략을 정의하는 것이다."))
    body.append(paragraph("초기 PoC는 read-only/draft 중심으로 운영하며, 계정잠금·호스트격리·방화벽차단·고객 공식통보 같은 고위험 조치는 자동 실행하지 않는다."))

    body.append(heading("2. 데이터셋 계층"))
    body.append(table(["계층", "목적", "데이터 소스", "사용 시점"], [
        ["D1 공개 벤치마크", "모델/알고리즘 baseline", "CICIDS2017/2018, UNSW-NB15, Bot-IoT, TON_IoT, LANL, CERT Insider", "PoC Day 1~30"],
        ["D2 SOC 운영형 공개/CTF", "Evidence Package/Timeline/Case 평가", "OTRF Security Datasets, Splunk BOTS v3, Sigma, MITRE ATT&CK", "PoC Day 15~60"],
        ["D3 합성/Replay", "Policy/Tool/Evidence/Prompt Guardrail 검증", "Synthetic Alert Generator, Atomic Red Team, MITRE Caldera, lab SIEM", "PoC Day 31~90"],
        ["D4 고객 Shadow", "실제 업무 효과 측정", "익명화된 SIEM/ITSM/EDR read-only 데이터", "PoC Day 61~90 이후"],
    ]))

    body.append(heading("3. 공개데이터셋 후보"))
    body.append(table(["후보", "확인/출처", "성격", "프로젝트 용도", "주의점"], [
        ["UNSW-NB15", "UNSW Research 페이지 확인", "네트워크 공격/정상 데이터", "supervised triage/anomaly baseline", "SOC verdict와 직접 동일시 금지"],
        ["Bot-IoT", "UNSW Research 페이지 확인", "IoT botnet/DoS/scan", "IoT/OT 확장 시나리오", "일반 기업 SOC 분포와 차이"],
        ["TON_IoT", "UNSW Research 페이지 확인", "Telemetry/IoT/IIoT", "OT/IoT package 후보", "MVP 기본 범위 아님"],
        ["LANL Cyber Security Events", "LANL 페이지 확인", "인증/DNS/flow 등 enterprise event", "entity graph/lateral movement 연구", "라이선스/접근 조건 확인 필요"],
        ["CERT Insider Threat", "CMU KiltHub 접근 확인", "내부자 위협 시나리오", "UEBA/insider risk 후보", "개인정보/행동 데이터 해석 주의"],
        ["OTRF Security Datasets", "GitHub README 확인", "replay 가능한 보안 이벤트", "Detection validation, Evidence replay", "데이터별 스키마 상이"],
        ["Splunk BOTS v3", "GitHub README 확인", "SOC CTF/실전형 로그", "Case/Evidence/Timeline 평가", "Splunk 중심, 변환 필요"],
        ["CICIDS2017/2018", "본 환경 TLS chain 문제", "IDS/플로우 벤치마크", "baseline 후보", "실사용 전 다운로드/라이선스/무결성 재확인"],
    ]))

    body.append(heading("4. 합성데이터셋 전략"))
    synthetic = [
        ("Synthetic Alert Generator", "alert_family, tenant_profile, asset_criticality, user_role, evidence_availability를 입력받아 normalized_alert, required_evidence, expected_missing_evidence, expected_reason_code를 생성한다."),
        ("Atomic Red Team 기반 lab 이벤트", "ATT&CK 매핑 portable detection test를 격리 lab에서만 사용한다. 운영망 실행 금지."),
        ("MITRE Caldera 기반 replay/evaluation", "adversary emulation 플랫폼을 공격 자동화가 아니라 평가 데이터 생성용 격리 lab으로만 사용한다."),
        ("Sigma rule 기반 alert simulation", "Sigma rule metadata로 alert family, ATT&CK tactic/technique, required evidence template을 생성한다."),
        ("OTRF/Splunk BOTS replay", "실제 SOC Case/Evidence/Timeline에 가까운 replay 평가셋으로 사용한다."),
    ]
    for title, text in synthetic:
        body.append(heading(title, 2))
        body.append(paragraph(text))

    body.append(heading("5. 평가 지표"))
    body.append(table(["지표", "정의", "PoC 목표"], [
        ["Evidence Package 생성 성공률", "Alert 입력 후 패키지 생성 완료", ">= 90%"],
        ["Evidence completeness", "required evidence 중 collected 또는 justified missing 비율", ">= 80~85%"],
        ["Missing reason coverage", "누락 증거에 reason/next_step 존재", ">= 90%"],
        ["Policy gate accuracy", "blocked/review/allowed 판단 정확도", ">= 95%"],
        ["Tenant leakage", "타 tenant 정보 접근/노출", "0"],
        ["Prompt injection quarantine", "known synthetic prompt injection 격리", "100%"],
        ["Unsupported conclusion", "근거 없는 결론/권고", "0 critical"],
        ["Human accepted/edit-light", "분석가 수용/소폭수정", "PoC >= 50%, Pilot >= 60%"],
    ]))

    body.append(heading("6. ML/DL/알고리즘 적용 원칙"))
    body.append(table(["영역", "1차 접근", "확장", "PoC 우선순위"], [
        ["Risk/Severity scoring", "규칙 기반 weighted score", "LightGBM/XGBoost/logistic regression", "High"],
        ["False positive 후보", "CSOP exception + known scanner + closure history", "supervised classifier/isolation forest", "High"],
        ["Alert correlation", "deterministic key + time window", "clustering/graph connected components", "High"],
        ["Entity context", "CMDB/IAM/IOC lookup + graph query", "graph embedding/GNN later", "Medium"],
        ["Timeline", "timestamp normalization + event ordering", "sequence anomaly detection", "High"],
        ["LLM draft", "Evidence citation 기반 template/generation", "RAG + evaluator calibration", "High"],
        ["Agent assurance", "deterministic checks + rubric", "LLM judge only as secondary", "High"],
    ]))

    body.append(heading("7. 90일 PoC 실행계획"))
    phases = [
        ("Phase 0: 착수 전 1주 - 범위 잠금", ["alert family 3개 선택", "connector read-only/draft-only 범위 확정", "자동 고위험 조치 금지 명시", "성공 KPI 기준선 합의"]),
        ("Day 1~30: 데이터/스키마/평가 기반", ["normalized_alert/evidence_package JSON schema", "dataset inventory", "Synthetic Alert Generator v0", "Replay metric 정의", "규칙 baseline 구현"]),
        ("Day 31~60: Investigation Agent MVP", ["Alert Intake", "Evidence Planner", "Tool Gateway mock/read-only", "Entity Context", "Timeline Builder", "Triage Candidate", "Ticket Draft", "Agent Trace"]),
        ("Day 61~90: Shadow 운영/평가", ["실제 반영 없는 shadow 비교", "human feedback 수집", "Agent Assurance metrics", "Operations Quality 후보 검증", "Go/Hold/No-Go 판단"]),
    ]
    for title, bullets in phases:
        body.append(heading(title, 2))
        for item in bullets:
            body.append(bullet(item))

    body.append(heading("8. 이번 단계 생성된 실행 seed"))
    for item in [
        "implementation_seed/schemas/normalized_alert.schema.json",
        "implementation_seed/schemas/evidence_package.schema.json",
        "implementation_seed/scripts/synthetic_alert_generator.py",
        "implementation_seed/tests/test_synthetic_alert_generator.py",
        "implementation_seed/fixtures/*.json",
        "implementation_seed/EVALUATION_PROTOCOL.md",
    ]:
        body.append(bullet(item))

    body.append(heading("9. 검증 명령"))
    body.append(paragraph("python -m unittest implementation_seed.tests.test_synthetic_alert_generator -v"))
    body.append(paragraph("python implementation_seed/scripts/synthetic_alert_generator.py --out implementation_seed/fixtures --seed 42"))

    body.append(heading("10. 다음 조치"))
    for item in [
        "기존 14_테스트_케이스.docx에 Agent Assurance 테스트를 병합한다.",
        "20_기술스택_및_상세설계.docx에 Evaluation API와 Replay Runner 구조를 병합한다.",
        "21_PoC_및_로드맵_업데이트.docx에 Day 1~90 gate와 KPI를 병합한다.",
        "BOTS v3 또는 OTRF 중 1개를 실제 replay seed로 선정한다.",
    ]:
        body.append(bullet(item))

    sect = '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>'
    return ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
            '<w:body>' + ''.join(body) + sect + '</w:body></w:document>')


def styles_xml() -> str:
    return '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:rPr><w:rFonts w:ascii="Malgun Gothic" w:eastAsia="Malgun Gothic"/><w:sz w:val="20"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:rPr><w:b/><w:sz w:val="32"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:rPr><w:b/><w:sz w:val="26"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/><w:basedOn w:val="Normal"/><w:rPr><w:b/><w:sz w:val="22"/></w:rPr></w:style>
</w:styles>'''


def write_docx() -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("[Content_Types].xml", '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>''')
        z.writestr("_rels/.rels", '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>''')
        z.writestr("word/_rels/document.xml.rels", '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>''')
        z.writestr("word/document.xml", document_xml())
        z.writestr("word/styles.xml", styles_xml())
    print(OUT)


if __name__ == "__main__":
    write_docx()
