/* 23 Nov 2026 (owner): "Word of the day" card in the student app – all students. Add each new word at the TOP with its
   date (YYYY-MM-DD). The app shows the newest word whose date is today or earlier. */
window.LLS_WORDS = [
  { date: "2026-11-23", word: "upset", say: "/ʌpˈset/ · ap-SET", it: "turbato, dispiaciuto, sconvolto",
    senses: [
      { pos: "adjective", def: "unhappy, worried or angry because something bad has happened",
        ex: ["She was <b>upset</b> when she lost her phone.", "Don't be <b>upset</b> – it wasn't your fault."] },
      { pos: "verb (upset – upset – upset)", def: "to make someone feel unhappy or worried",
        ex: ["The news really <b>upset</b> him.", "I'm sorry – I didn't mean to <b>upset</b> you."] },
      { pos: "an upset stomach", def: "a stomach that feels ill (mal di pancia)",
        ex: ["I didn't go to school because I had an <b>upset stomach</b>."] }
    ],
    tip: "Say <b>upset ABOUT</b> something and <b>upset WITH</b> someone: <i>She's upset about the exam. He's upset with me.</i>",
    q: "Which sentence is correct?", opts: ["I'm upset of the result.", "I'm upset about the result.", "I'm upsetting about the result."], ok: 1,
    why: "We say <b>upset about</b> something." }
];
(function () {
  function today() { var d = new Date(); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function draw() {
    var box = document.getElementById("llsWord"); if (!box) return;
    var t = today(), w = (window.LLS_WORDS || []).filter(function (x) { return x.date <= t; })[0];
    if (!w) { box.hidden = true; return; }
    box.innerHTML = '<details class="lls-wd lls-fold" data-fold="word"><summary class="lls-wd-h"><span>📖 Word of the day · Parola del giorno: <b class="lls-wd-peek">' + w.word + '</b></span><span class="lls-wd-b">New</span></summary>' +
      '<p class="lls-wd-w">' + w.word + ' <span>' + w.say + '</span></p><p class="lls-wd-it">🇮🇹 ' + w.it + '</p>' +
      w.senses.map(function (s, n) { return '<div class="lls-wd-s"><p><b>' + (n + 1) + '. ' + s.pos + '</b> – ' + s.def + '</p><ul>' + s.ex.map(function (e) { return '<li>' + e + '</li>'; }).join("") + '</ul></div>'; }).join("") +
      (w.tip ? '<p class="lls-wd-tip">💡 ' + w.tip + '</p>' : '') +
      '<div class="lls-wd-q"><p><b>Quick check:</b> ' + w.q + '</p>' + w.opts.map(function (o, n) { return '<button type="button" data-wo="' + n + '">' + "abc"[n] + ') ' + o + '</button>'; }).join("") +
      '<p class="lls-wd-f"></p></div><small>Try to use it today! · Prova a usarla oggi!</small></details>';
    box.hidden = false; if (window.llsFold) window.llsFold(box);
    box.onclick = function (e) {
      var b = e.target.closest("button[data-wo]"); if (!b) return;
      var f = box.querySelector(".lls-wd-f");
      if (+b.getAttribute("data-wo") === w.ok) { f.className = "lls-wd-f ok"; f.innerHTML = "✓ Right! " + w.why; } else { f.className = "lls-wd-f no"; f.textContent = "Not quite – try again! · Riprova!"; }
    };
  }
  window.llsDrawWord = draw;
  var css = document.createElement("style");
  css.textContent = "#llsWord{max-width:760px;margin:10px auto;padding:0 12px}" +
    ".lls-wd{background:#fff;border:1px solid #eadfb8;border-radius:14px;overflow:hidden;font:15px/1.45 Nunito,Arial,sans-serif;color:#111}" +
    ".lls-wd-h{background:#111;color:#FFC93C;font-weight:800;padding:9px 12px;display:flex;justify-content:space-between;align-items:center}" +
    ".lls-wd-b{white-space:nowrap;background:#E63946;color:#fff;border-radius:10px;padding:1px 9px;font-size:12px}" +
    ".lls-wd-w{font-size:28px;font-weight:800;margin:10px 12px 0}.lls-wd-w span{font-size:15px;font-weight:600;opacity:.6}" +
    ".lls-wd-it{margin:2px 12px 8px;opacity:.75}.lls-wd-s{margin:0 12px 6px}.lls-wd-s p{margin:0}.lls-wd-s ul{margin:4px 0 6px;padding-left:20px}" +
    ".lls-wd-tip{margin:6px 12px;padding:9px;border-radius:10px;background:#FFF6CC;color:#4a3800}" +
    ".lls-wd-q{border-top:1px solid #eee;margin:10px 12px 0;padding-top:10px}.lls-wd-q p{margin:0 0 6px}" +
    ".lls-wd-q button{display:block;width:100%;text-align:left;margin-bottom:6px;border:1px solid #ddd;border-radius:10px;background:#fffbf2;font:700 14px Nunito,Arial;padding:8px;cursor:pointer;color:#111}" +
    ".lls-wd-f{min-height:18px;font-size:14px}.lls-wd-f.ok{color:#1e8a4c}.lls-wd-f.no{color:#c0392b}.lls-wd small{display:block;margin:6px 12px 10px;opacity:.55}";
  document.head.appendChild(css);
})();
