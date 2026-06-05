#!/usr/bin/env python3
from __future__ import annotations

import argparse
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from fds_synth_ref.profile_extractor import extract_many, save_profiles


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--images", nargs="+", required=True, help="Authorized reference image paths")
    parser.add_argument("--out", required=True, help="Output JSON path")
    args = parser.parse_args()
    profiles = extract_many(args.images)
    Path(args.out).parent.mkdir(parents=True, exist_ok=True)
    save_profiles(profiles, args.out)
    print(f"wrote {len(profiles)} profiles to {args.out}")


if __name__ == "__main__":
    main()
