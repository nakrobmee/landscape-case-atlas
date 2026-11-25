# Monthly update routine — Landscape Case Atlas

Monthly refresh of EXISTING projects in the "Landscape Case Atlas" website (this repository; served by GitHub Pages; a Thai landscape architect's case-study library: a map, a case-study table and one page per project). This task does NOT add new projects — the daily routine (routines/daily-research.md) stages them and the Sunday routine publishes them. Write all descriptive text in Thai.

## Files
- data/projects.json — the source data (JSON array). The only data file you edit.
- tools/build.py — run `python3 tools/build.py` after editing; it validates and regenerates data/projects.js. Ignore exports/ (KML/CSV) and never mention Google My Maps.
- Do NOT edit index.html, cases.html, project.html, assets/ or build.py.
- The Sunday routine may write projects.json while you work: always load, modify and save it inside ONE short Python script right before writing (json.load / json.dump with ensure_ascii=False, indent=1), changing only the projects you reviewed.

## Steps
1. `date +%F` → today. Read projects.json.
2. Pick up to 30 projects to review this month, in this priority order:
   a. never reviewed (no "last_reviewed") — oldest added_date first;
   b. then the oldest "last_reviewed";
   within each group put first projects with 0 research items, fewer than 8 photos, no "plan" drawing, or no "boundary".
   Skip projects reviewed in the last 60 days.
3. For each selected project check, using WebSearch / WebFetch / curl:
   - Broken images: verify every image URL with `curl -sIL -o /dev/null -w "%{http_code} %{content_type}" "<url>"`; remove any that no longer return 200 + image/* (if the hero/first photo is removed, promote the best remaining photo of the finished project).
   - New research: Semantic Scholar (`https://api.semanticscholar.org/graph/v1/paper/search?query=<project name>&fields=title,authors,year,venue,externalIds,url&limit=20`), Crossref (`https://api.crossref.org/works?query=<project name>&rows=20&sort=published&order=desc`), Google Scholar, LAF landscapeperformance.org. Add only papers/theses that STUDY this project and that you verified (DOI/URL resolves, title matches), not already listed. Never invent a citation. Each: {"title","authors","year","journal","url","note_th"}.
   - Current photos: newer photos of the project as it is today (Wikimedia Commons search sorted by recent uploads — API `action=query&generator=search&gsrnamespace=6&gsrsort=create_timestamp_desc&prop=imageinfo&iiprop=url|extmetadata|timestamp&iiurlwidth=1600`; new firm/press photo sets; a later-phase publication). Add good ones as type "photo" with Thai caption, credit ("<author> (<licence>)" for Commons), source page and "year" (when the photo was taken). Keep max 20 photos and 4 drawings per project — if full, replace weaker/duplicate photos rather than exceeding the limit. Never hotlink fbcdn / cdninstagram / scontent / pinimg / reddit preview URLs. Keep the best photo of the finished project first.
   - Missing drawings: if there is no "plan", look again for a published masterplan / site plan.
   - Project news: new phases completed, expansions, renovations, awards won, published performance data, closures or major changes. Update facts (year, area/area_sqm, awards, description_th paragraph on results) only from sources you read; add those sources to "sources".
   - Missing boundary: try OSM Nominatim with polygon_geojson (see the weekday task's rules: only when the OSM feature really is the project; round to 6 decimals; store {"geometry", "source"}).
4. For every reviewed project set "last_reviewed": "<today>". If anything changed, also set "updated_date": "<today>" and append to "updates" (a list) one entry {"date": "<today>", "note_th": "<สั้น ๆ: เพิ่มงานวิจัย 2 ชิ้น, เพิ่มภาพปัจจุบัน 4 ภาพ (2026), ลบภาพเสีย 1 ภาพ>"}. Do not add an "updates" entry when nothing changed.
5. Run tools/build.py until it prints OK.
6. Finish with a short Thai report: number of projects reviewed; per changed project: name — what changed (research +n, photos +n/−n, drawings +n, facts/news); projects reviewed with no change (names only); how many projects have still never been reviewed.

## Quality rules
- Facts only from sources read this run; if unsure, leave the existing data as it is.
- Never delete research or sources unless the link is dead AND you cannot find a working URL for the same item.
## Saving your work (cloud run — REQUIRED)
You run in a fresh cloud checkout of the GitHub repository; nothing is kept unless it is pushed. The site is served by GitHub Pages from the `main` branch, so a push to `main` is what updates the website.
1. Before you start editing: `git checkout main && git pull --rebase origin main`.
2. At the end: `git add -A && git commit -m "monthly: review <n> projects <today>" -m "<the short Thai report>"`, then `git pull --rebase origin main` and `git push origin HEAD:main`. If the push is rejected because someone pushed meanwhile, pull --rebase again (resolve JSON conflicts by keeping both sides' entries) and push again. Never force-push.
3. If pushing to `main` is refused for permission reasons, push to a new branch `routine/<today>`, and say so clearly at the top of your report.
4. Image checks: `curl` to image hosts may be blocked by the cloud network policy. If curl gets a network/proxy error (not an HTTP status) for most hosts, say so in the report and keep images only from hosts you could verify, or verify with WebFetch.
