from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DETAILED = ROOT / "Detailed_PLAN.MD"
FINAL = ROOT / "FINAL_PLAN.md"
WIKI = ROOT / "고도화" / "llm-wiki" / "LLM_WIKI_HOME.md"
MANIFEST = ROOT / "고도화" / "llm-wiki" / "RED_TEAM_STUDIO_FILE_MANIFEST.json"


REQUIRED_DETAILED_TERMS = [
    "상세 요구사항",
    "화면/기능 명세",
    "마일스톤",
    "API 설계",
    "테스트 전략",
    "예외 케이스",
    "레드팀 분석2",
    "ChatShare",
    "LLM wiki",
    "ToolActionCard",
    "Claim-Evidence Matrix",
    "unsupported material claim 0건",
]

REQUIRED_FINAL_TERMS = [
    "실행 목표",
    "변경 파일 계획",
    "M0",
    "M1",
    "레드팀 분석2",
    "GitHub",
    "sanity test",
]


def _read(path: Path) -> str:
    if not path.exists():
        raise AssertionError(f"missing required file: {path}")
    return path.read_text(encoding="utf-8")


def _assert_terms(label: str, text: str, terms: list[str]) -> None:
    missing = [term for term in terms if term not in text]
    if missing:
        raise AssertionError(f"{label} missing terms: {missing}")


def main() -> int:
    detailed = _read(DETAILED)
    final = _read(FINAL)
    wiki = _read(WIKI)
    if not MANIFEST.exists():
        raise AssertionError(f"missing manifest: {MANIFEST}")
    _assert_terms("Detailed_PLAN.MD", detailed, REQUIRED_DETAILED_TERMS)
    _assert_terms("FINAL_PLAN.md", final, REQUIRED_FINAL_TERMS)
    _assert_terms("LLM_WIKI_HOME.md", wiki, ["Red Team Studio LLM Wiki Home", "ChatShare", "RED_TEAM_STUDIO_FILE_MANIFEST.json"])
    print("[+] plan contract sanity passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
