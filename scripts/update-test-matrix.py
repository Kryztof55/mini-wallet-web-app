#!/usr/bin/env python3
"""Recomputes the traceability matrix in specs/05-testing/test-plan.md.

A requirement row is ✅ only when every TC it lists is ✅ in the test-case tables.
Run after changing any TC status:  python3 scripts/update-test-matrix.py
"""
import re
from pathlib import Path

PLAN = Path(__file__).resolve().parent.parent / "specs/05-testing/test-plan.md"
TC_ROW = re.compile(r"^\| (TC-[A-Z0-9]+-\d+) \|.*\| (⬜|✅|❌) \|$", re.M)
STATUS_CELL = re.compile(r"\| (⬜|✅) \|$")

text = PLAN.read_text(encoding="utf-8")
status = {m.group(1): m.group(2) for m in TC_ROW.finditer(text)}
changed = []


def recompute(line: str) -> str:
    if line.startswith("| TC-") or not STATUS_CELL.search(line):
        return line
    tcs = re.findall(r"TC-[A-Z0-9]+-\d+", line)
    if not tcs:
        return line
    done = all(status.get(tc) == "✅" for tc in tcs)
    new = STATUS_CELL.sub("| ✅ |" if done else "| ⬜ |", line)
    if new != line:
        changed.append(line.split("|")[1].strip())
    return new


PLAN.write_text("\n".join(recompute(line) for line in text.split("\n")), encoding="utf-8")
print(f"{len(status)} test cases read; matrix rows changed: {changed or 'none'}")
