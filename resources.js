/* =========================================================
   LLS — Teacher resources (5 Oct 2026, needs Apps Script V31)
   "Found something good that will help other teachers? Share it here."
   Teachers share a link or a file with categories (level, book, lesson,
   skill, type, exam, tags) so others can find it. Browse with filters.
   Only the person who shared it, or the office, can remove it.
========================================================= */
(function () {
  "use strict";
  const LEVELS = ["Young Learners", "A1", "A2", "B1", "B2", "C1", "C2", "All levels"];
  const SKILLS = ["Grammar", "Vocabulary", "Reading", "Listening", "Speaking", "Writing", "Pronunciation", "Exam skills", "Games & warmers", "Classroom management"];
  const KINDS = ["Game", "Worksheet", "Video", "Audio", "Slides", "Website / app", "Test / quiz", "Song", "Teacher tip", "Other"];
  const KIND_ICON = { "Game": "🎲", "Worksheet": "📝", "Video": "🎬", "Audio": "🎧", "Slides": "🖥", "Website / app": "🌐", "Test / quiz": "✅", "Song": "🎵", "Teacher tip": "💡", "Other": "📎" };
  let cache = null;
  const filters = { q: "", level: "", skill: "", kind: "", book: "" };

  const esc = (s) => (typeof escapeHtml === "function" ? escapeHtml(String(s == null ? "" : s)) : String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])));
  const ready = () => (window.llsServerVersion || 0) >= 31;
  const opts = (list, first) => `<option value="">${first}</option>` + list.map((x) => `<option>${esc(x)}</option>`).join("");
  function books() {
    const C = window.LLS_COURSES || {}, P = (window.LLS_PLANS && LLS_PLANS.names) || {};
    const out = {};
    Object.keys(C).forEach((k) => { out[k] = (C[k] && C[k].title) || k; });
    Object.keys(P).forEach((k) => { out[k] = out[k] || P[k]; });
    return out;
  }
  function lessonCodes(book) {
    const plans = (window.LLS_PLANS && LLS_PLANS.courses && LLS_PLANS.courses[book]) || [];
    return plans.map((p) => `${p.id} ${p.title}`);
  }

  function shareFormHtml() {
    const B = books();
    return `
      <form id="resShareForm" class="res-form" novalidate>
        <div class="form-grid">
          <div class="form-field form-field-wide"><label for="resTitle">What is it? (short title) *</label>
            <input id="resTitle" maxlength="120" placeholder="e.g. Present perfect board race · Cambridge B1 Listening Part 1 practice"></div>
          <div class="form-field"><label for="resLevel">Level *</label><select id="resLevel">${opts(LEVELS, "Choose…")}</select></div>
          <div class="form-field"><label for="resSkill">Skill *</label><select id="resSkill">${opts(SKILLS, "Choose…")}</select></div>
          <div class="form-field"><label for="resKind">Type *</label><select id="resKind">${opts(KINDS, "Choose…")}</select></div>
          <div class="form-field"><label for="resBook">Book / course</label><select id="resBook"><option value="">Any / none</option>${Object.entries(B).map(([k, v]) => `<option value="${esc(k)}">${esc(v)}</option>`).join("")}</select></div>
          <div class="form-field form-field-wide"><label for="resLesson">Which lesson does it work with? <span class="muted">(e.g. 6A, 7A-2, Chefs L3)</span></label>
            <input id="resLesson" list="resLessonList" maxlength="80" placeholder="e.g. 6A"><datalist id="resLessonList"></datalist></div>
          <div class="form-field form-field-wide"><label for="resExam">Exam and part <span class="muted">(if it's exam practice)</span></label>
            <input id="resExam" maxlength="80" placeholder="e.g. Cambridge B1 Preliminary · Listening Part 1"></div>
          <div class="form-field form-field-wide"><label for="resTags">Topic / grammar / key words <span class="muted">(comma between them)</span></label>
            <input id="resTags" maxlength="200" placeholder="e.g. present perfect, speaking game, food"></div>
          <div class="form-field form-field-wide"><label for="resDesc">How do you use it? <span class="muted">(timing, tips – optional)</span></label>
            <textarea id="resDesc" rows="2" maxlength="600" placeholder="e.g. 10-minute warmer in pairs. Works well with teenagers."></textarea></div>
          <div class="form-field form-field-wide"><label for="resLink">Link</label><input id="resLink" type="url" maxlength="500" placeholder="https://…"></div>
          <div class="form-field form-field-wide"><label for="resFile">…or a file <span class="muted">(max 8 MB: PDF, Word, PowerPoint, photo, audio)</span></label>
            <input id="resFile" type="file" accept="image/*,application/pdf,audio/*,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"></div>
        </div>
        <p class="muted res-why">* Please fill in as much as you can: without a level, skill and lesson or topic, nobody will find it.</p>
        <p class="res-error" id="resError" hidden></p>
        <div class="res-actions"><button class="button" type="submit" id="resSubmit">💡 Share it</button><button class="button button-secondary" type="button" data-res-cancel>Cancel</button></div>
      </form>`;
  }

  function cardHtml(r) {
    const me = (typeof llsGetTeacherSession === "function" && llsGetTeacherSession()) || null;
    const isTeacher = typeof llsIsTeacher === "function" && llsIsTeacher();
    const canRemove = !isTeacher || (me && me.teacherId && me.teacherId === r.addedById);
    const where = [r.lesson && `Lesson ${r.lesson}`, r.exam, r.book && (books()[r.book] || r.book)].filter(Boolean);
    const date = r.addedAt ? new Date(r.addedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";
    return `<article class="res-card">
      <div class="res-top"><span class="res-icon" aria-hidden="true">${KIND_ICON[r.kind] || "📎"}</span>
        <div><h4>${esc(r.title)}</h4><div class="res-chips">${[r.level, r.skill, r.kind].filter(Boolean).map((c) => `<span class="res-chip">${esc(c)}</span>`).join("")}</div></div></div>
      ${where.length ? `<p class="res-where">📍 ${esc(where.join(" · "))}</p>` : ""}
      ${r.tags ? `<p class="res-tags">🏷 ${esc(r.tags)}</p>` : ""}
      ${r.description ? `<p class="res-desc">${esc(r.description)}</p>` : ""}
      <div class="res-foot"><span class="muted">${esc(r.addedBy || "")}${date ? " · " + esc(date) : ""}</span>
        <span class="res-open">${r.link ? `<a class="row-action" href="${esc(r.link)}" target="_blank" rel="noopener noreferrer">🔗 Open link</a>` : ""}${r.fileName ? `<button type="button" class="row-action" data-res-file="${esc(r.resourceId)}">📎 ${esc(r.fileName)}</button>` : ""}${canRemove ? `<button type="button" class="row-action warn" data-res-remove="${esc(r.resourceId)}" title="Remove">✕</button>` : ""}</span></div>
    </article>`;
  }

  function matches(r) {
    if (filters.level && r.level !== filters.level && r.level !== "All levels") return false;
    if (filters.skill && r.skill !== filters.skill) return false;
    if (filters.kind && r.kind !== filters.kind) return false;
    if (filters.book && r.book !== filters.book) return false;
    if (filters.q) {
      const hay = [r.title, r.lesson, r.exam, r.tags, r.description, r.level, r.skill, r.kind].join(" ").toLowerCase();
      if (!filters.q.toLowerCase().split(/\s+/).filter(Boolean).every((w) => hay.includes(w))) return false;
    }
    return true;
  }

  function renderList() {
    const box = document.getElementById("resList");
    if (!box) return;
    if (!ready()) { box.innerHTML = `<p class="muted">Sharing will switch on when the office installs the next portal update (Apps Script V31).</p>`; return; }
    if (!cache) { box.innerHTML = `<p class="muted">Loading…</p>`; return; }
    const list = cache.filter(matches);
    box.innerHTML = list.length ? list.map(cardHtml).join("") :
      `<p class="muted">${cache.length ? "Nothing matches these filters." : "Nothing shared yet. Be the first! 💡"}</p>`;
    const count = document.getElementById("resCount");
    if (count) count.textContent = cache.length ? `${list.length} of ${cache.length}` : "";
  }

  async function load(force) {
    if (!ready()) { renderList(); return; }
    if (cache && !force) { renderList(); return; }
    try {
      const res = await llsApiGet("getResources");
      cache = res.resources || [];
    } catch (e) {
      cache = cache || [];
      if (typeof showToast === "function") showToast("Couldn't load the shared resources. Try again in a moment.", "error");
    }
    renderList();
  }

  function openForm(prefill) {
    const holder = document.getElementById("resFormHolder");
    if (!holder) return;
    holder.innerHTML = shareFormHtml();
    holder.hidden = false;
    const form = document.getElementById("resShareForm");
    const bookSel = document.getElementById("resBook");
    const fillLessons = () => {
      const dl = document.getElementById("resLessonList");
      if (dl) dl.innerHTML = lessonCodes(bookSel.value).map((c) => `<option value="${esc(c.split(" ")[0])}">${esc(c)}</option>`).join("");
    };
    if (prefill) {
      if (prefill.book) bookSel.value = prefill.book;
      if (prefill.lesson) document.getElementById("resLesson").value = prefill.lesson;
      if (prefill.level && LEVELS.includes(prefill.level)) document.getElementById("resLevel").value = prefill.level;
    }
    fillLessons();
    bookSel.addEventListener("change", fillLessons);
    form.querySelector("[data-res-cancel]").addEventListener("click", () => { holder.hidden = true; holder.innerHTML = ""; });
    form.addEventListener("submit", submit);
    holder.scrollIntoView({ behavior: "smooth", block: "start" });
    document.getElementById("resTitle").focus();
  }

  async function submit(e) {
    e.preventDefault();
    const v = (id) => (document.getElementById(id)?.value || "").trim();
    const err = document.getElementById("resError");
    const show = (m) => { err.textContent = m; err.hidden = false; };
    err.hidden = true;
    const fields = { title: v("resTitle"), level: v("resLevel"), skill: v("resSkill"), kind: v("resKind"), book: v("resBook"), lesson: v("resLesson"), exam: v("resExam"), tags: v("resTags"), description: v("resDesc"), link: v("resLink") };
    const file = document.getElementById("resFile")?.files?.[0];
    if (!fields.title) return show("Give it a short title.");
    if (!fields.level || !fields.skill || !fields.kind) return show("Choose a level, a skill and a type, so other teachers can find it.");
    if (!fields.lesson && !fields.exam && !fields.tags) return show("Say which lesson, exam part or topic it works with (e.g. 6A, or Cambridge B1 Listening Part 1, or 'present perfect').");
    if (!fields.link && !file) return show("Add a link or a file.");
    if (fields.link && !/^https?:\/\//i.test(fields.link)) return show("The link must start with https://");
    const btn = document.getElementById("resSubmit");
    btn.disabled = true; btn.textContent = "Sharing…";
    try {
      const body = { action: "shareResource", fields };
      if (file) {
        if (typeof llsReadUpload_ !== "function") throw new Error("File upload isn't available here.");
        const up = await llsReadUpload_(file);
        Object.assign(body, { name: up.name, type: up.type, data: up.data });
      }
      const res = await llsApiPost(body);
      cache = [res.resource].concat(cache || []);
      document.getElementById("resFormHolder").hidden = true;
      document.getElementById("resFormHolder").innerHTML = "";
      renderList();
      if (typeof showToast === "function") showToast("💡 Shared – thank you! Other teachers can find it now.", "success");
    } catch (error) {
      show(error.message || "Couldn't share it. Try again.");
    } finally {
      btn.disabled = false; btn.textContent = "💡 Share it";
    }
  }

  async function removeRes(id) {
    if (!confirm("Remove this shared resource for everybody?")) return;
    try {
      await llsApiPost({ action: "removeResource", resourceId: id });
      cache = (cache || []).filter((r) => r.resourceId !== id);
      renderList();
    } catch (e) { if (typeof showToast === "function") showToast(e.message || "Couldn't remove it.", "error"); }
  }

  async function openFile(id) {
    const win = window.open("", "_blank");
    try {
      const res = await llsApiGet("getResourceFile", { resourceId: id });
      const r = res.resource || {};
      const bytes = Uint8Array.from(atob(res.data), (c) => c.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: r.type || "application/octet-stream" }));
      if (win && /^(image\/|audio\/|application\/pdf|text\/plain)/.test(r.type || "")) win.location.href = url;
      else { if (win) win.close(); const a = document.createElement("a"); a.href = url; a.download = r.fileName || "file"; document.body.appendChild(a); a.click(); a.remove(); }
      setTimeout(() => URL.revokeObjectURL(url), 120000);
    } catch (e) { if (win) win.close(); if (typeof showToast === "function") showToast(e.message || "Couldn't open the file.", "error"); }
  }

  function buildPage() {
    const page = document.getElementById("page-resources");
    if (!page || page.dataset.built) return;
    page.dataset.built = "1";
    const B = books();
    page.querySelector("#resFilters").innerHTML = `
      <input id="resQ" type="search" placeholder="Search: 6A, present perfect, Cambridge Part 1…" aria-label="Search">
      <select id="resFLevel" aria-label="Level">${opts(LEVELS.filter((l) => l !== "All levels"), "All levels")}</select>
      <select id="resFSkill" aria-label="Skill">${opts(SKILLS, "All skills")}</select>
      <select id="resFKind" aria-label="Type">${opts(KINDS, "All types")}</select>
      <select id="resFBook" aria-label="Book"><option value="">All books</option>${Object.entries(B).map(([k, v]) => `<option value="${esc(k)}">${esc(v)}</option>`).join("")}</select>
      <span class="muted" id="resCount"></span>`;
    const bind = (id, key) => document.getElementById(id).addEventListener("input", (e) => { filters[key] = e.target.value; renderList(); });
    bind("resQ", "q"); bind("resFLevel", "level"); bind("resFSkill", "skill"); bind("resFKind", "kind"); bind("resFBook", "book");
    page.addEventListener("click", (e) => {
      const f = e.target.closest("[data-res-file]"); if (f) { openFile(f.dataset.resFile); return; }
      const r = e.target.closest("[data-res-remove]"); if (r) { removeRes(r.dataset.resRemove); return; }
    });
  }

  // Where teachers land: a banner on the Lesson page and the Dashboard.
  function banners() {
    document.querySelectorAll("[data-res-banner]").forEach((b) => { b.hidden = false; });
  }

  window.llsShareResource = function (prefill) {
    if (typeof navigateTo === "function") navigateTo("resources");
    setTimeout(() => { if (ready()) openForm(prefill); }, 50);
  };

  // Register the page straight away (before the portal hides pages teachers can't use).
  try { if (typeof PAGE_TITLES === "object") PAGE_TITLES.resources = "Teacher resources"; } catch (_) {}
  try { if (typeof LLS_TEACHER_PAGES !== "undefined" && LLS_TEACHER_PAGES.indexOf("resources") === -1) LLS_TEACHER_PAGES.push("resources"); } catch (_) {}

  document.addEventListener("DOMContentLoaded", () => {
    buildPage();
    banners();
    document.addEventListener("click", (e) => {
      const s = e.target.closest("[data-res-share]");
      if (!s) return;
      e.preventDefault();
      let prefill = null;
      try {
        if (s.dataset.resShare === "lesson" && typeof llsLesson === "object" && llsLesson.classId) {
          const cls = llsLessonClasses().find((c) => c.id === llsLesson.classId);
          const code = typeof llsPlanCode_ === "function" ? llsPlanCode_(value("lessonUnitPage")) : "";
          prefill = { book: cls && cls.book, level: cls && cls.level, lesson: code };
        }
      } catch (_) {}
      window.llsShareResource(prefill);
    });
    document.querySelectorAll('.nav-item[data-page="resources"]').forEach((b) => b.addEventListener("click", () => load()));
    window.addEventListener("hashchange", () => { if (location.hash === "#resources") load(); });
    if (location.hash === "#resources") setTimeout(() => load(), 1500);
    document.getElementById("resNewButton")?.addEventListener("click", () => { if (ready()) openForm(); else renderList(); });
  });
  window.llsLoadResources = load;
})();
