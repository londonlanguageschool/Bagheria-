/* 20 Nov 2026 (owner): "Joke of the day" bonus card in the student app – teens and adults only (not Movers/Flyers/
   young learners). Cole sends jokes when he has time: add each new one at the TOP – the app shows the newest one. */
window.LLS_JOKES = [
  { joke: "I made a chicken salad the other day. Turns out chickens don't like salad.",
    exp: "<b>Chicken salad</b> = a salad made <i>with</i> chicken (insalata di pollo). The joke pretends it means a salad made <i>for</i> chickens – so the chickens didn't eat it! 🐔🥗",
    q: "What does <b>\"turns out\"</b> mean here?", opts: ["it rotates", "I discovered later / in the end", "it switches off"], ok: 1,
    why: "\"Turns out\" = we discovered something later (alla fine si è scoperto che…)." }
];
(function () {
  var YOUNG = /tiny|starter|mover|flyer|young learner|kid/i; // not for young learners (owner)
  function week() { var d = new Date(), j = new Date(2026, 10, 16); return Math.max(0, Math.floor((d - j) / (7 * 864e5))); }
  function draw(classNames) {
    var box = document.getElementById("llsJoke"); if (!box) return;
    var names = (classNames || []).filter(Boolean);
    if (!names.length || names.every(function (n) { return YOUNG.test(n); })) { box.hidden = true; return; }
    var k = window.LLS_JOKES[0]; if (!k) { box.hidden = true; return; }
    box.innerHTML = '<div class="lls-joke"><div class="lls-joke-h"><span>😄 Joke time · Battuta</span><span class="lls-joke-b">Bonus</span></div>' +
      '<p class="lls-joke-t">' + k.joke + '</p><p class="lls-joke-s">Did you get the joke? · Hai capito la battuta?</p>' +
      '<div class="lls-joke-row"><button type="button" data-jk="yes">😄 Yes!</button><button type="button" data-jk="no">🤔 Not really</button></div>' +
      '<button type="button" class="lls-joke-w" data-jk="exp">Show the explanation · Spiegazione</button><div class="lls-joke-e" hidden>' + k.exp + '</div>' +
      '<div class="lls-joke-q"><p>' + k.q + '</p>' + k.opts.map(function (o, n) { return '<button type="button" data-jo="' + n + '">' + "abc"[n] + ') ' + o + '</button>'; }).join("") +
      '<p class="lls-joke-f"></p></div><small>New jokes from your teachers · Nuove battute dai tuoi insegnanti</small></div>';
    box.hidden = false;
    box.onclick = function (e) {
      var b = e.target.closest("button"); if (!b) return;
      var ex = box.querySelector(".lls-joke-e"), w = box.querySelector(".lls-joke-w"), f = box.querySelector(".lls-joke-f");
      var jk = b.getAttribute("data-jk"), jo = b.getAttribute("data-jo");
      if (jk === "exp" || jk === "no") { var open = jk === "no" ? true : ex.hidden; ex.hidden = !open; w.textContent = open ? "Hide the explanation" : "Show the explanation · Spiegazione"; }
      if (jk === "yes") b.textContent = "😄 Great!";
      if (jo !== null) { if (+jo === k.ok) { f.className = "lls-joke-f ok"; f.textContent = "✓ Right! " + k.why; } else { f.className = "lls-joke-f no"; f.textContent = "Not quite – try again! · Riprova!"; } }
    };
  }
  window.llsDrawJoke = draw;
  var css = document.createElement("style");
  css.textContent = "#llsJoke{max-width:760px;margin:10px auto;padding:0 12px}" +
    ".lls-joke{background:#fff;border:1px solid #eadfb8;border-radius:14px;overflow:hidden;font:15px/1.4 Nunito,Arial,sans-serif;color:#111}" +
    ".lls-joke-h{background:#111;color:#FFC93C;font-weight:800;padding:9px 12px;display:flex;justify-content:space-between;align-items:center}" +
    ".lls-joke-b{background:#E63946;color:#fff;border-radius:10px;padding:1px 9px;font-size:12px}" +
    ".lls-joke-t{font-size:19px;font-weight:700;margin:12px 12px 8px}.lls-joke-s{margin:0 12px 8px;opacity:.7}" +
    ".lls-joke-row{display:flex;gap:8px;margin:0 12px 8px}.lls-joke button{flex:1;border:1px solid #ddd;border-radius:10px;background:#fffbf2;font:700 14px Nunito,Arial;padding:8px;cursor:pointer;color:#111}" +
    ".lls-joke-w{display:block;width:calc(100% - 24px);margin:0 12px}.lls-joke-e{margin:10px 12px;padding:10px;border-radius:10px;background:#FFF6CC;color:#4a3800}" +
    ".lls-joke-q{border-top:1px solid #eee;margin:12px 12px 0;padding-top:10px}.lls-joke-q p{margin:0 0 6px}.lls-joke-q button{display:block;width:100%;text-align:left;margin-bottom:6px}" +
    ".lls-joke-f{min-height:18px;font-size:14px}.lls-joke-f.ok{color:#1e8a4c}.lls-joke-f.no{color:#c0392b}.lls-joke small{display:block;margin:6px 12px 10px;opacity:.55}";
  document.head.appendChild(css);
})();
