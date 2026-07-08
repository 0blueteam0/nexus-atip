"""Benign helper used by RedTeam AX Bandit integration tests."""


def normalize_label(value: str) -> str:
    """Return a trimmed, display-safe label for sample evidence."""
    return " ".join(str(value or "").strip().split())


if __name__ == "__main__":
    print(normalize_label(" RedTeam AX sample helper "))
