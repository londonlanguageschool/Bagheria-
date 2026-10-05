/* =========================================================
   LLS — "🐞 Segnala un problema · Report a problem" (Beta), 1 Oct 2026
   Any element with data-report-problem="Portal|Student app|Website"
   opens an email to the school with the useful details filled in.
   Privacy: never includes the student's private link/key (only the
   page name, not the address bar query) and no contact details.
   Pages can add who is using it with window.llsReportWho = () => "...".
   A small panel also appears with the address and a "copy" button,
   for computers where clicking an email link does nothing.
========================================================= */
(function () {
  "use strict";
  var TO = "londonlanguageschoolbagheria@gmail.com";

  function details(where) {
    var who = "";
    try { who = (window.llsReportWho && window.llsReportWho()) || ""; } catch (_) {}
    var extra = "";
    try { extra = (window.llsReportExtra && window.llsReportExtra()) || ""; } catch (_) {}
    var page = (location.pathname.split("/").pop() || "index.html") + (location.hash || "");
    return [
      "— Dettagli automatici · Technical details —",
      "Dove · Where: " + where + " (" + page + ")",
      "Chi · Who: " + (who || "—"),
      "Quando · When: " + new Date().toLocaleString("it-IT"),
      "Schermo · Screen: " + window.innerWidth + "×" + window.innerHeight,
      "Browser: " + navigator.userAgent,
      extra
    ].filter(Boolean).join("\n");
  }

  function message(where) {
    return {
      subject: "[LLS Beta] Problema · Problem — " + where,
      body:
        "Cosa stavi facendo? · What were you doing?\n\n\n" +
        "Cosa è successo? · What happened?\n\n\n" +
        "(Se puoi, allega uno screenshot · If you can, attach a screenshot)\n\n" +
        details(where)
    };
  }

  // 5 Oct: problems with lesson materials (slides, homework sheets).
  function lessonMessage(lesson) {
    return {
      subject: "[LLS Lesson] Problema nella lezione · Lesson problem — " + lesson,
      body:
        "Grazie! Più sei preciso, più è facile correggerlo. · Thank you! The more specific you are, the easier it is to fix.\n\n" +
        "Lezione · Lesson: " + lesson + "\n" +
        "File (slide / homework sheet / answer key): \n" +
        "Numero slide o esercizio · Slide or exercise number: \n\n" +
        "Qual è il problema? · What is the problem?\n\n\n" +
        "Come lo correggeresti? · How would you fix it? (optional)\n\n\n" +
        "📷 Allega uno screenshot · Please attach a screenshot (or a photo of the screen).\n\n" +
        details("Lesson materials")
    };
  }

  function panel(msg) {
    var old = document.getElementById("llsReportPanel");
    if (old) old.remove();
    var box = document.createElement("div");
    box.id = "llsReportPanel";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-label", "Segnala un problema · Report a problem");
    box.style.cssText = "position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:100000;width:min(420px,calc(100% - 32px));background:#fff;color:#0f1b3d;border:2px solid #16275c;border-radius:18px;box-shadow:0 14px 40px rgba(15,27,61,.25);padding:14px 16px;font:14px/1.45 system-ui,-apple-system,Segoe UI,Roboto,sans-serif";
    box.innerHTML =
      '<strong style="display:block;font-size:15px;margin-bottom:4px">🐞 Grazie! · Thank you!</strong>' +
      '<div>Si apre la tua email. Se non si apre, scrivi a · If your email doesn\'t open, write to:<br><b>' + TO + '</b></div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">' +
      '<button type="button" data-r="copy" style="border:0;border-radius:999px;padding:9px 14px;background:#16275c;color:#fff;font:inherit;font-weight:700;cursor:pointer">Copia i dettagli · Copy details</button>' +
      '<button type="button" data-r="close" style="border:1px solid #cfdcee;border-radius:999px;padding:9px 14px;background:#fff;color:#16275c;font:inherit;font-weight:700;cursor:pointer">Chiudi · Close</button></div>';
    document.body.appendChild(box);
    box.querySelector('[data-r="close"]').addEventListener("click", function () { box.remove(); });
    box.querySelector('[data-r="copy"]').addEventListener("click", function (e) {
      var text = "A · To: " + TO + "\nOggetto · Subject: " + msg.subject + "\n\n" + msg.body;
      var done = function () { e.target.textContent = "✓ Copiato · Copied"; };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () { window.prompt("Copia · Copy:", text); });
      else window.prompt("Copia · Copy:", text);
    });
    setTimeout(function () { if (box.isConnected) box.remove(); }, 30000);
  }

  function open(where) {
    var msg = message(where || "Website");
    panel(msg);
    window.location.href = "mailto:" + TO + "?subject=" + encodeURIComponent(msg.subject) + "&body=" + encodeURIComponent(msg.body);
  }

  window.llsReportLesson = function (lesson) {
    var msg = lessonMessage(lesson || "?");
    panel(msg);
    window.location.href = "mailto:" + TO + "?subject=" + encodeURIComponent(msg.subject) + "&body=" + encodeURIComponent(msg.body);
  };
  window.llsReportProblem = open;
  window.llsReportMessage = message; // lets tests and the copy panel see the text
  document.addEventListener("click", function (e) {
    var les = e.target && e.target.closest ? e.target.closest("[data-report-lesson]") : null;
    if (les) { e.preventDefault(); window.llsReportLesson(les.getAttribute("data-report-lesson")); return; }
    var el = e.target && e.target.closest ? e.target.closest("[data-report-problem]") : null;
    if (!el) return;
    e.preventDefault();
    open(el.getAttribute("data-report-problem"));
  });
})();
