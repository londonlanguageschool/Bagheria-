/* 24 Nov 2026 (owner): flashcard WORD BANKS in the student app.
   One bank per book lesson (6A, 6B, 7A…), reused by every class and every year.
   A class sees a bank ONLY when it has finished that lesson (from the lesson log):
     - the last part of the lesson has been taught (e.g. 7B-2, PE4-2, or PE1), or
     - the class has already moved on to a later lesson of the book.
   So students never see words they haven't studied yet; new banks appear by themselves as units are finished.
   To add a bank: add it under the book code (as in the Classes sheet, column "Book"), same format:
     "7A": { t: "title", w: [["English", "Italian", "optional note"], …] }   – words approved by Cole first. */
window.LLS_WORDBANKS = {
 "EF-B1": {
  order: ["1A","1B","PE1","2A","2B","R1-2","3A","3B","PE2","4A","4B","R3-4","5A","5B","PE3","6A","6B","R5-6","7A","7B","PE4","8A","8B","R7-8","9A","9B","PE5","10A","10B","R9-10"],
  last: { "PE4": "PE4-2" },
  banks: {
  "1B": {"t": "Modern families – personality","w": [["selfish","egoista"],["spoilt","viziato"],["bossy","prepotente, autoritario"],["stubborn","testardo"],["moody","lunatico"],["reliable","affidabile"],["charming","affascinante"],["self-confident","sicuro di sé"],["sensible","assennato","not \"sensibile\""],["sensitive","sensibile, permaloso"],["shy","timido"],["mean","tirchio"],["mature / immature","maturo / immaturo"],["honest / dishonest","onesto / disonesto"],["responsible / irresponsible","responsabile / irresponsabile"],["patient / impatient","paziente / impaziente"],["brother-in-law","cognato"],["stepmother","matrigna"],["half-sister","sorellastra"],["only child","figlio unico"]]},"2A": {"t": "Spending money","w": [["lend (to)","prestare (a qualcuno)"],["borrow (from)","prendere in prestito (da)"],["earn","guadagnare (lavorando)"],["save","risparmiare"],["waste","sprecare"],["can't afford","non potersi permettere"],["owe","dovere (soldi)"],["charge","far pagare"],["inherit","ereditare"],["invest (in)","investire (in)"],["be worth","valere"],["raise money","raccogliere fondi"],["a scam","una truffa"],["a scammer","un truffatore"],["suspicious","sospettoso"],["bank / card details","dati bancari / della carta"]]},"2B": {"t": "Changing lives – strong adjectives + charity","w": [["furious (= very angry)","furioso"],["tiny (= very small)","minuscolo"],["terrified (= very frightened)","terrorizzato"],["fascinating (= very interesting)","affascinante"],["starving (= very hungry)","affamato, muoio di fame"],["huge / enormous (= very big)","enorme"],["boiling (= very hot)","si muore di caldo"],["freezing (= very cold)","si gela"],["filthy (= very dirty)","sudicio, lurido"],["delighted (= very pleased)","felicissimo"],["hilarious (= very funny)","esilarante"],["exhausted (= very tired)","esausto, distrutto"],["a charity","un ente benefico"],["a volunteer","un volontario"],["set up (a charity)","fondare"],["take part in","partecipare a"]]},"3A": {"t": "Survive the drive – transport","w": [["a coach","pullman (tra città)"],["a lorry","camion"],["a van","furgone"],["a ferry","traghetto"],["a tram","tram"],["a motorway","autostrada"],["the Underground","la metropolitana"],["a traffic jam","ingorgo"],["traffic lights","semaforo"],["a zebra crossing","strisce pedonali"],["roadworks","lavori stradali"],["a speed camera","autovelox"],["a seat belt","cintura di sicurezza"],["rush hour","ora di punta"],["a parking fine","multa per divieto di sosta"],["set off","partire"],["pick (someone) up","passare a prendere"],["run out of (petrol)","rimanere senza (benzina)"]]},"6A": {"t": "Behind the scenes – cinema","w": [["an action film","film d'azione"],["a comedy","commedia"],["a horror film","film horror"],["a rom-com","commedia romantica"],["a science fiction film","film di fantascienza"],["a thriller","thriller, giallo"],["the cast","il cast, gli attori"],["the soundtrack","la colonna sonora"],["the plot","la trama"],["a sequel","un seguito"],["an extra","una comparsa"],["subtitles","sottotitoli"],["a trailer","un trailer"],["a critic","un critico"],["dubbed","doppiato"],["the film is set in…","il film è ambientato a…"]]},"6B": {"t": "Every picture tells a story – the body","w": [["chin","mento"],["shoulders","spalle"],["tongue","lingua"],["thumb","pollice"],["knees","ginocchia"],["stomach","stomaco, pancia"],["toes","dita dei piedi"],["lips","labbra"],["bite","mordere"],["clap","applaudire"],["kick","calciare"],["nod","annuire"],["point","indicare"],["stare","fissare"],["whistle","fischiare"],["taste","assaggiare"],["He must be… / She might be… / It can't be…","deve essere / potrebbe essere / non può essere"]]},"7A": {"t": "Live and learn – education","w": [["a nursery school","scuola materna"],["a primary school","scuola elementare"],["a secondary school","scuola media/superiore"],["a state school","scuola pubblica"],["a private school","scuola privata","\"public school\" in the UK = private!"],["a boarding school","collegio"],["pupils","alunni"],["the head (teacher)","il preside"],["a term","un trimestre"],["a degree","una laurea"],["misbehave","comportarsi male"],["be punished","essere punito"],["cheat","copiare, imbrogliare"],["be expelled","essere espulso"],["take / pass / fail an exam","sostenere / superare / non superare un esame"],["revise","ripassare"],["be allowed to","avere il permesso di"]]},"7B": {"t": "The hotel of Mum and Dad – houses","w": [["in the country","in campagna"],["on the outskirts","in periferia"],["a village","un paese"],["a suburb","un quartiere residenziale (fuori città)"],["on the second floor","al secondo piano"],["a block of flats","un condominio"],["roof","tetto"],["chimney","comignolo"],["attic","soffitta"],["balcony","balcone"],["ground floor","piano terra"],["basement","seminterrato"],["steps","gradini"],["gate","cancello"],["terrace / patio","terrazza / patio"],["cosy","accogliente"],["spacious","spazioso"]]},"PE4": {"t": "Boys' night out – making suggestions","w": [["Shall we go out?","Usciamo?"],["Let's go to the cinema.","Andiamo al cinema."],["Why don't we stay in?","Perché non restiamo a casa?"],["We could order pizza.","Potremmo ordinare la pizza."],["How about / What about going bowling?","Che ne dici di andare a bowling?"],["I'd rather stay in.","Preferirei restare a casa."],["I'm not really in the mood.","Non ne ho proprio voglia."],["I'm not keen on…","Non mi piace molto…"]]},"8A": {"t": "The right job for you – work","w": [["do overtime","fare gli straordinari"],["get promoted","essere promosso"],["work shifts","fare i turni"],["be sacked / fired","essere licenziato"],["be made redundant","essere licenziato per esubero"],["resign","dimettersi"],["retire","andare in pensione"],["set up a business","avviare un'attività"],["do a training course","fare un corso di formazione"],["self-employed","lavoratore autonomo"],["full time / part time","a tempo pieno / part-time"],["temporary / permanent","a tempo determinato / indeterminato"],["be in charge of","essere responsabile di"],["application / qualification / retirement","domanda / qualifica / pensione"],["an entrepreneur","un imprenditore"],["make a pitch","presentare un'idea per venderla"],["invest","investire"],["profits","profitti"],["\"I'm out.\"","\"Io non ci sto.\" (non investo)"]]},"8B": {"t": "Have a nice day – shopping + nouns from verbs","w": [["a receipt","scontrino, ricevuta"],["a refund","rimborso"],["a discount","sconto"],["a bargain","un affare"],["a trolley / a basket","carrello / cestino"],["a library","biblioteca","libreria = bookshop"],["a changing room","camerino"],["a department store","grande magazzino"],["It suits you.","Ti sta bene."],["It fits.","È della taglia giusta."],["complain → a complaint","lamentarsi → un reclamo"],["deliver → delivery","consegnare → consegna"],["choose → choice","scegliere → scelta"],["pay → payment","pagare → pagamento"],["improve → improvement","migliorare → miglioramento"],["explain → explanation","spiegare → spiegazione"],["compensate → compensation","risarcire → risarcimento"]]},"9A": {"t": "Lucky encounters – adjectives and adverbs","w": [["lucky / unlucky","fortunato / sfortunato"],["luckily / unluckily","per fortuna / sfortunatamente"],["fortunately / unfortunately","fortunatamente / sfortunatamente"],["comfortable / uncomfortable","comodo / scomodo"],["patient / impatient","paziente / impaziente"],["patiently / impatiently","con pazienza / con impazienza"],["careful / careless","attento / sbadato"],["carefully / carelessly","con attenzione / con poca attenzione"],["-ful = with · -less = without","con · senza"],["If I had known…, I would have…","Se avessi saputo…, avrei…"]]},"9B": {"t": "Digital detox – devices","w": [["a charger","caricabatterie"],["a socket / a plug","presa / spina"],["an adaptor","adattatore"],["a remote control","telecomando"],["a memory stick","chiavetta USB"],["a router","router"],["a speaker","cassa"],["switch it on / off","accenderlo / spegnerlo"],["turn it up / down","alzarlo / abbassarlo (volume)"],["plug it in / unplug it","collegarlo / scollegarlo"],["install / update / delete it","installarlo / aggiornarlo / cancellarlo"],["a digital detox","una pausa dalla tecnologia"],["be addicted to","essere dipendente da"]]}
  }
 }
};
/* 24 Nov (owner): cards on the student page open and close to save space. Closed by default; the phone remembers. */
window.llsFold = function (box) {
  var d = box && box.querySelector("details.lls-fold"); if (!d) return;
  var k = "llsFold_" + d.getAttribute("data-fold");
  try { if (localStorage.getItem(k) === "1") d.open = true; } catch (_) {}
  d.addEventListener("toggle", function () { try { localStorage.setItem(k, d.open ? "1" : "0"); } catch (_) {} });
};
(function () {
  var fc = document.createElement("style");
  fc.textContent = "details.lls-fold>summary{list-style:none;cursor:pointer;position:relative;padding-right:44px!important}details.lls-fold>summary::-webkit-details-marker{display:none}" +
    "details.lls-fold>summary::after{content:'▾';position:absolute;right:12px;top:50%;transform:translateY(-50%);font-size:14px;opacity:.8}details.lls-fold[open]>summary::after{content:'▴'}";
  document.head.appendChild(fc);
})();
(function () {
  function today() { var d = new Date(); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function day(t) { t = String(t || "").replace(/^'/, "").trim(); var m = t.match(/^(\d{4})-(\d{2})-(\d{2})/); if (m) return m[0];
    m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/); return m ? m[3] + "-" + ("0" + m[2]).slice(-2) + "-" + ("0" + m[1]).slice(-2) : ""; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  // "7B-2 · SB pp.72–73" -> { key: "7B", part: "7B-2" }
  function parse(unit) {
    var u = String(unit || "").split("·")[0].trim().toUpperCase().replace(/\s+/g, "");
    var m = u.match(/^(\d{1,2}[A-C])(-\d)?$/); if (m) return { key: m[1], part: u };
    m = u.match(/^(PE\d{1,2})(-\d)?$/); if (m) return { key: m[1], part: u };
    m = u.match(/^R\d{1,2}-\d{1,2}$/); if (m) return { key: u, part: u };
    return null;
  }
  // Which banks a class has FINISHED (never one it is still on or hasn't started).
  function finished(book, classId, lessons) {
    var B = (window.LLS_WORDBANKS || {})[book]; if (!B) return [];
    var t = today(), seen = {}, parts = {}, maxIdx = -1;
    (lessons || []).forEach(function (l) {
      if (String(l.classId) !== String(classId)) return;
      var d = day(l.lessonDate); if (!d || d > t || /^cancelled/i.test(String(l.unit || "").trim())) return;
      var p = parse(l.unit); if (!p) return;
      var i = B.order.indexOf(p.key); if (i === -1) return;
      seen[p.key] = true; parts[p.part] = true; if (i > maxIdx) maxIdx = i;
    });
    return B.order.filter(function (k, i) {
      if (!B.banks[k] || !seen[k]) return false;
      var last = (B.last || {})[k] || (/^\d/.test(k) ? k + "-2" : k);
      return parts[last] || maxIdx > i;
    });
  }
  window.llsFinishedBanks = finished;

  var KEY = "llsBankKnown", state = null;
  function known() { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (_) { return {}; } }
  function saveKnown(k) { try { localStorage.setItem(KEY, JSON.stringify(k)); } catch (_) {} }
  function cardId(c) { return c[0]; }
  function say(text) {
    try { var s = window.speechSynthesis; if (!s) return; s.cancel(); var u = new SpeechSynthesisUtterance(text.replace(/\(.*?\)|…/g, " "));
      u.lang = "en-GB"; u.rate = 0.9; var v = s.getVoices().filter(function (x) { return /en-GB/i.test(x.lang); })[0]; if (v) u.voice = v; s.speak(u); } catch (_) {}
  }

  function draw(classes, lessons) {
    var box = document.getElementById("llsBanks"); if (!box) return;
    var list = [];
    (classes || []).forEach(function (c) {
      var book = String(c["Book"] || "").trim(), B = (window.LLS_WORDBANKS || {})[book]; if (!B) return;
      finished(book, c["Class ID"], lessons).forEach(function (k) { list.push({ id: book + ":" + k, key: k, bank: B.banks[k] }); });
    });
    if (!list.length) { box.hidden = true; return; }
    var kn = known();
    var all = []; list.forEach(function (b) { b.bank.w.forEach(function (w) { all.push(w); }); });
    box.innerHTML = '<details class="wb lls-fold" data-fold="banks"><summary class="wb-h"><span>🃏 My word banks · Le mie parole</span><span class="wb-n">' + all.length + ' words</span></summary>' +
      '<p class="wb-p">Words from the lessons you have finished. Tap a bank to practise with flashcards. · Le parole delle lezioni che hai finito.</p><div class="wb-list">' +
      list.slice().reverse().map(function (b, n) {
        var k = b.bank.w.filter(function (w) { return kn[cardId(w)]; }).length;
        return '<button type="button" data-wb="' + (list.length - 1 - n) + '"><b>' + esc(b.key) + '</b><span>' + esc(b.bank.t) + '</span><small>' + k + ' / ' + b.bank.w.length + ' ✓</small></button>';
      }).join("") + (list.length > 1 ? '<button type="button" data-wb="all" class="wb-all"><b>All</b><span>Mix all my words · Tutte mescolate</span><small>' + all.length + ' words</small></button>' : '') +
      '</div></details>';
    box.hidden = false; if (window.llsFold) window.llsFold(box);
    box.onclick = function (e) {
      var b = e.target.closest("button[data-wb]"); if (!b) return;
      var v = b.getAttribute("data-wb");
      if (v === "all") open("All my words", all); else open(list[+v].key + " · " + list[+v].bank.t, list[+v].bank.w);
    };
    window.__llsBanksRedraw = function () { draw(classes, lessons); };
  }

  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
  function open(title, words) {
    state = { title: title, deck: shuffle(words), pos: 0, flipped: false, itFirst: false, right: 0, total: words.length };
    var ov = document.getElementById("wbOverlay");
    if (!ov) { ov = document.createElement("div"); ov.id = "wbOverlay"; document.body.appendChild(ov); ov.addEventListener("click", act); }
    ov.hidden = false; document.body.style.overflow = "hidden"; show();
  }
  function close() { var ov = document.getElementById("wbOverlay"); if (ov) ov.hidden = true; document.body.style.overflow = ""; try { window.speechSynthesis && speechSynthesis.cancel(); } catch (_) {} if (window.__llsBanksRedraw) window.__llsBanksRedraw(); }
  function show() {
    var ov = document.getElementById("wbOverlay"), s = state;
    if (s.pos >= s.deck.length) {
      ov.innerHTML = '<div class="wb-m"><div class="wb-top"><b>' + esc(s.title) + '</b><button type="button" data-a="close" aria-label="Close">✕</button></div>' +
        '<div class="wb-done"><p class="wb-big">🎉 Well done!</p><p>You knew <b>' + s.right + '</b> of ' + s.total + ' at the first try. · Bravo!</p>' +
        '<button type="button" data-a="again" class="wb-go">↻ Practise again · Ancora</button><button type="button" data-a="close" class="wb-go wb-sec">Close · Chiudi</button></div></div>';
      return;
    }
    var c = s.deck[s.pos], front = s.itFirst ? c[1] : c[0], back = s.itFirst ? c[0] : c[1];
    ov.innerHTML = '<div class="wb-m"><div class="wb-top"><b>' + esc(s.title) + '</b><button type="button" data-a="close" aria-label="Close">✕</button></div>' +
      '<div class="wb-bar"><i style="width:' + Math.round(100 * s.pos / s.deck.length) + '%"></i></div><p class="wb-cnt">' + (s.pos + 1) + ' / ' + s.deck.length + '</p>' +
      '<button type="button" class="wb-card' + (s.flipped ? ' on' : '') + '" data-a="flip"><span class="wb-lang">' + (s.itFirst ? "🇮🇹 Italiano" : "🇬🇧 English") + '</span>' +
      '<span class="wb-front">' + esc(front) + '</span>' +
      (s.flipped ? '<span class="wb-back">' + esc(back) + '</span>' + (c[2] ? '<span class="wb-note">⚠ ' + esc(c[2]) + '</span>' : '') : '<span class="wb-tap">Tap to see the answer · Tocca per la risposta</span>') + '</button>' +
      '<div class="wb-row"><button type="button" data-a="say">🔊 Listen</button><button type="button" data-a="dir">⇄ ' + (s.itFirst ? "English first" : "Italiano prima") + '</button></div>' +
      (s.flipped ? '<div class="wb-row wb-ans"><button type="button" data-a="no" class="no">✗ Not yet · Non ancora</button><button type="button" data-a="yes" class="yes">✓ I knew it · Lo sapevo</button></div>' : '') + '</div>';
  }
  function act(e) {
    var b = e.target.closest("[data-a]"); if (!b) return;
    var a = b.getAttribute("data-a"), s = state, c = s && s.deck[s.pos];
    if (a === "close") return close();
    if (a === "again") return open(s.title, shuffle(s.deck.filter(function (x, i, arr) { return arr.indexOf(x) === i; })));
    if (a === "flip") { s.flipped = !s.flipped; if (s.flipped) say(c[0]); }
    else if (a === "say") say(c[0]);
    else if (a === "dir") { s.itFirst = !s.itFirst; s.flipped = false; }
    else if (a === "yes" || a === "no") {
      var k = known();
      if (a === "yes") { if (!c.__miss) s.right++; k[cardId(c)] = 1; }
      else { delete k[cardId(c)]; c.__miss = 1; s.deck.push(c); } // comes back at the end
      saveKnown(k); s.pos++; s.flipped = false;
    }
    show();
  }
  window.llsDrawBanks = draw;

  var css = document.createElement("style");
  css.textContent = "#llsBanks{max-width:760px;margin:10px auto;padding:0 12px}" +
    ".wb{background:#fff;border:1px solid #eadfb8;border-radius:14px;overflow:hidden;font:15px/1.45 Nunito,Arial,sans-serif;color:#111}" +
    ".wb-h{background:#16275c;color:#FFC93C;font-weight:800;padding:9px 12px;display:flex;justify-content:space-between;align-items:center}" +
    ".wb-n{white-space:nowrap;background:#FFC93C;color:#16275c;border-radius:10px;padding:1px 9px;font-size:12px}.wb-p{margin:8px 12px;opacity:.7;font-size:13px}" +
    ".wb-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;padding:0 12px 12px}" +
    ".wb-list button{display:flex;flex-direction:column;align-items:flex-start;text-align:left;border:1px solid #ddd;border-radius:12px;background:#fffbf2;padding:9px;cursor:pointer;font:inherit;color:#111;min-height:84px}" +
    ".wb-list b{font-size:20px;color:#E63946}.wb-list span{font-size:13px;font-weight:700;line-height:1.25}.wb-list small{margin-top:auto;opacity:.6;font-size:12px}.wb-list .wb-all{background:#eef3ff}" +
    "#wbOverlay{position:fixed;inset:0;z-index:9999;background:rgba(10,15,40,.6);display:flex;align-items:center;justify-content:center;padding:12px}#wbOverlay[hidden]{display:none}" +
    ".wb-m{background:#fff;border-radius:16px;width:100%;max-width:460px;padding:12px 14px 16px;font:15px/1.4 Nunito,Arial,sans-serif;color:#111}" +
    ".wb-top{display:flex;justify-content:space-between;align-items:center;gap:8px}.wb-top button{border:0;background:#eee;border-radius:50%;width:34px;height:34px;font-size:16px;cursor:pointer}" +
    ".wb-bar{height:6px;background:#eee;border-radius:3px;margin:10px 0 2px;overflow:hidden}.wb-bar i{display:block;height:100%;background:#2a9d5c}.wb-cnt{margin:0;text-align:right;font-size:12px;opacity:.6}" +
    ".wb-card{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;width:100%;min-height:210px;margin:6px 0 10px;border:2px solid #16275c;border-radius:16px;background:#fffbf2;cursor:pointer;font:inherit;color:#111;padding:16px}" +
    ".wb-card.on{background:#f1fbf4;border-color:#2a9d5c}.wb-lang{font-size:12px;opacity:.6}.wb-front{font-size:26px;font-weight:800;text-align:center}.wb-back{font-size:21px;font-weight:700;color:#1e6b3f;text-align:center}" +
    ".wb-note{font-size:14px;background:#FFF6CC;border-radius:8px;padding:4px 8px}.wb-tap{font-size:13px;opacity:.55}" +
    ".wb-row{display:flex;gap:8px;margin-top:8px}.wb-row button{flex:1;border:1px solid #ddd;border-radius:12px;background:#fff;padding:10px 6px;font:700 14px Nunito,Arial;cursor:pointer;color:#111}" +
    ".wb-ans .no{background:#fdecec;border-color:#f3b4b4}.wb-ans .yes{background:#e6f7ec;border-color:#9fd8b3}" +
    ".wb-done{text-align:center;padding:24px 4px}.wb-big{font-size:28px;font-weight:800;margin:0 0 6px}.wb-go{display:block;width:100%;margin-top:10px;border:0;border-radius:12px;background:#16275c;color:#fff;padding:12px;font:800 15px Nunito,Arial;cursor:pointer}.wb-sec{background:#eee;color:#111}";
  document.head.appendChild(css);
})();
