// 31 Oct 2026 (owner): "No slides on the website at all." Makes the two small lists Apps Script V40 reads:
//  - tools/slides-import.json: which decks/pictures importSlides copies into the school's private Drive
//    (from a fixed commit of this repo) and a version per file, so a run only copies what changed.
//  - tools/deck-map.json: which deck goes with which lesson of each book (no slides, only names), so the
//    server can check a student only sees the deck of a lesson their class has had.
// Usage: node tools/make-slide-lists.js [commit-sha-that-contains-the-files]
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const ROOT = path.join(__dirname, ".."), MAT = path.join(ROOT, "materials");
global.window = {}; require("../lesson-plans.js");
const P = window.LLS_PLANS;
const deckOf = (p) => {
  if (!p || !p.file) return "";
  const u = String((P.links || {})[p.file] || "");
  const m = u.match(/^deck:(?:[^/]+\/)?([^/?#]+?)(?:\.pptx)?$/i) || u.match(/\/materials\/[^/]+\/([^/?#]+)\.pptx/i) || String(p.file).match(/([^/]+)\.pptx$/i);
  return m ? m[1] : "";
};
const courses = {};
for (const [c, plans] of Object.entries(P.courses)) courses[c] = plans.map((p) => [p.id, deckOf(p), p.title || ""]);
fs.writeFileSync(path.join(__dirname, "deck-map.json"), JSON.stringify({ made: new Date().toISOString().slice(0, 10), courses }));
const sha = process.argv[2];
if (sha && fs.existsSync(path.join(MAT, "view", "index.json"))) {
  const h = (bufs) => { const x = crypto.createHash("sha1"); bufs.forEach((b) => x.update(b)); return x.digest("hex").slice(0, 10); };
  const idx = JSON.parse(fs.readFileSync(path.join(MAT, "view", "index.json")));
  const decks = {};
  for (const [d, n] of Object.entries(idx)) {
    const bufs = []; for (let i = 1; i <= n; i++) bufs.push(fs.readFileSync(path.join(MAT, "view", d, String(i).padStart(2, "0") + ".jpg")));
    decks[d] = { n, v: h(bufs) };
  }
  const pptx = [];
  for (const dir of fs.readdirSync(MAT)) {
    const full = path.join(MAT, dir); if (!fs.statSync(full).isDirectory() || dir === "view" || dir === "social") continue;
    for (const f of fs.readdirSync(full).filter((x) => x.endsWith(".pptx")).sort())
      pptx.push({ path: dir + "/" + f, name: f.replace(/_v3(?=\.pptx$)/, ""), v: h([fs.readFileSync(path.join(full, f))]) });
  }
  fs.writeFileSync(path.join(__dirname, "slides-import.json"), JSON.stringify({ sha, decks, pptx }, null, 1));
  console.log(Object.keys(decks).length, "decks of pictures,", pptx.length, "PowerPoints");
}
console.log("deck-map:", Object.keys(courses).length, "courses");
