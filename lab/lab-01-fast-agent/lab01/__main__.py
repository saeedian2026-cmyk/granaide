from __future__ import annotations

import argparse
import asyncio
import json
import os
import sys

from lab01.run import run_scenario


def main() -> None:
    parser = argparse.ArgumentParser(description="LAB-01 fast-agent candidate runner")
    parser.add_argument("--scenario", default="T1")
    parser.add_argument("--model", default=os.environ.get("FAST_AGENT_MODEL", "passthrough"))
    args = parser.parse_args()
    response = asyncio.run(run_scenario(args.scenario, model=args.model))
    json.dump(response, sys.stdout, indent=2)
    sys.stdout.write("\n")


if __name__ == "__main__":
    main()
