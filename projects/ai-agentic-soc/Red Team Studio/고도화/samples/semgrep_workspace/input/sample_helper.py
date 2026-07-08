"""Benign helper used by RedTeam AX Semgrep integration tests."""


def render_status(case_id: str) -> str:
    """Return a deterministic sample status message."""
    return f"case={case_id}: ready"


def main() -> None:
    print(render_status("CASE-SAMPLE"))


if __name__ == "__main__":
    main()
