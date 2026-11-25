// Shared helpers for index.html (map) and project.html (detail page).
const P = window.PROJECTS || [];
const C = window.CATEGORIES || {};
const col = k => (C[k] && C[k].color) || "#888";
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const cats = p => p.categories || (p.category ? [p.category] : []);
const IMG_TYPE = {plan: "Masterplan", diagram: "Diagram", section: "Section", photo: "Photo"};
const isDrawing = im => im.type && im.type !== "photo";
const coverImg = p => { const ims = p.images || []; return (ims.find(i => i.type === "photo") || ims[0] || {}).url; };
const projectUrl = p => `project.html?id=${encodeURIComponent(p.id)}`;

// One line-glyph per category (24×24, stroked). Drawn white inside the pin and the legend badge.
const GLYPH = {
  "urban-design": '<rect x="3" y="3" width="18" height="18" rx="1"/><path d="M3 12h18M12 3v18"/>',
  "public-parks": '<circle cx="12" cy="9" r="6"/><path d="M12 15v7M8 22h8"/>',
  "urban-squares": '<rect x="4" y="4" width="16" height="16" rx="1"/><circle cx="12" cy="12" r="3"/>',
  "greenways": '<path d="M7 21c0-5 10-4 10-9S9 7 9 3"/><circle cx="7" cy="21" r=".6"/><circle cx="9" cy="3" r=".6"/>',
  "green-belt": '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/>',
  "school-grounds": '<path d="M3 9l9-5 9 5-9 5zM7 11.5V16c0 1.5 2.5 3 5 3s5-1.5 5-3v-4.5"/>',
  "living-roofs": '<path d="M3 12l9-7 9 7M5 10.5V20h14v-9.5"/><path d="M7 9c1.5-1 3-1 5 0s3.5 1 5 0"/>',
  "community-gardens": '<path d="M12 21V11M12 13c-3 0-5-2-5-5 3 0 5 2 5 5zM12 13c3 0 5-2 5-5-3 0-5 2-5 5zM4 21h16"/>',
  "housing": '<path d="M3 11l9-7 9 7M5 9.5V20h14V9.5M10 20v-6h4v6"/>',
  "green-streets": '<path d="M5 21L9 3M19 21L15 3M12 6v2M12 11v2M12 16v2"/>',
  "cycleways": '<circle cx="6" cy="16" r="4"/><circle cx="18" cy="16" r="4"/><path d="M6 16l4-8h5l3 8M10 8l2 8h-6M14 5h3"/>',
  "private-gardens": '<path d="M12 4a3 3 0 0 1 3 3 3 3 0 0 1-3 3 3 3 0 0 1-3-3 3 3 0 0 1 3-3zM12 10v11M8 15c2 0 4 1 4 3M16 15c-2 0-4 1-4 3"/>',
  "flood-suds": '<path d="M12 3s6 7 6 11.5a6 6 0 0 1-12 0C6 10 12 3 12 3z"/><path d="M9.5 15a2.5 2.5 0 0 0 2.5 2.5"/>',
  "forestry": '<path d="M12 2l6 9h-3l4 6H5l4-6H6zM12 17v5"/>',
  "recreation": '<circle cx="12" cy="12" r="9"/><path d="M3.5 9h17M3.5 15h17M12 3c-3 3-3 15 0 18M12 3c3 3 3 15 0 18"/>',
  "hotels-resorts": '<path d="M3 20h18M5 20V9h14v11M9 13h2M13 13h2M9 16h2M13 16h2M12 9V4l4 2-4 2"/>',
  "industrial-commercial": '<path d="M3 21V12l5 3v-3l5 3V4h5v17zM2 21h20"/>',
  "historic": '<path d="M3 9l9-5 9 5zM5 9v9M10 9v9M14 9v9M19 9v9M3 20.5h18"/>',
  "land-art": '<path d="M2 19c3-6 6-9 10-9s7 3 10 9zM7 19c1.5-3 3-4.5 5-4.5s3.5 1.5 5 4.5"/>',
  "interior-planting": '<path d="M7 14h10l-1.5 7h-7zM12 14V8M12 10c-2.5 0-4-1.5-4-4 2.5 0 4 1.5 4 4zM12 8c2.5 0 4-1.5 4-4-2.5 0-4 1.5-4 4z"/>',
  "monuments": '<path d="M12 2.5l2 3.5H10zM10 6h4v12h-4zM7 18h10v3H7z"/>',
  "derelict-land": '<path d="M20 11A8 8 0 0 0 5.6 6.6L4 8M4 3v5h5M4 13a8 8 0 0 0 14.4 4.4L20 16M20 21v-5h-5"/>',
  "hospital-gardens": '<path d="M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z"/><path d="M12 9v5M9.5 11.5h5"/>',
  "transport-corridors": '<path d="M8 3L5 21M16 3l3 18M7.2 8h9.6M6.4 13h11.2M5.6 18h12.8"/>',
  "masterplanning": '<path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15M15 6v15"/>',
};
const glyph = (k, size = 14, stroke = "#fff") =>
  `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="${stroke}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${GLYPH[k] || '<circle cx="12" cy="12" r="4" fill="' + stroke + '"/>'}</svg>`;
// Coloured round badge with the category glyph — used as legend / tag marker.
const badge = (k, size = 18) =>
  `<span class="cbadge" style="background:${col(k)};width:${size}px;height:${size}px">${glyph(k, Math.round(size * .66))}</span>`;

const catTags = p => cats(p).map(k =>
  `<span class="ctag">${badge(k, 17)}${esc(C[k] ? C[k].en : k)}</span>`).join("");

function store(key, val){
  try { if (val === undefined) return localStorage.getItem(key); localStorage.setItem(key, val); } catch(e){ return null; }
}

// Wikipedia lead image as a fallback when a project has no image URLs.
const wikiCache = {};
async function wikiThumb(title){
  if (!title) return null;
  if (title in wikiCache) return wikiCache[title];
  try {
    const [lang, t] = title.includes(":") ? [title.split(":")[0], title.split(":").slice(1).join(":")] : ["en", title];
    const j = await (await fetch(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(t)}`)).json();
    return wikiCache[title] = (j.originalimage || j.thumbnail || {}).source || null;
  } catch(e){ return wikiCache[title] = null; }
}

// Base maps: OSM by default, Google satellite / hybrid switchable. Remembers the last choice.
function addBaseLayers(map, defaultName, key = "lca-base"){
  const g = lyr => L.tileLayer(`https://mt{s}.google.com/vt/lyrs=${lyr}&x={x}&y={y}&z={z}`,
    {subdomains: "0123", maxZoom: 21, attribution: "Imagery &copy; Google"});
  const layers = {
    "OpenStreetMap": L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      {maxZoom: 19, attribution: "&copy; OpenStreetMap contributors"}),
    "Google Satellite": g("s"),
    "Google Satellite + ป้ายชื่อ": g("y"),
  };
  const saved = store(key);
  (layers[saved] || layers[defaultName] || layers["OpenStreetMap"]).addTo(map);
  L.control.layers(layers, null, {position: "topright"}).addTo(map);
  map.on("baselayerchange", e => store(key, e.name));
}

// Pin: colour + glyph of the MAIN category (first in the list). 32×42, tip at bottom centre.
const pinHtml = k =>
  `<div class="pin-in"><svg viewBox="0 0 32 42" width="32" height="42" aria-hidden="true"><path d="M16 1C7.7 1 1 7.6 1 15.8 1 27 16 41 16 41s15-14 15-25.2C31 7.6 24.3 1 16 1z" fill="${col(k)}" stroke="#fff" stroke-width="2"/></svg>`
  + `<span class="pin-glyph">${glyph(k, 17)}</span></div>`;
function pinIcon(p){   // Leaflet (project page)
  return L.divIcon({className: "pin", iconSize: [32, 42], iconAnchor: [16, 41], popupAnchor: [0, -36], html: pinHtml(cats(p)[0])});
}

// Cluster: a plain count bubble (no category colours) — pins with colours appear when zoomed in.
function clusterHtml(n){
  const size = n < 5 ? 34 : n < 15 ? 40 : n < 40 ? 48 : 56;
  return {size, html: `<b>${n}</b>`};
}

// ---- shared top navigation (icons only): globe = map, grid = project cards. cur = "map" | "table"
const navHtml = cur => `<nav class="appnav" aria-label="มุมมอง">
  <a href="index.html" class="tip-below" data-tip="แผนที่" aria-label="แผนที่" ${cur === "map" ? 'aria-current="page"' : ""}><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c-2.5 2.6-3.6 5.6-3.6 9s1.1 6.4 3.6 9c2.5-2.6 3.6-5.6 3.6-9S14.5 5.6 12 3z"/></svg></a>
  <a href="cases.html" class="tip-below" data-tip="โครงการ" aria-label="โครงการ" ${cur === "table" ? 'aria-current="page"' : ""}><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5"/></svg></a>
</nav>`;
const brandHtml = () => `<a class="brand" href="index.html"><span class="brand-mark" aria-hidden="true"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 19C5 9 11 4 20 4c0 9-5 15-15 15zM5 19l8-8"/></svg></span><span>Landscape Case Atlas</span></a>`;

// ---- area: "259 ไร่" + "414,400 ตร.ม." (or ตร.กม. from 1 sq. km.)
const nf = new Intl.NumberFormat("en-US");
function fmtArea(sqm){
  if (!sqm) return null;
  const rai = sqm / 1600;
  return {rai: rai >= 10 ? nf.format(Math.round(rai)) : rai.toFixed(1), metric: sqm >= 1e6 ? `${+(sqm / 1e6).toFixed(1)} ตร.กม.` : `${nf.format(Math.round(sqm))} ตร.ม.`};
}
const firstYear = p => { const m = String(p.year || "").match(/\d{4}/g); return m ? +m[m.length - 1] : null; };   // latest year mentioned

// ---- country → continent (Thai label). Unknown countries fall into "อื่น ๆ".
const CONTINENTS = {
  "เอเชียตะวันออกเฉียงใต้": ["Thailand","Singapore","Malaysia","Indonesia","Vietnam","Philippines","Cambodia","Laos","Myanmar","Brunei","Timor-Leste"],
  "เอเชียตะวันออก": ["China","Japan","South Korea","Taiwan","Hong Kong","Macau","Mongolia","North Korea"],
  "เอเชียใต้และกลาง": ["India","Bangladesh","Pakistan","Sri Lanka","Nepal","Bhutan","Maldives","Afghanistan","Kazakhstan","Uzbekistan","Kyrgyzstan","Tajikistan","Turkmenistan"],
  "ตะวันออกกลาง": ["United Arab Emirates","Saudi Arabia","Qatar","Israel","Jordan","Lebanon","Iran","Iraq","Oman","Kuwait","Bahrain","Turkey","Türkiye","Syria","Yemen","Palestine"],
  "ยุโรป": ["United Kingdom","Denmark","Germany","Spain","Sweden","Netherlands","France","Italy","Norway","Finland","Iceland","Belgium","Switzerland","Austria","Portugal","Ireland","Poland","Czech Republic","Czechia","Hungary","Slovakia","Slovenia","Croatia","Greece","Estonia","Latvia","Lithuania","Romania","Bulgaria","Serbia","Luxembourg","Ukraine","Russia","Albania","North Macedonia","Bosnia and Herzegovina","Montenegro","Malta","Cyprus","Georgia","Armenia","Azerbaijan"],
  "อเมริกาเหนือ": ["United States","Canada"],
  "ละตินอเมริกา": ["Mexico","Brazil","Colombia","Chile","Argentina","Peru","Ecuador","Uruguay","Paraguay","Bolivia","Venezuela","Costa Rica","Panama","Guatemala","Cuba","Dominican Republic","Puerto Rico","Honduras","El Salvador","Nicaragua","Jamaica"],
  "แอฟริกา": ["South Africa","Kenya","Rwanda","Egypt","Morocco","Nigeria","Ghana","Ethiopia","Tanzania","Uganda","Senegal","Tunisia","Algeria","Burkina Faso","Mali","Niger","Namibia","Botswana","Zimbabwe","Zambia","Mozambique","Madagascar","Côte d'Ivoire","Ivory Coast","Cameroon","Malawi","Sierra Leone","Liberia"],
  "โอเชียเนีย": ["Australia","New Zealand","Fiji","Papua New Guinea","Samoa"],
};
const CONT_OF = Object.fromEntries(Object.entries(CONTINENTS).flatMap(([c, list]) => list.map(n => [n, c])));
const continent = p => CONT_OF[p.country] || "อื่น ๆ";

// ---- project-type picker: a dropdown that shows each type's icon (English names).
// catPicker(el, {counts: {key: n}, value, onChange(key), allLabel}) → {set(key), get()}. "" = all types.
const CARET = '<svg class="caret" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
const ALL_ICON = '<span class="cbadge cpick-all" aria-hidden="true"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg></span>';
function catPicker(el, {counts, value = "", onChange = () => {}, allLabel = "All project types", btnHtml = null}){
  const keys = Object.keys(C).filter(k => counts[k]);
  el.classList.add("cpick");
  el.innerHTML = `<button type="button" class="cpick-btn" aria-haspopup="listbox" aria-expanded="false"></button>
    <ul class="cpick-list" role="listbox" aria-label="Project type" hidden>${[""].concat(keys).map(k =>
      `<li role="option" tabindex="-1" data-k="${k}">${k ? badge(k, 20) : ALL_ICON}<span>${k ? esc(C[k].en) : esc(allLabel)}</span>${k ? `<span class="n">${counts[k]}</span>` : ""}</li>`).join("")}</ul>`;
  const btn = el.querySelector(".cpick-btn"), list = el.querySelector(".cpick-list"), items = () => [...list.children];
  let cur = "";
  function set(k, fire){
    cur = C[k] ? k : "";
    btn.innerHTML = btnHtml ? btnHtml(cur) : (cur ? badge(cur, 20) + `<span class="lbl">${esc(C[cur].en)}</span>` : ALL_ICON + `<span class="lbl">${esc(allLabel)}</span>`) + CARET;
    el.classList.toggle("on", !!cur);
    items().forEach(li => li.setAttribute("aria-selected", li.dataset.k === cur));
    if (fire) onChange(cur);
  }
  function open(o){
    list.hidden = !o; btn.setAttribute("aria-expanded", o);
    if (o) (list.querySelector("[aria-selected=true]") || list.firstElementChild).focus();
  }
  btn.addEventListener("click", () => open(list.hidden));
  list.addEventListener("click", e => { const li = e.target.closest("li"); if (!li) return; set(li.dataset.k, true); open(false); btn.focus(); });
  list.addEventListener("keydown", e => {
    const all = items(), i = all.indexOf(document.activeElement);
    if (e.key === "ArrowDown"){ e.preventDefault(); (all[i + 1] || all[0]).focus(); }
    else if (e.key === "ArrowUp"){ e.preventDefault(); (all[i - 1] || all[all.length - 1]).focus(); }
    else if (e.key === "Enter" || e.key === " "){ e.preventDefault(); document.activeElement.click(); }
    else if (e.key === "Escape" || e.key === "Tab"){ open(false); if (e.key === "Escape") btn.focus(); }
  });
  document.addEventListener("click", e => { if (!el.contains(e.target)) open(false); });
  set(value, false);
  return {set: k => set(k, false), get: () => cur};
}
