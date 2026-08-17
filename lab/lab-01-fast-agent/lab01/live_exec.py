from __future__ import annotations

import argparse
import asyncio
import json
from pathlib import Path

from lab01.live import run_one


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--scenario", required=True)
    parser.add_argument("--out", required=True)
    parser.add_argument("--model", required=True)
    args = parser.parse_args()
    asyncio.run(run_one(args.scenario, Path(args.out), args.model))


if __name__ == "__main__":
    main()
