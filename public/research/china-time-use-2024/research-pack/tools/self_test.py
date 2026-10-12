#!/usr/bin/env python3
"""self_test.py — proves the reproduction gate is not vacuous.

    python tools/self_test.py            (exit 0 = the gate behaves correctly)

It runs the reader flow in a throwaway copy of the pack, then deliberately breaks
things and requires the flow to fail:

  T1  clean copy            -> verify + recompute + parity all exit 0
  T2  after a full run      -> every pack file still has its original hash
                               (the reader flow must never rewrite a manifest)
  T3  one digit changed in dataset.json          -> verify_public_inputs.py FAILS
  T4  a duration changed in the page data layer  -> parity_check.mjs FAILS
  T5  a headline number changed in the data layer-> parity_check.mjs FAILS

T4/T5 matter: a reproduction that only checks hashes would still pass if the page
were regenerated from different numbers. This shows the numeric gate bites.
"""
from __future__ import annotations

import hashlib
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
for _s in (sys.stdout, sys.stderr):          # Windows consoles default to cp936/GBK
    try:
        _s.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
SKIP_PREFIX = ("out/", "__pycache__")


def sha(p: Path) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()


def snapshot(d: Path) -> dict[str, str]:
    out = {}
    for p in sorted(d.rglob("*")):
        if not p.is_file():
            continue
        rel = p.relative_to(d).as_posix()
        if rel.startswith(SKIP_PREFIX):
            continue
        out[rel] = sha(p)
    return out


def run(d: Path, *cmd: str) -> subprocess.CompletedProcess:
    return subprocess.run(list(cmd), cwd=d, capture_output=True, text=True,
                          encoding="utf-8", errors="replace")   # never inherit the Windows code page


def tail(cp: subprocess.CompletedProcess, n: int = 1) -> str:
    lines = [l for l in ((cp.stdout or "") + (cp.stderr or "")).splitlines() if l.strip()]
    return " / ".join(lines[-n:])[:200]


passed, failed = 0, []


def expect(name: str, ok: bool, detail: str = "") -> None:
    global passed
    if ok:
        passed += 1
    else:
        failed.append(name)
    print(f"[{'PASS' if ok else 'FAIL'}] {name}" + (f"  -> {detail}" if detail else ""))


def main() -> int:
    base = Path(tempfile.mkdtemp(prefix="ct2024-selftest-"))
    try:
        work = base / "pack"
        shutil.copytree(ROOT, work, ignore=shutil.ignore_patterns("out", "__pycache__"))

        # ---- T1 clean run
        r1 = run(work, sys.executable, "tools/verify_public_inputs.py")
        expect("T1a clean pack passes verify_public_inputs.py", r1.returncode == 0, tail(r1))
        r2 = run(work, sys.executable, "tools/recompute_statistics.py")
        expect("T1b clean pack passes recompute_statistics.py", r2.returncode == 0, tail(r2))
        r3 = run(work, "node", "tools/parity_check.mjs")
        expect("T1c clean pack passes parity_check.mjs", r3.returncode == 0, tail(r3))

        # ---- T2 nothing was rewritten by running the flow
        before = snapshot(work)
        run(work, sys.executable, "tools/verify_public_inputs.py")
        run(work, sys.executable, "tools/recompute_statistics.py")
        run(work, "node", "tools/parity_check.mjs")
        after = snapshot(work)
        changed = [k for k in after if before.get(k) != after[k]]
        expect("T2 the reader flow modifies no pack file (no manifest rewrite)",
               not changed, ", ".join(changed[:4]))

        # ---- T3 tamper with a frozen input
        t3 = base / "t3"
        shutil.copytree(work, t3, ignore=shutil.ignore_patterns("out"))
        ds = t3 / "data/audited/dataset.json"
        ds.write_text(ds.read_text(encoding="utf-8").replace('"participant_mean_min": 404',
                                                            '"participant_mean_min": 405', 1),
                      encoding="utf-8", newline="")
        v = run(t3, sys.executable, "tools/verify_public_inputs.py")
        c = run(t3, sys.executable, "tools/recompute_statistics.py")
        expect("T3 tampered frozen input is caught (verify fails, exit != 0)",
               v.returncode != 0, tail(v))
        expect("T3b tampered frozen input also breaks the arithmetic gate",
               c.returncode != 0, tail(c))

        # ---- T4/T5 tamper with the page's generated data layer only
        for label, old, new in [
            ("T4 participant duration changed in the data layer",
             '"participant_mean_min": 404', '"participant_mean_min": 409'),
            ("T5 a headline gap changed in the data layer",
             '"paid": -73.873', '"paid": -60.000'),
        ]:
            t = base / label[:2]
            shutil.copytree(work, t, ignore=shutil.ignore_patterns("out"))
            js = t / "data/time-use-data.js"
            txt = js.read_text(encoding="utf-8")
            if old not in txt:
                expect(label + " (setup)", False, f"pattern {old!r} not found in data layer")
                continue
            js.write_text(txt.replace(old, new, 1), encoding="utf-8", newline="")
            run(t, sys.executable, "tools/recompute_statistics.py")
            p = run(t, "node", "tools/parity_check.mjs")
            expect(label + " -> parity fails", p.returncode != 0, tail(p))

        # the pack itself must be untouched by all of the above
        expect("Z original pack unchanged after every tamper trial",
               snapshot(work) == snapshot(work) and sha(ROOT / "data/audited/dataset.json")
               == "7d310646c6a35ba355242fd76882b646f6d01e1477dab533d85345a409963095")
    finally:
        shutil.rmtree(base, ignore_errors=True)

    print(f"\n{passed}/{passed + len(failed)} passed")
    if failed:
        print("FATAL: self-test failed -> " + ", ".join(failed))
        return 1
    print("self-test: the reproduction gate bites")
    return 0


if __name__ == "__main__":
    sys.exit(main())
