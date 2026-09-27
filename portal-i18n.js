/* =========================================================
   LLS PORTAL — ITALIANO / ENGLISH switch (27 Sept 2026)
   The portal is written in English. This file swaps the words on
   screen for Italian when a user picks "IT", and puts the English
   back when they pick "EN". It only changes text the user sees:
   no data, names or saved values are ever translated.
   Choice is remembered on this computer (localStorage "lls_lang").
   To add a phrase: put the exact English text in IT below.
========================================================= */
(function () {
  "use strict";

  const IT = {
    // ---- login
    "Staff portal login": "Accesso portale staff",
    "Office / Admin": "Segreteria / Direzione",
    "Teacher": "Insegnante",
    "Enter the portal password to continue.": "Inserisci la password del portale per continuare.",
    "Log in with your teacher ID (or email) and PIN. You'll see your classes, attendance and homework.": "Entra con il tuo ID insegnante (o email) e il PIN. Vedrai le tue classi, le presenze e i compiti.",
    "Password": "Password",
    "Teacher ID or email": "ID insegnante o email",
    "PIN": "PIN",
    "Log in": "Entra",
    "Logging in…": "Accesso in corso…",
    "Forgotten your PIN, ID or password? · Password dimenticata?": "PIN, ID o password dimenticati?",
    "Teachers:": "Insegnanti:",
    "Office:": "Segreteria:",
    "you can log in with your": "puoi entrare con la tua",
    "email": "email",
    "instead of the Teacher ID. If the PIN doesn't work, ask the office: they set a new one in": "al posto dell'ID insegnante. Se il PIN non funziona, chiedi alla segreteria: ne imposta uno nuovo in",
    "Teachers → Edit → PIN": "Insegnanti → Modifica → PIN",
    "in a few seconds. After 8 wrong PINs the login pauses for 15 minutes.": "in pochi secondi. Dopo 8 PIN sbagliati l'accesso si blocca per 15 minuti.",
    "the office password is kept by the director (Cole). Don't share it by WhatsApp.": "la password della segreteria la custodisce il direttore (Cole). Non mandarla su WhatsApp.",
    "That PIN isn't right. Check it, or open \"Forgotten your PIN?\" below.": "Il PIN non è corretto. Controllalo, oppure apri \"PIN dimenticato?\" qui sotto.",
    "No teacher has that ID or email. Try your Teacher ID (e.g. TCH0002).": "Nessun insegnante con questo ID o email. Prova con il tuo ID (es. TCH0002).",
    "This teacher account is switched off. Ask the office.": "Questo account insegnante è disattivato. Chiedi alla segreteria.",
    "That password isn't right. Check Caps Lock and try again.": "La password non è corretta. Controlla il blocco maiuscole e riprova.",

    // ---- shell / nav
    "Dashboard": "Bacheca",
    "Lesson": "Lezione",
    "Students": "Studenti",
    "Classes": "Classi",
    "Attendance": "Presenze",
    "Homework": "Compiti",
    "Fees & Payments": "Quote e pagamenti",
    "Enquiries": "Richieste",
    "Teachers": "Insegnanti",
    "Reports": "Report",
    "Settings": "Impostazioni",
    "Log out": "Esci",
    "Export backup": "Esporta backup",
    "School portal": "Portale scuola",
    "Notifications": "Notifiche",
    "You're up to date. No portal alerts.": "Tutto in ordine. Nessun avviso.",
    "Search students, classes, enquiries...": "Cerca studenti, classi, richieste...",
    "Search portal": "Cerca nel portale",
    "Main navigation": "Menu principale",
    "Bagheria, Sicily": "Bagheria, Sicilia",
    "Language School": "Language School",

    // ---- dashboard
    "Welcome to your school portal.": "Benvenuto nel portale della scuola.",
    "Keep students, classes, payments, enquiries and attendance organised in one place.": "Studenti, classi, pagamenti, richieste e presenze, tutto in un unico posto.",
    "Today": "Oggi",
    "Today's classes": "Lezioni di oggi",
    "View all →": "Vedi tutte →",
    "Active students": "Studenti attivi",
    "Active classes": "Classi attive",
    "Student breakdown": "Studenti per livello",
    "Enrolment": "Iscrizioni",
    "Add active students to see the level breakdown.": "Aggiungi studenti attivi per vedere i livelli.",

    // ---- lesson page
    "Teaching": "Didattica",
    "Tap your class, take the register, write what you did and set homework. One button saves everything.": "Tocca la tua classe, fai l'appello, scrivi cosa avete fatto e assegna i compiti. Un solo pulsante salva tutto.",
    "Date": "Data",
    "Show other teachers' classes (e.g. to cover)": "Mostra le classi dei colleghi (es. supplenze)",
    "1 · Register": "1 · Registro",
    "2 · What we did": "2 · Cosa abbiamo fatto",
    "3 · Homework": "3 · Compiti",
    "(optional: goes straight to the students' app)": "(facoltativo: arriva subito nell'app degli studenti)",
    "Everyone here": "Tutti presenti",
    "✓ Here": "✓ Presente",
    "Late": "In ritardo",
    "Absent": "Assente",
    "Excused": "Giustificato",
    "How did they do?": "Com'è andata?",
    "⭐ Excellent": "⭐ Ottimo",
    "👍 Good": "👍 Bene",
    "🙂 OK": "🙂 Discreto",
    "🤝 Needs support": "🤝 Da aiutare",
    "Note (optional)": "Nota (facoltativa)",
    "⭐ Special lesson": "⭐ Lezione speciale",
    "(Welcome back, Halloween, Christmas… instead of the book. It still counts as a lesson; the unit doesn't move.)": "(Bentornati, Halloween, Natale… al posto del libro. Conta comunque come lezione; l'unità non avanza.)",
    "👋 Welcome back": "👋 Bentornati",
    "🎃 Halloween": "🎃 Halloween",
    "🎆 Bonfire Night": "🎆 Bonfire Night",
    "🎄 Christmas": "🎄 Natale",
    "🎭 Carnival": "🎭 Carnevale",
    "🐣 Easter": "🐣 Pasqua",
    "🎲 Revision games": "🎲 Giochi di ripasso",
    "🎉 End of year party": "🎉 Festa di fine anno",
    "Special lesson name": "Nome della lezione speciale",
    "Pick one above or type your own, e.g. Thanksgiving": "Scegline una sopra o scrivi la tua, es. Thanksgiving",
    "Unit / page": "Unità / pagina",
    "What we did": "Cosa abbiamo fatto",
    "Notes for the next teacher": "Note per il prossimo insegnante",
    "Instructions (optional)": "Istruzioni (facoltative)",
    "Due": "Consegna",
    "Recent homework": "Compiti recenti",
    "All lesson notes for this class": "Tutte le note di lezione della classe",
    "No lesson notes for this class yet.": "Ancora nessuna nota per questa classe.",
    "📝 Last lesson": "📝 Ultima lezione",
    "📝 Last lesson in this class": "📝 Ultima lezione di questa classe",
    "⭐ Special lesson ": "⭐ Lezione speciale ",
    "Unit": "Unità",
    "Notes": "Note",
    "💾 Save lesson": "💾 Salva lezione",
    "Saving…": "Salvataggio…",
    "Loading…": "Caricamento…",
    "Loading class…": "Carico la classe…",
    "Saves the register, notes and homework together": "Salva insieme registro, note e compiti",
    "  ← rating needed": "  ← manca la valutazione",
    "No students enrolled in this class yet.": "Nessuno studente iscritto in questa classe.",
    "Try again": "Riprova",
    "Results": "Risultati",
    "📊 Results": "📊 Risultati",
    "Previous unit": "Unità precedente",
    "Next unit": "Unità successiva",
    "e.g. 2B, p.18": "es. 2B, p.18",
    "e.g. 2B past simple, vocab game, listening p.19": "es. 2B past simple, gioco di lessico, ascolto p.19",
    "e.g. Didn't finish the reading. Marco absent: give him the sheet.": "es. Lettura da finire. Marco assente: dargli la scheda.",
    "e.g. Workbook p.12 ex 1–3": "es. Workbook p.12 es. 1–3",
    "Choose a class and date.": "Scegli una classe e una data.",
    "Nothing to save yet.": "Ancora niente da salvare.",
    "Give the special lesson a name (e.g. Halloween), or untick ⭐ Special lesson.": "Dai un nome alla lezione speciale (es. Halloween) o togli la spunta a ⭐ Lezione speciale.",

    // ---- homework page
    "Teachers log in to assign homework and mark it as completed. Results are tracked as part of each student's progress.": "Gli insegnanti assegnano i compiti e li segnano come fatti. I risultati contano nei progressi di ogni studente.",
    "Assign homework": "Assegna compiti",
    "+ Assign homework": "+ Assegna compiti",
    "Choose the class, write the homework yourself (title, instructions and due date) and press": "Scegli la classe, scrivi i compiti (titolo, istruzioni e data di consegna) e premi",
    ". It appears in the students' app straight away and counts towards their progress. You don't need the AI for this.": ". Compaiono subito nell'app degli studenti e contano nei loro progressi. Non serve l'AI.",
    "Class": "Classe",
    "Title": "Titolo",
    "Title *": "Titolo *",
    "Description / instructions": "Descrizione / istruzioni",
    "Due date": "Data di consegna",
    "e.g. Unit 4 vocabulary sheet": "es. Scheda lessico unità 4",
    "My classes": "Le mie classi",
    "Other classes": "Altre classi",
    "Tests": "Test",
    "+ New test": "+ Nuovo test",
    "No tests yet for this class.": "Ancora nessun test per questa classe.",
    "Write your own test for the class chosen above. Students take it in their app, it marks itself, and it counts towards their progress like homework.": "Crea un test per la classe scelta sopra. Gli studenti lo fanno nell'app, si corregge da solo e conta nei progressi come i compiti.",
    "+ Multiple choice question": "+ Domanda a scelta multipla",
    "+ Typed answer question": "+ Domanda a risposta scritta",
    "Question": "Domanda",
    "Remove": "Rimuovi",
    "Correct answer": "Risposta corretta",
    "Tick the correct option. Leave C and D empty for 2 options.": "Spunta l'opzione corretta. Lascia vuote C e D per 2 opzioni.",
    "Explanation (optional, shown after the test)": "Spiegazione (facoltativa, mostrata dopo il test)",
    "Correct answer(s), one per line": "Risposta/e corretta/e, una per riga",
    "Option A": "Opzione A",
    "Option B": "Opzione B",
    "Option C (optional)": "Opzione C (facoltativa)",
    "Option D (optional)": "Opzione D (facoltativa)",
    "e.g. Unit 2 check: past simple": "es. Verifica unità 2: past simple",
    "e.g. She ___ to school every day.": "es. She ___ to school every day.",
    "Save and give to class": "Salva e assegna alla classe",
    "View / Mark": "Vedi / Segna",
    "Delete test": "Elimina test",

    // ---- classes
    "View groups, teachers, lesson times, rooms and capacity.": "Gruppi, insegnanti, orari, aule e posti.",
    "Academic organisation": "Organizzazione didattica",
    "Day": "Giorno",
    "Time": "Orario",
    "Duration": "Durata",
    "Room": "Aula",
    "Class capacity": "Posti in classe",
    "📱 App links": "📱 Link app",
    "App links": "Link app",
    "Student app": "App studenti",
    "Each student (or parent) gets a private link: no username or password.": "Ogni studente (o genitore) riceve un link privato: niente nome utente né password.",
    "Send on WhatsApp": "Invia su WhatsApp",
    "opens a ready message in Italian with the link and how to add the app to the phone's home screen. If the student has a phone number saved, it goes straight to that chat.": "apre un messaggio pronto in italiano con il link e come aggiungere l'app alla schermata Home. Se lo studente ha un numero salvato, va dritto a quella chat.",
    "(no phone saved)": "(nessun numero)",
    "Creating link…": "Creo il link…",
    "Could not create the link.": "Non è stato possibile creare il link.",
    "Copy": "Copia",
    "Copy link": "Copia link",
    "Make new link": "Nuovo link",
    "Mini tests show each student's FIRST score (best score in brackets if they retook it). Practice = lesson sets and reviews passed up to the current unit.": "I mini test mostrano il PRIMO punteggio (il migliore tra parentesi se rifatto). Esercizi = serie e ripassi superati fino all'unità attuale.",
    "Average (first try)": "Media (primo tentativo)",
    "Progress": "Progressi",
    "Practice": "Esercizi",
    "Student": "Studente",
    "Taken": "Fatto",
    "Close": "Chiudi",
    "Cancel": "Annulla",
    "Save": "Salva",

    // ---- days / misc
    "Monday": "Lunedì", "Tuesday": "Martedì", "Wednesday": "Mercoledì", "Thursday": "Giovedì",
    "Friday": "Venerdì", "Saturday": "Sabato", "Sunday": "Domenica",
    "Mon & Fri": "Lun e Ven", "Mon & Wed": "Lun e Mer", "Tue & Thu": "Mar e Gio",
    "Young Learners": "Bambini",
    "We make English fun!": "We make English fun!"
  };

  const DAYS = { Monday: "lunedì", Tuesday: "martedì", Wednesday: "mercoledì", Thursday: "giovedì", Friday: "venerdì", Saturday: "sabato", Sunday: "domenica" };
  const MONTHS = { Jan: "gen", Feb: "feb", Mar: "mar", Apr: "apr", May: "mag", Jun: "giu", Jul: "lug", Aug: "ago", Sept: "set", Sep: "set", Oct: "ott", Nov: "nov", Dec: "dic",
    January: "gennaio", February: "febbraio", March: "marzo", April: "aprile", June: "giugno", July: "luglio", August: "agosto", September: "settembre", October: "ottobre", November: "novembre", December: "dicembre" };
  const day = (d) => DAYS[d] || d;
  const month = (m) => MONTHS[m] || m;
  const SAVED_PARTS = { "register": "registro", "homework (now in the students' app)": "compiti (già nell'app degli studenti)", "lesson notes": "note di lezione" };

  // Phrases that contain names, numbers or dates.
  const PATTERNS = [
    [/^My lessons on (\w+) (\d+) (\w+)$/, (m) => `Le mie lezioni di ${day(m[1])} ${m[2]} ${month(m[3])}`],
    [/^All my classes \((\d+)\)$/, (m) => `Tutte le mie classi (${m[1]})`],
    [/^(\d+)\/(\d+) here$/, (m) => `${m[1]}/${m[2]} presenti`],
    [/^(\d+)\/(\d+) done$/, (m) => `${m[1]}/${m[2]} fatti`],
    [/^Unit (\S+) ✎$/, (m) => `Unità ${m[1]} ✎`],
    [/^Logged in as (.+) \((.+)\)$/, (m) => `Accesso come ${m[1]} (${m[2]})`],
    [/^Logged in as (.+)$/, (m) => `Accesso come ${m[1]}`],
    [/^Results — (.+)$/, (m) => `Risultati — ${m[1]}`],
    [/^App links — (.+)$/, (m) => `Link app — ${m[1]}`],
    [/^New test — (.+)$/, (m) => `Nuovo test — ${m[1]}`],
    [/^(\d+) students$/, (m) => `${m[1]} studenti`],
    [/^1 student$/, () => "1 studente"],
    [/^(\d+) min$/, (m) => `${m[1]} min`],
    [/^· due (.+)$/, (m) => `· consegna ${m[1]}`],
    [/^No classes scheduled for (\w+)\.$/, (m) => `Nessuna lezione di ${day(m[1])}.`],
    [/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday) (\d+) (\w+) (\d{4})$/, (m) => `${day(m[1])} ${m[2]} ${month(m[3])} ${m[4]}`],
    [/^Question (\d+) · multiple choice$/, (m) => `Domanda ${m[1]} · scelta multipla`],
    [/^Question (\d+) · typed answer$/, (m) => `Domanda ${m[1]} · risposta scritta`],
    [/^Saved: (.+)\.$/, (m) => "Salvato: " + m[1].split(", ").map((p) => SAVED_PARTS[p] || p).join(", ") + "."],
    [/^Not saved: (.+)$/, (m) => `Non salvato: ${m[1]}`],
    [/^(.+) is now on unit (\d+)\. Practice in the app follows it\.$/, (m) => `${m[1]} ora è all'unità ${m[2]}. Gli esercizi nell'app la seguono.`],
    [/^(.+) is now on unit (\d+)\.$/, (m) => `${m[1]} ora è all'unità ${m[2]}.`],
    [/^✓ (.+) saved on this device\. It's being sent to Google in the background: you can go to your next class\.$/, (m) => `✓ ${m[1]} salvata su questo dispositivo. La invio a Google in sottofondo: puoi andare alla prossima classe.`],
    [/^✓ (.+) \((.+)\) is safely in Google Sheets\.$/, (m) => `✓ ${m[1]} (${m[2]}) è al sicuro su Google Sheets.`],
    [/^⏳ Sending (.+) to Google…$/, (m) => `⏳ Invio ${m[1].replace(/(\d+) lessons/, "$1 lezioni")} a Google…`],
    [/^⚠ (.+) not sent: (.+)\. Tap to retry$/, (m) => `⚠ ${m[1]} non inviata: ${m[2]}. Tocca per riprovare`],
    [/^Almost done: fill in (.+)\. They count towards each student's progress\.$/, (m) => "Quasi fatto: compila " + m[1].replace(/"How did they do\?" for (\d+) students?/, "\"Com'è andata?\" per $1 studente/i").replace(/"What we did"/, "\"Cosa abbiamo fatto\"").replace(" and ", " e ") + ". Contano nei progressi di ogni studente."],
    [/^Couldn't fetch earlier marks for this date \((.+)\)\. You can still take the register and save\.$/, (m) => `Non riesco a leggere le presenze già salvate (${m[1]}). Puoi comunque fare l'appello e salvare.`],
    [/^Could not load this lesson: (.*)$/, (m) => `Impossibile caricare la lezione: ${m[1]}`],
    [/^Google didn't answer this time \((.+)\)\. Wait a few seconds and try again\.$/, (m) => `Google non ha risposto (${m[1]}). Aspetta qualche secondo e riprova.`],
    [/^Google didn't answer \((.+)\)\. Wait a few seconds and try again\.$/, (m) => `Google non ha risposto (${m[1]}). Aspetta qualche secondo e riprova.`],
    [/^Google didn't confirm the save \((.+)\)\. It has probably been saved: the page has been refreshed, so check the list before saving again\.$/, (m) => `Google non ha confermato il salvataggio (${m[1]}). Probabilmente è salvato: la pagina è stata aggiornata, controlla l'elenco prima di salvare di nuovo.`]
  ];

  const KEY = "lls_lang";
  let lang = "en";
  try { lang = localStorage.getItem(KEY) === "it" ? "it" : "en"; } catch (_) {}

  const originals = new WeakMap(); // text node -> English
  const ATTRS = ["placeholder", "aria-label", "title"];

  function toItalian(text) {
    const trimmed = text.replace(/\s+/g, " ").trim();
    if (!trimmed) return null;
    if (Object.prototype.hasOwnProperty.call(IT, trimmed)) return text.replace(text.trim(), IT[trimmed]);
    for (const [re, fn] of PATTERNS) {
      const m = trimmed.match(re);
      if (m) return text.replace(text.trim(), fn(m));
    }
    return null;
  }

  function skip(el) {
    return !el || el.closest("script, style, textarea, input, [data-no-translate], .lls-lang");
  }

  function translateNode(node) {
    if (node.nodeType === 3) {
      if (skip(node.parentElement)) return;
      if (lang === "it") {
        const current = node.nodeValue;
        const known = originals.get(node);
        // If the app rewrote the text since we translated it, start again from the new English.
        const english = known && current === known.it ? known.en : current;
        const it = toItalian(english);
        if (it !== null && it !== current) {
          originals.set(node, { en: english, it });
          node.nodeValue = it;
        }
      } else {
        const known = originals.get(node);
        if (known && node.nodeValue === known.it) node.nodeValue = known.en;
        originals.delete(node);
      }
      return;
    }
    if (node.nodeType !== 1 || skip(node) && !node.matches("input, textarea")) return;
    ATTRS.forEach((a) => {
      if (!node.hasAttribute || !node.hasAttribute(a)) return;
      const store = "data-en-" + a;
      if (lang === "it") {
        const english = node.getAttribute(store) || node.getAttribute(a);
        const it = toItalian(english);
        if (it !== null) {
          if (!node.hasAttribute(store)) node.setAttribute(store, english);
          if (node.getAttribute(a) !== it) node.setAttribute(a, it);
        }
      } else if (node.hasAttribute(store)) {
        node.setAttribute(a, node.getAttribute(store));
        node.removeAttribute(store);
      }
    });
    if (node.matches && node.matches("input, textarea")) return;
    node.childNodes.forEach(translateNode);
  }

  let busy = false;
  function apply(root) {
    busy = true;
    try { translateNode(root || document.body); } finally { busy = false; }
  }

  function setLang(next) {
    lang = next === "it" ? "it" : "en";
    try { localStorage.setItem(KEY, lang); } catch (_) {}
    document.documentElement.lang = lang;
    document.querySelectorAll(".lls-lang button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
    apply(document.body);
  }

  function makeSwitch(extraClass) {
    const wrap = document.createElement("div");
    wrap.className = "lls-lang " + (extraClass || "");
    wrap.setAttribute("role", "group");
    wrap.setAttribute("aria-label", "Language / Lingua");
    wrap.innerHTML = '<button type="button" data-lang="it">IT</button><button type="button" data-lang="en">EN</button>';
    wrap.querySelectorAll("button").forEach((b) => {
      b.setAttribute("aria-pressed", String(b.dataset.lang === lang));
      b.addEventListener("click", () => setLang(b.dataset.lang));
    });
    return wrap;
  }

  function start() {
    const actions = document.querySelector(".topbar-actions");
    if (actions && !actions.querySelector(".lls-lang")) actions.insertBefore(makeSwitch("in-topbar"), actions.firstChild);
    const card = document.querySelector(".admin-login-card");
    if (card && !card.querySelector(".lls-lang")) card.insertBefore(makeSwitch("on-login"), card.firstChild);
    document.documentElement.lang = lang;
    if (lang === "it") apply(document.body);

    new MutationObserver((list) => {
      if (busy || lang !== "it") return;
      busy = true;
      try {
        list.forEach((m) => {
          if (m.type === "characterData") translateNode(m.target);
          else if (m.type === "attributes") translateNode(m.target);
          else m.addedNodes.forEach(translateNode);
        });
      } finally { busy = false; }
    }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }

  window.llsSetLanguage = setLang;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
