from __future__ import annotations

import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
PROJECT_ROOT = ROOT.parents[0]
REPORTS_JS = (
    PROJECT_ROOT
    / "soc-frontend-vite-react"
    / "soc-frontend"
    / "idiomatic-react"
    / "src"
    / "store"
    / "methods"
    / "reports.js"
)
INVENTORY_PATH = ROOT / "고도화" / "completion-audit" / "redteam2_korean_copy_inventory.json"

REQUIRED_KOREAN_ANCHORS = [
    "레드팀 분석2",
    "기존 레드팀 분석 흐름",
    "버튼을 누르기 전에 확인해야 할 쉬운 설명",
    "고위험 도구는 웹앱이 바로 실행하지 않고",
    "사람 승인",
    "결과 업로드",
    "분석도구 실행 안내",
    "처음 할 일",
    "안전한 실행 모드",
    "금지/주의",
    "도구 래퍼 신뢰 고정",
    "도구 실행 계획",
    "샌드박스 정책",
    "도구 출력",
    "시각 증거",
    "도구 결과 파일 업로드",
    "서비스 결과 가져오기",
    "읽기 전용 서비스 결과",
    "능동 스캔은 실행하지 않습니다",
    "실행 환경 준비도",
    "남은 실측 조건",
    "Docker Desktop daemon",
    "WSL 실행 환경",
    "WSL 배포판",
    "실측 승격 게이트",
    "승격 gate 결과",
    "조치 runbook",
    "남은 조치 단계",
    "증거 수집 패키지",
    "수집할 증거 항목",
    "증거 제출 검증",
    "승인된 제출 증거",
    "Evidence Card 후보 계획",
    "Evidence Card 후보 수",
    "도구 결과 LLM 분석 브리프",
    "분석 가능한 도구 근거",
    "LLM 분석 에이전트",
    "Finding/Claim 검토 패키지",
    "보류된 Finding/Claim 후보",
    "복합 도구 결과 회수 API",
    "/api/redteam/v2/toolchains/{toolchain_id}/collect-results",
    "저장된 stdout/stderr만 읽고",
    "결과 회수·Evidence 후보",
    "복합 Evidence 후보 승인 API",
    "/api/redteam/v2/toolchain-result-collections/{collection_id}/approve-evidence",
    "Evidence 후보 승인",
    "승인 버튼은 후보 Evidence만 승인하며",
    "Finding 생성·severity 승인·보고서 반영은 별도 단계로 남깁니다",
    "복합 Finding 초안 생성 API",
    "/api/redteam/v2/toolchain-result-collections/{collection_id}/promote-findings",
    "Finding 초안 생성",
    "승인된 Evidence만 pending review Finding 초안으로 만들고",
    "severity 2인 승인 전에는 Matrix와 보고서 Claim에 넣지 않습니다",
    "승인 전에는 Finding이나 보고서 Claim으로 확정하지 않습니다",
    "Finding 초안 생성 API",
    "Finding 초안 생성 API는 Evidence 승인 후에만 /api/redteam/v2/tool-result-finding-claim-review/{candidate_id}/promote-finding API로 사용할 수 있고",
    "Claim-Evidence Matrix 초안 API",
    "승인된 Evidence와 2인 severity 승인된 Finding만 보고서 검증 payload에 포함",
    "held row는 Evidence/Finding 승인 전 보류",
    "Matrix 기반 Report v2 draft API",
    "held row 0건과 report gate pass일 때만 한국어 Report v2 draft 생성",
    "export 전 최종 사람 승인은 별도로 필요",
    "운영자 조치 runbook 단계",
    "운영자 증거 수집 패키지",
    "운영자 제출 증거 검증",
    "Evidence Card 후보 import 계획",
    "아래 단계는 사람이 순서대로 수행",
    "Evidence Card 후보로 첨부",
    "Evidence Card 후보 payload",
    "Claim-Evidence Matrix 연결 전 사람 검토",
    "도구 재실행·능동 스캔·Finding 확정은 사람이 승인",
    "Finding severity 2인 승인 전에는 보고서에 자동 삽입하지 않습니다",
    "제출 manifest의 artifact path",
    "사람 승인 상태",
    "secret 값을 수집하지 않습니다",
    "Docker Desktop daemon 준비",
    "OpenVAS/ZAP read-only endpoint와 vault reference 설정",
    "조직 OpenVAS/ZAP read-only report endpoint",
    "외부 vault reference",
    "실서비스 가져오기",
    "조직 endpoint import 미실행",
    "케이스 RBAC 정책",
    "평가 맥락",
    "최종 게이트",
    "인용 검증",
    "근거 부족 주장",
    "차단 항목 없음",
]

REQUIRED_ALLOWED_TECH_TERMS = [
    "RedTeam AX",
    "ToolActionCard",
    "HITL",
    "Evidence Card",
    "Claim-Evidence Matrix",
    "Agentic RAG",
    "SCA",
    "Nuclei",
    "OpenVAS",
    "Trivy",
    "npm audit",
    "OWASP ZAP",
    "Sanitizer",
    "RBAC",
    "API",
    "ROE",
]

BEGINNER_SIGNAL_TERMS = [
    "쉬운 설명",
    "먼저",
    "사람",
    "승인",
    "수동",
    "업로드",
    "증거",
    "차단",
    "필요",
    "주의",
]

DISALLOWED_ENGLISH_ONLY_VISIBLE_PHRASES = [
    "Run in Lab",
    "Execute Governed Runner",
    "Report Gate",
    "Final Approval",
]


def _read_reports_source() -> str:
    if not REPORTS_JS.exists():
        raise AssertionError(f"missing reports.js: {REPORTS_JS}")
    return REPORTS_JS.read_text(encoding="utf-8")


def _segment(source: str, start: str, end: str) -> str:
    start_idx = source.find(start)
    if start_idx < 0:
        raise AssertionError(f"missing segment start: {start}")
    end_idx = source.find(end, start_idx)
    if end_idx < 0:
        raise AssertionError(f"missing segment end after {start}: {end}")
    return source[start_idx:end_idx]


def _extract_string_literals(segment: str) -> list[str]:
    strings: list[str] = []
    for match in re.finditer(r"(?<!\\)'((?:\\.|[^'\\])*)'", segment):
        value = match.group(1)
        if len(value.strip()) >= 2:
            strings.append(value)
    return strings


def _is_candidate_visible_copy(value: str) -> bool:
    if re.fullmatch(r"[A-Za-z0-9_./:-]+", value):
        return False
    if value.startswith(("http://", "https://", "/api/", "artifact://")):
        return False
    if value in {"div", "span", "button", "input", "textarea", "pre", "label", "select", "option"}:
        return False
    if value in {"grid", "flex", "center", "left", "right", "pointer", "auto", "vertical"}:
        return False
    return True


def build_inventory() -> dict:
    source = _read_reports_source()
    redteam2_segment = _segment(source, "  redTeamAnalysis2Panel() {", "  reportStudioTabs() {")
    tabs_segment = _segment(source, "  reportStudioTabs() {", "  reportStudioTabContent() {")
    combined = redteam2_segment + "\n" + tabs_segment
    literals = [item for item in _extract_string_literals(combined) if _is_candidate_visible_copy(item)]
    korean_literals = [item for item in literals if re.search(r"[가-힣]", item)]
    english_only_literals = [
        item
        for item in literals
        if re.search(r"[A-Za-z]", item) and not re.search(r"[가-힣]", item)
    ]
    allowed_technical_hits = {
        term: sum(1 for item in literals if term in item)
        for term in REQUIRED_ALLOWED_TECH_TERMS
    }
    beginner_hits = {
        term: sum(1 for item in korean_literals if term in item)
        for term in BEGINNER_SIGNAL_TERMS
    }
    missing_anchors = [term for term in REQUIRED_KOREAN_ANCHORS if term not in combined]
    disallowed_hits = [term for term in DISALLOWED_ENGLISH_ONLY_VISIBLE_PHRASES if term in combined]
    english_ratio = round(len(english_only_literals) / max(len(literals), 1), 4)
    return {
        "kind": "redteam2_korean_visible_copy_inventory",
        "schema_version": "0.1",
        "source": str(REPORTS_JS),
        "scope": "redTeamAnalysis2Panel plus reportStudioTabs",
        "literal_count": len(literals),
        "korean_literal_count": len(korean_literals),
        "english_only_literal_count": len(english_only_literals),
        "english_only_literal_ratio": english_ratio,
        "missing_korean_anchors": missing_anchors,
        "disallowed_english_only_visible_phrases": disallowed_hits,
        "allowed_technical_terms": allowed_technical_hits,
        "beginner_signal_terms": beginner_hits,
        "sample_korean_literals": korean_literals[:40],
        "sample_english_only_literals": english_only_literals[:40],
        "policy": {
            "max_english_only_literal_ratio": 0.35,
            "technical_terms_allowed_when_contextualized_in_korean": REQUIRED_ALLOWED_TECH_TERMS,
            "disallowed_english_only_visible_phrases": DISALLOWED_ENGLISH_ONLY_VISIBLE_PHRASES,
        },
        "status": "passed" if not missing_anchors and not disallowed_hits and english_ratio <= 0.35 else "failed",
    }


def main() -> int:
    inventory = build_inventory()
    if inventory["missing_korean_anchors"]:
        raise AssertionError(f"missing Korean anchors: {inventory['missing_korean_anchors']}")
    if inventory["disallowed_english_only_visible_phrases"]:
        raise AssertionError(
            "disallowed English-only visible phrases: "
            f"{inventory['disallowed_english_only_visible_phrases']}"
        )
    if inventory["english_only_literal_ratio"] > inventory["policy"]["max_english_only_literal_ratio"]:
        raise AssertionError(
            "English-only visible copy ratio too high: "
            f"{inventory['english_only_literal_ratio']}"
        )
    weak_beginner_terms = [term for term, count in inventory["beginner_signal_terms"].items() if count <= 0]
    if weak_beginner_terms:
        raise AssertionError(f"missing beginner guidance terms: {weak_beginner_terms}")
    missing_technical_terms = [
        term for term, count in inventory["allowed_technical_terms"].items() if count <= 0
    ]
    if missing_technical_terms:
        raise AssertionError(f"missing required technical terms: {missing_technical_terms}")

    INVENTORY_PATH.parent.mkdir(parents=True, exist_ok=True)
    INVENTORY_PATH.write_text(json.dumps(inventory, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(
        "[+] redteam2 Korean copy inventory passed "
        f"({inventory['korean_literal_count']}/{inventory['literal_count']} Korean-context literals, "
        f"English-only ratio={inventory['english_only_literal_ratio']})"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
