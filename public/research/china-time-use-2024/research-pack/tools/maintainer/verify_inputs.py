#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
verify_inputs.py — D1 input integrity gate.

Checks, in order, and FAILS (exit 1) on any mismatch:

  1. The two audited statistical inputs in data/audited/ match the SHA-256 values
     recorded for the audit-passed research package (frozen constants below —
     these come from the study phase, not from the files being checked).
  2. Every evidence artefact (NBS bulletin snapshots, Crossref records) matches
     evidence/EVIDENCE_MANIFEST.json.
  3. (optional, --research-package DIR) data/audited/*.json are byte-identical to
     DIR/source/*.json, i.e. D1 did not touch the authoritative numbers.
  4. (optional, --research-package-zip FILE) the research package ZIP hash equals
     the value frozen in PROVENANCE.md §2.

Usage:
    python tools/verify_inputs.py
    python tools/verify_inputs.py --research-package ../inputs/china_time_use_2024_final_figures
    python tools/verify_inputs.py --write-manifest      # authoring only: refresh evidence hashes
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# Frozen from the audit-passed research package (china_time_use_2024_final_figures.zip,
# SHA-256 b8b96dd270f0da2f8c350cbc77d5866a991aaaa523e12ab6b96fc83d43134478).
UPSTREAM_AUDITED = {
    "dataset.json": "7d310646c6a35ba355242fd76882b646f6d01e1477dab533d85345a409963095",
    "gate2_results.json": "f986faaf6ea2409eff75fcce4619473ba9292e1a98670954c4254e8327009d55",
}
RESEARCH_PACKAGE_ZIP_SHA256 = (
    "b8b96dd270f0da2f8c350cbc77d5866a991aaaa523e12ab6b96fc83d43134478"
)


def sha(p: Path) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--research-package", default=None,
                    help="path to extracted china_time_use_2024_final_figures (compares bytes)")
    ap.add_argument("--research-package-zip", default=None,
                    help="path to china_time_use_2024_final_figures.zip (compares package hash)")
    ap.add_argument("--write-manifest", action="store_true",
                    help="authoring only: rewrite evidence/EVIDENCE_MANIFEST.json from files")
    args = ap.parse_args()

    problems: list[str] = []
    checks = 0

    def check(ok: bool, name: str, detail: str = "") -> None:
        nonlocal checks
        checks += 1
        print(f"[{'PASS' if ok else 'FAIL'}] {name}{('  -> ' + detail) if detail else ''}")
        if not ok:
            problems.append(name)

    # ---- 1. audited statistical inputs -------------------------------------
    for name, want in UPSTREAM_AUDITED.items():
        p = ROOT / "data" / "audited" / name
        if not p.exists():
            check(False, f"audited input exists: {name}", "file missing")
            continue
        got = sha(p)
        check(got == want, f"audited SHA-256: {name}", got[:16] + "…")

    # ---- 2. evidence artefacts ---------------------------------------------
    man_path = ROOT / "evidence" / "EVIDENCE_MANIFEST.json"
    ev_files = sorted(
        str(p.relative_to(ROOT)).replace("\\", "/")
        for p in (ROOT / "evidence").rglob("*")
        if p.is_file() and p.name != "EVIDENCE_MANIFEST.json"
    )
    if args.write_manifest:
        payload = {
            "_note": "Authoring-time manifest. verify_inputs.py compares files against these hashes.",
            "sha256": {rel: sha(ROOT / rel) for rel in ev_files},
        }
        # newline="\n": without it Windows text mode turns every \n into \r\n, and this
        # manifest then pins the CRLF bytes of every evidence file. The published pack
        # hashes the bytes it ships, so an authoring-time CRLF here makes the repository
        # copy and the reproduction ZIP disagree (fixed 2026-10-12, LF is canonical).
        man_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
                            encoding="utf-8", newline="\n")
        print(f"OK  wrote {man_path} ({len(ev_files)} entries)")

    if man_path.exists():
        man = json.loads(man_path.read_text(encoding="utf-8"))
        for rel, want in man["sha256"].items():
            p = ROOT / rel
            if not p.exists():
                check(False, f"evidence exists: {rel}", "missing")
                continue
            check(sha(p) == want, f"evidence SHA-256: {rel}", sha(p)[:16] + "…")
        extra = [r for r in ev_files if r not in man["sha256"]]
        check(not extra, "no unlisted evidence files", "; ".join(extra))
    elif not args.write_manifest:
        check(False, "evidence manifest present", "run with --write-manifest once")

    # ---- 3. byte-identity with the research package ------------------------
    if args.research_package:
        src = Path(args.research_package).resolve() / "source"
        for name in UPSTREAM_AUDITED:
            a, b = ROOT / "data" / "audited" / name, src / name
            if not b.exists():
                check(False, f"research package copy present: {name}", str(b))
                continue
            check(sha(a) == sha(b), f"byte-identical to research package: {name}")

    # ---- 4. research package ZIP hash --------------------------------------
    if args.research_package_zip:
        got = sha(Path(args.research_package_zip))
        check(got == RESEARCH_PACKAGE_ZIP_SHA256, "research package ZIP SHA-256", got[:16] + "…")

    print(f"\n{checks - len(problems)}/{checks} passed")
    if problems:
        print("FATAL: input integrity failed -> " + "; ".join(problems))
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
