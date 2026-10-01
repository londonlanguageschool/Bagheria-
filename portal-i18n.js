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
    "Report a problem": "Segnala un problema",
    "Fill it in now": "Compilala ora",
    "Later, I promise": "Dopo, lo prometto",
    "Cole is watching you ❤️": "Cole ti sta guardando ❤️",
    "PWWWEEEAAASSSEEEE do it when you get a chance 🙏": "PEEERFAAAVOOOREEE fallo appena puoi 🙏",
    "Cole can see you haven't filled in this lesson:": "Cole vede che non hai compilato questa lezione:",
    "Cole can see you haven't filled in these lessons:": "Cole vede che non hai compilato queste lezioni:",
    "What did you do today?": "Cosa avete fatto oggi?",
    "Tap all that apply · students see this on their road map": "Tocca tutto ciò che avete fatto · gli studenti lo vedono nel loro percorso",
    "Anything else?": "Altro?",
    "(optional: students see this)": "(facoltativo: lo vedono gli studenti)",
    "📘 Grammar: which grammar?": "📘 Grammatica: quale?",
    "🔤 Vocabulary: which words?": "🔤 Vocabolario: quali parole?",
    "📖 Reading: topic": "📖 Lettura: argomento",
    "🎧 Listening: topic": "🎧 Ascolto: argomento",
    "🗣️ Speaking: topic": "🗣️ Parlato: argomento",
    "✍️ Writing: topic": "✍️ Scrittura: argomento",
    "🎲 Games & songs: topic": "🎲 Giochi e canzoni: argomento",
    "📘 Grammar": "📘 Grammatica",
    "🔤 Vocabulary": "🔤 Vocabolario",
    "📖 Reading": "📖 Lettura",
    "🎧 Listening": "🎧 Ascolto",
    "🗣️ Speaking": "🗣️ Parlato",
    "✍️ Writing": "✍️ Scrittura",
    "🎲 Games & songs": "🎲 Giochi e canzoni",
    "One moment: the link is being made.": "Un attimo: sto preparando il link.",
    "✓ All changes are safely in Google Sheets.": "✓ Tutte le modifiche sono al sicuro su Google Sheets.",
    "✓ Attendance saved. Sending to Google in the background.": "✓ Presenze salvate. Le invio a Google in sottofondo.",
    "✓ Lesson notes saved. Sending to Google in the background.": "✓ Note della lezione salvate. Le invio a Google in sottofondo.",
    "Class saved.": "Classe salvata.",
    "Teacher updated.": "Insegnante aggiornato.",
    "Enquiry deleted.": "Richiesta eliminata.",
    "Test deleted.": "Test eliminato.",
    "Homework assigned.": "Compito assegnato.",
    "Course fee saved.": "Quota salvata.",
    "Class archived.": "Classe archiviata.",
    "Student marked inactive.": "Studente segnato come non attivo.",
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
    "4 · Quiz": "4 · Quiz",
    "(optional: students take it in their app, it marks itself)": "(facoltativo: gli studenti lo fanno nell'app, si corregge da solo)",
    "+ New quiz": "+ Nuovo quiz",
    "No quizzes yet for this class.": "Ancora nessun quiz per questa classe.",
    "All lesson notes for this class": "Tutte le note di lezione della classe",
    "No lesson notes for this class yet.": "Ancora nessuna nota per questa classe.",
    "📝 Last lesson": "📝 Ultima lezione",
    "📝 Last lesson in this class": "📝 Ultima lezione di questa classe",
    "⭐ Special lesson ": "⭐ Lezione speciale ",
    "Unit": "Unità",
    "Notes": "Note",
    "💾 Save lesson": "💾 Salva lezione",
    "✓ Lesson saved": "✓ Lezione salvata",
    "Saving…": "Salvataggio…",
    "Loading…": "Caricamento…",
    "Loading class…": "Carico la classe…",
    "⏳ Loading your classes from Google… (up to 30 seconds)": "⏳ Carico le tue classi da Google… (fino a 30 secondi)",
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
    "⏳ Saving… you can carry on, it finishes by itself.": "⏳ Salvataggio in corso… puoi continuare, finisce da solo.",
    "Enquiry updated in Google Sheets.": "Richiesta aggiornata su Google Sheets.",
    "Enquiry added to Google Sheets.": "Richiesta aggiunta su Google Sheets.",
    "Fee and payment recorded.": "Quota e pagamento registrati.",
    "Payment recorded.": "Pagamento registrato.",
    "Student saved. Google Sheets is updating in the background.": "Studente salvato.",
    "✓ Saved": "✓ Salvato",
    "✓ Attendance saved": "✓ Presenze salvate",
    "Not assigned": "Non assegnata",
    "⏳ Loading the register…": "⏳ Carico il registro…",
    "Wait until the register has loaded, then save.": "Aspetta che il registro sia caricato, poi salva.",
    "Attendance saved to Google Sheets.": "Presenze salvate su Google Sheets.",
    "Optional note": "Nota (facoltativa)",
    "Choose a class.": "Scegli una classe.",
    "Full payment": "Pagamento unico",
    "3 instalments": "3 rate",
    "10-hour pack (1-2-1)": "Pacchetto 10 ore (1-2-1)",
    "Monthly": "Mensile",
    "Other (see notes)": "Altro (vedi note)",
    "Cash": "Contanti",
    "Card": "Carta",
    "Bank transfer": "Bonifico",
    "Other": "Altro",
    "Walk-in": "Di persona",
    "Referral": "Passaparola",
    "Website": "Sito web",
    "School partnership": "Scuola partner",
    "Paused": "In pausa",
    "Completed": "Completato",
    "Select level": "Scegli il livello",
    "+ New enquiry": "+ Nuova richiesta",
    "+ Add student": "+ Aggiungi studente",
    "Collected this month": "Incassato questo mese",
    "Payments dated this month": "Pagamenti di questo mese",
    "Open enquiries": "Richieste aperte",
    "Nothing waiting": "Niente in attesa",
    "students": "studenti",
    "Recent enquiries": "Richieste recenti",
    "Open CRM →": "Apri richieste →",
    "No active enquiries.": "Nessuna richiesta aperta.",
    "Finance": "Contabilità",
    "Payment overview": "Riepilogo pagamenti",
    "Paid": "Pagato",
    "Outstanding": "Da incassare",
    "No payment data yet.": "Ancora nessun pagamento.",
    "Manage payments": "Gestisci pagamenti",
    "Student management": "Gestione studenti",
    "Manage enrolments, contact information, course allocation and status.": "Iscrizioni, contatti, classi e stato degli studenti.",
    "Export CSV": "Esporta CSV",
    "Course / Class": "Corso / Classe",
    "Level": "Livello",
    "Contact": "Contatti",
    "Status": "Stato",
    "Joined": "Iscritto dal",
    "Actions": "Azioni",
    "Date of birth not set": "Data di nascita mancante",
    "Active": "Attivo",
    "Edit": "Modifica",
    "📱 App link": "📱 Link app",
    "Deactivate": "Disattiva",
    "Academic records": "Registri",
    "Office view of past registers, for corrections and exports. Teachers take the register, write the lesson notes and set homework on": "Qui la segreteria vede e corregge i registri già fatti. Gli insegnanti fanno l'appello, le note e i compiti su",
    "★ Lesson": "★ Lezione",
    "Lesson date": "Data della lezione",
    "Save attendance": "Salva presenze",
    "Present": "Presente",
    "Attendance rate": "Percentuale presenze",
    "Lesson status": "Stato lezione",
    "No active students are enrolled in this class.": "Nessuno studente attivo iscritto a questa classe.",
    "Track fees, payments, outstanding balances and payment dates.": "Quote, pagamenti, saldi da incassare e scadenze.",
    "+ Record payment": "+ Registra pagamento",
    "Total fees": "Totale quote",
    "Collected": "Incassato",
    "Collection rate": "Percentuale incassata",
    "Description": "Descrizione",
    "Total fee": "Quota totale",
    "Balance": "Saldo",
    "Last payment": "Ultimo pagamento",
    "No payment records yet.": "Ancora nessun pagamento registrato.",
    "Search payments...": "Cerca pagamenti...",
    "Search students...": "Cerca studenti...",
    "Search enquiries...": "Cerca richieste...",
    "Sales & enrolment": "Richieste e iscrizioni",
    "Follow every lead from first contact to enrolment.": "Segui ogni richiesta dal primo contatto all'iscrizione.",
    "New": "Nuova",
    "Contacted": "Contattata",
    "Placement/Trial Booked": "Test/prova prenotata",
    "Placement/Trial Completed": "Test/prova fatta",
    "Course Offered": "Corso proposto",
    "Enrolled": "Iscritto",
    "Lost": "Persa",
    "Name": "Nome",
    "Interested in": "Interessato a",
    "Source": "Fonte",
    "Stage": "Fase",
    "Created": "Creata",
    "No enquiries yet.": "Ancora nessuna richiesta.",
    "Student record": "Scheda studente",
    "Add student": "Aggiungi studente",
    "Edit student": "Modifica studente",
    "First name *": "Nome *",
    "Surname *": "Cognome *",
    "Telephone": "Telefono",
    "Date of birth": "Data di nascita",
    "Level *": "Livello *",
    "Parent / guardian": "Genitore / tutore",
    "Save student": "Salva studente",
    "Record payment": "Registra pagamento",
    "Student *": "Studente *",
    "Description *": "Descrizione *",
    "Total fee (€) *": "Quota totale (€) *",
    "Amount paid (€) *": "Importo pagato (€) *",
    "Payment plan for this course fee": "Piano di pagamento per questa quota",
    "1st payment due": "1ª rata entro",
    "2nd payment due": "2ª rata entro",
    "3rd payment due": "3ª rata entro",
    "Suggested dates: change them to match what you agreed.": "Date suggerite: cambiale se avete concordato altro.",
    "Payment date": "Data del pagamento",
    "Method": "Metodo",
    "Save payment": "Salva pagamento",
    "e.g. General English course": "es. Corso di inglese generale",
    "Lead record": "Scheda richiesta",
    "New enquiry": "Nuova richiesta",
    "Edit enquiry": "Modifica richiesta",
    "Name *": "Nome *",
    "Student age": "Età dello studente",
    "Interested in *": "Interessato a *",
    "Next follow-up": "Prossimo ricontatto",
    "Enquiry date": "Data della richiesta",
    "Save enquiry": "Salva richiesta",
    "e.g. Cambridge B2": "es. Cambridge B2",
    "Add payment": "Aggiungi pagamento",
    "Edit plan": "Modifica piano",
    "Payments": "Pagamenti",
    "✓ Saved · in Google Sheets": "✓ Salvata · su Google Sheets",
    "✓ Saved on this device · sending to Google…": "✓ Salvata su questo dispositivo · invio a Google…",
    "⚠ Not sent yet: tap the orange pill to retry": "⚠ Non ancora inviata: tocca il pulsante arancione per riprovare",
    "Which payment is this? *": "Quale pagamento è? *",
    "Instalment 1": "Rata 1",
    "Instalment 2": "Rata 2",
    "Instalment 3": "Rata 3",
    "Hour pack": "Pacchetto ore",
    "Other (see notes)": "Altro (vedi note)",
    "Save anyway": "Salva comunque",
    "Which payment": "Quale pagamento",
    "Amount": "Importo",
    "Void": "Annullato",
    "Void payment": "Annulla pagamento",
    "Confirm void": "Conferma annullamento",
    "Voiding…": "Annullamento…",
    "Still saving…": "Salvataggio in corso…",
    "Close": "Chiudi",
    "No payments recorded for this fee yet.": "Nessun pagamento registrato per questa quota.",
    "Reason, e.g. entered twice": "Motivo, es. inserito due volte",
    "Your name": "Il tuo nome",
    "Payment voided. It no longer counts towards the balance.": "Pagamento annullato. Non conta più nel saldo.",
    "Write why this payment is being voided (e.g. entered twice).": "Scrivi perché annulli questo pagamento (es. inserito due volte).",
    "Choose which payment this is (e.g. Instalment 1).": "Scegli quale pagamento è (es. Rata 1).",
    "Voiding needs the new Apps Script (V26). Paste and deploy it, then try again.": "Per annullare serve il nuovo Apps Script (V26). Incollalo e pubblicalo, poi riprova.",
    "The payment could not be voided.": "Non è stato possibile annullare il pagamento.",
    "A payment entered by mistake is": "Un pagamento inserito per errore viene",
    "voided": "annullato",
    ", not deleted: it stays in the sheet crossed out, with the reason, and no longer counts towards the balance.": ", non cancellato: resta nel foglio barrato, con il motivo, e non conta più nel saldo.",
    "Convert to Student": "Trasforma in studente",
    "Enrolment and course fee": "Iscrizione e quota",
    "School year": "Anno scolastico",
    "Course fee (€) *": "Quota del corso (€) *",
    "Discount (€)": "Sconto (€)",
    "Payment plan": "Piano di pagamento",
    "Overdue": "Scaduto",
    "Delete": "Elimina",
    "Follow-up": "Ricontatto",
    "Portal": "Portale",
    "Answers: type each answer, then tick the correct one": "Risposte: scrivi ogni risposta, poi spunta quella giusta",
    "Type answer A, e.g. go": "Scrivi la risposta A, es. go",
    "Type answer B, e.g. goes": "Scrivi la risposta B, es. goes",
    "Type answer C (optional)": "Scrivi la risposta C (facoltativa)",
    "Type answer D (optional)": "Scrivi la risposta D (facoltativa)",
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
    "Cancel": "Annulla",
    "Save": "Salva",

    // ---- days / misc
    "Monday": "Lunedì", "Tuesday": "Martedì", "Wednesday": "Mercoledì", "Thursday": "Giovedì",
    "Friday": "Venerdì", "Saturday": "Sabato", "Sunday": "Domenica",
    "Mon & Fri": "Lun e Ven", "Mon & Wed": "Lun e Mer", "Tue & Thu": "Mar e Gio",
    "Young Learners": "Bambini",
    "We make English fun!": "We make English fun!",

    // ---- timetable (29 Sept)
    "Timetable": "Orario",
    "Every lesson of the week, like the board in the office. Built from Classes: change a class there and it moves here.": "Tutte le lezioni della settimana, come la lavagna in segreteria. Si basa su Classi: se modifichi una classe lì, si sposta anche qui.",
    "All teachers": "Tutti gli insegnanti",
    "All rooms": "Tutte le aule",
    "Provisional": "Provvisoria",
    "No lessons match these filters.": "Nessuna lezione con questi filtri.",
    "No lessons yet. Add a day and time to a class in Classes.": "Ancora nessuna lezione. Aggiungi giorno e ora a una classe in Classi.",
    "Loading classes…": "Caricamento classi…",
    "1 lesson": "1 lezione",
    "Room clash": "Aula già occupata",
    "Teacher clash": "Insegnante già impegnato"
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
    [/^(\d+)\/(\d+) done · (\d+)%$/, (m) => `${m[1]}/${m[2]} fatti · ${m[3]}%`],
    [/^· (\d+) questions$/, (m) => `· ${m[1]} domande`],
    [/^Unit (\S+) ✎$/, (m) => `Unità ${m[1]} ✎`],
    [/^Logged in as (.+) \((.+)\)$/, (m) => `Accesso come ${m[1]} (${m[2]})`],
    [/^Logged in as (.+)$/, (m) => `Accesso come ${m[1]}`],
    [/^Results — (.+)$/, (m) => `Risultati — ${m[1]}`],
    [/^App links — (.+)$/, (m) => `Link app — ${m[1]}`],
    [/^New test — (.+)$/, (m) => `Nuovo test — ${m[1]}`],
    [/^(\d+) students$/, (m) => `${m[1]} studenti`],
    [/^1 student$/, () => "1 studente"],
    [/^(\d+) lessons$/, (m) => `${m[1]} lezioni`],
    [/^(\d+) min$/, (m) => `${m[1]} min`],
    [/^· due (.+)$/, (m) => `· consegna ${m[1]}`],
    [/^No classes scheduled for (\w+)\.$/, (m) => `Nessuna lezione di ${day(m[1])}.`],
    [/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday) (\d+) (\w+) (\d{4})$/, (m) => `${day(m[1])} ${m[2]} ${month(m[3])} ${m[4]}`],
    [/^Add payment — (.+)$/, (m) => `Aggiungi pagamento — ${m[1]}`],
    [/^TUT TUT, (.+)!$/, (m) => `TUT TUT, ${m[1]}!`],
    [/^⏳ Sending (\d+) changes to Google…$/, (m) => `⏳ Invio ${m[1]} modifiche a Google…`],
    [/^⚠ (.+) not sent: (.+)\. Tap to retry$/, (m) => `⚠ ${m[1]} non inviato: ${m[2]}. Tocca per riprovare`],
    [/^Google didn't accept the change to (.+): (.+)\. Showing Google's data again\.$/, (m) => `Google non ha accettato la modifica (${m[1]}): ${m[2]}. Mostro di nuovo i dati di Google.`],
    [/^Payments — (.+)$/, (m) => `Pagamenti — ${m[1]}`],
    [/^Possible duplicate: (.+) on (.+?)( \((.+)\))? is already recorded for this fee\. Check before saving\. If it really is a second payment, press Save anyway\.$/, (m) => `Possibile doppione: ${m[1]} del ${m[2]}${m[4] ? " (" + (IT[m[4]] || m[4]) + ")" : ""} è già registrato per questa quota. Controlla prima di salvare. Se è davvero un secondo pagamento, premi Salva comunque.`],
    [/^Student (\S+) created\. Google Sheets is updating in the background\.$/, (m) => `Studente ${m[1]} creato.`],
    [/^(\d+) total student records$/, (m) => `${m[1]} studenti in archivio`],
    [/^(\d+) active teachers?$/, (m) => `${m[1]} insegnanti attivi`],
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
      const opt = node.parentElement && node.parentElement.closest("option");
      if (opt && !opt.hasAttribute("value")) return; // 28 Sept: its text is the value saved to Google
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
