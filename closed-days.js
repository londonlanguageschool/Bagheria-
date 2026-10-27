/* 27 Oct 2026: the days the school is closed (same list as the website).
   Used by the portal (lessons skip these days) and shown as a small card
   in the student app and the teacher/office portal (#llsClosedDays). */
window.LLS_CLOSED = [
  { from: "2026-12-07", to: "2026-12-08", it: "7–8 dicembre 2026", en: "7–8 December 2026", why: "Scuola chiusa · School closed" },
  { from: "2026-12-23", to: "2027-01-07", it: "23 dicembre 2026 – 7 gennaio 2027", en: "23 December 2026 – 7 January 2027", why: "Vacanze di Natale · Christmas holidays" },
  { from: "2027-03-19", to: "2027-03-19", it: "19 marzo 2027", en: "19 March 2027", why: "San Giuseppe, patrono di Bagheria · patron saint of Bagheria" },
  { from: "2027-03-25", to: "2027-03-30", it: "25–30 marzo 2027", en: "25–30 March 2027", why: "Vacanze di Pasqua · Easter holidays" },
  { from: "2027-05-31", to: "2027-06-02", it: "31 maggio – 2 giugno 2027", en: "31 May – 2 June 2027", why: "Scuola chiusa · School closed" }
];
(function () {
  function iso(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function draw() {
    var box = document.getElementById("llsClosedDays");
    if (!box) return;
    var today = iso(new Date());
    var list = window.LLS_CLOSED.filter(function (c) { return c.to >= today; });
    if (!list.length) { box.hidden = true; return; }
    var next = list[0], now = next.from <= today;
    var line = function (c) { return "<li><b>" + c.it + "</b>" + (c.it !== c.en ? " · " + c.en : "") + "<br><small>" + c.why + "</small></li>"; };
    box.innerHTML = '<details class="lls-closed' + (now ? " lls-closed-now" : "") + '"><summary>📅 ' +
      (now ? "Oggi la scuola è chiusa · School closed today" : "Scuola chiusa · School closed: <b>" + next.it + "</b>") +
      ' <span class="lls-closed-more">tutte le date · all dates ▾</span></summary><ul>' + list.map(line).join("") + "</ul></details>";
    box.hidden = false;
  }
  var css = document.createElement("style");
  css.textContent = "#llsClosedDays{max-width:760px;margin:10px auto;padding:0 12px}" +
    ".lls-closed{background:#fff8d6;border:1px solid #f2d675;border-radius:12px;padding:9px 12px;font:15px/1.4 Nunito,Arial,sans-serif;color:#16275c}" +
    ".lls-closed-now{background:#fdecec;border-color:#dc2626;color:#7f1d1d}" +
    ".lls-closed summary{cursor:pointer;list-style:none}.lls-closed summary::-webkit-details-marker{display:none}" +
    ".lls-closed-more{font-size:12.5px;opacity:.7;white-space:nowrap}" +
    ".lls-closed ul{margin:8px 0 2px;padding-left:18px}.lls-closed li{margin:5px 0}.lls-closed small{opacity:.75}";
  document.head.appendChild(css);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", draw); else draw();
})();
