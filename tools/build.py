#!/usr/bin/env python3
"""Build site data + Google My Maps exports from data/projects.json.

Outputs:
  data/projects.js                   -> loaded by index.html (works via file://)
  exports/landscape-case-studies.kml -> every project (import into Google My Maps)
  exports/weekly/<YYYY-Www>.kml      -> one file per weekly batch
  exports/landscape-case-studies.csv -> same data as CSV (My Maps also accepts CSV)
"""
import csv
import json
import sys
from pathlib import Path
from xml.sax.saxutils import escape

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "projects.json"

# key: (Thai, English, hex colour) — project types of the Landscape Institute (UK):
# https://www.landscapearchitecture.org.uk/project-types-landscape-architecture/
# ("Flood protection" and "Flood protection and SUDS" merged; "Masterplanning" from its specialist services).
# A project lists one or more keys in "categories"; the first one is its primary type (pin colour).
CATEGORIES = {
    "urban-design": ("ออกแบบเมือง", "Urban design", "#b0413e"),
    "public-parks": ("สวนสาธารณะ", "Public parks", "#3f9e4f"),
    "urban-squares": ("ลานเมือง", "Urban squares", "#c94f7c"),
    "greenways": ("ทางสีเขียว", "Greenways", "#8ab02f"),
    "green-belt": ("แนวเขตสีเขียว", "Green belt", "#5c8a2e"),
    "school-grounds": ("สวนและพื้นที่โรงเรียน", "School gardens and grounds", "#6a5acd"),
    "living-roofs": ("หลังคาเขียวและสวนบนหลังคา", "Living roofs and roof gardens", "#2f9e8f"),
    "community-gardens": ("สวนชุมชน", "Community gardens", "#c9a227"),
    "housing": ("ผังและภูมิทัศน์ที่อยู่อาศัย", "Housing layout and design", "#d1663c"),
    "green-streets": ("ถนนสีเขียว", "Green streets", "#e07b39"),
    "cycleways": ("ทางจักรยาน", "Cycleways", "#e8b80a"),
    "private-gardens": ("สวนส่วนตัว", "Private gardens", "#d67ab0"),
    "flood-suds": ("ป้องกันน้ำท่วมและระบบระบายน้ำยั่งยืน (SuDS)", "Flood protection and SUDS", "#26a6c9"),
    "forestry": ("ออกแบบพื้นที่ป่าไม้", "Forestry design", "#2a7a3b"),
    "recreation": ("ออกแบบพื้นที่นันทนาการ", "Recreation design", "#e08a1e"),
    "hotels-resorts": ("โรงแรมและรีสอร์ท", "Hotels and resorts", "#1e7fd8"),
    "industrial-commercial": ("พื้นที่อุตสาหกรรมและพาณิชยกรรม", "Industrial and commercial sites", "#8c5a4a"),
    "historic": ("อนุรักษ์และฟื้นฟูพื้นที่ประวัติศาสตร์", "Historic preservation and restoration", "#6e6e6e"),
    "land-art": ("ศิลปะภูมิทัศน์และประติมากรรมดิน", "Landscape art and earth sculpture", "#a0522d"),
    "interior-planting": ("พืชพรรณในงานออกแบบภายใน", "Horticultural design aspects of interior design", "#7fae6b"),
    "monuments": ("อนุสรณ์สถาน", "Monuments", "#4b4b6b"),
    "derelict-land": ("ฟื้นฟูพื้นที่รกร้าง", "Derelict land reclamation", "#9a6b3a"),
    "hospital-gardens": ("สวนโรงพยาบาล", "Hospital gardens", "#e05c7a"),
    "transport-corridors": ("แนวเส้นทางคมนาคม", "Transport corridors", "#3a5fa8"),
    "masterplanning": ("ผังแม่บท", "Masterplanning", "#7a4fa3"),
}
IMAGE_TYPES = {"plan", "diagram", "section", "photo"}
GEOM_TYPES = {"Polygon", "MultiPolygon", "LineString", "MultiLineString"}  # project boundary (optional)
REQUIRED = ["id", "name", "designer", "city", "country", "lat", "lng", "categories",
            "summary_th", "description_th", "added_week"]


def validate(projects):
    errors, seen = [], set()
    for i, p in enumerate(projects):
        tag = p.get("id", f"#{i}")
        for k in REQUIRED:
            if p.get(k) in (None, ""):
                errors.append(f"{tag}: missing '{k}'")
        if p.get("id") in seen:
            errors.append(f"{tag}: duplicate id")
        seen.add(p.get("id"))
        cats = p.get("categories")
        if not isinstance(cats, list) or not cats:
            errors.append(f"{tag}: 'categories' must be a non-empty list")
        else:
            for c in cats:
                if c not in CATEGORIES:
                    errors.append(f"{tag}: unknown category '{c}' (use {list(CATEGORIES)})")
        for im in p.get("images", []):
            if im.get("type") not in IMAGE_TYPES:
                errors.append(f"{tag}: image type '{im.get('type')}' not in {sorted(IMAGE_TYPES)}")
        b = p.get("boundary")
        if b is not None and (not isinstance(b, dict) or (b.get("geometry") or {}).get("type") not in GEOM_TYPES
                              or not (b.get("geometry") or {}).get("coordinates")):
            errors.append(f"{tag}: 'boundary' must be {{'geometry': GeoJSON {sorted(GEOM_TYPES)}, 'source': [...]}}")
        photos = sum(1 for im in p.get("images", []) if im.get("type") == "photo")
        if photos > 20:
            errors.append(f"{tag}: {photos} photos (max 20)")
        try:
            if not (-90 <= float(p["lat"]) <= 90 and -180 <= float(p["lng"]) <= 180):
                errors.append(f"{tag}: lat/lng out of range")
        except (KeyError, TypeError, ValueError):
            errors.append(f"{tag}: lat/lng not numeric")
    return errors


def kml_placemark(p):
    cats = p["categories"]
    en = ", ".join(CATEGORIES[c][1] for c in cats)
    th = ", ".join(CATEGORIES[c][0] for c in cats)
    imgs = [im["url"] for im in sorted(p.get("images", []), key=lambda i: i.get("type") != "plan") if im.get("url")]
    lines = [p["summary_th"], "",
             f"ผู้ออกแบบ: {p['designer']}",
             f"ปี: {p.get('year', '-')}  |  พื้นที่: {p.get('area', '-')}",
             f"หมวด: {th} ({en})"]
    for r in p.get("research", []):
        lines.append(f"งานวิจัย: {r.get('title')} ({r.get('year', '')}) {r.get('url', '')}")
    for s in p.get("sources", [])[:3]:
        lines.append(f"แหล่งข้อมูล: {s.get('url')}")
    desc = "\n".join(lines)
    data = [("gx_media_links", " ".join(imgs)), ("designer", p["designer"]),
            ("year", str(p.get("year", ""))), ("category", CATEGORIES[cats[0]][1]), ("all_categories", en), ("added_week", p["added_week"])]
    ext = "".join(f'<Data name="{n}"><value>{escape(v)}</value></Data>' for n, v in data if v)
    return (f'<Placemark><name>{escape(p["name"])}</name>'
            f'<description>{escape(desc)}</description>'
            f'<styleUrl>#{cats[0]}</styleUrl>'
            f'<ExtendedData>{ext}</ExtendedData>'
            f'<Point><coordinates>{float(p["lng"])},{float(p["lat"])},0</coordinates></Point></Placemark>')


def write_kml(path, name, projects):
    def kml_color(h):  # #rrggbb -> aabbggrr
        return "ff" + h[5:7] + h[3:5] + h[1:3]
    styles = "".join(
        f'<Style id="{k}"><IconStyle><color>{kml_color(c)}</color><scale>1.1</scale>'
        f'<Icon><href>https://maps.google.com/mapfiles/kml/paddle/wht-blank.png</href></Icon></IconStyle></Style>'
        for k, (_, _, c) in CATEGORIES.items())
    marks = "".join(kml_placemark(p) for p in projects)
    path.write_text('<?xml version="1.0" encoding="UTF-8"?>\n'
                    '<kml xmlns="http://www.opengis.net/kml/2.2"><Document>'
                    f'<name>{escape(name)}</name>{styles}{marks}</Document></kml>\n', encoding="utf-8")


def main():
    projects = json.loads(DATA.read_text(encoding="utf-8"))
    errors = validate(projects)
    if errors:
        print("VALIDATION FAILED:\n  " + "\n  ".join(errors))
        sys.exit(1)

    for p in projects:  # page-friendly: primary category shortcut
        p["category"] = p["categories"][0]
    cats = {k: {"th": th, "en": en, "color": c} for k, (th, en, c) in CATEGORIES.items()}
    (ROOT / "data" / "projects.js").write_text(
        "// Generated by tools/build.py from data/projects.json — do not edit by hand.\n"
        f"window.CATEGORIES = {json.dumps(cats, ensure_ascii=False, indent=1)};\n"
        f"window.PROJECTS = {json.dumps(projects, ensure_ascii=False, indent=1)};\n", encoding="utf-8")

    exports = ROOT / "exports"
    write_kml(exports / "landscape-case-studies.kml", "Landscape Case Studies (ทั้งหมด)", projects)
    weeks = sorted({p["added_week"] for p in projects})
    for w in weeks:
        write_kml(exports / "weekly" / f"{w}.kml", f"Landscape Case Studies {w}",
                  [p for p in projects if p["added_week"] == w])

    with open(exports / "landscape-case-studies.csv", "w", newline="", encoding="utf-8-sig") as f:
        wr = csv.writer(f)
        wr.writerow(["name", "latitude", "longitude", "category", "all_categories", "designer", "year", "city",
                     "country", "summary_th", "image", "source", "added_week"])
        for p in projects:
            wr.writerow([p["name"], p["lat"], p["lng"], CATEGORIES[p["category"]][1],
                         "; ".join(CATEGORIES[c][1] for c in p["categories"]), p["designer"],
                         p.get("year", ""), p["city"], p["country"], p["summary_th"],
                         (p.get("images") or [{}])[0].get("url", ""),
                         (p.get("sources") or [{}])[0].get("url", ""), p["added_week"]])

    print(f"OK: {len(projects)} projects, weeks: {', '.join(weeks) or '-'}")


if __name__ == "__main__":
    main()
