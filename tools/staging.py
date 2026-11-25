"""Staging helper for the daily-research / Sunday-publish workflow.

  python3 tools/staging.py check     validate data/projects.json + every staging/*.json together
                                     (same rules as build.py, plus duplicate ids/names across files)
  python3 tools/staging.py summary   print staged projects (for the inbox page's weekly status)
  python3 tools/staging.py publish   append every staged project to data/projects.json,
                                     move the staging files to staging/archive/ (run build.py after)
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build import DATA, ROOT, validate  # noqa: E402

STAGING = ROOT / "staging"
ARCHIVE = STAGING / "archive"


def staged_files():
    return sorted(p for p in STAGING.glob("*.json")
                  if p.name not in ("state.json", "inbox_updates.json"))


def load_staged():
    out = []
    for f in staged_files():
        items = json.loads(f.read_text(encoding="utf-8"))
        if not isinstance(items, list):
            sys.exit(f"{f.name}: must be a JSON array")
        out += [(f, p) for p in items]
    return out


def check():
    projects = json.loads(DATA.read_text(encoding="utf-8"))
    staged = load_staged()
    errors = validate(projects + [p for _, p in staged])
    names = {}
    for p in projects + [p for _, p in staged]:
        key = p.get("name", "").strip().lower()
        if key in names:
            errors.append(f"{p.get('id')}: same name as {names[key]}")
        names[key] = p.get("id")
    if errors:
        print("VALIDATION FAILED:\n  " + "\n  ".join(errors))
        sys.exit(1)
    print(f"OK: {len(projects)} published + {len(staged)} staged in {len(staged_files())} file(s)")


def summary():
    staged = [p for _, p in load_staged()]
    print(json.dumps([{"id": p["id"], "name": p["name"], "city": p.get("city", ""),
                       "country": p.get("country", ""), "year": str(p.get("year", "")),
                       "added_date": p.get("added_date", "")} for p in staged],
                     ensure_ascii=False, indent=1))


def publish():
    check()
    projects = json.loads(DATA.read_text(encoding="utf-8"))
    staged = load_staged()
    projects += [p for _, p in staged]
    DATA.write_text(json.dumps(projects, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    ARCHIVE.mkdir(exist_ok=True)
    for f in staged_files():
        f.rename(ARCHIVE / f.name)
    print(f"published {len(staged)} project(s); total now {len(projects)}")


if __name__ == "__main__":
    {"check": check, "summary": summary, "publish": publish}.get(
        (sys.argv[1:] or ["check"])[0], lambda: sys.exit(__doc__))()
