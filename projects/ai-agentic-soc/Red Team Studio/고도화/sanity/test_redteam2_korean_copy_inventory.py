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
    "분석가용 다음 실행 안내",
    "분석가는 결과 첨부, Evidence 후보 확인, 보고서 주장 검토 순서로 진행합니다",
    "분석 환경 설정(관리자용)",
    "분석가가 바로 이해할 필요가 없는 컨테이너, 보조 실행 환경, 조직 OpenVAS/ZAP 읽기 전용 접속",
    "6개 도구 제출 양식 만들기",
    "6개 도구 제출 양식",
    "제출 항목",
    "예상 파일명",
    "컨테이너 실행 환경",
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
    "복합 도구 결과 회수",
    "진행률",
    "다음 행동",
    "상세 진행 기록(관리자/감사용)",
    "사용자 안내",
    "결과가 준비되면 회수·Evidence 후보 단계와 검토 우선순위가 표시됩니다",
    "운영 산출물 묶음 만들기",
    "운영 산출물 폴더에서 분석도구 결과 파일을 찾아 SHA-256 묶음을 만들고 명령은 실행하지 않습니다",
    "운영 산출물 가져오기",
    "파일 위치와 해시를 검증해 Nuclei/OpenVAS/Trivy/SCA/npm audit/ZAP 결과 파일을 한 collection으로 가져옵니다",
    "저장된 출력 또는 운영자 첨부 결과만 읽고",
    "분석 결과 수집·검토 워크플로우",
    "이 영역의 목적은 실행 목록을 보여주는 것이 아니라",
    "분석 결과 수집·검토",
    "상세 실행 기록(관리자/감사용)",
    "결과 수집 상태",
    "결과 정리 상태",
    "승인된 분석 실행 시작",
    "운영자 결과 첨부 - 명령 실행 없음",
    "승인된 로컬 runner 실행",
    "운영자 결과 본문",
    "---REDTEAM-AX-TOOL---",
    "여러 도구 결과 첨부",
    "운영 산출물 묶음 만들기·가져오기",
    "운영 산출물 묶음 만들기는 폴더 안의 분석도구 결과 파일을 찾아 SHA-256을 계산합니다",
    "운영 산출물 폴더 경로",
    "폴더에서 manifest 만들기",
    "운영 산출물 manifest 가져오기",
    "운영 산출물 묶음은 파일 위치와 해시를 확인한 뒤",
    "도구 명령·능동 스캔은 실행하지 않고 검증된 파일만 toolchain collection으로 연결합니다",
    "결과 회수·Evidence 후보",
    "LLM 분석 에이전트 요약",
    "증거 사용 제한",
    "결과 회수 뒤 표시됩니다",
    "도구별 normalizer와 Evidence 사용 제한을 표시",
    "분석 결과 쉬운 요약",
    "확인 후보",
    "심각도 분포",
    "도구별 분석 요약",
    "검토 우선순위",
    "세부 실행 ID와 저장 위치는 관리자 감사 기록과 Evidence Card에서 추적합니다",
    "필수 6개 도구 coverage",
    "필수 6개 분석도구",
    "Nuclei/OpenVAS/Trivy/SCA/npm audit/ZAP 6개 coverage",
    "완료 게이트 미준비",
    "CycloneDX SBOM",
    "컴포넌트 인벤토리 Evidence",
    "취약점 후보 Evidence",
    "affects 연결은 사람이 검토하기 전 Claim으로 확정하지 않습니다",
    "복합 Evidence 후보 승인",
    "Evidence 후보 승인",
    "복합 Evidence 후보 승인은 후보 Evidence만 승인하며",
    "Finding 생성·심각도 승인·보고서 반영은 별도 단계로 남깁니다",
    "복합 Finding 초안 생성",
    "Finding 초안 생성",
    "승인된 Evidence만 pending review Finding 초안으로 만들고",
    "2인 심각도 승인 전에는 Matrix와 보고서 Claim에 넣지 않습니다",
    "복합 Finding 심각도 2인 승인",
    "Finding 심각도 2인 승인",
    "레드팀 리드와 업무 소유자가 같은 심각도를 승인해야",
    "보고서 생성은 Matrix gate 이후에만 진행합니다",
    "복합 Collection Matrix 초안",
    "Matrix 초안 생성",
    "승인된 Evidence와 2인 승인 Finding만 ready row로 구성하며",
    "held row는 보고서 입력에서 제외합니다",
    "복합 Collection Report v2 draft",
    "Report v2 draft 생성",
    "최종 export 승인은 별도로 남깁니다",
    "복합 Collection 최종 export 게이트",
    "/api/redteam/v2/reports/{report_id}/approve-export",
    "/api/redteam/v2/reports/{report_id}/export",
    "collection Report v2 draft의 report_id가 자동으로 최종 게이트 패널에 연결됩니다",
    "복합 Collection E2E 완료 게이트",
    "복합 Collection E2E 완료 게이트",
    "기존 산출물만 읽어 Evidence 승인, Finding 승격, 2인 severity 승인, Matrix ready, Report gate, export 완료를 한 번에 점검합니다",
    "복합 Collection 전체 닫기",
    "운영 산출물 전체 닫기",
    "실제 운영 증거 사전 점검",
    "필수 분석도구 산출물",
    "Nuclei/OpenVAS/Trivy/SCA/npm audit/ZAP 6개 결과 파일을 점검합니다",
    "필수 6개 분석도구 산출물 전체를 같은 폴더에 준비",
    "누락 도구",
    "예상 파일명 패턴",
    "누락 도구 결과 파일을 운영 산출물 폴더에 추가한 뒤 다시 점검하세요",
    "6개 결과가 모두 필요",
    "다음 실행 준비 단계",
    "화면 버튼",
    "도구 실행 가능 여부",
    "도구 실행 전 해결 필요",
    "실행 전 준비",
    "실행 전 준비 차단",
    "설치 확인, 래퍼 신뢰, 격리 준비 상태를 먼저 확인하세요",
    "운영 증거 제출 묶음 초안",
    "운영자가 첨부한 파일의 해시와 상태를 확인해 사람 승인 전까지 완료로 보지 않습니다",
    "운영 Evidence Card 후보 가져오기",
    "승인된 운영자 제출 증거 후보를 Evidence Card로 등록하고 명시적 사람 검토가 있을 때만 승인 기록을 남깁니다",
    "운영 closure 제출 패키지",
    "개발 부산물 제외",
    "완료/보고서 Claim 증거로 사용하지 않습니다",
    "운영 closure 사람 검토",
    "검토 완료 운영 closure 실행",
    "운영 closure 증거 인증",
    "운영 completion audit 검토",
    "전체 목표 완료 검토",
    "completion audit matrix, accepted gate, 종료 조건 0건, 개발 부산물 제외를 모두 확인",
    "남은 gap이 있으면 완료를 차단",
    "운영 산출물 폴더, 승인자 4명, 실행 차단 조건, 닫기 요청을 실행 전 검증",
    "제출 패키지 체크리스트, 승인자 서명, 차단 조건 처리 방침을 실행 전 기록",
    "사람 검토 기록의 승인된 닫기 요청만 사용해 별도 HITL close를 실행",
    "실제 운영 산출물과 실제 승인자 증명을 completion audit 후보로 검증",
    "인증 후보를 독립 감사 checklist로 다시 검토하고 테스트 산출물은 완료 후보에서 차단",
    "샘플/테스트/통제 산출물을 운영 closure 전에 차단",
    "운영 closure 제출 패키지 확인",
    "실제 운영 증거 사전 점검",
    "운영 증거 제출 묶음 초안",
    "운영 Evidence Card 후보 가져오기",
    "Evidence Card 후보 가져오기",
    "Evidence Card 후보 ID 선택",
    "사람 검토를 완료했으며 생성된 Evidence Card를 바로 승인 기록으로 남김",
    "운영 증거 제출 묶음 항목",
    "운영 증거 제출 묶음 누락",
    "실제 운영 증거 차단 조건",
    "운영 closure 사람 검토 기록",
    "검토 완료 운영 closure 실행",
    "운영 closure 증거 인증",
    "운영 completion audit 검토",
    "전체 목표 완료 검토",
    "운영 closure 증거 검사",
    "운영 closure 실측 attestation",
    "운영 completion audit checklist",
    "운영 completion audit 차단 조건",
    "전체 목표 완료 checklist",
    "전체 목표 완료 차단 조건",
    "운영 closure 제출 항목",
    "운영 closure 승인자",
    "운영 closure 사람 검토",
    "운영 closure 서명",
    "기존 운영 분석도구 폴더를 묶음으로 만들고 가져오기, 결과 회수, close-e2e까지 이어서 수행하지만 분석도구, 컨테이너, 보조 실행 환경, 네트워크 스캔 명령은 실행하지 않습니다",
    "전체 닫기용 운영 분석도구 산출물 폴더",
    "운영 산출물 전체 닫기",
    "명시된 사람 승인자 정보를 받아 Evidence 승인, Finding 승격, 2인 severity 승인, Matrix, Report v2 draft, export 승인, export, completion gate를 순서대로 수행하지만 분석도구 명령과 능동 스캔은 실행하지 않습니다",
    "복합 Collection 전체 닫기 승인자",
    "사람 승인 필드가 비어 있으면 실행하지 않습니다",
    "전체 닫기: 승인·보고서·Export",
    "승인 전에는 Finding이나 보고서 Claim으로 확정하지 않습니다",
    "Finding 초안 생성 API",
    "Finding 초안 생성 API는 Evidence 승인 후에만 /api/redteam/v2/tool-result-finding-claim-review/{candidate_id}/promote-finding API로 사용할 수 있고",
    "Claim-Evidence Matrix 초안 API",
    "승인된 Evidence와 2인 severity 승인된 Finding만 보고서 검증 payload에 포함",
    "held row는 Evidence/Finding 승인 전 보류",
    "Matrix 기반 Report v2 draft API",
    "보류 row 0건과 report gate pass일 때만 한국어 Report v2 draft를 생성합니다",
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
    "제출 묶음의 보관 위치",
    "사람 승인 상태",
    "secret 값을 수집하지 않습니다",
    "컨테이너 실행 환경 준비",
    "OpenVAS/ZAP 읽기 전용 연결과 외부 비밀 보관 참조 설정",
    "조직 OpenVAS/ZAP 읽기 전용 접속",
    "외부 비밀 보관 참조",
    "실서비스 가져오기",
    "조직 읽기 전용 가져오기 미실행",
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
    "여러 분석도구 순차 실행·결과 첨부",
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
