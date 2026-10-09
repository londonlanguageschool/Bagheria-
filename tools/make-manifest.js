// Builds materials/manifest.json for tools/LLS-deck-sync.gs (Drive copy of every finished deck).
const fs = require("fs"), path = require("path"), crypto = require("crypto");
global.window = {}; require("../lesson-plans.js");
const P = window.LLS_PLANS, ROOT = path.join(__dirname, "..", "materials");
const FOLDERS = { A2: "1JY2ha6o6dp7jaoaR1dGIq_V5sY4sYAo1", B1: "1V-RAFNNB4A5_T0dnqtw11vaRHbo0j6FT" };
const prevIds = (fs.existsSync(path.join(ROOT, "replaced.json")) ? JSON.parse(fs.readFileSync(path.join(ROOT, "replaced.json"))) : {});
const files = [];
for (const dir of Object.keys(FOLDERS)) {
  const d = path.join(ROOT, dir); if (!fs.existsSync(d)) continue;
  for (const name of fs.readdirSync(d).filter((f) => f.endsWith(".pptx") || f.endsWith(".pdf"))) {
    const rel = dir + "/" + name, buf = fs.readFileSync(path.join(d, name));
    files.push({ path: rel, name: name.replace(/_v3(?=\.pptx$)/, ""), folderId: FOLDERS[dir], v: crypto.createHash("sha1").update(buf).digest("hex").slice(0, 10), replaces: prevIds[rel] || [] });
  }
}
fs.writeFileSync(path.join(ROOT, "manifest.json"), JSON.stringify({ base: "https://londonlanguageschool.github.io/Bagheria-/materials/", oldFolderId: "1hijtgiLag5wE6s1tK_CYOLBhfBmg0cPz", files }, null, 1));
console.log(files.length, "files");
