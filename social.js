/* 27 Oct 2026: school videos on Instagram, shown in the student app (#llsSocial).
   Add new posts at the TOP of the list. */
window.LLS_SOCIAL = [
  { url: "https://www.instagram.com/reel/De_8DCDJId7/", img: "materials/social/ep2.jpg", title: "THREE or TREE? 🌳", sub: "Pronuncia · Episodio 2: TH" },
  { url: "https://www.instagram.com/reel/DeeMvZRRcwF/", img: "materials/social/ep1.jpg", title: "Hungry or Angry? 😋😡", sub: "Pronuncia · Episodio 1: H" }
];
(function () {
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function draw() {
    var box = document.getElementById("llsSocial"); if (!box || !window.LLS_SOCIAL.length) return;
    box.innerHTML = '<div class="lls-soc"><div class="lls-soc-h">📺 I nostri video · Our videos <small>Guarda, metti mi piace e condividi! · Watch, like &amp; share!</small></div><div class="lls-soc-row">' +
      window.LLS_SOCIAL.map(function (p, i) {
        return '<div class="lls-soc-card"><a href="' + esc(p.url) + '" target="_blank" rel="noopener"><img src="' + esc(p.img) + '" alt="" loading="lazy"><span class="lls-soc-play">▶</span></a>' +
          '<b>' + esc(p.title) + '</b><small>' + esc(p.sub) + '</small>' +
          '<div class="lls-soc-btns"><a href="' + esc(p.url) + '" target="_blank" rel="noopener">❤️ Instagram</a><button type="button" data-soc-share="' + i + '">📤 Condividi</button></div></div>';
      }).join("") + "</div></div>";
    box.hidden = false;
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-soc-share]"); if (!b) return;
    var p = window.LLS_SOCIAL[+b.getAttribute("data-soc-share")]; var text = p.title + " – London Language School Bagheria 🇬🇧";
    if (navigator.share) { navigator.share({ title: p.title, text: text, url: p.url }).catch(function () {}); }
    else { window.open("https://wa.me/?text=" + encodeURIComponent(text + " " + p.url), "_blank", "noopener"); }
  });
  var css = document.createElement("style");
  css.textContent = "#llsSocial{max-width:760px;margin:10px auto;padding:0 12px}" +
    ".lls-soc{background:#fff;border:1px solid #dfe9f5;border-radius:14px;padding:10px 12px;font:15px/1.35 Nunito,Arial,sans-serif;color:#16275c}" +
    ".lls-soc-h{font-weight:800;margin-bottom:8px}.lls-soc-h small{display:block;font-weight:600;font-size:12.5px;opacity:.7}" +
    ".lls-soc-row{display:flex;gap:10px;overflow-x:auto;padding-bottom:4px}" +
    ".lls-soc-card{flex:0 0 150px;display:flex;flex-direction:column;gap:2px}.lls-soc-card>a{position:relative;display:block}" +
    ".lls-soc-card img{width:150px;height:200px;object-fit:cover;border-radius:10px;display:block;background:#eef7ff}" +
    ".lls-soc-play{position:absolute;inset:0;margin:auto;width:44px;height:44px;border-radius:50%;background:rgba(0,0,0,.55);color:#fff;display:flex;align-items:center;justify-content:center;font-size:20px}" +
    ".lls-soc-card b{font-size:14px;margin-top:4px}.lls-soc-card small{font-size:12px;opacity:.7}" +
    ".lls-soc-btns{display:flex;gap:4px;margin-top:4px}.lls-soc-btns a,.lls-soc-btns button{flex:1;border:0;border-radius:8px;background:#eef7ff;color:#16275c;font:800 12px Nunito,Arial;padding:6px 2px;text-align:center;text-decoration:none;cursor:pointer}";
  document.head.appendChild(css);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", draw); else draw();
})();
