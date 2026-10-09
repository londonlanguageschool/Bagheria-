// Builds materials/manifest.json for tools/LLS-deck-sync.gs (Drive copy of every finished deck).
const fs = require("fs"), path = require("path"), crypto = require("crypto");
global.window = {}; require("../lesson-plans.js");
const P = window.LLS_PLANS, ROOT = path.join(__dirname, "..", "materials");
const FOLDERS = { A2: "1JY2ha6o6dp7jaoaR1dGIq_V5sY4sYAo1", B1: "1V-RAFNNB4A5_T0dnqtw11vaRHbo0j6FT", EFE: "1nCAxkLAaZgrTgbNolekD5EI2x3Tn82Dm", B2: "1zQ4JxU3LafRC34oXdP01dVXv4U95RjPx" };
// B1 decks go into their unit folder (same name there → the Drive file is updated in place, same link)
const B1_UNITS = { 1: "1kYADKz4Skf2SgZ0s_NqI8jTmJIkYl5Ul", 2: "12dnOw5gvz-soeTX2Uu1MPfO9QJlvMYpr", 3: "1Ay2vMuOa-8Hjw6-D3gs4PqxH7STYfH5e", 4: "1V__Hgbc8FptESwz-y2DULUj6bYiq98wt", 5: "1OVGOugutsqD1fOC8Pq-cgNrgWmiVF4Uc",
  6: "1pZ9vEd53Cn7TM-w6lMHJx6Yc94LgiNiU", 7: "1JWGcWJ4whXFH8XXtitnpLCSgYkdewagD", 8: "1bmwXggpTQogom6s5LntxOAHUTAGzxKSl", 9: "1YEcv4X_lvGcU-SJhN68fq437-Pj0dlfK", 10: "17Eng2v9bzI7A8ZFufnMREDqM8pp23UBG" };
const PE_UNIT = { 1: 1, 2: 3, 3: 5, 4: 7, 5: 9 };
function folderFor(dir, name) {
  if (dir !== "B1") return FOLDERS[dir];
  let m = name.match(/^B1_(\d+)[AB]-/); if (m) return B1_UNITS[+m[1]];
  m = name.match(/^B1_PE(\d)/); if (m) return B1_UNITS[PE_UNIT[+m[1]]];
  m = name.match(/^B1_R(\d+)-(\d+)/); if (m) return B1_UNITS[+m[2]];
  return FOLDERS[dir];
}
const prevIds = (fs.existsSync(path.join(ROOT, "replaced.json")) ? JSON.parse(fs.readFileSync(path.join(ROOT, "replaced.json"))) : {});
const files = [];
for (const dir of Object.keys(FOLDERS)) {
  const d = path.join(ROOT, dir); if (!fs.existsSync(d)) continue;
  for (const name of fs.readdirSync(d).filter((f) => f.endsWith(".pptx") || f.endsWith(".pdf"))) {
    const rel = dir + "/" + name, buf = fs.readFileSync(path.join(d, name));
    files.push({ path: rel, name: name.replace(/_v3(?=\.pptx$)/, ""), folderId: folderFor(dir, name), v: crypto.createHash("sha1").update(buf).digest("hex").slice(0, 10), replaces: prevIds[rel] || [] });
  }
}
fs.writeFileSync(path.join(ROOT, "manifest.json"), JSON.stringify({ base: "https://londonlanguageschool.github.io/Bagheria-/materials/", oldFolderId: "1hijtgiLag5wE6s1tK_CYOLBhfBmg0cPz", files }, null, 1));
console.log(files.length, "files");
