"use strict";

/* =========================================================
   LONDON LANGUAGE SCHOOL PORTAL
   Browser-based production front end
========================================================= */

const STORAGE_KEY = "lls_portal_v1";

const LEVELS = [
  "Young Learners",
  "A1",
  "A2",
  "B1",
  "B2",
  "C1",
  "C2"
];

const ENQUIRY_STAGES = [
  "New",
  "Contacted",
  "Placement/Trial Booked",
  "Placement/Trial Completed",
  "Course Offered",
  "Enrolled",
  "Lost"
];

const PAGE_TITLES = {
  dashboard: "Dashboard",
  lesson: "Lesson",
  students: "Students",
  classes: "Classes",
  timetable: "Timetable",
  attendance: "Attendance",
  homework: "Homework",
  fees: "Fees & Payments",
  enquiries: "Enquiries",
  teachers: "Teachers",
  reports: "Reports",
  settings: "Settings"
};

const CHART_COLOURS = [
  "#0b3b78",
  "#ee3124",
  "#177b52",
  "#b76811",
  "#6d55a3",
  "#3b7da7",
  "#8d4050"
];

let state = loadState();
let confirmCallback = null;
let attendanceDraft = {};

/* =========================================================
   DEFAULT DATA
========================================================= */

function getDefaultState() {
  const today = isoDate(new Date());
  const followUpDate = isoDate(addDays(new Date(), 2));

  return {
    settings: {
      schoolName: "London Language School",
      phone: "",
      email: "",
      address: "Bagheria, Sicily, Italy"
    },

    teachers: [
      {
        id: makeId("teacher"),
        name: "Anna Romano",
        email: "",
        phone: "",
        role: "English Teacher",
        status: "Active",
        notes: ""
      },
      {
        id: makeId("teacher"),
        name: "James Taylor",
        email: "",
        phone: "",
        role: "English Teacher",
        status: "Active",
        notes: ""
      }
    ],

    classes: [],

    students: [],

    payments: [],

    enquiries: [
      {
        id: makeId("enquiry"),
        name: "Sample Enquiry",
        age: "",
        phone: "",
        email: "",
        course: "Cambridge English",
        source: "WhatsApp",
        status: "New",
        followup: followUpDate,
        created: today,
        notes: "Example enquiry — edit or delete this record."
      }
    ],

    attendance: {}
  };
}

/* =========================================================
   INITIALISATION
========================================================= */

document.addEventListener("DOMContentLoaded", initialisePortal);

function initialisePortal() {
  ensureStateStructure();
  bindNavigation();
  bindGlobalControls();
  bindForms();
  bindFilters();
  initialiseDates();
  populateSelects();
  renderAll();
  navigateTo(readPageFromHash() || "dashboard", false);
}

function ensureStateStructure() {
  const defaults = getDefaultState();

  state.settings = {
    ...defaults.settings,
    ...(state.settings || {})
  };

  state.teachers = Array.isArray(state.teachers)
    ? state.teachers
    : [];

  state.classes = Array.isArray(state.classes)
    ? state.classes
    : [];

  state.students = Array.isArray(state.students)
    ? state.students
    : [];

  state.payments = Array.isArray(state.payments)
    ? state.payments
    : [];

  state.enquiries = Array.isArray(state.enquiries)
    ? state.enquiries
    : [];

  state.attendance =
    state.attendance && typeof state.attendance === "object"
      ? state.attendance
      : {};

  saveState();
}

function initialiseDates() {
  const today = new Date();

  setValue("attendanceDate", isoDate(today));
  setValue("studentJoined", isoDate(today));
  setValue("paymentDate", isoDate(today));
  setValue("enquiryCreated", isoDate(today));

  const formatted = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(today);

  text("todayLabel", formatted);
}

/* =========================================================
   STORAGE
========================================================= */

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      const defaults = getDefaultState();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
      return defaults;
    }

    return JSON.parse(saved);
  } catch (error) {
    console.error("Unable to load portal data:", error);
    return getDefaultState();
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Unable to save portal data:", error);
    showToast("Could not save data in this browser.", "error");
  }
}

/* =========================================================
   NAVIGATION
========================================================= */

function bindNavigation() {
  document.querySelectorAll("[data-page]").forEach((button) => {
    button.addEventListener("click", () => {
      navigateTo(button.dataset.page);
    });
  });

  document.querySelectorAll("[data-page-target]").forEach((button) => {
    button.addEventListener("click", () => {
      navigateTo(button.dataset.pageTarget);
      closeUserDropdown();
    });
  });

  window.addEventListener("hashchange", () => {
    const page = readPageFromHash();

    if (page && PAGE_TITLES[page]) {
      navigateTo(page, false);
    }
  });
}

function navigateTo(page, updateHash = true) {
  if (!PAGE_TITLES[page]) {
    page = "dashboard";
  }
  // V22: teachers only see the teaching pages.
  if (typeof llsIsTeacher === "function" && llsIsTeacher() && LLS_TEACHER_PAGES.indexOf(page) === -1) {
    page = "dashboard";
  }

  document.querySelectorAll(".page").forEach((section) => {
    section.classList.toggle(
      "active",
      section.id === `page-${page}`
    );
  });

  document.querySelectorAll(".nav-item[data-page]").forEach((button) => {
    button.classList.toggle(
      "active",
      button.dataset.page === page
    );
  });

  text("pageTitle", PAGE_TITLES[page]);

  if (updateHash) {
    history.replaceState(null, "", `#${page}`);
  }

  document.body.classList.remove("sidebar-open");
  closeGlobalSearch();
  closeUserDropdown();

  if (page === "attendance") {
    // V2.5: attendance is now live (Google Sheets), not local storage.
    // Calling the old renderAttendance() here used to swap in the old
    // 3-button UI, which has no data-live-attendance-row markup, so
    // clicking Save afterwards falsely reported "no students in this class".
    if (typeof populateLiveAttendanceClasses === "function") populateLiveAttendanceClasses();
    if (typeof renderLiveAttendance === "function") renderLiveAttendance();
  }

  if (page === "homework") {
    try { llsTestFromLesson = false; } catch (_) {}
    if (typeof renderHomeworkLoginState === "function") renderHomeworkLoginState();
  }

  if (page === "lesson" && typeof llsInitLessonPage === "function") llsInitLessonPage();

  if (page === "reports") {
    renderReports();
  }

  if (page === "timetable" && typeof llsRenderTimetable === "function") llsRenderTimetable();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function readPageFromHash() {
  return location.hash.replace("#", "").trim();
}

/* =========================================================
   GLOBAL CONTROLS
========================================================= */

function bindGlobalControls() {
  const mobileMenuButton = byId("mobileMenuButton");
  const sidebarOverlay = byId("sidebarOverlay");
  const userMenuButton = byId("userMenuButton");
  const notificationButton = byId("notificationButton");
  const closeNotificationButton = byId("closeNotificationPanel");

  mobileMenuButton.addEventListener("click", () => {
    document.body.classList.add("sidebar-open");
  });

  sidebarOverlay.addEventListener("click", () => {
    document.body.classList.remove("sidebar-open");
  });

  userMenuButton.addEventListener("click", (event) => {
    event.stopPropagation();
    byId("userDropdown").classList.toggle("visible");
  });

  notificationButton.addEventListener("click", () => {
    byId("notificationPanel").classList.add("open");
  });

  closeNotificationButton.addEventListener("click", () => {
    byId("notificationPanel").classList.remove("open");
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".user-menu-wrap")) {
      closeUserDropdown();
    }

    if (
      !event.target.closest(".global-search") &&
      !event.target.closest(".global-search-results")
    ) {
      closeGlobalSearch();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeAllModals();
      closeGlobalSearch();
      closeUserDropdown();
      byId("notificationPanel").classList.remove("open");
      document.body.classList.remove("sidebar-open");
    }
  });

  document.querySelectorAll("[data-close-modal]").forEach((button) => {
    button.addEventListener("click", () => {
      closeModal(button.dataset.closeModal);
    });
  });

  document.querySelectorAll(".modal-backdrop").forEach((backdrop) => {
    backdrop.addEventListener("mousedown", (event) => {
      if (event.target === backdrop) {
        closeModal(backdrop.id);
      }
    });
  });

  byId("quickStudentButton").addEventListener("click", openNewStudent);
  byId("quickEnquiryButton").addEventListener("click", openNewEnquiry);
  byId("addStudentButton").addEventListener("click", openNewStudent);
  byId("addClassButton").addEventListener("click", openNewClass);
  byId("addPaymentButton").addEventListener("click", openNewPayment);
  byId("addEnquiryButton").addEventListener("click", openNewEnquiry);
  byId("addTeacherButton").addEventListener("click", openNewTeacher);

  byId("exportStudentsButton").addEventListener(
    "click",
    exportStudentsCsv
  );

  byId("exportPaymentsButton").addEventListener(
    "click",
    exportPaymentsCsv
  );

  byId("exportEnquiriesButton").addEventListener(
    "click",
    exportEnquiriesCsv
  );

  byId("exportAttendanceButton").addEventListener(
    "click",
    exportAttendanceCsv
  );

  byId("exportFullReportButton").addEventListener(
    "click",
    exportFullReport
  );

  byId("backupDataButton").addEventListener(
    "click",
    exportBackup
  );

  byId("settingsExportBackup").addEventListener(
    "click",
    exportBackup
  );

  byId("backupImportInput").addEventListener(
    "change",
    importBackup
  );

  byId("resetPortalButton").addEventListener("click", () => {
    openConfirm(
      "Reset portal data?",
      "This will remove the current portal records stored in this browser and restore the original starter data.",
      () => {
        state = getDefaultState();
        saveState();
        populateSelects();
        renderAll();
        showToast("Portal data reset.", "success");
      },
      "Reset"
    );
  });

  byId("globalSearchInput").addEventListener(
    "input",
    renderGlobalSearch
  );
}

/* =========================================================
   FILTERS
========================================================= */

function bindFilters() {
  [
    "studentSearch",
    "studentStatusFilter",
    "studentLevelFilter"
  ].forEach((id) => {
    byId(id).addEventListener("input", renderStudents);
    byId(id).addEventListener("change", renderStudents);
  });

  [
    "classSearch",
    "classDayFilter"
  ].forEach((id) => {
    byId(id).addEventListener("input", renderClasses);
    byId(id).addEventListener("change", renderClasses);
  });

  [
    "paymentSearch",
    "paymentStatusFilter"
  ].forEach((id) => {
    byId(id).addEventListener("input", renderPayments);
    byId(id).addEventListener("change", renderPayments);
  });

  [
    "enquirySearch",
    "enquiryStatusFilter"
  ].forEach((id) => {
    byId(id).addEventListener("input", renderEnquiries);
    byId(id).addEventListener("change", renderEnquiries);
  });

  // Attendance class/date/save controls are bound by the live V2.5
  // Google-Sheets attendance block further down this file, not here.
}

/* =========================================================
   FORMS
========================================================= */

function bindForms() {
  byId("studentForm").addEventListener(
    "submit",
    saveStudentForm
  );

  byId("classForm").addEventListener(
    "submit",
    saveClassForm
  );

  byId("paymentForm").addEventListener(
    "submit",
    savePaymentForm
  );

  byId("enquiryForm").addEventListener(
    "submit",
    saveEnquiryForm
  );

  byId("teacherForm").addEventListener(
    "submit",
    saveTeacherForm
  );

  byId("settingsForm").addEventListener(
    "submit",
    saveSettingsForm
  );

  byId("confirmActionButton").addEventListener(
    "click",
    executeConfirmAction
  );
}

/* =========================================================
   MASTER RENDER
========================================================= */

function renderAll() {
  populateSelects();
  renderDashboard();
  renderStudents();
  renderClasses();
  if (typeof llsRenderTimetable === "function") llsRenderTimetable();
  // Attendance is rendered by the live Google-Sheets system (see V2.5 block
  // near the bottom of this file), not here. Calling the old local
  // renderAttendance() on every render cycle used to intermittently
  // overwrite the live attendance table with the disconnected local one.
  renderPayments();
  renderEnquiries();
  renderTeachers();
  renderReports();
  renderSettings();
  renderNotifications();
}

/* =========================================================
   DASHBOARD
========================================================= */

function renderDashboard() {
  const activeStudents = state.students.filter(
    (student) => student.status === "Active"
  );

  const totalCollected = sum(
    state.payments.map((payment) => number(payment.paid))
  );

  const currentMonthCollected = sum(
    state.payments
      .filter((payment) => isCurrentMonth(payment.date))
      .map((payment) => number(payment.paid))
  );

  const totalFees = sum(
    state.payments.map((payment) => number(payment.fee))
  );

  const outstanding = Math.max(
    0,
    totalFees - totalCollected
  );

  const openEnquiries = state.enquiries.filter(
    (enquiry) =>
      !["Enrolled", "Lost"].includes(enquiry.status)
  );

  text("statStudents", activeStudents.length);
  text(
    "statStudentsSub",
    `${state.students.length} total student record${state.students.length === 1 ? "" : "s"}`
  );

  text("statClasses", state.classes.length);
  text(
    "statClassesSub",
    `${state.teachers.filter((teacher) => teacher.status === "Active").length} active teacher${state.teachers.filter((teacher) => teacher.status === "Active").length === 1 ? "" : "s"}`
  );

  text(
    "statCollected",
    formatMoney(currentMonthCollected)
  );

  text(
    "statCollectedSub",
    "Payments dated this month"
  );

  text("statEnquiries", openEnquiries.length);
  text(
    "statEnquiriesSub",
    openEnquiries.length
      ? "Active sales opportunities"
      : "Nothing waiting"
  );

  renderTodayClasses();
  renderStudentBreakdown();
  renderRecentEnquiries();
  if (typeof llsRenderNoFeePanel === "function") llsRenderNoFeePanel();
  if (typeof llsRenderOverduePanel === "function") llsRenderOverduePanel();
  if (typeof llsRenderCancelPanel === "function") llsRenderCancelPanel();
  if (typeof llsScheduleWeekPanels_ === "function") llsScheduleWeekPanels_();

  text(
    "dashboardPaidAmount",
    formatMoney(totalCollected)
  );

  text(
    "dashboardDueAmount",
    formatMoney(outstanding)
  );

  const collectionRate =
    totalFees > 0
      ? Math.min(100, (totalCollected / totalFees) * 100)
      : 0;

  byId("paymentProgressBar").style.width =
    `${collectionRate}%`;

  text(
    "paymentProgressText",
    totalFees
      ? `${Math.round(collectionRate)}% of recorded fees have been collected.`
      : "No payment data yet."
  );
}

function renderTodayClasses() {
  const container = byId("todayClassesList");
  const todayName = new Intl.DateTimeFormat(
    "en-GB",
    { weekday: "long" }
  ).format(new Date());

  // V15.4: a class can meet on a second weekday (Day 2 / Time 2).
  const classes = state.classes
    .filter((item) => String(item.status || "").trim().toLowerCase() === "active")
    .filter((item) => item.day === todayName || item.day2 === todayName)
    .map((item) => item.day === todayName ? item : { ...item, time: item.time2 || item.time })
    .sort((a, b) => a.time.localeCompare(b.time));

  if (!classes.length) {
    container.innerHTML = emptyState(
      `No classes scheduled for ${todayName}.`
    );
    return;
  }

  container.innerHTML = classes
    .map((item) => {
      const enrolled = getClassStudents(item.id).length;
      const teacher = getTeacher(item.teacherId) || (item.teacherName ? { name: item.teacherName } : null);

      return `
        <div class="schedule-item">
          <div class="schedule-time">${escapeHtml(formatTime(item.time))}</div>

          <div class="schedule-info">
            <strong>${escapeHtml(item.name)}${typeof llsIsCancelled === "function" && llsIsCancelled(item.id, isoDate(new Date())) ? ' <span class="cancel-tag">🚫 Cancelled</span>' : ""}</strong>
            <span>
              ${escapeHtml(item.level)}
              · ${escapeHtml(teacher?.name || "Teacher not assigned")}
              ${item.room ? ` · ${escapeHtml(item.room)}` : ""}
            </span>
          </div>

          <div class="schedule-count">
            ${enrolled} student${enrolled === 1 ? "" : "s"}
          </div>
        </div>
      `;
    })
    .join("");
}

function renderStudentBreakdown() {
  const activeStudents = state.students.filter(
    (student) => student.status === "Active"
  );

  const counts = LEVELS
    .map((level) => ({
      level,
      count: activeStudents.filter(
        (student) => student.level === level
      ).length
    }))
    .filter((item) => item.count > 0);

  text("donutTotal", activeStudents.length);

  const donut = byId("studentDonut");
  const legend = byId("studentBreakdownLegend");

  if (!activeStudents.length) {
    donut.style.background = "var(--ink-100)";
    legend.innerHTML = `
      <p class="muted">Add active students to see the level breakdown.</p>
    `;
    return;
  }

  let angle = 0;
  const segments = [];

  counts.forEach((item, index) => {
    const degrees =
      (item.count / activeStudents.length) * 360;

    const start = angle;
    const end = angle + degrees;
    const colour =
      CHART_COLOURS[index % CHART_COLOURS.length];

    segments.push(
      `${colour} ${start}deg ${end}deg`
    );

    angle = end;
  });

  donut.style.background =
    `conic-gradient(${segments.join(",")})`;

  legend.innerHTML = counts
    .map((item, index) => `
      <div class="legend-row">
        <span
          class="legend-dot"
          style="background:${CHART_COLOURS[index % CHART_COLOURS.length]}"
        ></span>
        <span>${escapeHtml(item.level)}</span>
        <strong>${item.count}</strong>
      </div>
    `)
    .join("");
}

function renderRecentEnquiries() {
  const container = byId("recentEnquiriesList");

  const enquiries = [...state.enquiries]
    .filter(
      (enquiry) =>
        !["Enrolled", "Lost"].includes(enquiry.status)
    )
    .sort((a, b) =>
      String(b.created).localeCompare(String(a.created))
    )
    .slice(0, 5);

  if (!enquiries.length) {
    container.innerHTML = emptyState(
      "No active enquiries."
    );
    return;
  }

  container.innerHTML = enquiries
    .map((enquiry) => `
      <div class="compact-item">
        <div class="compact-avatar">
          ${escapeHtml(getInitials(enquiry.name))}
        </div>

        <div class="compact-copy">
          <strong>${escapeHtml(enquiry.name)}</strong>
          <span>${escapeHtml(enquiry.course || "Course not specified")}</span>
        </div>

        ${statusBadge(enquiry.status)}
      </div>
    `)
    .join("");
}

/* =========================================================
   STUDENTS
========================================================= */

function renderStudents() {
  const body = byId("studentsTableBody");

  const query =
    byId("studentSearch").value
      .trim()
      .toLowerCase();

  const status =
    byId("studentStatusFilter").value;

  const level =
    byId("studentLevelFilter").value;

  const students = [...state.students]
    .filter((student) => {
      const haystack = [
        student.firstName,
        student.lastName,
        student.email,
        student.phone,
        student.level,
        getClass(student.classId)?.name
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query || haystack.includes(query);

      const matchesStatus =
        status === "all" ||
        student.status === status;

      const matchesLevel =
        level === "all" ||
        student.level === level;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesLevel
      );
    })
    .sort((a, b) =>
      `${a.lastName} ${a.firstName}`.localeCompare(
        `${b.lastName} ${b.firstName}`
      )
    );

  text(
    "studentsTableCount",
    `${students.length} student${students.length === 1 ? "" : "s"}`
  );

  if (!students.length) {
    body.innerHTML = tableEmptyRow(
      7,
      query || status !== "all" || level !== "all"
        ? "No students match these filters."
        : "No students yet. Add your first student."
    );
    return;
  }

  body.innerHTML = students
    .map((student) => {
      const classRecord = getClass(student.classId);

      return `
        <tr>
          <td>
            <div class="student-cell">
              <div class="student-avatar">
                ${escapeHtml(
                  getInitials(
                    `${student.firstName} ${student.lastName}`
                  )
                )}
              </div>

              <div>
                <strong>
                  ${escapeHtml(student.firstName)}
                  ${escapeHtml(student.lastName)}
                </strong>
                <span>
                  ${student.dob
                    ? `DOB ${escapeHtml(formatDate(student.dob))}`
                    : "Date of birth not set"}
                </span>
              </div>
            </div>
          </td>

          <td>
            ${classRecord
              ? escapeHtml(classRecord.name)
              : '<span class="muted">Not assigned</span>'}
          </td>

          <td>
            <strong>${escapeHtml(student.level || "—")}</strong>
          </td>

          <td>
            <div class="contact-cell">
              <span>${escapeHtml(student.phone || "—")}</span>
              <span>${escapeHtml(student.email || "—")}</span>
            </div>
          </td>

          <td>${statusBadge(student.status)}</td>

          <td>
            ${student.joined
              ? escapeHtml(formatDate(student.joined))
              : "—"}
          </td>

          <td class="table-actions-cell">
            <div class="row-actions">
              <button
                class="row-action"
                type="button"
                data-edit-student="${student.id}"
              >
                Edit
              </button>

              <button
                class="row-action"
                type="button"
                data-homework-link="${student.id}"
              >
                📱 App link
              </button>

              <button
                class="row-action delete"
                type="button"
                data-delete-student="${student.id}"
              >
                Deactivate
              </button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  body
    .querySelectorAll("[data-edit-student]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        openEditStudent(button.dataset.editStudent);
      });
    });

  body
    .querySelectorAll("[data-homework-link]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        openHomeworkLink(button.dataset.homeworkLink);
      });
    });

  body
    .querySelectorAll("[data-delete-student]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        deleteStudent(button.dataset.deleteStudent);
      });
    });
}

function openNewStudent() {
  const progress = byId("studentHomeworkProgress");
  if (progress) progress.hidden = true;
  const coachBox = byId("studentCoachBox");
  if (coachBox) coachBox.hidden = true;
  pendingConversionEnquiryId = "";
  const conversionFields = byId("conversionEnrolmentFields");
  if (conversionFields) conversionFields.hidden = true;
  byId("studentForm").reset();
  setValue("studentId", "");
  setValue("studentJoined", isoDate(new Date()));
  setValue("studentStatus", "Active");

  populateStudentClassSelect();

  text("studentModalTitle", "Add student");
  openModal("studentModal");
}

function openEditStudent(id) {
  pendingConversionEnquiryId = "";
  const conversionFields = byId("conversionEnrolmentFields");
  if (conversionFields) conversionFields.hidden = true;
  const student = state.students.find(
    (item) => item.id === id
  );

  if (!student) {
    return;
  }

  populateStudentClassSelect();

  setValue("studentId", student.id);
  setValue("studentFirstName", student.firstName);
  setValue("studentLastName", student.lastName);
  setValue("studentEmail", student.email);
  setValue("studentPhone", student.phone);
  setValue("studentDob", student.dob);
  setValue("studentLevel", student.level);
  setValue("studentClass", student.classId);
  setValue("studentStatus", student.status);
  setValue("studentJoined", student.joined);
  setValue("studentParent", student.parent);
  setValue("studentNotes", student.notes);

  text("studentModalTitle", "Edit student");
  openModal("studentModal");
  loadStudentHomeworkProgress(id);
  llsShowCoachBox(student);
}

/*
 * V12.8 — stable student save.
 *
 * IMPORTANT: no GET is allowed in the critical save path.
 * Apps Script writes have been reaching Sheets; the repeated failure came
 * from immediately following a write with getPortalData while Google's
 * ContentService redirect was still unstable.
 *
 * This verifier runs later, silently, and never turns a successful write
 * into a visible save error.
 */
async function llsRefreshCoreAfterSaveInBackground() {
  const delays = [4000, 8000, 12000];

  for (const delay of delays) {
    await new Promise((resolve) => setTimeout(resolve, delay));
    // 30 Sept: don't reload while changes are still on their way to Google,
    // or the old values would briefly come back.
    for (let i = 0; i < 60 && typeof llsSaveQLoad === "function" && llsSaveQLoad().some((j) => !j.error); i++) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    try {
      const payload = await llsApiGet("getPortalData");
      llsApplyCorePortalData(payload);
      return true;
    } catch (error) {
      console.warn("LLS V12.8: silent background verification deferred.", error);
    }
  }

  console.warn("LLS V12.8: automatic verification deferred until the next normal refresh.");
  return false;
}

async function saveStudentForm(event) {
  event.preventDefault();

  const id = value("studentId").trim();
  const firstName = value("studentFirstName").trim();
  const lastName = value("studentLastName").trim();
  const isConversion = !id && Boolean(pendingConversionEnquiryId);
  const convEnquiryId = pendingConversionEnquiryId; // 28 Sept: kept for the background save
  const classId = value("studentClass").trim();

  if (!firstName || !lastName) {
    showToast("First name and surname are required.", "error");
    return;
  }

  if (isConversion && !classId) {
    showToast("Choose a class before completing enrolment.", "error");
    return;
  }

  const schoolYear = String(
    byId("conversionSchoolYear")?.value || "2026-27"
  ).trim();

  const courseFee = Number(
    byId("conversionCourseFee")?.value || 0
  );

  const discount = Number(
    byId("conversionDiscount")?.value || 0
  );

  const paymentPlan = String(
    byId("conversionPaymentPlan")?.value || "3 instalments"
  );

  if (isConversion && courseFee <= 0) {
    showToast("Enter the agreed course fee.", "error");
    return;
  }

  if (isConversion && (discount < 0 || discount > courseFee)) {
    showToast("Check the discount amount.", "error");
    return;
  }

  const button = byId("studentForm")?.querySelector('button[type="submit"]');
  const oldLabel = button?.textContent || (id ? "Save changes" : "Save student");

  if (button) {
    button.disabled = true;
    button.textContent = isConversion ? "Completing enrolment…" : "Saving…";
  }

  const fields = {
    "First Name": firstName,
    "Surname": lastName,
    "Email": value("studentEmail").trim(),
    "Phone": value("studentPhone").trim(),
    "Date of Birth": value("studentDob"),
    "Level": value("studentLevel"),
    "Class": "",
    "Status": value("studentStatus") || "Active",
    "Joined": value("studentJoined") || isoDate(new Date()),
    "Parent / Guardian": value("studentParent").trim(),
    "Notes": value("studentNotes").trim()
  };

  llsBgStart("studentModal");
  let bgOk = false;
  // 30 Sept: an edited student shows the new details at once.
  if (id) {
    const early = state.students.find((item) => String(item.id || "").trim() === id);
    if (early) {
      Object.assign(early, {
        firstName, lastName, email: fields["Email"], phone: fields["Phone"], dob: fields["Date of Birth"],
        level: fields["Level"], status: fields["Status"], joined: fields["Joined"],
        parent: fields["Parent / Guardian"], notes: fields["Notes"]
      });
      saveState();
      renderAll();
    }
  }
  try {
    const result = await llsApiPost(
      id
        ? { action: "updateStudent", studentId: id, fields }
        : { action: "createStudent", fields }
    );

    const studentId = String(result.studentId || id || "").trim();

    if (!studentId) {
      throw new Error("Student saved but no Student ID was returned.");
    }

    let enrolment = null;

    /*
      V2.5 FIX
      The Students sheet can display a Class value, but real class membership
      for Attendance comes from the Enrolments sheet. Therefore selecting a
      class for ANY student must also create/maintain the active Enrolment.
    */
    {
      /*
       * V12.8: use the last successfully loaded enrolment snapshot.
       * DO NOT call getPortalData immediately after updateStudent.
       * That immediate read-after-write was the recurring 404/refresh failure.
       */
      const allEnrolments = Array.isArray(llsLivePortalData?.enrolments)
        ? llsLivePortalData.enrolments
        : [];

      const activeForStudent = allEnrolments.filter((item) =>
        String(item["Student ID"] || "").trim() === studentId &&
        String(item["Status"] || "").trim().toLowerCase() === "active"
      );

      const selectedClass = state.classes.find(
        (item) => String(item.id || "").trim() === classId
      );

      const selectedSchoolYear = String(
        selectedClass?.schoolYear || schoolYear || "2026-27"
      ).trim();

      const sameClass = classId ? activeForStudent.find((item) =>
        String(item["Class ID"] || "").trim() === classId &&
        String(item["School Year"] || "").trim() === selectedSchoolYear
      ) : null;

      if (!classId) {
        for (const existing of activeForStudent) {
          const existingId = String(existing["Enrolment ID"] || "").trim();
          if (existingId) {
            await llsApiPost({ action: "endEnrolment", enrolmentId: existingId });
          }
        }
      } else if (sameClass) {
        enrolment = {
          success: true,
          enrolmentId: String(sameClass["Enrolment ID"] || "").trim()
        };
      } else {
        // If the student is moving class, end previous active enrolment(s).
        for (const existing of activeForStudent) {
          const existingId = String(existing["Enrolment ID"] || "").trim();
          if (existingId) {
            await llsApiPost({
              action: "endEnrolment",
              enrolmentId: existingId
            });
          }
        }

        enrolment = await llsApiPost({
          action: "createEnrolment",
          studentId,
          classId,
          schoolYear: selectedSchoolYear,
          startDate: fields["Joined"] || isoDate(new Date())
        });
      }
    }

    if (isConversion) {
      const enquiry = state.enquiries.find(
        (item) => item.id === convEnquiryId
      );

      if (!enquiry) {
        throw new Error("Original enquiry could not be found.");
      }

      if (!enrolment) {
        throw new Error("Class enrolment was not created.");
      }

      await llsApiPost({
        action: "createFee",
        fields: {
          "Student ID": studentId,
          "Enrolment ID": enrolment.enrolmentId || "",
          "School Year": schoolYear,
          "Course Fee": courseFee,
          "Discount": discount,
          "Amount Due": Math.max(0, courseFee - discount),
          "Payment Plan": paymentPlan,
          ...llsInstalmentFields(paymentPlan, Math.max(0, courseFee - discount)),
          "Status": "Open",
          "Notes": `Created from enquiry ${enquiry.id}.`
        }
      });

      await llsApiPost({
        action: "updateEnquiry",
        enquiryId: enquiry.id,
        fields: {
          "Name": enquiry.name,
          "Age": enquiry.age,
          "Phone": enquiry.phone,
          "Email": enquiry.email,
          "Course": enquiry.course,
          "Source": enquiry.source,
          "Stage": "Enrolled",
          "Follow-up": "",
          "Enquiry Date": enquiry.created,
          "Level Result": enquiry.finalLevel || enquiry.levelResult || "",
          "Trial Requested": enquiry.trialDate
            ? "Yes"
            : (enquiry.trialRequested || ""),
          "Notes": [
            enquiry.notes || "",
            enquiry.trialDate
              ? `Placement/Trial date: ${enquiry.trialDate}`
              : "",
            enquiry.assessment
              ? `Teacher assessment: ${enquiry.assessment}`
              : "",
            `Student created: ${studentId}`,
            enrolment.enrolmentId
              ? `Enrolment created: ${enrolment.enrolmentId}`
              : ""
          ].filter(Boolean).join("\n")
        }
      });
    }

    /*
     * V12.8: update the visible student immediately from the user's confirmed
     * selection. Google Sheets remains the source of truth; the silent
     * background verifier reconciles later.
     */
    const localStudent = state.students.find(
      (item) => String(item.id || "").trim() === studentId
    );

    if (localStudent) {
      localStudent.firstName = firstName;
      localStudent.lastName = lastName;
      localStudent.email = fields["Email"];
      localStudent.phone = fields["Phone"];
      localStudent.dob = fields["Date of Birth"];
      localStudent.level = fields["Level"];
      localStudent.classId = classId;
      localStudent.status = fields["Status"];
      localStudent.joined = fields["Joined"];
      localStudent.parent = fields["Parent / Guardian"];
      localStudent.notes = fields["Notes"];
      saveState();
    } else {
      // V19: show a brand-new student straight away (Sheets confirms later).
      state.students.push({
        id: studentId,
        firstName,
        lastName,
        email: fields["Email"],
        phone: fields["Phone"],
        dob: fields["Date of Birth"],
        level: fields["Level"],
        classId,
        status: fields["Status"],
        joined: fields["Joined"],
        parent: fields["Parent / Guardian"],
        notes: fields["Notes"],
        coachUntil: ""
      });
      saveState();
    }

    pendingConversionEnquiryId = "";
    closeModal("studentModal");
    renderAll();

    // V12.8: the save UI is complete now; verification is non-blocking.
    showToast(
      isConversion
        ? "Student enrolment saved. Google Sheets is updating in the background."
        : id
          ? "Student saved. Google Sheets is updating in the background."
          : `Student ${studentId} created. Google Sheets is updating in the background.`,
      "success"
    );

    bgOk = true;
    // V12.8 silent verification. This never holds the Save UI.
    void llsRefreshCoreAfterSaveInBackground();

    if (isConversion) {
      // Enquiry refresh is also non-blocking after a successful conversion.
      void (async () => {
        try {
          // V19: the new course fee shows on Fees & Payments straight away.
          if (typeof llsLoadFinanceFromSheets === "function") {
            await llsLoadFinanceFromSheets(true).catch((e) => console.warn("LLS: finance refresh deferred.", e));
          }
          await llsLoadEnquiriesFromSheets();
          renderAll();
        } catch (error) {
          console.warn("LLS V12.7: enquiry refresh deferred.", error);
        }
      })();
    }
  } catch (error) {
    console.error("LLS student/enrolment save failed:", error);
    showToast(
      error?.message || "Could not save student/class assignment.",
      "error"
    );
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = oldLabel;
    }
    llsBgEnd(bgOk, "studentModal");
  }
}

function deleteStudent(id) {
  const student = state.students.find(
    (item) => item.id === id
  );

  if (!student) {
    return;
  }

  // V15.5: "Delete" used to remove the student only from this browser;
  // the row stayed in Google Sheets and came back on refresh. Now it marks
  // the student Inactive and ends their class enrolments, saved to Sheets.
  // History (payments, attendance) is kept.
  openConfirm(
    "Mark student inactive?",
    `${student.firstName} ${student.lastName} will be marked Inactive and removed from their class. Their payment and attendance history is kept. You can set them back to Active later with Edit.`,
    async () => {
      try {
        // 30 Sept: shown at once, sent to Google in the background.
        const activeEnrolments = (llsLivePortalData.enrolments || []).filter((item) =>
          String(item["Student ID"] || "").trim() === id &&
          String(item["Status"] || "").trim().toLowerCase() === "active"
        );
        const bodies = [{ action: "updateStudent", studentId: id, fields: { "Status": "Inactive" } }];
        for (const enrolment of activeEnrolments) {
          const enrolmentId = String(enrolment["Enrolment ID"] || "").trim();
          if (enrolmentId) {
            bodies.push({ action: "endEnrolment", enrolmentId });
            enrolment["Status"] = "Completed";
          }
        }
        llsQueueSave(`${student.firstName} ${student.lastName}`, bodies);

        // Re-find: a background refresh may have replaced state.students.
        const current = state.students.find((item) => item.id === id);
        if (current) {
          current.status = "Inactive";
          current.classId = "";
        }
        saveState();
        renderAll();
        showToast("Student marked inactive.", "success");
        void llsRefreshCoreAfterSaveInBackground();
      } catch (error) {
        console.error(error);
        showToast(error.message || "Could not update the student.", "error");
      }
    },
    "Mark inactive"
  );
}

/* =========================================================
   CLASSES
========================================================= */

function renderClasses() {
  const container = byId("classGrid");

  const query =
    byId("classSearch").value
      .trim()
      .toLowerCase();

  const day = byId("classDayFilter").value;

  const classes = [...state.classes]
    .filter((item) => String(item.status || "").trim().toLowerCase() !== "archived")
    .filter((item) => {
      const teacher = getTeacher(item.teacherId) || (item.teacherName ? { name: item.teacherName } : null);

      const haystack = [
        item.name,
        item.level,
        item.day,
        item.room,
        teacher?.name
      ]
        .join(" ")
        .toLowerCase();

      return (
        (!query || haystack.includes(query)) &&
        (day === "all" || item.day === day || item.day2 === day)
      );
    })
    .sort((a, b) => {
      const dayDiff =
        dayIndex(a.day) - dayIndex(b.day);

      if (dayDiff !== 0) {
        return dayDiff;
      }

      return a.time.localeCompare(b.time);
    });

  if (!classes.length) {
    container.innerHTML = emptyState(
      query || day !== "all"
        ? "No classes match these filters."
        : "No classes yet. Create your first class."
    );
    return;
  }

  container.innerHTML = classes
    .map((item) => {
      const teacher = getTeacher(item.teacherId) || (item.teacherName ? { name: item.teacherName } : null);
      const students = getClassStudents(item.id);
      const capacity = Math.max(
        1,
        number(item.capacity) || 1
      );

      const capacityPercentage = Math.min(
        100,
        (students.length / capacity) * 100
      );

      return `
        <article class="class-card">
          <div class="class-card-top">
            <span class="class-level">
              ${escapeHtml(item.level)}
            </span>

            <div class="card-action-menu">
              <button
                class="row-action"
                type="button"
                data-edit-class="${item.id}"
              >
                Edit
              </button>

              <button
                class="row-action delete"
                type="button"
                data-delete-class="${item.id}"
              >
                ×
              </button>
            </div>
          </div>

          <h3>${escapeHtml(item.name)}</h3>

          <div class="class-teacher">
            ${escapeHtml(
              teacher?.name ||
              "Teacher not assigned"
            )}
          </div>

          <div class="class-details">
            <div class="class-detail">
              <span>Day</span>
              <strong>${escapeHtml(item.day2 ? `${item.day.slice(0, 3)} & ${item.day2.slice(0, 3)}` : item.day)}</strong>
            </div>

            <div class="class-detail">
              <span>Time</span>
              <strong>${escapeHtml(item.day2 && item.time2 && item.time2 !== item.time ? `${formatTime(item.time)} / ${formatTime(item.time2)}` : formatTime(item.time))}</strong>
            </div>

            <div class="class-detail">
              <span>Duration</span>
              <strong>${number(item.duration) || 0} min</strong>
            </div>

            <div class="class-detail">
              <span>Room</span>
              <strong>${escapeHtml(item.room || "—")}</strong>
            </div>
          </div>

          <div class="capacity-wrap">
            <div class="capacity-label">
              <span>Class capacity</span>
              <strong>
                ${students.length} / ${capacity}
              </strong>
            </div>

            <div class="capacity-bar">
              <div style="width:${capacityPercentage}%"></div>
            </div>
          </div>
          ${llsClassBookLine(item, students.length)}
        </article>
      `;
    })
    .join("");

  container
    .querySelectorAll("[data-edit-class]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        openEditClass(button.dataset.editClass);
      });
    });

  container
    .querySelectorAll("[data-delete-class]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        deleteClass(button.dataset.deleteClass);
      });
    });

  if (typeof llsTeacherClassControls === "function") llsTeacherClassControls();

  container
    .querySelectorAll("[data-class-applinks]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        llsOpenClassAppLinks(button.dataset.classApplinks);
      });
    });

  container
    .querySelectorAll("[data-class-results]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        llsOpenClassResults(button.dataset.classResults);
      });
    });
}

function openNewClass() {
  byId("classForm").reset();
  setValue("classId", "");
  setValue("classSchoolYear", "2026-27");
  setValue("classCapacity", "10");
  setValue("classDuration", "60");
  setValue("classDay2", "");
  setValue("classTime2", "");
  llsFillBookSelect();
  setValue("classBook", "");
  setValue("classUnits", "");
  setValue("classCurrentUnit", "");
  setValue("classNotes", "");
  setValue("classStatus", "Active");
  text("classModalTitle", "Create class");
  openModal("classModal");
}

function openEditClass(id) {
  const item = state.classes.find((entry) => entry.id === id);
  if (!item) return;

  setValue("classId", item.id);
  setValue("className", item.name);
  setValue("classSchoolYear", item.schoolYear || "2026-27");
  setValue("classLevel", item.level);
  setValue("classTeacher", item.teacherName || item.teacherId || "");
  setValue("classDay", item.day);
  setValue("classTime", item.time);
  setValue("classDay2", item.day2 || "");
  setValue("classTime2", item.time2 || "");
  setValue("classDuration", item.duration || 60);
  setValue("classRoom", item.room);
  setValue("classCapacity", item.capacity || 10);
  setValue("classRegisterSheet", item.registerSheet || "");
  setValue("classStatus", item.status || "Active");
  llsFillBookSelect();
  setValue("classBook", item.book || "");
  setValue("classUnits", item.units || "");
  setValue("classCurrentUnit", item.currentUnit || "");
  setValue("classNotes", item.notes || "");

  text("classModalTitle", "Edit class");
  openModal("classModal");
}

async function saveClassForm(event) {
  event.preventDefault();

  const id = value("classId").trim();
  const className = value("className").trim();
  const schoolYear = value("classSchoolYear").trim() || "2026-27";
  const capacity = Number(value("classCapacity") || 10);

  if (!className) {
    showToast("Class name is required.", "error");
    return;
  }

  if (capacity < 1) {
    showToast("Class capacity must be at least 1.", "error");
    return;
  }

  const submitButton = byId("classForm")?.querySelector('button[type="submit"]');
  const oldLabel = submitButton?.textContent || "Save class";

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Saving…";
  }

  const fields = {
    "Class Name": className,
    "School Year": schoolYear,
    "Level": value("classLevel"),
    "Teacher": value("classTeacher").trim(),
    "Day": value("classDay"),
    "Time": value("classTime"),
    "Room": value("classRoom").trim(),
    "Capacity": capacity,
    "Register Sheet": value("classRegisterSheet").trim(),
    "Status": value("classStatus") || "Active"
  };

  // V16.1: second weekly lesson and length (Apps Script V16 saves these).
  const extraFields = {
    "Day 2": value("classDay2"),
    "Time 2": value("classDay2") ? value("classTime2") : "",
    "Duration": value("classDuration") || "",
    // V18: course book / units / current unit drive the student Practice section.
    "Book": value("classBook"),
    "Units": value("classUnits").trim(),
    "Current Unit": value("classCurrentUnit"),
    "Notes": value("classNotes").trim()
  };

  if (extraFields["Day 2"] && !extraFields["Time 2"]) {
    showToast("Add a start time for the second day.", "error");
    if (submitButton) { submitButton.disabled = false; submitButton.textContent = oldLabel; }
    return;
  }

  // 30 Sept: editing a class shows at once and goes to Google in the background.
  if (id) {
    const existing = state.classes.find((item) => String(item.id || "").trim() === id);
    if (existing) {
      Object.assign(existing, {
        name: className, schoolYear, level: fields["Level"], teacherName: fields["Teacher"],
        day: fields["Day"], time: fields["Time"], room: fields["Room"], capacity,
        registerSheet: fields["Register Sheet"], status: fields["Status"],
        day2: extraFields["Day 2"], time2: extraFields["Time 2"],
        duration: Number(extraFields["Duration"]) || existing.duration,
        book: extraFields["Book"], units: extraFields["Units"],
        currentUnit: extraFields["Current Unit"], notes: extraFields["Notes"]
      });
    }
    llsQueueSave(className, { action: "updateClass", classId: id, fields: { ...fields, ...extraFields } });
    saveState();
    closeModal("classModal");
    renderAll();
    showToast("Class saved.", "success");
    if (submitButton) { submitButton.disabled = false; submitButton.textContent = oldLabel; }
    return;
  }

  // A new class needs its Class ID from Google: the form closes now and
  // reopens, filled in, only if Google refuses it.
  llsBgStart("classModal");
  let bgOk = false;
  try {
    const result = await llsApiPost(
      id
        ? { action: "updateClass", classId: id, fields: { ...fields, ...extraFields } }
        : { action: "createClass", fields }
    );

    // createClass only knows the original columns: add the extras after.
    if (!id && result?.classId) {
      await llsApiPost({ action: "updateClass", classId: result.classId, fields: extraFields });
    }

    /*
     * V12.9 — Classes now use the same stable save strategy as Students.
     * Never hold the Save UI open while immediately re-reading Google Sheets.
     */
    const classId = String(result?.classId || id || "").trim();

    if (id) {
      const existing = state.classes.find(
        (item) => String(item.id || "").trim() === id
      );

      if (existing) {
        existing.name = className;
        existing.schoolYear = schoolYear;
        existing.level = fields["Level"];
        existing.teacherName = fields["Teacher"];
        existing.day = fields["Day"];
        existing.time = fields["Time"];
        existing.room = fields["Room"];
        existing.capacity = capacity;
        existing.registerSheet = fields["Register Sheet"];
        existing.status = fields["Status"];
        existing.day2 = extraFields["Day 2"];
        existing.time2 = extraFields["Time 2"];
        existing.duration = Number(extraFields["Duration"]) || existing.duration;
        existing.book = extraFields["Book"];
        existing.units = extraFields["Units"];
        existing.currentUnit = extraFields["Current Unit"];
        existing.notes = extraFields["Notes"];
      }
    } else if (classId) {
      state.classes.push({
        id: classId,
        name: className,
        schoolYear,
        level: fields["Level"],
        teacherId: "",
        teacherName: fields["Teacher"],
        day: fields["Day"],
        time: fields["Time"],
        day2: extraFields["Day 2"],
        time2: extraFields["Time 2"],
        duration: Number(extraFields["Duration"]) || 60,
        book: extraFields["Book"],
        units: extraFields["Units"],
        currentUnit: extraFields["Current Unit"],
        notes: extraFields["Notes"],
        room: fields["Room"],
        capacity,
        registerSheet: fields["Register Sheet"],
        status: fields["Status"]
      });
    }

    saveState();
    closeModal("classModal");
    renderAll();
    bgOk = true;

    showToast(
      id
        ? "Class saved. Google Sheets is updating in the background."
        : classId
          ? `Class ${classId} created. Google Sheets is updating in the background.`
          : "Class sent to Google Sheets. It will appear after verification.",
      "success"
    );

    void llsRefreshCoreAfterSaveInBackground();
  } catch (error) {
    console.error("LLS class save failed:", error);
    showToast(
      error?.message || "Could not save the class.",
      "error"
    );
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = oldLabel;
    }
    llsBgEnd(bgOk, "classModal");
  }
}

function deleteClass(id) {
  const item = getClass(id);

  if (!item) {
    return;
  }

  const studentCount =
    getClassStudents(id).length;

  // V15.5: archive in Google Sheets instead of hiding in this browser only.
  if (studentCount) {
    showToast(
      `${item.name} still has ${studentCount} active student${studentCount === 1 ? "" : "s"}. Move or deactivate them first.`,
      "error"
    );
    return;
  }

  openConfirm(
    "Archive class?",
    `${item.name} will be archived: hidden from Classes, Attendance and the dashboard. Its attendance history is kept.`,
    async () => {
      try {
        llsQueueSave(item.name, { action: "updateClass", classId: id, fields: { "Status": "Archived" } });

        const currentClass = state.classes.find((record) => record.id === id);
        if (currentClass) currentClass.status = "Archived";
        saveState();
        renderAll();
        showToast("Class archived.", "success");
        void llsRefreshCoreAfterSaveInBackground();
      } catch (error) {
        console.error(error);
        showToast(error.message || "Could not archive the class.", "error");
      }
    },
    "Archive"
  );
}

/* =========================================================
   ATTENDANCE
========================================================= */

function populateAttendanceClassSelect() {
  const select = byId("attendanceClassSelect");
  const current = select.value;

  if (!state.classes.length) {
    select.innerHTML =
      `<option value="">No classes available</option>`;
    return;
  }

  select.innerHTML = state.classes
    .map((item) => `
      <option value="${escapeAttribute(item.id)}">
        ${escapeHtml(item.name)} — ${escapeHtml(item.level)}
      </option>
    `)
    .join("");

  if (
    current &&
    state.classes.some((item) => item.id === current)
  ) {
    select.value = current;
  }
}

function renderAttendance() {
  populateAttendanceClassSelect();

  const classId =
    value("attendanceClassSelect");

  const date =
    value("attendanceDate");

  const body =
    byId("attendanceTableBody");

  if (!classId) {
    body.innerHTML = tableEmptyRow(
      4,
      "Create a class before recording attendance."
    );

    updateAttendanceSummary([]);
    return;
  }

  const students = getClassStudents(classId)
    .filter((student) => student.status === "Active")
    .sort((a, b) =>
      a.lastName.localeCompare(b.lastName)
    );

  const key = attendanceKey(classId, date);
  const savedAttendance =
    state.attendance[key] || {};

  attendanceDraft = {};

  students.forEach((student) => {
    attendanceDraft[student.id] =
      savedAttendance[student.id] || "Present";
  });

  if (!students.length) {
    body.innerHTML = tableEmptyRow(
      4,
      "No active students are assigned to this class."
    );

    updateAttendanceSummary([]);
    return;
  }

  body.innerHTML = students
    .map((student) => {
      const current =
        attendanceDraft[student.id];

      return `
        <tr>
          <td>
            <div class="student-cell">
              <div class="student-avatar">
                ${escapeHtml(
                  getInitials(
                    `${student.firstName} ${student.lastName}`
                  )
                )}
              </div>

              <div>
                <strong>
                  ${escapeHtml(student.firstName)}
                  ${escapeHtml(student.lastName)}
                </strong>
              </div>
            </div>
          </td>

          <td>
            <strong>${escapeHtml(student.level)}</strong>
          </td>

          <td>
            <div class="attendance-choice">
              ${attendanceButton(
                student.id,
                "Present",
                current
              )}
              ${attendanceButton(
                student.id,
                "Absent",
                current
              )}
              ${attendanceButton(
                student.id,
                "Late",
                current
              )}
            </div>
          </td>

          <td>
            <span
              id="attendance-status-${student.id}"
            >
              ${statusBadge(current)}
            </span>
          </td>
        </tr>
      `;
    })
    .join("");

  body
    .querySelectorAll("[data-attendance-student]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const studentId =
          button.dataset.attendanceStudent;

        const status =
          button.dataset.attendanceStatus;

        attendanceDraft[studentId] = status;

        renderAttendanceChoiceState(
          studentId,
          status
        );

        updateAttendanceSummary(students);
      });
    });

  updateAttendanceSummary(students);
}

function attendanceButton(studentId, status, current) {
  const selectedClass =
    current === status
      ? `selected-${slug(status)}`
      : "";

  return `
    <button
      class="${selectedClass}"
      type="button"
      data-attendance-student="${escapeAttribute(studentId)}"
      data-attendance-status="${escapeAttribute(status)}"
    >
      ${escapeHtml(status)}
    </button>
  `;
}

function renderAttendanceChoiceState(studentId, status) {
  document
    .querySelectorAll(
      `[data-attendance-student="${cssEscape(studentId)}"]`
    )
    .forEach((button) => {
      button.classList.remove(
        "selected-present",
        "selected-absent",
        "selected-late"
      );

      if (
        button.dataset.attendanceStatus === status
      ) {
        button.classList.add(
          `selected-${slug(status)}`
        );
      }
    });

  const badge = byId(
    `attendance-status-${studentId}`
  );

  if (badge) {
    badge.innerHTML = statusBadge(status);
  }
}

function updateAttendanceSummary(students) {
  const total = students.length;

  const statuses = students.map(
    (student) =>
      attendanceDraft[student.id] || "Present"
  );

  const present = statuses.filter(
    (status) =>
      status === "Present" ||
      status === "Late"
  ).length;

  const absent = statuses.filter(
    (status) => status === "Absent"
  ).length;

  const rate =
    total > 0
      ? Math.round((present / total) * 100)
      : 0;

  text("attendanceTotal", total);
  text("attendancePresent", present);
  text("attendanceAbsent", absent);
  text("attendanceRate", `${rate}%`);
}

function saveAttendance() {
  const classId =
    value("attendanceClassSelect");

  const date =
    value("attendanceDate");

  if (!classId || !date) {
    showToast(
      "Choose a class and lesson date.",
      "error"
    );
    return;
  }

  const key =
    attendanceKey(classId, date);

  state.attendance[key] = {
    ...attendanceDraft
  };

  saveState();
  renderNotifications();

  showToast(
    "Attendance saved.",
    "success"
  );
}

/* =========================================================
   PAYMENTS
========================================================= */

function renderPayments() {
  const body = byId("paymentsTableBody");

  const query =
    value("paymentSearch")
      .trim()
      .toLowerCase();

  const filterStatus =
    value("paymentStatusFilter");

  const payments = [...state.payments]
    .filter((payment) => {
      const student =
        getStudent(payment.studentId);

      const status =
        paymentStatus(payment);

      const haystack = [
        getStudentName(student),
        payment.description,
        payment.method,
        status
      ]
        .join(" ")
        .toLowerCase();

      return (
        (!query || haystack.includes(query)) &&
        (filterStatus === "all" ||
          status === filterStatus ||
          (filterStatus === "Overdue" && payment.overdue))
      );
    })
    .sort((a, b) =>
      String(b.date).localeCompare(String(a.date))
    );

  updateFinanceStats();
  llsRenderHourPacks();

  if (!payments.length) {
    body.innerHTML = tableEmptyRow(
      8,
      query || filterStatus !== "all"
        ? "No payments match these filters."
        : "No payment records yet."
    );
    return;
  }

  body.innerHTML = payments
    .map((payment) => {
      const student =
        getStudent(payment.studentId);

      const fee = number(payment.fee);
      const paid = number(payment.paid);
      const balance = Math.max(
        0,
        fee - paid
      );

      const status =
        paymentStatus(payment);

      return `
        <tr>
          <td>
            <strong>
              ${escapeHtml(
                getStudentName(student) ||
                "Student removed"
              )}
            </strong>
          </td>

          <td>${escapeHtml(payment.description || "—")}</td>

          <td>${formatMoney(fee)}</td>

          <td>
            <strong>${formatMoney(paid)}</strong>
          </td>

          <td>
            ${formatMoney(balance)}
          </td>

          <td>
            ${payment.date
              ? escapeHtml(formatDate(payment.date))
              : "—"}
          </td>

          <td>
            ${statusBadge(status)}
            ${llsNextDueLine(payment)}
          </td>

          <td class="table-actions-cell">
            <div class="row-actions">
              <button
                class="row-action"
                type="button"
                data-edit-payment="${payment.id}"
              >
                Add payment
              </button>
              <button
                class="row-action"
                type="button"
                data-edit-fee="${payment.id}"
              >
                Edit plan
              </button>
              ${llsReminderLink(payment, student)}

              <button
                class="row-action"
                type="button"
                data-delete-payment="${payment.id}"
              >
                Payments
              </button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  body
    .querySelectorAll("[data-edit-payment]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        openAddPayment(button.dataset.editPayment);
      });
    });

  body
    .querySelectorAll("[data-edit-fee]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        llsOpenFeeEditor(button.dataset.editFee);
      });
    });

  body
    .querySelectorAll("[data-delete-payment]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        deletePayment(button.dataset.deletePayment);
      });
    });
}

function updateFinanceStats() {
  const totalFees = sum(
    state.payments.map((payment) =>
      number(payment.fee)
    )
  );

  const collected = sum(
    state.payments.map((payment) =>
      number(payment.paid)
    )
  );

  const outstanding =
    Math.max(0, totalFees - collected);

  const rate =
    totalFees > 0
      ? Math.round(
          Math.min(
            100,
            (collected / totalFees) * 100
          )
        )
      : 0;

  text(
    "financeTotalFees",
    formatMoney(totalFees)
  );

  text(
    "financeCollected",
    formatMoney(collected)
  );

  text(
    "financeOutstanding",
    formatMoney(outstanding)
  );

  text(
    "financeRate",
    `${rate}%`
  );
}

function openNewPayment() {
  if (!state.students.length) {
    showToast(
      "Add a student before recording a payment.",
      "error"
    );

    navigateTo("students");
    return;
  }

  paymentModalMode = "create";

  byId("paymentForm").reset();

  setValue("paymentId", "");
  setValue("paymentDate", isoDate(new Date()));
  setValue("paymentMethod", "Cash");

  byId("paymentStudent").disabled = false;
  byId("paymentDescription").readOnly = false;
  byId("paymentFee").readOnly = false;

  populatePaymentStudentSelect();

  // V19: a new course fee gets a payment plan and due dates.
  const planBox = byId("paymentPlanBox");
  if (planBox) planBox.hidden = false;
  setValue("paymentPlan", "3 instalments");
  llsSuggestDueDates("payment");

  text(
    "paymentModalTitle",
    "Record payment"
  );

  llsPaymentFormReady();
  openModal("paymentModal");
}

function openAddPayment(feeId) {
  const fee = (llsLiveFinanceData.fees || []).find(
    (item) => String(item["Fee ID"] || "").trim() === feeId
  );

  if (!fee) {
    showToast("That fee record could not be found. Try refreshing.", "error");
    return;
  }

  const studentId = String(fee["Student ID"] || "").trim();
  const student = getStudent(studentId);

  paymentModalMode = "payment";

  byId("paymentForm").reset();

  populatePaymentStudentSelect();

  setValue("paymentId", feeId);
  setValue("paymentStudent", studentId);
  setValue("paymentDescription", llsFeeDescription(fee));
  setValue("paymentFee", number(fee["Amount Due"]));
  setValue("paymentPaid", "");
  setValue("paymentDate", isoDate(new Date()));
  setValue("paymentMethod", "Cash");
  setValue("paymentNotes", "");

  byId("paymentStudent").disabled = true;
  byId("paymentDescription").readOnly = true;
  byId("paymentFee").readOnly = true;
  const planBox = byId("paymentPlanBox");
  if (planBox) planBox.hidden = true;

  text(
    "paymentModalTitle",
    `Add payment — ${getStudentName(student) || "Student"}`
  );

  llsPaymentFormReady();
  openModal("paymentModal");
}

async function savePaymentForm(event) {
  event.preventDefault();

  const mode = paymentModalMode;
  const studentId = value("paymentStudent");
  const courseFee = number(value("paymentFee"));
  const paidNow = number(value("paymentPaid"));
  const description = value("paymentDescription").trim();
  const paymentDate = value("paymentDate");
  const method = value("paymentMethod");
  const notes = value("paymentNotes").trim();

  if (!studentId) {
    showToast("Select a student.", "error");
    return;
  }

  if (mode === "create" && courseFee <= 0) {
    showToast("Enter the total course fee.", "error");
    return;
  }

  if (mode === "payment" && paidNow <= 0) {
    showToast("Enter an amount greater than zero.", "error");
    return;
  }

  if (courseFee < 0 || paidNow < 0) {
    showToast("Payment amounts cannot be negative.", "error");
    return;
  }

  // 28 Sept: say which payment this is, and warn before saving a duplicate.
  const instalment = value("paymentInstalment");
  if (paidNow > 0 && !instalment) {
    showToast("Choose which payment this is (e.g. Instalment 1).", "error");
    return;
  }
  if (mode === "payment" && paidNow > 0 && !llsDuplicateCheckPassed(value("paymentId"), paidNow, paymentDate, instalment)) {
    return;
  }

  const button = byId("paymentForm")?.querySelector('button[type="submit"]');
  const oldLabel = button?.textContent || "Save payment";

  if (button) {
    button.disabled = true;
    button.textContent = "Saving…";
  }

  let feeId = value("paymentId");
  const plan = value("paymentPlan") || "Full payment";
  if (mode === "create" && plan === "Full payment" && !value("paymentDue1")) setValue("paymentDue1", paymentDate);
  const planFields = mode === "create" ? { "Payment Plan": plan, ...llsInstalmentFields(plan, courseFee, "payment") } : {};
  llsBgStart("paymentModal");
  let bgOk = false;
  try {

    if (mode === "create") {

      const feeResult = await llsApiPost({
        action: "createFee",
        fields: {
          "Student ID": studentId,
          "School Year": "2026-27",
          "Course Fee": courseFee,
          "Discount": 0,
          "Amount Due": courseFee,
          ...planFields,
          "Notes": description
        }
      });

      feeId = String(feeResult.feeId || "").trim();

      if (!feeId) {
        throw new Error("Fee was saved but no Fee ID was returned.");
      }

      // Optimistic update: we already know what we just wrote, so show it
      // immediately rather than waiting on a full re-download from Sheets.
      llsLiveFinanceData.fees.push({
        "Fee ID": feeId,
        "Student ID": studentId,
        "School Year": "2026-27",
        "Course Fee": courseFee,
        "Discount": 0,
        "Amount Due": courseFee,
        ...planFields,
        "Notes": description
      });

      if (paidNow > 0) {
        const payResult = await llsApiPost({
          action: "createPayment",
          fields: {
            "Fee ID": feeId,
            "Student ID": studentId,
            "Payment Date": paymentDate,
            "Amount": paidNow,
            "Payment Method": method,
            "Instalment": instalment,
            "Notes": notes
          }
        });

        llsLiveFinanceData.payments.push({
          "Payment ID": String(payResult?.paymentId || ""),
          "Fee ID": feeId,
          "Student ID": studentId,
          "Payment Date": paymentDate,
          "Amount": paidNow,
          "Payment Method": method,
          "Instalment": instalment,
          "Notes": notes
        });
      }
    } else {
      if (!feeId) {
        throw new Error("No fee was selected for this payment.");
      }

      const payResult = await llsApiPost({
        action: "createPayment",
        fields: {
          "Fee ID": feeId,
          "Student ID": studentId,
          "Payment Date": paymentDate,
          "Amount": paidNow,
          "Payment Method": method,
          "Instalment": instalment,
          "Notes": notes
        }
      });

      llsLiveFinanceData.payments.push({
        "Payment ID": String(payResult?.paymentId || ""),
        "Fee ID": feeId,
        "Student ID": studentId,
        "Payment Date": paymentDate,
        "Amount": paidNow,
        "Payment Method": method,
        "Instalment": instalment,
        "Status": "Active",
        "Notes": notes
      });
    }

    // Show the result straight away...
    llsRebuildPaymentsState();
    saveState();
    renderAll();
    bgOk = true;

    showToast(
      mode === "create" ? "Fee and payment recorded." : "Payment recorded.",
      "success"
    );

    // ...then quietly reconcile with Sheets in the background (picks up the
    // real row order/timestamps; does not block or re-open the modal).
    llsLoadFinanceFromSheets(true)
      .then(() => renderAll())
      .catch((error) => console.warn("LLS: background finance reconcile deferred.", error));
  } catch (error) {
    console.error(error);
    showToast(error.message || "The payment could not be saved.", "error");
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = oldLabel;
    }
    paymentModalMode = "create";
    if (!bgOk) paymentModalMode = mode; // a failed save reopens in the same mode
    llsBgEnd(bgOk, "paymentModal");
  }
}

// 28 Sept: the old "Delete" button now opens the list of this fee's
// payments, where a mistaken one can be voided (never deleted).
function deletePayment(id) {
  llsOpenFeePayments(id);
}

function paymentStatus(payment) {
  const fee = number(payment.fee);
  const paid = number(payment.paid);

  if (fee <= 0 || paid >= fee) {
    return "Paid";
  }

  if (paid > 0) {
    return "Part-paid";
  }

  return "Due";
}

/* =========================================================
   ENQUIRIES
========================================================= */

function renderEnquiries() {
  const body = byId("enquiriesTableBody");

  const query =
    value("enquirySearch")
      .trim()
      .toLowerCase();

  const statusFilter =
    value("enquiryStatusFilter");

  const enquiries = [...state.enquiries]
    .filter((enquiry) => {
      const haystack = [
        enquiry.name,
        enquiry.phone,
        enquiry.email,
        enquiry.course,
        enquiry.source,
        enquiry.status
      ]
        .join(" ")
        .toLowerCase();

      return (
        (!query || haystack.includes(query)) &&
        (statusFilter === "all" ||
          enquiry.status === statusFilter)
      );
    })
    .sort((a, b) =>
      String(b.created).localeCompare(String(a.created))
    );

  renderPipeline();

  if (!enquiries.length) {
    body.innerHTML = tableEmptyRow(
      8,
      query || statusFilter !== "all"
        ? "No enquiries match these filters."
        : "No enquiries yet."
    );
  } else {
    body.innerHTML = enquiries
      .map((enquiry) => `
        <tr>
          <td>
            <div class="student-cell">
              <div class="student-avatar">
                ${escapeHtml(getInitials(enquiry.name))}
              </div>

              <div>
                <strong>${escapeHtml(enquiry.name)}</strong>
                <span>
                  ${enquiry.age
                    ? `Age ${escapeHtml(enquiry.age)}`
                    : "Age not recorded"}
                </span>
              </div>
            </div>
          </td>

          <td>
            ${escapeHtml(enquiry.course || "—")}
          </td>

          <td>
            <div class="contact-cell">
              <span>${escapeHtml(enquiry.phone || "—")}</span>
              <span>${escapeHtml(enquiry.email || "—")}</span>
            </div>
          </td>

          <td>
            ${escapeHtml(enquiry.source || "—")}
          </td>

          <td>
            ${statusBadge(enquiry.status)}
          </td>

          <td>
            ${enquiry.followup
              ? followUpCell(enquiry.followup)
              : '<span class="muted">Not set</span>'}
          </td>

          <td>
            ${enquiry.created
              ? escapeHtml(formatDate(enquiry.created))
              : "—"}
          </td>

          <td class="table-actions-cell">
            <div class="row-actions">
              <button
                class="row-action"
                type="button"
                data-edit-enquiry="${enquiry.id}"
              >
                Edit
              </button>

              ${enquiry.status === "Enrolled" ? `
              <span class="row-action" style="cursor:default; opacity:.75;">
                ✓ Student created
              </span>` : ["Placement/Trial Completed", "Course Offered"].includes(enquiry.status) ? `
              <button
                class="row-action"
                type="button"
                data-convert-enquiry="${enquiry.id}"
              >
                Convert to Student
              </button>` : ""}

              <button
                class="row-action delete"
                type="button"
                data-delete-enquiry="${enquiry.id}"
              >
                Delete
              </button>
            </div>
          </td>
        </tr>
      `)
      .join("");

    body
      .querySelectorAll("[data-edit-enquiry]")
      .forEach((button) => {
        button.addEventListener("click", () => {
          openEditEnquiry(
            button.dataset.editEnquiry
          );
        });
      });

    body
      .querySelectorAll("[data-convert-enquiry]")
      .forEach((button) => {
        button.addEventListener("click", () => {
          convertEnquiryToStudent(button.dataset.convertEnquiry);
        });
      });

    body
      .querySelectorAll("[data-delete-enquiry]")
      .forEach((button) => {
        button.addEventListener("click", () => {
          deleteEnquiry(
            button.dataset.deleteEnquiry
          );
        });
      });
  }

  updateEnquiryBadge();
}

function renderPipeline() {
  const container = byId("enquiryPipeline");

  container.innerHTML = ENQUIRY_STAGES
    .map((stage) => {
      const count = state.enquiries.filter(
        (enquiry) => enquiry.status === stage
      ).length;

      return `
        <div class="pipeline-step">
          <span>${escapeHtml(stage)}</span>
          <strong>${count}</strong>
        </div>
      `;
    })
    .join("");
}

function updateEnquiryBadge() {
  const openCount = state.enquiries.filter(
    (enquiry) =>
      !["Enrolled", "Lost"].includes(enquiry.status)
  ).length;

  const badge = byId("enquiryNavBadge");

  text("enquiryNavBadge", openCount);

  badge.classList.toggle(
    "visible",
    openCount > 0
  );
}

function followUpCell(date) {
  const overdue =
    isPastDate(date);

  return `
    <span class="status-badge ${
      overdue
        ? "status-paused"
        : "status-completed"
    }">
      ${overdue ? "Overdue · " : ""}
      ${escapeHtml(formatDate(date))}
    </span>
  `;
}

function openNewEnquiry() {
  byId("enquiryForm").reset();

  setValue("enquiryId", "");
  setValue("enquiryStatus", "New");
  setValue(
    "enquiryCreated",
    isoDate(new Date())
  );
  setValue("enquiryTrialDate", "");
  setValue("enquiryFinalLevel", "");
  setValue("enquiryAssessment", "");

  text(
    "enquiryModalTitle",
    "New enquiry"
  );

  openModal("enquiryModal");
}

function openEditEnquiry(id) {
  const enquiry = state.enquiries.find(
    (item) => item.id === id
  );

  if (!enquiry) {
    return;
  }

  setValue("enquiryId", enquiry.id);
  setValue("enquiryName", enquiry.name);
  setValue("enquiryStudentAge", enquiry.age);
  setValue("enquiryPhone", enquiry.phone);
  setValue("enquiryEmail", enquiry.email);
  setValue("enquiryCourse", enquiry.course);
  setValue("enquirySource", enquiry.source);
  setValue("enquiryStatus", enquiry.status);
  setValue("enquiryFollowup", enquiry.followup);
  setValue("enquiryCreated", enquiry.created);
  setValue("enquiryTrialDate", enquiry.trialDate || "");
  setValue("enquiryFinalLevel", enquiry.finalLevel || enquiry.levelResult || "");
  setValue("enquiryAssessment", enquiry.assessment || "");
  setValue("enquiryNotes", enquiry.notes);

  text(
    "enquiryModalTitle",
    "Edit enquiry"
  );

  openModal("enquiryModal");
}

async function llsApiPost(body) {
  llsForgetReads_();
  /*
   * V12.5 — Apps Script write transport fix.
   * Send the mutation without trying to read the cross-origin redirected
   * ContentService response. The normal sheet refresh remains the source
   * of truth after a save.
   */
  const form = new URLSearchParams();
  form.set("action", String((body || {}).action || ""));
  form.set("payload", JSON.stringify(body || {}));
  form.set("_", String(Date.now()));

  try {
    await fetch(LLS_API_URL, {
      method: "POST",
      mode: "no-cors",
      body: form,
      cache: "no-store",
      redirect: "follow"
    }, { timeoutMs: LLS_SAVE_TIMEOUT_MS, save: true });
  } catch (_) {
    throw new Error("Could not send the change to Apps Script.");
  }

  await new Promise((resolve) => setTimeout(resolve, 250));
  return { success: true, transport: "opaque-no-cors" };
}

async function saveEnquiryForm(event) {
  event.preventDefault();

  const id = value("enquiryId").trim();

  const record = {
    id,
    name: value("enquiryName").trim(),
    age: value("enquiryStudentAge"),
    phone: value("enquiryPhone").trim(),
    email: value("enquiryEmail").trim(),
    course: value("enquiryCourse").trim(),
    source: value("enquirySource"),
    status: value("enquiryStatus"),
    followup: value("enquiryFollowup"),
    created: value("enquiryCreated") || isoDate(new Date()),
    trialDate: value("enquiryTrialDate"),
    finalLevel: value("enquiryFinalLevel"),
    assessment: value("enquiryAssessment").trim(),
    notes: value("enquiryNotes").trim()
  };

  if (!record.name || !record.course) {
    showToast("Name and course interest are required.", "error");
    return;
  }

  const submitButton = byId("enquiryForm")
    ?.querySelector('button[type="submit"]');
  const oldLabel = submitButton?.textContent;

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Saving…";
  }

  const fields = {
    "Name": record.name,
    "Age": record.age,
    "Phone": record.phone,
    "Email": record.email,
    "Course": record.course,
    "Source": record.source,
    "Stage": record.status,
    "Follow-up": record.followup,
    "Enquiry Date": record.created,
    "Level Result": record.finalLevel,
    "Trial Requested": record.trialDate ? "Yes" : "",
    "Notes": [
      record.notes,
      record.trialDate ? `Placement/Trial date: ${record.trialDate}` : "",
      record.assessment ? `Teacher assessment: ${record.assessment}` : ""
    ].filter(Boolean).join("\n")
  };

  // 28 Sept: close now, show the change at once, save in the background.
  llsBgStart("enquiryModal");
  let bgOk = false;
  if (id) {
    const local = state.enquiries.find((item) => item.id === id);
    if (local) { Object.assign(local, record); renderAll(); }
  }
  try {
    await llsApiPost(
      id
        ? { action: "updateEnquiry", enquiryId: id, fields }
        : { action: "createEnquiry", fields }
    );
    bgOk = true;

    showToast(
      id ? "Enquiry updated in Google Sheets." : "Enquiry added to Google Sheets.",
      "success"
    );
    llsLoadEnquiriesFromSheets().then(() => renderAll()).catch((e) => console.warn("LLS: enquiry refresh deferred.", e));
  } catch (error) {
    console.error("LLS enquiry save failed:", error);
    if (error.uncertain) {
      bgOk = true; // probably saved: don't reopen the form
      showToast(error.message, "error");
    } else {
      showToast(
        `Could not save the enquiry: ${error.message || "please try again"}.`,
        "error"
      );
    }
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = oldLabel || "Save enquiry";
    }
    llsBgEnd(bgOk, "enquiryModal");
  }
}

function deleteEnquiry(id) {
  const enquiry = state.enquiries.find((item) => item.id === id);

  if (!enquiry) return;

  openConfirm(
    "Delete enquiry?",
    `Delete the enquiry for ${enquiry.name}?`,
    async () => {
      // 30 Sept: gone from the list at once; Google catches up in the background.
      state.enquiries = state.enquiries.filter((item) => item.id !== id);
      saveState();
      renderAll();
      showToast("Enquiry deleted.", "success");
      llsQueueSave(`the enquiry for ${enquiry.name}`, { action: "deleteEnquiry", enquiryId: id });
    }
  );
}


let pendingConversionEnquiryId = "";

async function convertEnquiryToStudent(id) {
  const enquiry = state.enquiries.find((item) => item.id === id);
  if (!enquiry) return;

  pendingConversionEnquiryId = id;
  // New student: hide the boxes that belong to an existing student.
  const progressBox = byId("studentHomeworkProgress");
  if (progressBox) progressBox.hidden = true;
  const coachBox = byId("studentCoachBox");
  if (coachBox) coachBox.hidden = true;

  const parts = String(enquiry.name || "").trim().split(/\s+/);
  const firstName = parts.shift() || "";
  const lastName = parts.join(" ");

  try {
    await llsLoadClassesFromSheets();
  } catch (error) {
    console.error("Could not refresh classes before enrolment:", error);
  }
  populateStudentClassSelect();
  byId("studentForm").reset();
  setValue("studentId", "");
  setValue("studentFirstName", firstName);
  setValue("studentLastName", lastName);
  setValue("studentEmail", enquiry.email || "");
  setValue("studentPhone", enquiry.phone || "");
  setValue("studentLevel", enquiry.finalLevel || enquiry.levelResult || "");
  setValue("studentStatus", "Active");
  setValue("studentJoined", isoDate(new Date()));
  setValue(
    "studentNotes",
    [
      `Converted from enquiry ${enquiry.id}.`,
      enquiry.course ? `Course interest: ${enquiry.course}.` : "",
      enquiry.assessment ? `Teacher assessment: ${enquiry.assessment}` : "",
      enquiry.notes || ""
    ].filter(Boolean).join("\n")
  );

  text("studentModalTitle", "Convert enquiry to student");
  const conversionFields = byId("conversionEnrolmentFields");
  if (conversionFields) conversionFields.hidden = false;
  setValue("conversionSchoolYear", "2026-27");
  setValue("conversionCourseFee", "");
  setValue("conversionDiscount", "0");
  setValue("conversionPaymentPlan", "3 instalments");
  llsSuggestDueDates();

  openModal("studentModal");

  showToast(
    "Student form prepared from the enquiry. Check the details, choose a class if appropriate, then Save student.",
    "success"
  );
}

/* =========================================================
   TEACHERS
========================================================= */

function renderTeachers() {
  const container = byId("teacherGrid");

  if (!state.teachers.length) {
    container.innerHTML = emptyState(
      "No teachers yet. Add your first teacher."
    );
    return;
  }

  container.innerHTML = [...state.teachers]
    .sort((a, b) =>
      a.name.localeCompare(b.name)
    )
    .map((teacher) => {
      const classes = state.classes.filter(
        (item) =>
          item.teacherId === teacher.id
      );

      return `
        <article class="teacher-card">
          <div class="teacher-card-top">
            <div class="teacher-identity">
              <div class="teacher-avatar">
                ${escapeHtml(getInitials(teacher.name))}
              </div>

              <div>
                <strong>${escapeHtml(teacher.name)}</strong>
                <span>${escapeHtml(teacher.role || "Teacher")}</span>
              </div>
            </div>

            ${statusBadge(teacher.status)}
          </div>

          <div class="teacher-meta">
            <div class="teacher-meta-row">
              <span>Classes</span>
              <strong>${classes.length}</strong>
            </div>

            <div class="teacher-meta-row">
              <span>Email</span>
              <strong>${escapeHtml(teacher.email || "—")}</strong>
            </div>

            <div class="teacher-meta-row">
              <span>Telephone</span>
              <strong>${escapeHtml(teacher.phone || "—")}</strong>
            </div>
          </div>

          <div class="modal-actions">
            <button
              class="row-action"
              type="button"
              data-edit-teacher="${teacher.id}"
            >
              Edit
            </button>

            <button
              class="row-action delete"
              type="button"
              data-delete-teacher="${teacher.id}"
            >
              Delete
            </button>
          </div>
        </article>
      `;
    })
    .join("");

  container
    .querySelectorAll("[data-edit-teacher]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        openEditTeacher(
          button.dataset.editTeacher
        );
      });
    });

  container
    .querySelectorAll("[data-delete-teacher]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        deleteTeacher(
          button.dataset.deleteTeacher
        );
      });
    });
}

function openNewTeacher() {
  byId("teacherForm").reset();

  setValue("teacherId", "");
  setValue("teacherPin", "");
  setValue(
    "teacherRole",
    "English Teacher"
  );
  setValue(
    "teacherStatus",
    "Active"
  );

  text(
    "teacherModalTitle",
    "Add teacher"
  );

  openModal("teacherModal");
}

function openEditTeacher(id) {
  const teacher =
    getTeacher(id);

  if (!teacher) {
    return;
  }

  setValue("teacherId", teacher.id);
  setValue("teacherName", teacher.name);
  setValue("teacherEmail", teacher.email);
  setValue("teacherPhone", teacher.phone);
  setValue("teacherRole", teacher.role);
  setValue("teacherStatus", teacher.status);
  setValue("teacherNotes", teacher.notes);
  // PIN is never sent back from the server, so this always starts blank.
  // Leaving it blank on save keeps the teacher's existing PIN unchanged;
  // typing a new one resets it.
  setValue("teacherPin", "");

  text(
    "teacherModalTitle",
    "Edit teacher"
  );

  openModal("teacherModal");
}

async function saveTeacherForm(event) {
  event.preventDefault();

  const id = value("teacherId");
  const name = value("teacherName").trim();
  const pin = value("teacherPin").trim();

  if (!name) {
    showToast("Teacher name is required.", "error");
    return;
  }

  if (!id && !/^\d{4,6}$/.test(pin)) {
    showToast("Set a 4 to 6 digit login PIN for this teacher.", "error");
    return;
  }

  if (pin && !/^\d{4,6}$/.test(pin)) {
    showToast("PIN must be 4 to 6 digits.", "error");
    return;
  }

  const fields = {
    "Name": name,
    "Email": value("teacherEmail").trim(),
    "Phone": value("teacherPhone").trim(),
    "Role": value("teacherRole").trim(),
    "Status": value("teacherStatus") || "Active",
    "Notes": value("teacherNotes").trim()
  };

  if (pin) fields["PIN"] = pin;

  const button = byId("teacherForm")?.querySelector('button[type="submit"]');
  const oldLabel = button?.textContent || "Save teacher";

  // 30 Sept: editing a teacher shows at once and goes to Google in the background.
  if (id) {
    if (!Array.isArray(state.teachers)) state.teachers = [];
    const i = state.teachers.findIndex((t) => t.id === id);
    const localRecord = { id, name: fields["Name"], email: fields["Email"], phone: fields["Phone"], role: fields["Role"], status: fields["Status"], notes: fields["Notes"] };
    if (i >= 0) state.teachers[i] = { ...state.teachers[i], ...localRecord };
    llsQueueSave(fields["Name"] || "the teacher", { action: "updateTeacher", teacherId: id, fields });
    saveState();
    renderAll();
    closeModal("teacherModal");
    showToast("Teacher updated.", "success");
    return;
  }

  llsBgStart("teacherModal");
  let bgOk = false;
  try {
    const result = await llsApiPost(
      id
        ? { action: "updateTeacher", teacherId: id, fields }
        : { action: "createTeacher", fields }
    );

    // Optimistic local update: reflect the save immediately using the
    // data we already have, instead of blocking on a second Sheets
    // round-trip. Mirrors the pattern used for Payments.
    const teacherId = id || String(result.teacherId || "").trim();
    const localRecord = {
      id: teacherId,
      name: fields["Name"],
      email: fields["Email"],
      phone: fields["Phone"],
      role: fields["Role"],
      status: fields["Status"],
      notes: fields["Notes"]
    };

    if (!Array.isArray(state.teachers)) state.teachers = [];
    const existingIndex = state.teachers.findIndex((t) => t.id === teacherId);
    if (existingIndex >= 0) {
      state.teachers[existingIndex] = { ...state.teachers[existingIndex], ...localRecord };
    } else if (teacherId) {
      state.teachers.push(localRecord);
    }

    saveState();
    renderAll();
    closeModal("teacherModal");
    bgOk = true;

    showToast(
      id ? "Teacher updated." : "Teacher added.",
      "success"
    );

    // Reconcile with Sheets in the background (non-blocking).
    llsLoadTeachersFromSheets().catch(() => {});
  } catch (error) {
    console.error(error);
    showToast(error.message || "Could not save the teacher.", "error");
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = oldLabel;
    }
    llsBgEnd(bgOk, "teacherModal");
  }
}

function deleteTeacher(id) {
  showToast(
    "Deleting teachers isn't available in the portal yet — remove the row directly in the Teachers tab of the Google Sheet.",
    "error"
  );
}

/* =========================================================
   REPORTS
========================================================= */

function renderReports() {
  const activeStudents =
    state.students.filter(
      (student) =>
        student.status === "Active"
    );

  const totalFees = sum(
    state.payments.map((item) =>
      number(item.fee)
    )
  );

  const collected = sum(
    state.payments.map((item) =>
      number(item.paid)
    )
  );

  const outstanding =
    Math.max(0, totalFees - collected);

  const collectionRate =
    totalFees > 0
      ? Math.round(
          Math.min(
            100,
            (collected / totalFees) * 100
          )
        )
      : 0;

  const enrolledLeads =
    state.enquiries.filter(
      (item) =>
        item.status === "Enrolled"
    ).length;

  const conversionRate =
    state.enquiries.length > 0
      ? Math.round(
          (enrolledLeads /
            state.enquiries.length) *
            100
        )
      : 0;

  const averageClass =
    state.classes.length > 0
      ? (
          activeStudents.length /
          state.classes.length
        ).toFixed(1)
      : "0";

  text(
    "reportActiveStudents",
    activeStudents.length
  );

  text(
    "reportAverageClass",
    averageClass
  );

  text(
    "reportCollectionRate",
    `${collectionRate}%`
  );

  text(
    "reportConversionRate",
    `${conversionRate}%`
  );

  text(
    "reportFees",
    formatMoney(totalFees)
  );

  text(
    "reportCollected",
    formatMoney(collected)
  );

  text(
    "reportOutstanding",
    formatMoney(outstanding)
  );

  renderLevelReport();
  renderSourceReport();
  renderFollowupHealth();
}

function renderLevelReport() {
  const container =
    byId("levelReportBars");

  const activeStudents =
    state.students.filter(
      (student) =>
        student.status === "Active"
    );

  const counts = LEVELS.map(
    (level) => ({
      level,
      count: activeStudents.filter(
        (student) =>
          student.level === level
      ).length
    })
  );

  const maximum =
    Math.max(
      1,
      ...counts.map(
        (item) => item.count
      )
    );

  container.innerHTML = counts
    .map((item) => `
      <div class="bar-row">
        <div class="bar-row-label">
          ${escapeHtml(item.level)}
        </div>

        <div class="bar-track">
          <div
            class="bar-value"
            style="width:${(item.count / maximum) * 100}%"
          ></div>
        </div>

        <div class="bar-number">
          ${item.count}
        </div>
      </div>
    `)
    .join("");
}

function renderSourceReport() {
  const container =
    byId("sourceReportList");

  const sourceCounts = {};

  state.enquiries.forEach((enquiry) => {
    const source =
      enquiry.source || "Unknown";

    sourceCounts[source] =
      (sourceCounts[source] || 0) + 1;
  });

  const entries =
    Object.entries(sourceCounts)
      .sort((a, b) => b[1] - a[1]);

  if (!entries.length) {
    container.innerHTML = emptyState(
      "No enquiry source data yet."
    );
    return;
  }

  container.innerHTML = entries
    .map(([source, count]) => `
      <div class="metric-row">
        <span>${escapeHtml(source)}</span>
        <strong>${count}</strong>
      </div>
    `)
    .join("");
}

function renderFollowupHealth() {
  const container =
    byId("followupHealth");

  const open = state.enquiries.filter(
    (item) =>
      !["Enrolled", "Lost"].includes(item.status)
  );

  const overdue =
    open.filter(
      (item) =>
        item.followup &&
        isPastDate(item.followup)
    ).length;

  const scheduled =
    open.filter(
      (item) =>
        item.followup &&
        !isPastDate(item.followup)
    ).length;

  const missing =
    open.filter(
      (item) =>
        !item.followup
    ).length;

  container.innerHTML = `
    <div class="metric-row">
      <span>Open opportunities</span>
      <strong>${open.length}</strong>
    </div>

    <div class="metric-row">
      <span>Follow-ups scheduled</span>
      <strong>${scheduled}</strong>
    </div>

    <div class="metric-row">
      <span>Overdue follow-ups</span>
      <strong>${overdue}</strong>
    </div>

    <div class="metric-row">
      <span>No follow-up date</span>
      <strong>${missing}</strong>
    </div>
  `;
}

/* =========================================================
   SETTINGS
========================================================= */

function renderSettings() {
  setValue(
    "schoolName",
    state.settings.schoolName
  );

  setValue(
    "schoolPhone",
    state.settings.phone
  );

  setValue(
    "schoolEmail",
    state.settings.email
  );

  setValue(
    "schoolAddress",
    state.settings.address
  );
}

function saveSettingsForm(event) {
  event.preventDefault();

  state.settings = {
    schoolName:
      value("schoolName").trim() ||
      "London Language School",
    phone:
      value("schoolPhone").trim(),
    email:
      value("schoolEmail").trim(),
    address:
      value("schoolAddress").trim()
  };

  saveState();

  showToast(
    "Settings saved.",
    "success"
  );
}

/* =========================================================
   NOTIFICATIONS
========================================================= */

function renderNotifications() {
  const list =
    byId("notificationList");

  const notifications = [];

  state.enquiries
    .filter(
      (enquiry) =>
        !["Enrolled", "Lost"].includes(
          enquiry.status
        ) &&
        enquiry.followup &&
        isPastDate(enquiry.followup)
    )
    .forEach((enquiry) => {
      notifications.push({
        icon: "!",
        title: "Enquiry follow-up overdue",
        message:
          `${enquiry.name} · ${enquiry.course}`
      });
    });

  state.payments
    .filter(
      (payment) =>
        paymentStatus(payment) !== "Paid" &&
        // V19: with payment dates, only warn once a payment is late.
        (!payment.nextDue || payment.overdue)
    )
    .forEach((payment) => {
      const student =
        getStudent(payment.studentId);

      if (payment.overdue) {
        notifications.push({
          icon: "€",
          title: "Payment overdue",
          message: `${getStudentName(student) || "Student"} · ${formatMoney(payment.nextAmount)} since ${formatDate(payment.nextDue)}`
        });
        return;
      }

      notifications.push({
        icon: "€",
        title: "Outstanding balance",
        message:
          `${getStudentName(student) || "Student"} · ${formatMoney(Math.max(0, number(payment.fee) - number(payment.paid)))} due`
      });
    });

  (state.students || [])
    .filter((s) => s.coachRequest && !(s.coachUntil && s.coachUntil >= isoDate(new Date())))
    .forEach((s) => {
      const [date, plan] = s.coachRequest.split(" ");
      notifications.push({
        icon: "🗣",
        title: "Speaking Coach request",
        message: `${getStudentName(s)} · ${plan === "year" ? "€25 school year" : "€3 a month"} · asked ${formatDate(date)}`
      });
    });

  (llsHourPacks?.students || [])
    .filter((e) => e.hoursBought > 0 && e.hoursLeft <= 2)
    .forEach((e) => {
      notifications.push({
        icon: "⏱",
        title: e.hoursLeft <= 0 ? "1-2-1 pack used up" : "1-2-1 pack nearly used",
        message: `${getStudentName(getStudent(e.studentId)) || "Student"} · ${e.hoursLeft} h left`
      });
    });

  // 2 Oct: students coming to lessons with no course fee recorded.
  const noFee = typeof llsStudentsWithoutFee_ === "function" ? llsStudentsWithoutFee_() : [];
  if (noFee.length) {
    notifications.unshift({
      icon: "💶",
      title: "No payment details",
      message: `${noFee.length} student${noFee.length === 1 ? " is" : "s are"} in a class with no course fee recorded (see the Dashboard)`
    });
  }

  byId("notificationDot").classList.toggle(
    "visible",
    notifications.length > 0
  );

  if (!notifications.length) {
    list.innerHTML = emptyState(
      "You're up to date. No portal alerts."
    );
    return;
  }

  list.innerHTML = notifications
    .slice(0, 20)
    .map((item) => `
      <div class="notification-item">
        <div class="notification-item-icon">
          ${escapeHtml(item.icon)}
        </div>

        <div>
          <strong>${escapeHtml(item.title)}</strong>
          <span>${escapeHtml(item.message)}</span>
        </div>
      </div>
    `)
    .join("");
}

/* =========================================================
   GLOBAL SEARCH
========================================================= */

function renderGlobalSearch() {
  const input =
    byId("globalSearchInput");

  const resultsContainer =
    byId("globalSearchResults");

  const query =
    input.value
      .trim()
      .toLowerCase();

  if (query.length < 2) {
    closeGlobalSearch();
    return;
  }

  const results = [];

  state.students.forEach((student) => {
    const name =
      `${student.firstName} ${student.lastName}`;

    const haystack = [
      name,
      student.email,
      student.phone,
      student.level
    ]
      .join(" ")
      .toLowerCase();

    if (haystack.includes(query)) {
      results.push({
        type: "Student",
        title: name,
        subtitle:
          `${student.level || "No level"} · ${student.status}`,
        page: "students",
        icon: "S"
      });
    }
  });

  state.classes.forEach((item) => {
    const haystack = [
      item.name,
      item.level,
      item.day,
      item.room
    ]
      .join(" ")
      .toLowerCase();

    if (haystack.includes(query)) {
      results.push({
        type: "Class",
        title: item.name,
        subtitle:
          `${item.level} · ${item.day} ${formatTime(item.time)}`,
        page: "classes",
        icon: "C"
      });
    }
  });

  state.enquiries.forEach((enquiry) => {
    const haystack = [
      enquiry.name,
      enquiry.course,
      enquiry.phone,
      enquiry.email
    ]
      .join(" ")
      .toLowerCase();

    if (haystack.includes(query)) {
      results.push({
        type: "Enquiry",
        title: enquiry.name,
        subtitle:
          `${enquiry.course} · ${enquiry.status}`,
        page: "enquiries",
        icon: "E"
      });
    }
  });

  if (!results.length) {
    resultsContainer.innerHTML =
      `<div class="search-empty">No results found.</div>`;
  } else {
    resultsContainer.innerHTML =
      results
        .slice(0, 12)
        .map((result) => `
          <button
            class="search-result"
            type="button"
            data-search-page="${result.page}"
          >
            <div class="search-result-icon">
              ${escapeHtml(result.icon)}
            </div>

            <div>
              <strong>
                ${escapeHtml(result.title)}
              </strong>
              <span>
                ${escapeHtml(result.type)}
                ·
                ${escapeHtml(result.subtitle)}
              </span>
            </div>
          </button>
        `)
        .join("");

    resultsContainer
      .querySelectorAll("[data-search-page]")
      .forEach((button) => {
        button.addEventListener("click", () => {
          navigateTo(
            button.dataset.searchPage
          );

          input.value = "";
          closeGlobalSearch();
        });
      });
  }

  resultsContainer.classList.add("visible");
}

function closeGlobalSearch() {
  byId("globalSearchResults")
    .classList.remove("visible");
}

function closeUserDropdown() {
  byId("userDropdown")
    .classList.remove("visible");
}

/* =========================================================
   SELECT POPULATION
========================================================= */

function populateSelects() {
  populateStudentClassSelect();
  populateTeacherSelect();
  populatePaymentStudentSelect();
  if (typeof populateLiveAttendanceClasses === "function") populateLiveAttendanceClasses();
}

function populateStudentClassSelect(selectedId = "") {
  const select = byId("studentClass");
  if (!select) return;

  const availableClasses = (state.classes || []).filter((item) => {
    const status = String(item.status || "").trim().toLowerCase();
    return status !== "inactive" && status !== "archived";
  });

  select.innerHTML =
    `<option value="">Not assigned</option>` +
    availableClasses
      .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")))
      .map((item) => {
        const id = String(item.id || "");
        const name = String(item.name || item.className || id || "Class");
        const schedule = [
          [item.day, item.time].filter(Boolean).join(" "),
          [item.day2, item.time2].filter(Boolean).join(" ")
        ].filter(Boolean).join(" / ");
        const label = schedule ? `${name} — ${schedule}` : name;
        return `<option value="${escapeAttribute(id)}">${escapeHtml(label)}</option>`;
      })
      .join("");

  if (selectedId && availableClasses.some((item) => String(item.id) === String(selectedId))) {
    select.value = String(selectedId);
  }
}

function populateTeacherSelect() {
  // V16.1: the class Teacher field is free text (a class can have two
  // teachers, e.g. "Cole (Mon) / Helen (Wed)"). The list only suggests
  // names from the Teachers page; nothing typed is ever discarded.
  const list = byId("classTeacherList");

  if (!list) {
    return;
  }

  list.innerHTML = state.teachers
    .filter((teacher) => teacher.status === "Active" && teacher.name)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((teacher) => `<option value="${escapeAttribute(teacher.name)}"></option>`)
    .join("");
}

function populatePaymentStudentSelect() {
  const select =
    byId("paymentStudent");

  if (!select) {
    return;
  }

  const current =
    select.value;

  select.innerHTML =
    `<option value="">Select student</option>` +
    [...state.students]
      .sort((a, b) =>
        a.lastName.localeCompare(b.lastName)
      )
      .map((student) => `
        <option value="${escapeAttribute(student.id)}">
          ${escapeHtml(student.firstName)}
          ${escapeHtml(student.lastName)}
        </option>
      `)
      .join("");

  if (
    current &&
    state.students.some(
      (student) =>
        student.id === current
    )
  ) {
    select.value = current;
  }
}

/* =========================================================
   CSV EXPORTS
========================================================= */

function exportStudentsCsv() {
  const rows = [
    [
      "First name",
      "Surname",
      "Email",
      "Telephone",
      "Date of birth",
      "Level",
      "Class",
      "Status",
      "Joined",
      "Parent / Guardian",
      "Notes"
    ],
    ...state.students.map((student) => [
      student.firstName,
      student.lastName,
      student.email,
      student.phone,
      student.dob,
      student.level,
      getClass(student.classId)?.name || "",
      student.status,
      student.joined,
      student.parent,
      student.notes
    ])
  ];

  downloadCsv(
    `lls-students-${isoDate(new Date())}.csv`,
    rows
  );
}

function exportPaymentsCsv() {
  const rows = [
    [
      "Student",
      "Description",
      "Total fee",
      "Paid",
      "Balance",
      "Payment date",
      "Method",
      "Status",
      "Notes"
    ],
    ...state.payments.map((payment) => {
      const student =
        getStudent(payment.studentId);

      const fee =
        number(payment.fee);

      const paid =
        number(payment.paid);

      return [
        getStudentName(student),
        payment.description,
        fee,
        paid,
        Math.max(0, fee - paid),
        payment.date,
        payment.method,
        paymentStatus(payment),
        payment.notes
      ];
    })
  ];

  downloadCsv(
    `lls-payments-${isoDate(new Date())}.csv`,
    rows
  );
}

function exportEnquiriesCsv() {
  const rows = [
    [
      "Name",
      "Age",
      "Telephone",
      "Email",
      "Interested in",
      "Source",
      "Stage",
      "Follow-up",
      "Created",
      "Notes"
    ],
    ...state.enquiries.map((enquiry) => [
      enquiry.name,
      enquiry.age,
      enquiry.phone,
      enquiry.email,
      enquiry.course,
      enquiry.source,
      enquiry.status,
      enquiry.followup,
      enquiry.created,
      enquiry.notes
    ])
  ];

  downloadCsv(
    `lls-enquiries-${isoDate(new Date())}.csv`,
    rows
  );
}

async function exportAttendanceCsv() {
  const classId = value("attendanceClassSelect");
  const date = value("attendanceDate");

  const classRecord = (llsLivePortalData.classes || []).find(
    (item) => String(item["Class ID"] || "").trim() === classId
  );

  if (!classId || !classRecord || !date) {
    showToast(
      "Choose an attendance class and date first.",
      "error"
    );
    return;
  }

  const className = String(classRecord["Class Name"] || classId);

  let attendanceRows;
  try {
    const data = await llsApiGet("getAttendance", { classId, lessonDate: date });
    attendanceRows = Array.isArray(data.attendance) ? data.attendance : [];
  } catch (error) {
    showToast(
      "Could not load attendance from Google Sheets: " + error.message,
      "error"
    );
    return;
  }

  const byStudent = new Map(
    attendanceRows.map((item) => [String(item["Student ID"] || "").trim(), item])
  );

  const students = llsStudentsForClass(classId);

  const rows = [
    [
      "Class",
      "Date",
      "Student",
      "Level",
      "Status",
      "Notes"
    ],
    ...students.map((student) => {
      const studentId = String(student["Student ID"] || "").trim();
      const record = byStudent.get(studentId) || {};
      return [
        className,
        date,
        llsStudentName(student),
        String(student["Level"] || ""),
        String(record["Status"] || "Present"),
        String(record["Notes"] || "")
      ];
    })
  ];

  downloadCsv(
    `lls-attendance-${slug(className)}-${date}.csv`,
    rows
  );
}

function exportFullReport() {
  const activeStudents =
    state.students.filter(
      (item) => item.status === "Active"
    ).length;

  const fees = sum(
    state.payments.map(
      (item) => number(item.fee)
    )
  );

  const collected = sum(
    state.payments.map(
      (item) => number(item.paid)
    )
  );

  const enrolled = state.enquiries.filter(
    (item) => item.status === "Enrolled"
  ).length;

  const rows = [
    ["London Language School Portal Report"],
    ["Generated", new Date().toLocaleString("en-GB")],
    [],
    ["Metric", "Value"],
    ["Active students", activeStudents],
    ["Classes", state.classes.length],
    ["Teachers", state.teachers.length],
    ["Enquiries", state.enquiries.length],
    ["Enrolled enquiries", enrolled],
    ["Fees recorded", fees],
    ["Collected", collected],
    ["Outstanding", Math.max(0, fees - collected)],
    [],
    ["Student levels"],
    ...LEVELS.map((level) => [
      level,
      state.students.filter(
        (student) =>
          student.status === "Active" &&
          student.level === level
      ).length
    ])
  ];

  downloadCsv(
    `lls-report-${isoDate(new Date())}.csv`,
    rows
  );
}

function downloadCsv(filename, rows) {
  const csv = rows
    .map((row) =>
      row
        .map(csvEscape)
        .join(",")
    )
    .join("\r\n");

  downloadFile(
    filename,
    "\uFEFF" + csv,
    "text/csv;charset=utf-8"
  );

  showToast(
    "CSV export created.",
    "success"
  );
}

function csvEscape(valueToEscape) {
  const stringValue =
    valueToEscape === null ||
    valueToEscape === undefined
      ? ""
      : String(valueToEscape);

  return `"${stringValue.replace(/"/g, '""')}"`;
}

/* =========================================================
   BACKUP
========================================================= */

function exportBackup() {
  const backup = {
    app: "London Language School Portal",
    version: 1,
    exportedAt:
      new Date().toISOString(),
    data: state
  };

  downloadFile(
    `lls-portal-backup-${isoDate(new Date())}.json`,
    JSON.stringify(backup, null, 2),
    "application/json"
  );

  showToast(
    "Portal backup exported.",
    "success"
  );
}

function importBackup(event) {
  const file =
    event.target.files?.[0];

  event.target.value = "";

  if (!file) {
    return;
  }

  const reader =
    new FileReader();

  reader.onload = () => {
    try {
      const parsed =
        JSON.parse(reader.result);

      const importedState =
        parsed.data || parsed;

      if (
        !importedState ||
        typeof importedState !== "object"
      ) {
        throw new Error(
          "Invalid backup format"
        );
      }

      openConfirm(
        "Import backup?",
        "The imported backup will replace the portal data currently stored in this browser.",
        () => {
          state = importedState;
          ensureStateStructure();
          saveState();
          renderAll();

          showToast(
            "Backup imported successfully.",
            "success"
          );
        },
        "Import"
      );
    } catch (error) {
      console.error(error);

      showToast(
        "The selected file is not a valid LLS portal backup.",
        "error"
      );
    }
  };

  reader.readAsText(file);
}

/* =========================================================
   MODALS
========================================================= */

function openModal(id) {
  const modal = byId(id);

  if (!modal) {
    return;
  }

  modal.classList.add("open");
  document.body.style.overflow = "hidden";

  setTimeout(() => {
    const focusTarget =
      modal.querySelector(
        "input:not([type='hidden']), select, textarea, button"
      );

    focusTarget?.focus();
  }, 30);
}

function closeModal(id) {
  const modal = byId(id);

  if (!modal) {
    return;
  }

  modal.classList.remove("open");

  if (
    !document.querySelector(
      ".modal-backdrop.open"
    )
  ) {
    document.body.style.overflow = "";
  }

  if (id === "confirmModal") {
    confirmCallback = null;
  }
}

function closeAllModals() {
  document
    .querySelectorAll(".modal-backdrop.open")
    .forEach((modal) => {
      modal.classList.remove("open");
    });

  confirmCallback = null;
  document.body.style.overflow = "";
}

function openConfirm(
  title,
  message,
  callback,
  actionLabel = "Delete"
) {
  text(
    "confirmModalTitle",
    title
  );

  text(
    "confirmModalMessage",
    message
  );

  text(
    "confirmActionButton",
    actionLabel
  );

  confirmCallback =
    callback;

  openModal("confirmModal");
}

function executeConfirmAction() {
  if (
    typeof confirmCallback === "function"
  ) {
    const callback =
      confirmCallback;

    confirmCallback = null;
    closeModal("confirmModal");
    callback();
  }
}

/* =========================================================
   TOASTS
========================================================= */

function showToast(
  message,
  type = "success"
) {
  const region =
    byId("toastRegion");

  const toast =
    document.createElement("div");

  toast.className =
    `toast ${type}`;

  toast.innerHTML = `
    <div>
      <strong>
        ${type === "error" ? "Action needed" : "LLS Portal"}
      </strong>
      <span>${escapeHtml(message)}</span>
    </div>
  `;

  region.appendChild(toast);
  if (type === "success") llsPing(); // 28 Sept: a short "ping" whenever something is saved

  setTimeout(() => {
    toast.remove();
  }, 3500);
}

/* 28 Sept: success sound. The audio context is opened on the first tap
   (browsers only allow sound after the user has touched the page). */
let llsAudio = null;
function llsAudioUnlock() {
  try {
    if (!llsAudio) llsAudio = new (window.AudioContext || window.webkitAudioContext)();
    if (llsAudio.state === "suspended") llsAudio.resume();
  } catch (_) {}
}
document.addEventListener("pointerdown", llsAudioUnlock, { passive: true });
document.addEventListener("keydown", llsAudioUnlock, { passive: true });
function llsPing() {
  try {
    if (!llsAudio) return;
    const t = llsAudio.currentTime;
    [[880, 0], [1320, 0.09]].forEach(([freq, delay]) => {
      const o = llsAudio.createOscillator();
      const g = llsAudio.createGain();
      o.type = "sine";
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t + delay);
      g.gain.exponentialRampToValueAtTime(0.18, t + delay + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + delay + 0.28);
      o.connect(g).connect(llsAudio.destination);
      o.start(t + delay);
      o.stop(t + delay + 0.3);
    });
  } catch (_) {}
}

/* 28 Sept: office forms close as soon as Save is pressed and finish saving
   in the background (Google takes ~30 s per step). A counter keeps track, the
   page warns before closing while something is still saving, and a failed
   save reopens its form with everything still filled in. */
let llsBgSaving = 0;
function llsBgStart(modalId) {
  llsBgSaving++;
  closeModal(modalId);
  showToast("⏳ Saving… you can carry on, it finishes by itself.", "info");
}
function llsBgEnd(ok, modalId) {
  llsBgSaving = Math.max(0, llsBgSaving - 1);
  if (!ok && modalId && !document.querySelector(".modal-backdrop.open")) openModal(modalId);
}
window.addEventListener("beforeunload", (e) => {
  if (llsBgSaving > 0) { e.preventDefault(); e.returnValue = ""; }
});

/* 28 Sept: a Save button that stays on screen turns green for a moment. */
function llsFlashSaved(button, label) {
  if (!button) return;
  const old = button.dataset.label || button.textContent;
  button.dataset.label = old;
  button.textContent = label || "✓ Saved";
  button.classList.add("is-saved");
  button.disabled = true;
  setTimeout(() => {
    button.textContent = old;
    button.classList.remove("is-saved");
    button.disabled = false;
    delete button.dataset.label;
  }, 3000);
}

/* =========================================================
   DATA HELPERS
========================================================= */

function getStudent(id) {
  return state.students.find(
    (student) =>
      student.id === id
  );
}

function getStudentName(student) {
  if (!student) {
    return "";
  }

  return `${student.firstName} ${student.lastName}`.trim();
}

function getClass(id) {
  return state.classes.find(
    (item) =>
      item.id === id
  );
}

function getTeacher(id) {
  return state.teachers.find(
    (teacher) =>
      teacher.id === id
  );
}

function getClassStudents(classId) {
  return state.students.filter(
    (student) =>
      student.classId === classId
  );
}

function attendanceKey(
  classId,
  date
) {
  return `${date}__${classId}`;
}

/* =========================================================
   FORM / DOM HELPERS
========================================================= */

function byId(id) {
  return document.getElementById(id);
}

function text(id, content) {
  const element =
    byId(id);

  if (element) {
    element.textContent =
      content ?? "";
  }
}

function value(id) {
  return byId(id)?.value ?? "";
}

function setValue(id, newValue) {
  const element =
    byId(id);

  if (element) {
    element.value =
      newValue ?? "";
  }
}

/* =========================================================
   GENERAL HELPERS
========================================================= */

function makeId(prefix = "item") {
  if (
    window.crypto &&
    typeof window.crypto.randomUUID === "function"
  ) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 9)}`;
}

function number(valueToConvert) {
  const parsed =
    Number(valueToConvert);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

function sum(values) {
  return values.reduce(
    (total, item) =>
      total + number(item),
    0
  );
}

function formatMoney(amount) {
  return new Intl.NumberFormat(
    "it-IT",
    {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }
  ).format(number(amount));
}

function formatDate(dateString) {
  if (!dateString) {
    return "";
  }

  const date =
    parseIsoLocal(dateString);

  if (
    Number.isNaN(date.getTime())
  ) {
    return dateString;
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }
  ).format(date);
}

function formatTime(time) {
  if (!time) {
    return "—";
  }

  return time.slice(0, 5);
}

function isoDate(date) {
  const year =
    date.getFullYear();

  const month =
    String(date.getMonth() + 1)
      .padStart(2, "0");

  const day =
    String(date.getDate())
      .padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseIsoLocal(dateString) {
  const parts =
    String(dateString)
      .split("-")
      .map(Number);

  if (parts.length !== 3) {
    return new Date(dateString);
  }

  return new Date(
    parts[0],
    parts[1] - 1,
    parts[2]
  );
}

function addDays(date, days) {
  const result =
    new Date(date);

  result.setDate(
    result.getDate() + days
  );

  return result;
}

function isPastDate(dateString) {
  if (!dateString) {
    return false;
  }

  const target =
    parseIsoLocal(dateString);

  const today =
    parseIsoLocal(
      isoDate(new Date())
    );

  return target < today;
}

function isCurrentMonth(dateString) {
  if (!dateString) {
    return false;
  }

  const date =
    parseIsoLocal(dateString);

  const today =
    new Date();

  return (
    date.getFullYear() ===
      today.getFullYear() &&
    date.getMonth() ===
      today.getMonth()
  );
}

function dayIndex(day) {
  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday"
  ];

  const index =
    days.indexOf(day);

  return index === -1
    ? 99
    : index;
}

function getInitials(name) {
  return String(name || "?")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) =>
      part.charAt(0).toUpperCase()
    )
    .join("");
}

function slug(valueToSlug) {
  return String(valueToSlug)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function statusBadge(status) {
  const safeStatus =
    status || "Unknown";

  return `
    <span class="status-badge status-${slug(safeStatus)}">
      ${escapeHtml(safeStatus)}
    </span>
  `;
}

function emptyState(message) {
  return `
    <div class="empty-state">
      ${escapeHtml(message)}
    </div>
  `;
}

function tableEmptyRow(
  columns,
  message
) {
  return `
    <tr>
      <td colspan="${columns}">
        <div class="empty-state">
          ${escapeHtml(message)}
        </div>
      </td>
    </tr>
  `;
}

function escapeHtml(valueToEscape) {
  return String(
    valueToEscape ?? ""
  )
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttribute(valueToEscape) {
  return escapeHtml(
    valueToEscape
  );
}

function cssEscape(valueToEscape) {
  if (
    window.CSS &&
    typeof window.CSS.escape === "function"
  ) {
    return CSS.escape(
      valueToEscape
    );
  }

  return String(valueToEscape)
    .replace(
      /["\\]/g,
      "\\$&"
    );
}

function downloadFile(
  filename,
  content,
  mimeType
) {
  const blob =
    new Blob(
      [content],
      { type: mimeType }
    );

  const url =
    URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

/* ============================================================
   LLS V2 — GOOGLE SHEETS ENQUIRY API BRIDGE
   Google Sheets is the source of truth for enquiries.
   ============================================================ */
const LLS_API_URL = "https://script.google.com/macros/s/AKfycbyHbfFoaiMOT1rpY2DcbXAkuNwMoOHVdLlG2aQLgPgCe5gqPuyk8VYm7i4eGQRm8iqi/exec";

function llsDateOnly(valueToNormalise) {
  if (!valueToNormalise) return "";
  const raw = String(valueToNormalise).trim();
  const match = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];

  // The sheet is in UK format: 05/03/2026 = 5 March (never US month-first).
  const uk = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (uk) return `${uk[3]}-${uk[2].padStart(2, "0")}-${uk[1].padStart(2, "0")}`;

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;

  return [
    parsed.getFullYear(),
    String(parsed.getMonth() + 1).padStart(2, "0"),
    String(parsed.getDate()).padStart(2, "0")
  ].join("-");
}

function llsNormaliseStage(stage) {
  const raw = String(stage || "New").trim();
  const aliases = {
    "Trial booked": "Placement/Trial Booked",
    "Trial Booked": "Placement/Trial Booked",
    "Trial completed": "Placement/Trial Completed",
    "Trial Completed": "Placement/Trial Completed",
    "Interested": "Course Offered"
  };
  return aliases[raw] || raw || "New";
}

let llsCoreLoadPromise = null;
let llsCoreSettled = false; // 28 Sept: true once the first class list from Google has arrived (or failed)

function llsApplyCorePortalData(payload) {
  const studentRows = Array.isArray(payload.students) ? payload.students : [];
  const classRows = Array.isArray(payload.classes) ? payload.classes : [];
  const enrolmentRows = Array.isArray(payload.enrolments) ? payload.enrolments : [];

  state.classes = classRows.map((r) => ({
    id: String(r["Class ID"] || r.id || "").trim(),
    name: String(r["Class Name"] || r.name || "").trim(),
    schoolYear: String(r["School Year"] || r.schoolYear || "2026-27").trim(),
    level: String(r["Level"] || r.level || ""),
    teacherId: String(r["Teacher"] || r.teacher || ""),
    teacherName: String(r["Teacher"] || r.teacher || ""),
    day: String(r["Day"] || r.day || ""),
    time: String(r["Time"] || r.time || "").slice(0, 5),
    day2: String(r["Day 2"] || r.day2 || ""),
    time2: String(r["Time 2"] || r.time2 || "").slice(0, 5),
    duration: Number(r["Duration"] || r.duration || 90),
    room: String(r["Room"] || r.room || ""),
    capacity: Number(r["Capacity"] || r.capacity || 10),
    registerSheet: "",
    status: String(r["Status"] || r.status || "Active"),
    notes: String(r["Notes"] || r.notes || ""),
    book: String(r["Book"] || ""),
    units: String(r["Units"] || ""),
    currentUnit: String(r["Current Unit"] || "")
  })).filter((item) => item.id);

  // Authoritative membership: ACTIVE Enrolments only.
  // The legacy Students["Class"] cell is deliberately ignored.
  const activeClassByStudent = new Map();
  enrolmentRows.forEach((enrolment) => {
    const status = String(enrolment["Status"] || "").trim().toLowerCase();
    const studentId = String(enrolment["Student ID"] || "").trim();
    const classId = String(enrolment["Class ID"] || "").trim();
    if (status === "active" && studentId && classId) {
      activeClassByStudent.set(studentId, classId);
    }
  });

  state.students = studentRows.map((r) => {
    const studentId = String(r["Student ID"] || r.id || "").trim();
    return {
      id: studentId,
      firstName: r["First Name"] || r.firstName || "",
      lastName: r["Surname"] || r.lastName || "",
      email: r["Email"] || r.email || "",
      phone: r["Phone"] || r.phone || "",
      dob: llsDateOnly(r["Date of Birth"] || r.dob || ""),
      level: r["Level"] || r.level || "",
      classId: activeClassByStudent.get(studentId) || "",
      status: r["Status"] || r.status || "Active",
      joined: llsDateOnly(r["Joined"] || r.joined || ""),
      parent: r["Parent / Guardian"] || r.parent || "",
      notes: r["Notes"] || r.notes || "",
      coachUntil: llsCoachIso(r["Speaking Coach Until"]),
      coachRequest: String(r["Speaking Coach Request"] || "").replace(/^'/, "")
    };
  }).filter((student) => student.id);

  llsLivePortalData = {
    students: studentRows,
    classes: classRows,
    enrolments: enrolmentRows
  };
  // 30 Sept: kept on this device so registers open at once next time.
  try { localStorage.setItem("lls_core_rows", JSON.stringify(llsLivePortalData)); } catch (_) {}

  saveState();
  populateStudentClassSelect();
  if (typeof populateLiveAttendanceClasses === "function") populateLiveAttendanceClasses();
  renderAll();
  if (document.getElementById("page-lesson")?.classList.contains("active") && typeof llsInitLessonPage === "function") llsInitLessonPage();

  console.info(
    `LLS: loaded ${state.classes.length} classes, ${state.students.length} students and ${enrolmentRows.length} enrolments from Google Sheets.`
  );

  return payload;
}

async function llsLoadCoreFromSheets(force = false) {
  if (llsCoreLoadPromise && !force) return llsCoreLoadPromise;

  llsCoreLoadPromise = (async () => {
    try {
      // One supported endpoint supplies Students + Classes + Enrolments.
      // This replaces the competing getStudents/getClasses requests that
      // were intermittently redirecting to googleusercontent 404 pages.
      const payload = await llsApiGet("getPortalData");
      return llsApplyCorePortalData(payload);
    } catch (error) {
      console.error("LLS: could not load core portal data from Google Sheets:", error);
      showToast(
        "Could not refresh school data from Google Sheets. Showing the last available data.",
        "error"
      );
      return null;
    } finally {
      llsCoreLoadPromise = null;
      if (!llsCoreSettled) {
        llsCoreSettled = true;
        if (document.getElementById("page-lesson")?.classList.contains("active") && typeof llsRenderLessonPicker === "function") llsRenderLessonPicker();
      }
    }
  })();

  return llsCoreLoadPromise;
}

async function llsLoadStudentsFromSheets() {
  const payload = await llsLoadCoreFromSheets();
  return payload ? state.students : null;
}

async function llsLoadClassesFromSheets() {
  const payload = await llsLoadCoreFromSheets();
  return payload ? state.classes : null;
}

async function llsLoadEnquiriesFromSheets() {
  try {
    // V15.1: go through llsApiGet so the login token is sent.
    const payload = await llsApiGet("getEnquiries");

    const rows = Array.isArray(payload)
      ? payload
      : (payload.enquiries || payload.data || []);

    if (!Array.isArray(rows)) {
      throw new Error("No enquiry array returned by API");
    }

    state.enquiries = rows.map((r, i) => ({
      id: r["Enquiry ID"] || r.id || r.enquiryId || r.enquiryID ||
        `ENQ${String(i + 1).padStart(4, "0")}`,
      name: r["Name"] || r.name || "",
      age: r["Age"] || r.age || "",
      phone: r["Phone"] || r.phone || "",
      email: r["Email"] || r.email || "",
      course: r["Course"] || r.course || r.interestedIn || "",
      source: r["Source"] || r.source || "",
      status: llsNormaliseStage(r["Stage"] || r.stage || r.status || "New"),
      followup: llsDateOnly(
        r["Follow-up"] || r["Follow Up"] || r.followUp || r.followup || ""
      ),
      created: llsDateOnly(
        r["Enquiry Date"] || r.enquiryDate || r.created || ""
      ),
      notes: r["Notes"] || r.notes || "",
      levelResult: r["Level Result"] || r.levelResult || "",
      finalLevel: r["Level Result"] || r.levelResult || "",
      trialRequested: r["Trial Requested"] || r.trialRequested || "",
      trialDate: (() => {
        const m = String(r["Notes"] || r.notes || "").match(/Placement\/Trial date:\s*(\d{4}-\d{2}-\d{2})/i);
        return m ? m[1] : "";
      })(),
      assessment: (() => {
        const m = String(r["Notes"] || r.notes || "").match(/Teacher assessment:\s*([^\n\r]+)/i);
        return m ? m[1].trim() : "";
      })()
    }));

    saveState();
    renderAll();

    console.info(
      `LLS: loaded ${state.enquiries.length} enquiries from Google Sheets.`
    );

    return state.enquiries;
  } catch (error) {
    console.error("LLS: could not load enquiries from Google Sheets:", error);
    showToast(
      "Could not refresh enquiries from Google Sheets. Showing the last available data.",
      "error"
    );
    return null;
  }
}

async function llsLoadTeachersFromSheets() {
  try {
    const data = await llsApiGet("getTeachers");
    const rows = Array.isArray(data.teachers) ? data.teachers : [];

    state.teachers = rows.map((r) => ({
      id: String(r["Teacher ID"] || "").trim(),
      name: r["Name"] || "",
      email: r["Email"] || "",
      phone: r["Phone"] || "",
      role: r["Role"] || "",
      status: r["Status"] || "Active",
      notes: r["Notes"] || ""
    })).filter((teacher) => teacher.id);

    saveState();
    renderAll();

    console.info(`LLS: loaded ${state.teachers.length} teachers from Google Sheets.`);
    return state.teachers;
  } catch (error) {
    console.error("LLS: could not load teachers from Google Sheets:", error);
    showToast(
      "Could not refresh teachers from Google Sheets. Showing the last available data.",
      "error"
    );
    return null;
  }
}

window.addEventListener("load", async () => {
  // V15.1: don't hit the API (and show error toasts) before staff log in.
  if (!llsHasAdminSession()) return;
  // V15.2: fetch all four at once instead of one after another.
  // Finance needs student/class data to label fees, so re-render once
  // everything has arrived.
  // V22: teachers only load teaching data (no enquiries or money).
  const startup = Promise.all(llsIsTeacher()
    ? [llsLoadCoreFromSheets(true), llsLoadTeachersFromSheets()]
    : [
        llsLoadCoreFromSheets(true),
        llsLoadEnquiriesFromSheets(),
        llsLoadFinanceFromSheets(true),
        llsLoadTeachersFromSheets()
      ]);
  // 30 Sept (speed): the class list is what people wait for, so the
  // register is drawn as soon as it arrives (the rest keeps loading).
  const core = llsCoreLoadPromise;
  if (core) core.then(() => { try { renderLiveAttendance(); } catch (_) {} });
  await startup;
  llsRebuildPaymentsState();
  renderAll();
});

/* =========================================================
   V13 — LIVE FEES & PAYMENTS (Google Sheets backed)
   Mirrors the same pattern used for students/classes/enquiries:
   raw Sheets rows are loaded into llsLiveFinanceData, then
   normalised into state.payments (one row per Fee, "paid" =
   sum of that Fee's Payments) so every existing screen that
   already reads state.payments — Dashboard, the Fees & Payments
   page, Reports, CSV export — keeps working unchanged.
========================================================= */

let llsLiveFinanceData = { fees: [], payments: [] };
let paymentModalMode = "create"; // "create" = new fee + first payment, "payment" = add payment to an existing fee

function llsFeeDescription(fee) {
  const schoolYear = String(fee["School Year"] || "").trim();
  const enrolmentId = String(fee["Enrolment ID"] || "").trim();
  let className = "";

  if (enrolmentId) {
    const enrolment = (llsLivePortalData.enrolments || []).find(
      (item) => String(item["Enrolment ID"] || "").trim() === enrolmentId
    );

    if (enrolment) {
      const classId = String(enrolment["Class ID"] || "").trim();
      const classRecord = (llsLivePortalData.classes || []).find(
        (item) => String(item["Class ID"] || "").trim() === classId
      );
      if (classRecord) className = String(classRecord["Class Name"] || "").trim();
    }
  }

  const notes = String(fee["Notes"] || "").trim();

  if (className) return schoolYear ? `${className} · ${schoolYear}` : className;
  if (notes) return notes;
  return schoolYear ? `Course fee · ${schoolYear}` : "Course fee";
}

function llsRebuildPaymentsState() {
  const fees = llsLiveFinanceData.fees || [];
  const payments = llsLiveFinanceData.payments || [];

  state.payments = fees
    .map((fee) => {
      const feeId = String(fee["Fee ID"] || "").trim();
      const studentId = String(fee["Student ID"] || "").trim();

      // 28 Sept: voided payments stay in the sheet but never count.
      const feePayments = payments.filter(
        (item) => String(item["Fee ID"] || "").trim() === feeId && !llsPaymentIsVoid(item)
      );

      const paid = sum(feePayments.map((item) => number(item["Amount"])));

      const lastPayment = [...feePayments].sort((a, b) =>
        String(a["Payment Date"] || "").localeCompare(String(b["Payment Date"] || ""))
      ).pop();

      return {
        id: feeId,
        studentId,
        description: llsFeeDescription(fee),
        fee: number(fee["Amount Due"]),
        paid,
        date: lastPayment ? String(lastPayment["Payment Date"] || "") : "",
        method: lastPayment ? String(lastPayment["Payment Method"] || "") : "",
        notes: String(fee["Notes"] || ""),
        ...llsNextInstalment(fee, paid)
      };
    })
    .filter((item) => item.id);
}

async function llsLoadFinanceFromSheets(force = false) {
  try {
    const data = await llsApiGet("getFinanceData");

    llsLiveFinanceData = {
      fees: Array.isArray(data.fees) ? data.fees : [],
      payments: Array.isArray(data.payments) ? data.payments : []
    };
    window.llsFinanceReady = true; // 2 Oct: the "no payment details" reminder waits for this

    llsRebuildPaymentsState();
    saveState();

    console.info(
      `LLS: loaded ${llsLiveFinanceData.fees.length} fees and ${llsLiveFinanceData.payments.length} payments from Google Sheets.`
    );

    return true;
  } catch (error) {
    console.error("LLS: could not load finance data from Google Sheets:", error);
    showToast(
      "Could not refresh fees & payments from Google Sheets. Showing the last available data.",
      "error"
    );
    return false;
  }
}


/* V2 CLASS OPERATIONS */
function v2StudentClassValue(s) {
  return String(s.classId || s.classID || s.class || s.className || s["Class ID"] || s["Class"] || "").trim();
}
function v2StudentsForClass(c) {
  const id = String(c.id || "").trim(), name = String(c.name || "").trim().toLowerCase();
  return (state.students || []).filter(s => {
    const x = v2StudentClassValue(s);
    return x === id || x.toLowerCase() === name;
  });
}
function openClassWorkspace(classId) {
  const c = (state.classes || []).find(x => String(x.id) === String(classId));
  if (!c) return;
  const modal = document.getElementById("classWorkspaceModal");
  document.getElementById("classWorkspaceTitle").textContent = c.name || "Class";
  document.getElementById("classWorkspaceMeta").textContent =
    [c.level, c.teacherName || c.teacherId,
     c.day && c.time ? `${c.day} ${c.time}` : "",
     c.day2 && c.time2 ? `${c.day2} ${c.time2}` : ""].filter(Boolean).join(" · ");
  const students = v2StudentsForClass(c);
  document.getElementById("classWorkspaceStudents").innerHTML = students.length
    ? students.map(s => {
        const n = [s.firstName,s.surname].filter(Boolean).join(" ") || s.name || "Student";
        return `<div class="class-student-row"><div><strong>${escapeHtml(n)}</strong><span>${escapeHtml(s.level || "—")}</span></div><div>${escapeHtml(s.email || s.phone || "—")}</div></div>`;
      }).join("")
    : `<div class="empty-state">No students assigned to this class yet.</div>`;
  document.getElementById("classWorkspaceAttendance").dataset.classId = c.id;
  modal.classList.add("is-open"); modal.setAttribute("aria-hidden","false");
}
function closeClassWorkspace() {
  const m=document.getElementById("classWorkspaceModal");
  if(m){m.classList.remove("is-open");m.setAttribute("aria-hidden","true");}
}
function goToClassAttendance() {
  const id=document.getElementById("classWorkspaceAttendance").dataset.classId;
  closeClassWorkspace(); location.hash="#attendance";
  setTimeout(()=>{
    const s=document.getElementById("attendanceClass");
    if(s){s.value=id;s.dispatchEvent(new Event("change",{bubbles:true}));}
  },150);
}
function enhanceV2ClassActions() {
  const classes=state.classes||[];
  const buttons=[...document.querySelectorAll("button")];
  classes.forEach(c=>{
    if(document.querySelector(`[data-v2-open-class="${CSS.escape(String(c.id))}"]`)) return;
    const edit=buttons.find(b=>{
      const t=(b.textContent||"").trim().toLowerCase(), oc=b.getAttribute("onclick")||"";
      return t==="edit" && oc.includes(String(c.id));
    });
    if(!edit||!edit.parentElement)return;
    const b=document.createElement("button");
    b.type="button"; b.className=edit.className; b.textContent="Open class";
    b.dataset.v2OpenClass=String(c.id); b.onclick=()=>openClassWorkspace(c.id);
    edit.parentElement.insertBefore(b,edit);
  });
}
if(typeof renderAll==="function"){
  const _renderAll=renderAll;
  renderAll=function(...a){const r=_renderAll.apply(this,a);setTimeout(enhanceV2ClassActions,0);return r;};
}
window.addEventListener("hashchange",()=>setTimeout(enhanceV2ClassActions,80));
setTimeout(enhanceV2ClassActions,150);



/* =========================================================
   V2.5 NEXT BUILD — LIVE TEACHER ATTENDANCE
   Google Sheets backed. Existing portal UI is retained.
========================================================= */

let llsLivePortalData = { students: [], classes: [], enrolments: [] };
let llsLiveAttendance = [];
let llsAttendanceLoadedKey = "";

/* 27 Sept: Google Apps Script drops replies (HTTP 404 / an HTML page)
   when a browser fires many requests at once. Send at most 2 at a time.
   30 Sept (speed): 1) every request now gives up after a time limit, so
   one reply Google never sends can't block a lane for minutes (the cause
   of "the portal takes minutes"); the usual retry then runs. 2) Requests
   the person is waiting for (register, lesson, saves, login) go ahead of
   background loads (finance, enquiries, teachers, version check). */
let llsActiveRequests = 0;
const llsRequestWaiters = [];      // someone is waiting on screen
const llsBackgroundWaiters = [];   // can wait
// 5 Oct (speed): start with the Apps Script version seen last time, so
// panels that depend on it don't wait for "ping" (it's re-checked anyway).
try { const v = Number(localStorage.getItem("lls_server_version")); if (v > 0 && window.llsServerVersion === undefined) window.llsServerVersion = v; } catch (_) {}
const LLS_BACKGROUND_ACTIONS = new Set(["ping", "getEnquiries", "getFinanceData", "getTeachers", "getOneToOneHours"]);
const LLS_READ_TIMEOUT_MS = 20000;
const LLS_SAVE_TIMEOUT_MS = 60000;

function llsNextRequest_() {
  const next = llsRequestWaiters.shift() || llsBackgroundWaiters.shift();
  if (next) next();
}

async function llsFetch_(url, options, opts = {}) {
  // 30 Sept: saves never queue behind reads. Opening a lesson starts two
  // slow reads, which used to hold the save back for 20–30 seconds.
  const lane = !opts.save;
  if (lane && llsActiveRequests >= 3) {
    await new Promise((resolve) => (opts.background ? llsBackgroundWaiters : llsRequestWaiters).push(resolve));
  }
  if (lane) llsActiveRequests++;
  const controller = (typeof AbortController === "function") ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), opts.timeoutMs || LLS_READ_TIMEOUT_MS) : null;
  try {
    const response = await fetch(url, Object.assign({}, options, controller ? { signal: controller.signal } : {}));
    // Read the body inside the time limit and the lane, so a reply that
    // stops half-way can't hang either.
    const body = await response.text();
    return { ok: response.ok, status: response.status, text: async () => body };
  } catch (error) {
    if (error && error.name === "AbortError") {
      const e = new Error("Google took too long to answer");
      e.timeout = true;
      throw e;
    }
    throw error;
  } finally {
    if (timer) clearTimeout(timer);
    if (lane) {
      llsActiveRequests--;
      llsNextRequest_();
    }
  }
}

// Changes that are safe to send twice (logins, "set to this value" edits,
// registers and notes that replace the same row). Anything that ADDS a row
// is only retried with Apps Script V25, which recognises the receipt.
const LLS_SAFE_TO_RESEND = new Set([
  "adminLogin", "teacherPortalLogin", "teacherLogin", "studentCodeLogin",
  "saveAttendance", "saveLessonLog", "saveLesson", "updateClass", "updateStudent", "updateEnquiry",
  "updateFee", "updateTeacher", "updateHomework", "markHomeworkStatus", "setSpeakingCoach", "markHomeworkFeedback", "removeFile", "reportLessonIssue", "resolveLessonIssue"
]);
const LLS_LOGIN_ACTIONS = new Set(["adminLogin", "teacherPortalLogin", "teacherLogin"]);

// 5 Oct (speed): identical reads that are already on their way are shared,
// and a few slow, often-repeated reads are remembered for 60 seconds.
// Any save clears the memory, so nobody sees old data after a change.
const llsGetInFlight_ = new Map();
const llsGetMemory_ = new Map();
const LLS_REMEMBER_READS = new Set(["getLessonDates", "ping"]);
function llsForgetReads_() { llsGetMemory_.clear(); }
async function llsApiGet(action, params = {}, opts = {}) {
  const shareKey = action + "|" + JSON.stringify(Object.entries(params || {}).filter(([, v]) => v !== undefined && v !== null && String(v) !== "").sort());
  const remembered = llsGetMemory_.get(shareKey);
  if (remembered && Date.now() - remembered.at < 60000) return remembered.data;
  if (llsGetInFlight_.has(shareKey)) return llsGetInFlight_.get(shareKey);
  const job = llsApiGetNow_(action, params, opts).then((data) => {
    if (LLS_REMEMBER_READS.has(action)) llsGetMemory_.set(shareKey, { at: Date.now(), data });
    return data;
  }).finally(() => llsGetInFlight_.delete(shareKey));
  llsGetInFlight_.set(shareKey, job);
  return job;
}
async function llsApiGetNow_(action, params = {}, opts = {}) {
  const url = new URL(LLS_API_URL);
  url.searchParams.set("action", action);
  url.searchParams.set("t", Date.now());
  url.searchParams.set("token", sessionStorage.getItem(LLS_ADMIN_TOKEN_KEY) || "");
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value) !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  // 27 Sept: Google sometimes loses the reply (HTTP 404 from
  // googleusercontent, or an unreadable page). Reading is safe to repeat,
  // so try up to 3 times before giving up.
  let data = null;
  let problem = "";
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt) {
      url.searchParams.set("t", Date.now());
      await new Promise((resolve) => setTimeout(resolve, attempt * 1200));
    }
    try {
      const response = await llsFetch_(url.toString(), { method: "GET", cache: "no-store", redirect: "follow" },
        { background: Boolean(opts.background) || LLS_BACKGROUND_ACTIONS.has(action) });
      if (!response.ok) { problem = `HTTP ${response.status}`; continue; }
      const raw = await response.text();
      try { data = JSON.parse(raw); } catch (_) { problem = "Apps Script did not return JSON."; continue; }
      break;
    } catch (error) {
      problem = error && error.timeout ? "no reply in 20 seconds" : "no connection";
    }
  }
  if (!data) throw new Error(`Google didn't answer this time (${problem}). Wait a few seconds and try again.`);
  if (!data || data.success !== true) {
    if (data && data.error === "UNAUTHORIZED" && typeof llsHandleSessionExpired === "function") {
      llsHandleSessionExpired();
    }
    throw new Error(data?.error || "API request failed.");
  }
  return data;
}

async function llsApiPost(body) {
  // V12.3: form POST avoids the intermittent Apps Script GET redirect/404.
  // V15: every mutation carries the admin session token.
  const payload = Object.assign({}, body || {}, {
    token: sessionStorage.getItem(LLS_ADMIN_TOKEN_KEY) || "",
    // 27 Sept: a receipt number per save. Apps Script V25 remembers it for
    // 10 minutes, so re-sending after a lost reply never saves twice.
    requestId: (body && body.requestId) || ((window.crypto && crypto.randomUUID) ? crypto.randomUUID() : `r${Date.now()}${Math.random().toString(36).slice(2)}`)
  });
  const act = String(payload.action || "");
  const canRetry = (window.llsServerVersion || 0) >= 25 ||
    LLS_SAFE_TO_RESEND.has(act) || (act === "createStudentLink" && !payload.reset);
  let lastProblem = null;
  for (let attempt = 0; attempt < (canRetry ? 3 : 1); attempt++) {
    if (attempt) await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
    try {
      return await llsSendMutation_(payload);
    } catch (error) {
      if (!error.transport) throw error; // the server answered: a real error
      lastProblem = error;
      console.warn("LLS save: reply lost, attempt", attempt + 1, error.message);
    }
  }
  if (LLS_LOGIN_ACTIONS.has(act) || act === "createStudentLink") {
    throw new Error("Google didn't answer (" + (lastProblem?.message || "no reply") + "). Wait a few seconds and try again.");
  }
  const uncertain = new Error(
    "Google didn't confirm the save (" + (lastProblem?.message || "no reply") + "). " +
    "It has probably been saved: the page has been refreshed, so check the list before saving again."
  );
  uncertain.uncertain = true;
  try { if (typeof llsRefreshAfterUncertainSave_ === "function") llsRefreshAfterUncertainSave_(); } catch (_) {}
  throw uncertain;
}

async function llsSendMutation_(payload) {
  llsForgetReads_();
  const transportError = (message) => { const e = new Error(message); e.transport = true; return e; };

  // V15.3: send changes through the script's GET "mutate" route.
  // Apps Script answers POSTs with a redirect that intermittently comes
  // back as HTTP 404 in the browser (the change may or may not have been
  // saved). GET requests to the same script are reliable, so use GET
  // unless the change is too large to fit in a URL.
  const getUrl = new URL(LLS_API_URL);
  getUrl.searchParams.set("action", "mutate");
  getUrl.searchParams.set("payload", JSON.stringify(payload));
  getUrl.searchParams.set("_", String(Date.now()));

  let response;

  try {
  if (getUrl.toString().length <= 7000) {
    response = await llsFetch_(getUrl.toString(), {
      method: "GET",
      cache: "no-store",
      redirect: "follow"
    }, { timeoutMs: LLS_SAVE_TIMEOUT_MS, save: true });
  } else {
    const form = new URLSearchParams();
    form.set("action", String(payload.action || ""));
    form.set("payload", JSON.stringify(payload));
    form.set("_", String(Date.now()));

    response = await llsFetch_(LLS_API_URL, {
      method: "POST",
      body: form,
      cache: "no-store",
      redirect: "follow"
    }, { timeoutMs: LLS_SAVE_TIMEOUT_MS, save: true });
  }
  } catch (error) {
    throw transportError(error && error.timeout ? "no reply in 60 seconds" : "no connection");
  }

  if (!response.ok) throw transportError(`HTTP ${response.status}`);

  let raw = "";
  try { raw = await response.text(); } catch (_) { throw transportError("reply cut off"); }
  let result;
  try {
    result = JSON.parse(raw);
  } catch (_) {
    console.error("LLS mutation returned non-JSON:", raw.slice(0, 500));
    throw transportError("reply was not readable");
  }

  if (!result || result.success !== true) {
    if (result && result.error === "UNAUTHORIZED" && typeof llsHandleSessionExpired === "function") {
      llsHandleSessionExpired();
    }
    throw new Error(result?.error || result?.message || "The server did not confirm the change.");
  }
  return result;
}

function llsStudentName(student) {
  return [student["First Name"] || "", student["Surname"] || ""].join(" ").trim() || student["Student ID"] || "Student";
}

function llsActiveEnrolmentsForClass(classId) {
  return (llsLivePortalData.enrolments || []).filter(item =>
    String(item["Class ID"] || "").trim() === String(classId || "").trim() &&
    String(item["Status"] || "").trim().toLowerCase() === "active"
  );
}

function llsStudentsForClass(classId) {
  const ids = new Set(llsActiveEnrolmentsForClass(classId).map(item => String(item["Student ID"] || "").trim()));
  return (llsLivePortalData.students || []).filter(student => ids.has(String(student["Student ID"] || "").trim()));
}

async function loadLiveAttendanceFoundation(force = false) {
  if (!force && llsLivePortalData.classes.length) return llsLivePortalData;
  // 30 Sept (speed): if the class list is already on its way, wait for it
  // instead of asking Google a second time.
  if (!force && llsCoreLoadPromise) {
    try { await llsCoreLoadPromise; } catch (_) {}
    if (llsLivePortalData.classes.length) { populateLiveAttendanceClasses(); return llsLivePortalData; }
  }
  const data = await llsApiGet("getPortalData");
  llsLivePortalData = {
    students: Array.isArray(data.students) ? data.students : [],
    classes: Array.isArray(data.classes) ? data.classes : [],
    enrolments: Array.isArray(data.enrolments) ? data.enrolments : []
  };
  populateLiveAttendanceClasses();
  return llsLivePortalData;
}

function populateLiveAttendanceClasses() {
  const select = document.getElementById("attendanceClassSelect");
  if (!select) return;
  const previous = select.value;
  const classes = (llsLivePortalData.classes || []).filter(item =>
    !item["Status"] || String(item["Status"]).trim().toLowerCase() === "active"
  );
  select.innerHTML = classes.length
    ? classes.map(item => `<option value="${escapeHtml(String(item["Class ID"] || ""))}">${escapeHtml(String(item["Class Name"] || item["Class ID"] || "Class"))}</option>`).join("")
    : `<option value="">No active classes</option>`;
  if (classes.some(item => String(item["Class ID"] || "") === previous)) select.value = previous;
}

// 28 Sept: each load is numbered; only the latest one may draw the register,
// and rows remember which class+date they belong to, so a register can never
// be saved under the wrong class while Google is still answering.
let llsAttRenderSeq = 0;

async function renderLiveAttendance() {
  const body = document.getElementById("attendanceTableBody");
  if (!body) return;
  const seq = ++llsAttRenderSeq;
  const saveBtn = document.getElementById("saveAttendanceButton");
  const wantKey = `${document.getElementById("attendanceClassSelect")?.value || ""}|${document.getElementById("attendanceDate")?.value || ""}`;
  if (llsAttendanceLoadedKey !== wantKey) {
    body.innerHTML = `<tr><td colspan="4"><div class="empty-state">⏳ Loading the register…</div></td></tr>`;
    llsSetAttendanceStats(0, 0, 0);
    if (saveBtn) saveBtn.disabled = true;
  }

  try {
    await loadLiveAttendanceFoundation();
    const classId = document.getElementById("attendanceClassSelect")?.value || "";
    const lessonDate = document.getElementById("attendanceDate")?.value || "";
    const students = llsStudentsForClass(classId);

    if (!classId) {
      body.innerHTML = `<tr><td colspan="4"><div class="empty-state">Choose a class.</div></td></tr>`;
      llsSetAttendanceStats(0,0,0);
      return;
    }

    const key = `${classId}|${lessonDate}`;
    if (llsAttendanceLoadedKey !== key) {
      const data = await llsApiGet("getAttendance", { classId, lessonDate });
      if (seq !== llsAttRenderSeq) return; // a newer class/date was chosen meanwhile
      llsLiveAttendance = Array.isArray(data.attendance) ? data.attendance : [];
      llsAttendanceLoadedKey = key;
    }
    if (seq !== llsAttRenderSeq) return;

    const byStudent = new Map(llsLiveAttendance.map(item => [String(item["Student ID"] || "").trim(), item]));

    body.innerHTML = students.length ? students.map(student => {
      const studentId = String(student["Student ID"] || "").trim();
      const existing = byStudent.get(studentId) || {};
      const status = String(existing["Status"] || "Present");
      return `
        <tr data-live-attendance-row="${escapeHtml(studentId)}" data-att-key="${escapeHtml(key)}">
          <td><strong>${escapeHtml(llsStudentName(student))}</strong><div class="muted">${escapeHtml(studentId)}</div></td>
          <td>${escapeHtml(String(student["Level"] || "—"))}</td>
          <td>
            <select class="live-attendance-status" data-student-id="${escapeHtml(studentId)}">
              <option value="Present"${status==="Present"?" selected":""}>Present</option>
              <option value="Absent"${status==="Absent"?" selected":""}>Absent</option>
              <option value="Late"${status==="Late"?" selected":""}>Late</option>
              <option value="Excused"${status==="Excused"?" selected":""}>Excused</option>
            </select>
          </td>
          <td><input class="live-attendance-note" data-student-id="${escapeHtml(studentId)}" value="${escapeHtml(String(existing["Notes"] || ""))}" placeholder="Optional note"></td>
        </tr>`;
    }).join("") : `<tr><td colspan="4"><div class="empty-state">No active students are enrolled in this class.</div></td></tr>`;

    body.querySelectorAll(".live-attendance-status").forEach(el => el.addEventListener("change", llsRefreshAttendanceStats));
    llsRefreshAttendanceStats();
    if (saveBtn) saveBtn.disabled = false;
    if (typeof llsLoadLessonLog === "function") llsLoadLessonLog();
  } catch (error) {
    console.error(error);
    if (seq !== llsAttRenderSeq) return;
    if (saveBtn) saveBtn.disabled = false;
    body.innerHTML = `<tr><td colspan="4"><div class="empty-state">Could not load live attendance: ${escapeHtml(error.message)}</div></td></tr>`;
  }
}

function llsRefreshAttendanceStats() {
  const controls = [...document.querySelectorAll(".live-attendance-status")];
  const present = controls.filter(el => ["Present","Late"].includes(el.value)).length;
  const absent = controls.filter(el => ["Absent","Excused"].includes(el.value)).length;
  llsSetAttendanceStats(controls.length, present, absent);
}

function llsSetAttendanceStats(total, present, absent) {
  if (document.getElementById("attendanceTotal")) document.getElementById("attendanceTotal").textContent = total;
  if (document.getElementById("attendancePresent")) document.getElementById("attendancePresent").textContent = present;
  if (document.getElementById("attendanceAbsent")) document.getElementById("attendanceAbsent").textContent = absent;
  if (document.getElementById("attendanceRate")) document.getElementById("attendanceRate").textContent = total ? `${Math.round((present/total)*100)}%` : "0%";
}

async function saveLiveAttendance() {
  const classId = document.getElementById("attendanceClassSelect")?.value || "";
  const lessonDate = document.getElementById("attendanceDate")?.value || "";
  if (!classId || !lessonDate) {
    showToast("Choose a class and lesson date.", "error");
    return;
  }

  const rows = [...document.querySelectorAll("[data-live-attendance-row]")].filter(row => row.dataset.attKey === `${classId}|${lessonDate}`).map(row => {
    const studentId = row.dataset.liveAttendanceRow;
    return {
      studentId,
      status: row.querySelector(".live-attendance-status")?.value || "Present",
      notes: row.querySelector(".live-attendance-note")?.value || ""
    };
  });

  if (!rows.length) {
    showToast(llsAttendanceLoadedKey === `${classId}|${lessonDate}` ? "There are no students in this class." : "Wait until the register has loaded, then save.", "error");
    return;
  }

  const button = document.getElementById("saveAttendanceButton");
  if (button) { button.disabled = true; button.textContent = "Saving…"; }

  try {
    // 30 Sept: saved on this device at once, sent to Google in the background.
    const clsName = (state.classes.find((c) => c.id === classId) || {}).name || "the register";
    llsQueueSave(`${clsName} register`, { action: "saveAttendance", classId, lessonDate, rows });
    // 28 Sept: keep the register on screen (no 30-second reload after saving).
    llsLiveAttendance = rows.map((r) => ({ "Student ID": r.studentId, "Status": r.status, "Notes": r.notes }));
    llsAttendanceLoadedKey = `${classId}|${lessonDate}`;
    showToast("✓ Attendance saved. Sending to Google in the background.", "success");
    if (button) { button.disabled = false; button.textContent = "Save attendance"; }
    llsFlashSaved(button, "✓ Attendance saved");
  } catch (error) {
    console.error(error);
    showToast(error.message || "Attendance could not be saved.", "error");
    if (button) { button.disabled = false; button.textContent = "Save attendance"; }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const classSelect = document.getElementById("attendanceClassSelect");
  const dateInput = document.getElementById("attendanceDate");
  const saveButton = document.getElementById("saveAttendanceButton");

  if (classSelect) {
    classSelect.addEventListener("change", () => {
      llsAttendanceLoadedKey = "";
      renderLiveAttendance();
    });
  }
  if (dateInput) {
    dateInput.addEventListener("change", () => {
      llsAttendanceLoadedKey = "";
      renderLiveAttendance();
    });
  }
  if (saveButton) {
    // Capture phase prevents the old localStorage save handler from becoming the source of truth.
    saveButton.addEventListener("click", event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      saveLiveAttendance();
    }, true);
  }

  // 30 Sept (speed): the page-load fetch (window "load") already brings
  // the class list; draw the register once it arrives instead of asking
  // Google for the same data twice.
});

/* =========================================================
   V14 — HOMEWORK (teacher PIN login + assign / mark done)
   Google Sheets backed. Teacher identity is a lightweight PIN
   check — it attributes homework correctly and keeps each
   teacher's login private, but it does NOT restrict what the
   rest of the admin portal shows. That's a bigger, separate
   step if full role-based access is wanted later.
========================================================= */

const LLS_TEACHER_SESSION_KEY = "lls_teacher_session";
let llsHomeworkCache = { classId: "", homework: [], status: [], files: [] };

function llsGetTeacherSession() {
  try {
    const raw = sessionStorage.getItem(LLS_TEACHER_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

function llsSetTeacherSession(session) {
  try {
    if (session) {
      sessionStorage.setItem(LLS_TEACHER_SESSION_KEY, JSON.stringify(session));
    } else {
      sessionStorage.removeItem(LLS_TEACHER_SESSION_KEY);
    }
  } catch (_) {
    // Private browsing / storage blocked — session just won't persist across a refresh.
  }
}

function renderHomeworkLoginState() {
  const loginPanel = byId("homeworkLoginPanel");
  const workspace = byId("homeworkWorkspace");
  if (!loginPanel || !workspace) return;

  const session = llsGetTeacherSession();

  if (session) {
    loginPanel.style.display = "none";
    workspace.style.display = "";
    const nameEl = byId("homeworkTeacherName");
    if (nameEl) {
      nameEl.textContent = `Logged in as ${session.name || "Teacher"}${session.role ? ` (${session.role})` : ""}`;
    }
    populateHomeworkClassSelect();
    renderHomeworkList();
    if (typeof renderTeacherTests === "function") renderTeacherTests();
  } else {
    loginPanel.style.display = "";
    workspace.style.display = "none";
  }
}

async function llsHomeworkLogin() {
  const idOrEmail = value("homeworkTeacherLoginId").trim();
  const pin = value("homeworkTeacherPin").trim();
  const errorEl = byId("homeworkLoginError");
  const button = byId("homeworkLoginButton");

  if (errorEl) errorEl.style.display = "none";

  if (!idOrEmail || !pin) {
    if (errorEl) {
      errorEl.textContent = "Enter your teacher ID or email, and your PIN.";
      errorEl.style.display = "";
    }
    return;
  }

  if (button) { button.disabled = true; button.textContent = "Logging in…"; }

  try {
    const result = await llsApiPost({
      action: "teacherLogin",
      teacherId: idOrEmail,
      email: idOrEmail,
      pin
    });

    llsSetTeacherSession({
      teacherId: result.teacher?.["Teacher ID"] || "",
      name: result.teacher?.["Name"] || "Teacher",
      email: result.teacher?.["Email"] || "",
      role: result.teacher?.["Role"] || ""
    });

    setValue("homeworkTeacherPin", "");
    renderHomeworkLoginState();
  } catch (error) {
    if (errorEl) {
      errorEl.textContent = error.message || "Could not log in. Check your ID/email and PIN.";
      errorEl.style.display = "";
    }
  } finally {
    if (button) { button.disabled = false; button.textContent = "Log in"; }
  }
}

function llsHomeworkLogout() {
  llsSetTeacherSession(null);
  renderHomeworkLoginState();
}

function populateHomeworkClassSelect() {
  const select = byId("homeworkClassSelect");
  if (!select) return;
  const previous = select.value;

  const classes = (llsLivePortalData.classes || []).filter(item =>
    !item["Status"] || String(item["Status"]).trim().toLowerCase() === "active"
  );

  // Teachers: their own classes first, and preselect the class open on the
  // Lesson page (or their first class) instead of the first class overall.
  const names = typeof llsMyNames === "function" ? llsMyNames() : null;
  const isMine = (item) => {
    if (!names) return false;
    const words = String(item["Teacher"] || "").toLowerCase().split(/[^a-zà-ú]+/);
    return words.some((w) => names.has(w));
  };
  const option = (item) => `<option value="${escapeHtml(String(item["Class ID"] || ""))}">${escapeHtml(String(item["Class Name"] || item["Class ID"] || "Class"))}</option>`;
  const mine = classes.filter(isMine);
  const others = classes.filter((c) => !isMine(c));
  select.innerHTML = !classes.length
    ? `<option value="">No active classes</option>`
    : mine.length
      ? `<optgroup label="My classes">${mine.map(option).join("")}</optgroup><optgroup label="Other classes">${others.map(option).join("")}</optgroup>`
      : classes.map(option).join("");

  const has = (id) => id && classes.some((item) => String(item["Class ID"] || "") === id);
  let lessonClass = "";
  try { lessonClass = llsLesson.classId || ""; } catch (_) { /* Lesson page not initialised yet */ }
  if (has(previous)) select.value = previous;
  else if (has(lessonClass)) select.value = lessonClass;
  else if (mine.length) select.value = String(mine[0]["Class ID"] || "");
  try { llsHomeworkPageDueChips(); } catch (_) {}
  try { llsHomeworkPageWb_(); } catch (_) {}
}

async function renderHomeworkList(mode) {
  const body = byId("homeworkListBody");
  if (!body) return;

  const classId = value("homeworkClassSelect");

  if (!classId) {
    body.innerHTML = tableEmptyRow(5, "Choose a class.");
    return;
  }

  try {
    // 30 Sept: "cache" repaints without asking Google again.
    const data = mode === "cache" && llsHomeworkCache.classId === classId
      ? llsHomeworkCache
      : await llsApiGet("getHomeworkForClass", { classId });
    llsHomeworkCache = { classId, homework: data.homework || [], status: data.status || [], files: data.files || [] };
    llsApplyQueuedHomework_(llsHomeworkCache);

    const totalStudents = llsStudentsForClass(classId).length;

    if (!llsHomeworkCache.homework.length) {
      body.innerHTML = tableEmptyRow(5, "No homework assigned yet for this class.");
      return;
    }

    body.innerHTML = llsHomeworkCache.homework
      .slice()
      .sort((a, b) => llsDateOnly(b["Due Date"]).localeCompare(llsDateOnly(a["Due Date"])))
      .map(item => {
        const homeworkId = String(item["Homework ID"] || "");
        const done = llsHomeworkCache.status.filter(s =>
          String(s["Homework ID"] || "") === homeworkId &&
          String(s["Status"] || "") === "Done"
        ).length;

        const f = llsHwFileCounts_(homeworkId);
        return `
          <tr>
            <td><strong>${escapeHtml(String(item["Title"] || ""))}</strong></td>
            <td>${item["Due Date"] ? escapeHtml(formatDate(llsDateOnly(item["Due Date"]))) : "—"}</td>
            <td>${done} / ${totalStudents}</td>
            <td>${f.teacher ? `📎 ${f.teacher}` : ""}${f.students ? ` <span class="hw-files-in${f.toMark ? " has-new" : ""}" title="Students who handed in work${f.toMark ? " (" + f.toMark + " to mark)" : ""}">📥 ${f.students}${f.toMark ? ` · ${f.toMark} to mark` : ""}</span>` : ""}${!f.teacher && !f.students ? "—" : ""}</td>
            <td class="table-actions-cell">
              <button class="row-action" type="button" data-view-homework="${escapeAttribute(homeworkId)}">
                View / Mark
              </button>
              ${homeworkId.startsWith("pending-") ? "" : `<button class="row-action" type="button" data-hw-files="${escapeAttribute(homeworkId)}">📎 Files</button>`}
            </td>
          </tr>
        `;
      })
      .join("");

    body.querySelectorAll("[data-view-homework]").forEach(button => {
      button.addEventListener("click", () => openHomeworkStatusModal(button.dataset.viewHomework));
    });
    body.querySelectorAll("[data-hw-files]").forEach(button => {
      button.addEventListener("click", () => llsOpenHwFiles(button.dataset.hwFiles));
    });
  } catch (error) {
    console.error(error);
    body.innerHTML = tableEmptyRow(5, "Could not load homework: " + error.message);
  }
}

function openHomeworkStatusModal(homeworkId) {
  const homework = llsHomeworkCache.homework.find(item => String(item["Homework ID"] || "") === homeworkId);
  if (!homework) return;

  const students = llsStudentsForClass(llsHomeworkCache.classId);
  const statusByStudent = new Map(
    llsHomeworkCache.status
      .filter(s => String(s["Homework ID"] || "") === homeworkId)
      .map(s => [String(s["Student ID"] || "").trim(), s])
  );

  text("homeworkStatusTitle", String(homework["Title"] || "Homework"));

  const list = byId("homeworkStatusList");
  list.innerHTML = students.length
    ? students.map(student => {
        const studentId = String(student["Student ID"] || "").trim();
        const record = statusByStudent.get(studentId);
        const isDone = record && String(record["Status"] || "") === "Done";
        const work = llsHwWorkFor_(homeworkId, studentId);
        const mark = String(record?.["Mark"] || ""), feedback = String(record?.["Feedback"] || "");

        return `
          <div class="homework-status-row">
            <span>${escapeHtml(llsStudentName(student))}${work.length ? ` <span class="hw-files-in${mark || feedback ? "" : " has-new"}">📥 ${work.length}</span>` : ""}${mark ? ` <span class="hw-mark">⭐ ${escapeHtml(mark)}</span>` : ""}</span>
            ${statusBadge(isDone ? "Done" : "Not started")}
            <button
              class="button ${isDone ? "button-secondary" : "button-primary"}"
              type="button"
              data-mark-homework="${escapeAttribute(homeworkId)}"
              data-mark-student="${escapeAttribute(studentId)}"
              data-mark-next="${isDone ? "Not started" : "Done"}"
            >
              ${isDone ? "Mark not done" : "Mark done"}
            </button>
          </div>
          ${work.length || mark || feedback ? `<div class="hw-work" data-work-student="${escapeAttribute(studentId)}">
            ${work.length ? `<div class="hw-file-chips">${work.map((x) => llsFileChip_(x)).join("")}</div>` : ""}
            <div class="hw-mark-form">
              <input type="text" maxlength="40" placeholder="Mark, e.g. 8/10 or ⭐⭐⭐" value="${escapeAttribute(mark)}" data-mark-input>
              <textarea rows="2" maxlength="1500" placeholder="Comment for the student (they see it in their app)" data-feedback-input>${escapeHtml(feedback)}</textarea>
              <button class="button button-primary" type="button" data-save-mark="${escapeAttribute(studentId)}">${mark || feedback ? "Update mark" : "Save mark"}</button>
            </div>
          </div>` : ""}
        `;
      }).join("")
    : `<div class="empty-state">No active students are enrolled in this class.</div>`;

  llsWireFileChips_(list);
  list.querySelectorAll("[data-save-mark]").forEach((button) => button.addEventListener("click", () => {
    const box = button.closest("[data-work-student]");
    llsSaveHwMark_(homeworkId, button.dataset.saveMark, box.querySelector("[data-mark-input]").value, box.querySelector("[data-feedback-input]").value);
  }));
  list.querySelectorAll("[data-mark-homework]").forEach(button => {
    button.addEventListener("click", () => {
      // 30 Sept: ticks at once; Google catches up in the background.
      const hwId = button.dataset.markHomework, stId = button.dataset.markStudent, next = button.dataset.markNext;
      const rec = llsHomeworkCache.status.find((s) => String(s["Homework ID"] || "") === hwId && String(s["Student ID"] || "").trim() === stId);
      if (rec) rec["Status"] = next;
      else llsHomeworkCache.status.push({ "Homework ID": hwId, "Student ID": stId, "Status": next });
      llsQueueSave("homework ticks", { action: "markHomeworkStatus", homeworkId: hwId, studentId: stId, status: next });
      openHomeworkStatusModal(homeworkId);
      llsRepaintHomeworkCounts_();
    });
  });

  openModal("homeworkStatusModal");
}

async function llsHomeworkAssign() {
  const session = llsGetTeacherSession();
  if (!session) {
    showToast("Log in first.", "error");
    return;
  }

  const classId = value("homeworkClassSelect");
  const title = value("homeworkTitle").trim();
  const description = value("homeworkDescription").trim();
  const dueDate = value("homeworkDueDate");

  if (!classId || !title) {
    showToast("Choose a class and enter a title.", "error");
    return;
  }

  const assignedDate = isoDate(new Date());
  // 2 Oct: with files, the homework is created first (it needs its number), then the files go up.
  const picked = Array.from(byId("homeworkFiles")?.files || []);
  if (picked.length) {
    const btn = byId("homeworkAssignButton");
    if (btn) { btn.disabled = true; btn.textContent = "Assigning…"; }
    try {
      const made = await llsApiPost({ action: "createHomework", classId, teacherId: session.teacherId, title, description, assignedDate, dueDate });
      const sent = await llsUploadHwFiles_(made.homeworkId, picked);
      setValue("homeworkTitle", "");
      setValue("homeworkDescription", "");
      setValue("homeworkDueDate", "");
      try { llsHomeworkPageDueChips(); delete llsWbState.homeworkWbBox; llsHomeworkPageWb_(); } catch (_) {}
      if (byId("homeworkFiles")) byId("homeworkFiles").value = "";
      llsHwFilesPickedLabel_();
      showToast(sent === picked.length ? "Homework assigned with " + sent + " file" + (sent === 1 ? "" : "s") + "." : "Homework assigned. Some files didn't upload: add them with 📎 Files.", sent === picked.length ? "success" : "error");
      renderHomeworkList();
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = "+ Assign homework"; }
    }
    return;
  }
  // 30 Sept: shows in the list at once; Google catches up in the background.
  llsQueueSave(`homework "${title}"`, { action: "createHomework", classId, teacherId: session.teacherId, title, description, assignedDate, dueDate });
  if (llsHomeworkCache.classId === classId) {
    llsHomeworkCache.homework.push({ "Homework ID": "pending-" + Date.now(), "Class ID": classId, "Title": title, "Description": description, "Assigned Date": assignedDate, "Due Date": dueDate });
    llsRepaintHomeworkCounts_();
  }
  setValue("homeworkTitle", "");
  setValue("homeworkDescription", "");
  setValue("homeworkDueDate", "");
  try { llsHomeworkPageDueChips(); delete llsWbState.homeworkWbBox; llsHomeworkPageWb_(); } catch (_) {}
  showToast("Homework assigned.", "success");
}

document.addEventListener("DOMContentLoaded", () => {
  const loginButton = byId("homeworkLoginButton");
  const pinField = byId("homeworkTeacherPin");
  const logoutButton = byId("homeworkLogoutButton");
  const classSelect = byId("homeworkClassSelect");
  const assignButton = byId("homeworkAssignButton");

  if (loginButton) loginButton.addEventListener("click", llsHomeworkLogin);
  if (pinField) pinField.addEventListener("keydown", (event) => {
    if (event.key === "Enter") llsHomeworkLogin();
  });
  if (logoutButton) logoutButton.addEventListener("click", llsHomeworkLogout);
  if (classSelect) classSelect.addEventListener("change", renderHomeworkList);
  if (assignButton) assignButton.addEventListener("click", llsHomeworkAssign);

  renderHomeworkLoginState();
});

/* =========================================================
   V15 — ADMIN PORTAL LOGIN GATE
   Protects the whole admin portal behind one shared password,
   checked server-side by Apps Script (never stored in this file).
   Separate from the per-teacher PIN system on the Homework page.
========================================================= */

const LLS_ADMIN_TOKEN_KEY = "lls_admin_session_token";
const LLS_ROLE_KEY = "lls_session_role";

function llsRole() {
  try { return sessionStorage.getItem(LLS_ROLE_KEY) || "admin"; } catch (_) { return "admin"; }
}

function llsIsTeacher() {
  return llsHasAdminSession() && llsRole() === "teacher";
}

function llsHasAdminSession() {
  return !!sessionStorage.getItem(LLS_ADMIN_TOKEN_KEY);
}

// 28 Sept: while logged in, the page has NO password box. Otherwise Chrome
// treats other boxes (homework title, search) as login fields and fills
// in saved emails, which could be sent to students as homework.
function llsLoginPasswordBoxes(on) {
  ["adminLoginPassword", "teacherLoginPin"].forEach((id) => {
    const el = byId(id);
    if (!el) return;
    el.type = on ? "password" : "text";
    el.disabled = !on;
    el.setAttribute("autocomplete", on ? "current-password" : "off");
    if (!on) el.value = "";
  });
  const tid = byId("teacherLoginId");
  if (tid) { tid.disabled = !on; tid.setAttribute("autocomplete", on ? "username" : "off"); }
}

function llsNoAutofill() {
  document.querySelectorAll("input, textarea").forEach((el) => {
    if (el.closest("#adminLoginForm")) return;
    if (/^(checkbox|radio|date|file|hidden|button|submit|number)$/i.test(el.type || "")) return;
    el.setAttribute("autocomplete", "off");
  });
}

function llsAdminGateShow() {
  const gate = byId("adminLoginGate");
  llsLoginPasswordBoxes(true);
  if (gate) gate.style.display = "flex";
}

function llsAdminGateHide() {
  const gate = byId("adminLoginGate");
  if (gate) gate.style.display = "none";
  llsLoginPasswordBoxes(false);
  try { llsNoAutofill(); } catch (_) {}
}

function llsHandleSessionExpired() {
  sessionStorage.removeItem(LLS_ADMIN_TOKEN_KEY);
  llsAdminGateShow();
  showToast("Your session expired. Please log in again.", "error");
}

// Run immediately (script executes after the DOM is parsed, since it's
// loaded at the end of <body>): show or hide the gate before anything
// else the page does.
if (llsHasAdminSession()) {
  llsAdminGateHide();
} else {
  llsAdminGateShow();
}

document.addEventListener("DOMContentLoaded", () => {
  const form = byId("adminLoginForm");
  const errorEl = byId("adminLoginError");
  const submitBtn = byId("adminLoginSubmit");
  if (!form) return;

  // V22: Office/Admin (password) or Teacher (ID + PIN).
  let loginMode = "office";
  const setMode = (mode) => {
    loginMode = mode;
    byId("officeLoginFields").hidden = mode !== "office";
    byId("teacherLoginFields").hidden = mode !== "teacher";
    byId("loginAsOffice").className = `button ${mode === "office" ? "button-primary" : "button-secondary"}`;
    byId("loginAsTeacher").className = `button ${mode === "teacher" ? "button-primary" : "button-secondary"}`;
    byId("loginAsOffice").setAttribute("aria-pressed", String(mode === "office"));
    byId("loginAsTeacher").setAttribute("aria-pressed", String(mode === "teacher"));
    text("loginHelp", mode === "office"
      ? "Enter the portal password to continue."
      : "Log in with your teacher ID (or email) and PIN. You'll see your classes, attendance and homework.");
    (mode === "office" ? byId("adminLoginPassword") : byId("teacherLoginId"))?.focus();
  };
  byId("loginAsOffice")?.addEventListener("click", () => setMode("office"));
  byId("loginAsTeacher")?.addEventListener("click", () => setMode("teacher"));

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const password = byId("adminLoginPassword")?.value || "";

    if (errorEl) { errorEl.style.display = "none"; errorEl.textContent = ""; }
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Logging in…"; }

    try {
      if (loginMode === "teacher") {
        const idOrEmail = value("teacherLoginId").trim();
        const result = await llsApiPost({
          action: "teacherPortalLogin",
          teacherId: idOrEmail,
          email: idOrEmail,
          pin: value("teacherLoginPin").trim()
        });
        sessionStorage.setItem(LLS_ADMIN_TOKEN_KEY, result.token);
        sessionStorage.setItem(LLS_ROLE_KEY, "teacher");
        llsSetTeacherSession({
          teacherId: result.teacher?.["Teacher ID"] || "",
          name: result.teacher?.["Name"] || "Teacher",
          email: result.teacher?.["Email"] || "",
          role: result.teacher?.["Role"] || ""
        });
        window.location.reload();
        return;
      }
      const result = await llsApiPost({ action: "adminLogin", password });
      sessionStorage.setItem(LLS_ADMIN_TOKEN_KEY, result.token);
      sessionStorage.setItem(LLS_ROLE_KEY, "admin");
      // Reload so every page-load data fetch (core data, finance,
      // teachers, enquiries) picks up the new session token cleanly.
      window.location.reload();
    } catch (error) {
      if (errorEl) {
        const raw = String(error.message || "");
        errorEl.textContent =
          /Incorrect PIN/i.test(raw) ? "That PIN isn't right. Check it, or open \"Forgotten your PIN?\" below." :
          /Teacher not found/i.test(raw) ? "No teacher has that ID or email. Try your Teacher ID (e.g. TCH0002)." :
          /not active/i.test(raw) ? "This teacher account is switched off. Ask the office." :
          /password/i.test(raw) && /incorrect|invalid|wrong/i.test(raw) ? "That password isn't right. Check Caps Lock and try again." :
          raw || "Login failed. Check the password and try again.";
        byId("loginForgot")?.setAttribute("open", "");
        errorEl.style.display = "block";
      }
    } finally {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "Log in"; }
    }
  });

  const logoutButton = byId("adminLogoutButton");
  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      sessionStorage.removeItem(LLS_ADMIN_TOKEN_KEY);
      sessionStorage.removeItem(LLS_ROLE_KEY);
      // V15.1: don't leave student/parent data cached on this computer.
      try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
      llsForgetCachedData_();
      try { sessionStorage.removeItem(LLS_TEACHER_SESSION_KEY); } catch (_) {}
      window.location.reload();
    });
  }
});


/* =========================================================
   V16 — STUDENT HOMEWORK LINKS
   Each student gets a private link to homework.html?k=KEY.
   The key is made by Apps Script (createStudentLink) and stored
   in the Students sheet. Staff copy it or send it by WhatsApp.
========================================================= */

let llsHomeworkLinkStudentId = "";

function llsHomeworkPageUrl(key) {
  const url = new URL("homework.html", location.href);
  url.search = "";
  url.hash = "";
  url.searchParams.set("k", key);
  return url.toString();
}

async function openHomeworkLink(studentId, reset = false) {
  const student = getStudent(studentId);
  if (!student) return;

  llsHomeworkLinkStudentId = studentId;
  text("homeworkLinkTitle", `App link — ${getStudentName(student)}`);
  setValue("homeworkLinkUrl", "Creating link…");
  text("homeworkLinkNote", "");
  // 30 Sept: buttons stay locked until this student's link is ready.
  // (Pressing "Open app" too early used to open the staff portal instead.)
  llsLinkButtonsReady_(false);
  openModal("homeworkLinkModal");

  // 30 Sept: a student who already has a key opens instantly: the key is
  // already in the data the portal loaded, so there's no need to ask Google.
  const raw = (llsLivePortalData.students || []).find((r) => String(r["Student ID"] || "").trim() === studentId) || {};
  const knownKey = String(raw["Access Key"] || "").trim();
  const knownCode = String(raw["Login Code"] || "").trim();

  try {
    const result = !reset && knownKey.length >= 20
      ? { key: knownKey, code: knownCode }
      : await llsApiPost({ action: "createStudentLink", studentId, reset });
    if (llsHomeworkLinkStudentId !== studentId) return; // another student was opened meanwhile
    raw["Access Key"] = result.key;
    if (result.code) raw["Login Code"] = result.code;
    const link = llsHomeworkPageUrl(result.key);
    setValue("homeworkLinkUrl", link);

    byId("homeworkLinkWhatsApp").href = llsAppWhatsAppHref(student, link, result.code);
    if (byId("homeworkLinkOpen")) byId("homeworkLinkOpen").href = link;
    llsLinkButtonsReady_(true);
    const codeText = result.code ? `Student Portal code: ${result.code}. ` : "";
    text(
      "homeworkLinkNote",
      reset
        ? `${codeText}New link and code made. The old slip no longer works.`
        : `${codeText}Keep the link and code private: anyone with them can see this student's homework.`
    );
  } catch (error) {
    console.error(error);
    setValue("homeworkLinkUrl", "");
    text(
      "homeworkLinkNote",
      /Unknown mutation action/i.test(error.message || "")
        ? "The Apps Script hasn't been updated yet (V16 needed)."
        : (error.message || "Could not create the link.")
    );
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const copyButton = byId("homeworkLinkCopy");
  const resetButton = byId("homeworkLinkReset");

  if (copyButton) {
    copyButton.addEventListener("click", async () => {
      const link = value("homeworkLinkUrl");
      if (!/^https?:/.test(link)) return;
      try {
        await navigator.clipboard.writeText(link);
      } catch (_) {
        byId("homeworkLinkUrl").select();
        document.execCommand("copy");
      }
      showToast("Link copied.", "success");
    });
  }

  if (resetButton) {
    resetButton.addEventListener("click", () => {
      if (!llsHomeworkLinkStudentId) return;
      openHomeworkLink(llsHomeworkLinkStudentId, true);
    });
  }
});


/* =========================================================
   V16.1 — HOMEWORK PROGRESS ON THE STUDENT RECORD
   Uses getHomeworkForStudent (admin login required): homework
   for the student's active classes and their done/not-done status.
========================================================= */

async function loadStudentHomeworkProgress(studentId) {
  const box = byId("studentHomeworkProgress");
  if (!box) return;

  box.hidden = false;
  text("studentHomeworkProgressText", "Loading…");
  text("studentHomeworkProgressPct", "");
  text("studentHomeworkProgressList", "");
  byId("studentHomeworkProgressBar").style.width = "0";

  try {
    const data = await llsApiGet("getHomeworkForStudent", { studentId });
    if (value("studentId") !== studentId) return; // modal moved on

    const homework = Array.isArray(data.homework) ? data.homework : [];
    const doneIds = new Set(
      (Array.isArray(data.status) ? data.status : [])
        .filter((row) => String(row["Status"] || "") === "Done")
        .map((row) => String(row["Homework ID"] || ""))
    );

    const total = homework.length;
    const done = homework.filter((h) => doneIds.has(String(h["Homework ID"] || ""))).length;

    // V21: everything set counts equally (homework, tests, reviews, mini tests
    // = 1 point; each lesson practice set = 1/3).
    const tests = Array.isArray(data.tests) ? data.tests : [];
    const testResults = Array.isArray(data.testResults) ? data.testResults : [];
    const testsDone = tests.filter((t) => testResults.some((r) => r.testId === t.testId)).length;
    const p = window.LLS_PRACTICE
      ? LLS_PRACTICE.progressPoints({
          homeworkDone: done, homeworkTotal: total,
          testsDone, testsTotal: tests.length,
          results: Array.isArray(data.practice) ? data.practice : [],
          books: llsBooksForStudent(studentId),
          ratings: (Array.isArray(data.attendance) ? data.attendance : []).map((a) => a.rating).filter(Boolean)
        })
      : { pct: total ? Math.round((done / total) * 100) : 0, available: total, tests: [0, 0], practice: [0, 0] };
    const pct = p.pct;

    text("studentHomeworkProgressText", total ? `${done} of ${total} homework done` : "No homework set for this student's class yet.");
    text("studentHomeworkProgressPct", p.available ? `${pct}%` : "");
    byId("studentHomeworkProgressBar").style.width = `${pct}%`;
    const extra = [];
    if (p.tests[1]) extra.push(`Tests taken: ${p.tests[0]} of ${p.tests[1]}`);
    if (p.practice[1]) extra.push(`Practice: ${Math.round((p.practice[0] / p.practice[1]) * 100)}% of the lessons so far`);
    if (p.lessons && p.lessons[1]) extra.push(`In class: ${Math.round((p.lessons[0] / p.lessons[1]) * 100)}% over ${p.lessons[1]} rated lessons`);
    const results = testResults.map((r) => {
      const t = tests.find((x) => x.testId === r.testId);
      return t ? `${t.title} ${r.first}/${r.total}` : "";
    }).filter(Boolean);
    if (results.length) extra.push(`Test scores: ${results.join(", ")}`);
    text("studentPracticeProgressText", extra.join(" · ") || "No tests or practice yet.");

    const today = isoDate(new Date());
    const missing = homework
      .filter((h) => !doneIds.has(String(h["Homework ID"] || "")) && llsDateOnly(h["Due Date"]) && llsDateOnly(h["Due Date"]) < today)
      .map((h) => String(h["Title"] || "Homework"));

    text(
      "studentHomeworkProgressList",
      missing.length ? `Overdue: ${missing.slice(0, 5).join(", ")}${missing.length > 5 ? "…" : ""}` : ""
    );
  } catch (error) {
    console.error(error);
    text("studentHomeworkProgressText", "Could not load homework progress.");
  }
}


/* =========================================================
   V17 — AI HOMEWORK DRAFTS
   Apps Script V17 calls Claude with the class's level; the draft
   fills Title + Instructions for the teacher to edit, then Assign.
========================================================= */

async function llsCreateHomeworkDraft() {
  const classId = value("homeworkClassSelect");
  const topic = value("homeworkAiTopic").trim();
  const button = byId("homeworkAiButton");
  const message = byId("homeworkAiMessage");

  if (!classId) { showToast("Choose a class first.", "error"); return; }
  if (!topic) { showToast("Write the topic first.", "error"); return; }

  const record = (llsLivePortalData.classes || []).find(
    (item) => String(item["Class ID"] || "").trim() === classId
  ) || {};

  const hasWork = value("homeworkTitle").trim() || value("homeworkDescription").trim();
  if (hasWork && !window.confirm("Replace the title and instructions you have written?")) return;

  if (button) { button.disabled = true; button.textContent = "Writing…"; }
  if (message) message.textContent = "The AI is writing the homework. This takes about 10–20 seconds.";

  try {
    const result = await llsApiPost({
      action: "generateHomework",
      className: String(record["Class Name"] || ""),
      level: String(record["Level"] || ""),
      ages: String(record["Notes"] || ""),
      topic,
      type: value("homeworkAiType"),
      minutes: value("homeworkAiMinutes")
    });

    setValue("homeworkTitle", result.title || "");
    setValue("homeworkDescription", result.instructions || "");
    if (message) message.textContent = "Draft ready below. Read it, change anything you like, set the due date, then Assign.";
    byId("homeworkTitle")?.scrollIntoView({ behavior: "smooth", block: "center" });
  } catch (error) {
    console.error(error);
    const notSetUp = /AI_NOT_SET_UP|Unknown mutation action/i.test(error.message || "");
    if (message) {
      message.textContent = notSetUp
        ? "The AI homework builder isn't switched on yet. Ask Cole."
        : (error.message || "The AI could not create the homework. Try again.");
    }
  } finally {
    if (button) { button.disabled = false; button.textContent = "Create draft"; }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const button = byId("homeworkAiButton");
  if (button) button.addEventListener("click", llsCreateHomeworkDraft);
});


/* =========================================================
   V18 — PRACTICE (course book per class + practice progress)
   practice/courses.js lists the books; the class form sets
   Book / Units / Current Unit; progress = 80% homework + 20% practice.
========================================================= */

function llsFillBookSelect() {
  const select = byId("classBook");
  if (!select || select.dataset.filled === "1" || !window.LLS_COURSES) return;
  Object.values(LLS_COURSES).forEach((course) => {
    const option = document.createElement("option");
    option.value = course.id;
    option.textContent = course.title;
    select.appendChild(option);
  });
  select.dataset.filled = "1";
}

function llsPracticeSummary(studentId, results) {
  const empty = { done: 0, total: 0, label: "" };
  if (!window.LLS_PRACTICE || !window.LLS_COURSES) return empty;

  const classIds = new Set(
    (state.enrolments || [])
      .filter((e) => String(e.studentId || e["Student ID"] || "") === studentId &&
        String(e.status || e["Status"] || "Active").toLowerCase() === "active")
      .map((e) => String(e.classId || e["Class ID"] || ""))
  );
  const student = (state.students || []).find((s) => s.id === studentId);
  if (student && student.classId) classIds.add(String(student.classId));

  const setIds = new Set();
  (state.classes || []).forEach((cls) => {
    if (!classIds.has(cls.id) || !cls.book || !LLS_COURSES[cls.book]) return;
    LLS_PRACTICE.practiceSetIdsFor(cls.book, cls.units, cls.currentUnit).forEach((id) => setIds.add(id));
  });

  const passed = new Set(
    results
      .filter((r) => Number(r.total) > 0 && Number(r.best) / Number(r.total) >= LLS_PRACTICE.PASS_MARK)
      .map((r) => String(r.setId))
  );
  const done = [...setIds].filter((id) => passed.has(id)).length;
  const extra = [...passed].filter((id) => !setIds.has(id)).length;

  if (!setIds.size) {
    return {
      done: 0,
      total: 0,
      label: results.length
        ? `Practice: ${passed.size} set(s) passed. Set a course book on the class to count practice in progress.`
        : "Practice: no course book set for this class yet."
    };
  }

  return {
    done,
    total: setIds.size,
    label: `Practice: ${done} of ${setIds.size} sets passed up to the current unit${extra ? ` (+${extra} extra)` : ""}.`
  };
}


/* =========================================================
   V19 — AI SPEAKING COACH (paid extra)
   The office sets "active until" per student; Apps Script V19
   checks it before every coach reply. Empty date = off.
========================================================= */

function llsCoachIso(raw) {
  const text = String(raw || "").replace(/^'/, "").trim();
  let m = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  m = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  return "";
}

function llsCoachLabel(until) {
  if (!until) return "Off. Set the date the student has paid until to switch it on.";
  const today = isoDate(new Date());
  return until >= today
    ? `On until ${until}. The student sees the Speaking Coach in the Practice tab.`
    : `Expired on ${until}. Set a new date to switch it back on.`;
}

function llsShowCoachBox(student) {
  const box = byId("studentCoachBox");
  if (!box || !student) return;
  box.hidden = false;
  box.dataset.studentId = student.id;
  setValue("studentCoachUntil", student.coachUntil || "");
  text("studentCoachText", llsCoachLabel(student.coachUntil || "") + llsCoachRequestLabel(student));
}

async function llsSaveCoach(until) {
  const box = byId("studentCoachBox");
  const studentId = box?.dataset.studentId || "";
  if (!studentId || studentId !== value("studentId")) return;
  const buttons = [byId("studentCoachSave"), byId("studentCoachOff")];
  buttons.forEach((b) => { if (b) b.disabled = true; });
  try {
    llsQueueSave("the Speaking Coach", { action: "setSpeakingCoach", studentId, until });
    const student = state.students.find((s) => s.id === studentId);
    if (student) student.coachUntil = until;
    saveState();
    setValue("studentCoachUntil", until);
    text("studentCoachText", llsCoachLabel(until));
    showToast(until ? "Speaking Coach switched on." : "Speaking Coach switched off.");
  } catch (error) {
    console.error(error);
    showToast(/unknown mutation/i.test(error.message || "")
      ? "Update the Apps Script to V19 first."
      : "Could not save the coach date.", "error");
  } finally {
    buttons.forEach((b) => { if (b) b.disabled = false; });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  byId("studentCoachSave")?.addEventListener("click", () => {
    const until = value("studentCoachUntil");
    if (!until) { showToast("Choose a date first.", "error"); return; }
    llsSaveCoach(until);
  });
  byId("studentCoachOff")?.addEventListener("click", () => llsSaveCoach(""));
});


/* =========================================================
   V19 — "Record payment" uses the student's open fee
   If the chosen student already has a fee with money still owed,
   the payment goes against that fee instead of creating a second
   (duplicate) course fee.
========================================================= */

function llsOpenFeeForStudent(studentId) {
  return (state.payments || []).find((p) =>
    p.studentId === studentId && number(p.fee) - number(p.paid) > 0.001
  ) || null;
}

document.addEventListener("DOMContentLoaded", () => {
  const select = byId("paymentStudent");
  if (!select) return;
  select.addEventListener("change", () => {
    if (select.disabled) return;
    const open = llsOpenFeeForStudent(select.value);
    if (open) {
      paymentModalMode = "payment";
      setValue("paymentId", open.id);
      setValue("paymentDescription", open.description || "Course fee");
      setValue("paymentFee", number(open.fee));
      byId("paymentDescription").readOnly = true;
      byId("paymentFee").readOnly = true;
      if (byId("paymentPlanBox")) byId("paymentPlanBox").hidden = true;
      showToast(`Owed: ${formatMoney(number(open.fee) - number(open.paid))}. This payment will go against the existing course fee.`);
    } else if (paymentModalMode === "payment") {
      paymentModalMode = "create";
      setValue("paymentId", "");
      setValue("paymentDescription", "");
      setValue("paymentFee", "");
      byId("paymentDescription").readOnly = false;
      byId("paymentFee").readOnly = false;
      if (byId("paymentPlanBox")) byId("paymentPlanBox").hidden = false;
    }
  });
});


/* =========================================================
   V19 — PAYMENT DATES, OVERDUE AND WHATSAPP REMINDERS
   A fee can have up to 3 instalments (amount + due date) in the
   Fees sheet. Payments are counted against them in order, so the
   portal knows the next amount due and whether it is late.
========================================================= */

function llsAddMonths(date, months) {
  const d = new Date(date.getFullYear(), date.getMonth() + months, 1);
  return d;
}

function llsSuggestDueDates(prefix = "conversion") {
  const today = new Date();
  setValue(`${prefix}Due1`, isoDate(today));
  setValue(`${prefix}Due2`, isoDate(llsAddMonths(today, 3)));
  setValue(`${prefix}Due3`, isoDate(llsAddMonths(today, 6)));
  llsShowDueDateFields(prefix);
}

function llsInstalmentCount(plan) {
  if (plan === "Full payment" || /hour pack/i.test(String(plan || ""))) return 1;
  if (plan === "3 instalments") return 3;
  return 0; // Monthly / Other: no fixed dates here
}

function llsShowDueDateFields(prefix = "conversion") {
  const plan = prefix === "payment" ? value("paymentPlan") : value("conversionPaymentPlan");
  const count = llsInstalmentCount(plan);
  document.querySelectorAll(`#${prefix}DueDates [data-instalment]`).forEach((box) => {
    box.hidden = Number(box.dataset.instalment) > count;
  });
  const wrap = byId(`${prefix}DueDates`);
  if (wrap) wrap.hidden = count === 0;
}

// Split the amount into equal whole-euro parts; any remainder goes on the first.
function llsInstalmentFields(plan, amountDue, prefix = "conversion") {
  const count = llsInstalmentCount(plan);
  const fields = {};
  if (!count || !(amountDue > 0)) return fields;
  const part = Math.floor(amountDue / count);
  const first = Math.round((amountDue - part * (count - 1)) * 100) / 100;
  for (let i = 1; i <= count; i++) {
    fields[`Instalment ${i} Amount`] = i === 1 ? first : part;
    fields[`Instalment ${i} Due`] = value(`${prefix}Due${i}`) || "";
  }
  return fields;
}

function llsNextInstalment(fee, paid) {
  const schedule = [];
  for (let i = 1; i <= 3; i++) {
    const amount = number(fee[`Instalment ${i} Amount`]);
    const due = llsDateOnly(fee[`Instalment ${i} Due`]);
    if (amount > 0 && /^\d{4}-\d{2}-\d{2}$/.test(due)) schedule.push({ amount, due });
  }
  if (!schedule.length) return { nextDue: "", nextAmount: 0, overdue: false };

  let cumulative = 0;
  for (const item of schedule) {
    cumulative += item.amount;
    if (cumulative - number(paid) > 0.001) {
      const owed = Math.min(item.amount, cumulative - number(paid));
      return {
        nextDue: item.due,
        nextAmount: Math.round(owed * 100) / 100,
        overdue: item.due < isoDate(new Date())
      };
    }
  }
  return { nextDue: "", nextAmount: 0, overdue: false };
}

function llsNextDueLine(payment) {
  if (!payment.nextDue) return "";
  const colour = payment.overdue ? "#b3261e" : "#56617a";
  const label = payment.overdue ? "Overdue" : "Next";
  return `<div style="font-size: 12px; margin-top: 4px; color: ${colour}; font-weight: ${payment.overdue ? 700 : 500};">
    ${label}: ${escapeHtml(formatMoney(payment.nextAmount))} · ${escapeHtml(formatDate(payment.nextDue))}
  </div>`;
}

function llsWhatsAppNumber(phone) {
  let digits = String(phone || "").replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  else if (digits.startsWith("00")) digits = digits.slice(2);
  else if (/^3\d{8,9}$/.test(digits)) digits = "39" + digits; // Italian mobile
  return digits.length >= 10 ? digits : "";
}

function llsReminderLink(payment, student) {
  if (!payment.overdue || !student) return "";
  const number_ = llsWhatsAppNumber(student.phone);
  if (!number_) return "";
  const name = student.firstName || "";
  const message =
    `Buongiorno! Vi ricordiamo gentilmente che la rata di ${formatMoney(payment.nextAmount)} ` +
    `del corso di inglese${name ? ` di ${name}` : ""} era in scadenza il ${llsItalianDate(payment.nextDue)}. ` +
    `Potete pagare in segreteria o rispondere a questo messaggio per qualsiasi domanda. ` +
    `Se avete già pagato, ignorate pure questo messaggio. Grazie! London Language School`;
  return `<a class="row-action" href="https://wa.me/${number_}?text=${encodeURIComponent(message)}" target="_blank" rel="noopener">WhatsApp reminder</a>`;
}

document.addEventListener("DOMContentLoaded", () => {
  byId("conversionPaymentPlan")?.addEventListener("change", () => llsShowDueDateFields("conversion"));
  byId("paymentPlan")?.addEventListener("change", () => llsShowDueDateFields("payment"));
});

function llsItalianDate(iso) {
  const m = String(iso || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return String(iso || "");
  return new Date(+m[1], +m[2] - 1, +m[3]).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
}


/* =========================================================
   V19 — EDIT A COURSE FEE (total, plan, instalments, notes)
   Uses updateFee (already in the Apps Script since V12).
========================================================= */

function llsFeeEditorCount() {
  const plan = value("feeEditPlan");
  return plan === "Full payment" || /hour pack/i.test(plan) ? 1 : plan === "3 instalments" ? 3 : 0;
}

function llsFeeEditorRefresh() {
  const count = llsFeeEditorCount();
  document.querySelectorAll("#feeEditRows [data-fee-row]").forEach((row) => {
    row.hidden = Number(row.dataset.feeRow) > count;
  });
  byId("feeEditRows").hidden = count === 0;
  const total = number(value("feeEditTotal"));
  let sumParts = 0;
  for (let i = 1; i <= count; i++) sumParts += number(value(`feeEditAmount${i}`));
  const ok = count === 0 || Math.abs(sumParts - total) < 0.01;
  const check = byId("feeEditCheck");
  check.textContent = count ? (ok ? `Payments add up to ${formatMoney(total)} ✓` : `Payments add up to ${formatMoney(sumParts)}, not ${formatMoney(total)}`) : "";
  check.style.color = ok ? "#177b52" : "#b3261e";
  return ok;
}

function llsFeeEditorSplit() {
  const count = llsFeeEditorCount();
  const total = number(value("feeEditTotal"));
  if (!count || !(total > 0)) return;
  const part = Math.floor(total / count);
  const first = Math.round((total - part * (count - 1)) * 100) / 100;
  for (let i = 1; i <= count; i++) setValue(`feeEditAmount${i}`, i === 1 ? first : part);
  if (!value("feeEditDue1")) setValue("feeEditDue1", isoDate(new Date()));
  if (count === 3) {
    if (!value("feeEditDue2")) setValue("feeEditDue2", isoDate(llsAddMonths(new Date(), 3)));
    if (!value("feeEditDue3")) setValue("feeEditDue3", isoDate(llsAddMonths(new Date(), 6)));
  }
  llsFeeEditorRefresh();
}

function llsOpenFeeEditor(feeId) {
  const fee = (llsLiveFinanceData.fees || []).find((f) => String(f["Fee ID"] || "").trim() === feeId);
  if (!fee) {
    showToast("That fee could not be found. Try refreshing.", "error");
    return;
  }
  const student = getStudent(String(fee["Student ID"] || "").trim());
  setValue("feeEditId", feeId);
  setValue("feeEditTotal", number(fee["Amount Due"]));
  const plan = String(fee["Payment Plan"] || "").trim();
  setValue("feeEditPlan", ["Full payment", "3 instalments", "10-hour pack", "Monthly", "Other"].includes(plan) ? plan : "Full payment");
  for (let i = 1; i <= 3; i++) {
    const amount = number(fee[`Instalment ${i} Amount`]);
    setValue(`feeEditAmount${i}`, amount > 0 ? amount : "");
    setValue(`feeEditDue${i}`, llsDateOnly(fee[`Instalment ${i} Due`]) || "");
  }
  setValue("feeEditNotes", String(fee["Notes"] || ""));
  text("feeModalTitle", `Edit course fee — ${getStudentName(student) || "Student"}`);
  llsFeeEditorRefresh();
  openModal("feeModal");
}

async function llsSaveFeeEditor(event) {
  event.preventDefault();
  const feeId = value("feeEditId");
  const total = number(value("feeEditTotal"));
  const plan = value("feeEditPlan");
  const count = llsFeeEditorCount();

  if (!(total >= 0)) { showToast("Enter the total to pay.", "error"); return; }
  if (!llsFeeEditorRefresh()) { showToast("The payments must add up to the total. Press Split total equally or fix the amounts.", "error"); return; }
  for (let i = 1; i <= count; i++) {
    if (number(value(`feeEditAmount${i}`)) > 0 && !value(`feeEditDue${i}`)) {
      showToast(`Add a due date for payment ${i}.`, "error");
      return;
    }
  }

  const fields = { "Amount Due": total, "Payment Plan": plan, "Notes": value("feeEditNotes").trim() };
  for (let i = 1; i <= 3; i++) {
    fields[`Instalment ${i} Amount`] = i <= count ? number(value(`feeEditAmount${i}`)) : 0;
    fields[`Instalment ${i} Due`] = i <= count ? value(`feeEditDue${i}`) : "";
  }

  const button = byId("feeForm").querySelector('button[type="submit"]');
  try {
    llsQueueSave("the course fee", { action: "updateFee", feeId, fields });
    const fee = (llsLiveFinanceData.fees || []).find((f) => String(f["Fee ID"] || "").trim() === feeId);
    if (fee) Object.assign(fee, fields);
    llsRebuildPaymentsState();
    saveState();
    renderAll();
    closeModal("feeModal");
    showToast("Course fee saved.", "success");
  } catch (error) {
    console.error(error);
    showToast(error.message || "The course fee could not be saved.", "error");
  } finally {
    button.disabled = false;
    button.textContent = "Save fee";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  byId("feeForm")?.addEventListener("submit", llsSaveFeeEditor);
  byId("feeEditSplit")?.addEventListener("click", llsFeeEditorSplit);
  ["feeEditPlan", "feeEditTotal", "feeEditAmount1", "feeEditAmount2", "feeEditAmount3"].forEach((id) => {
    byId(id)?.addEventListener("input", llsFeeEditorRefresh);
    byId(id)?.addEventListener("change", llsFeeEditorRefresh);
  });
});


/* =========================================================
   V20 — CLASS RESULTS (mini tests + practice) per class
========================================================= */

function llsClassBookLine(item, studentCount = 0) {
  const course = window.LLS_COURSES && LLS_COURSES[item.book];
  const parts = [];
  if (course) {
    parts.push(course.title);
    if (item.units) parts.push(`units ${item.units}`);
    if (item.currentUnit) parts.push(`now unit ${item.currentUnit}`);
  }
  if (!course && !studentCount) return "";
  return `
    <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-top: 12px; flex-wrap: wrap;">
      <span style="font-size: 13px; color: #56617a;">${course ? `📘 ${escapeHtml(parts.join(" · "))}` : ""}</span>
      <span style="display: flex; gap: 6px; flex-wrap: wrap;">
        ${studentCount ? `<button class="row-action" type="button" data-class-applinks="${escapeHtml(item.id)}">📱 App links</button>` : ""}
        <button class="row-action" type="button" data-class-results="${escapeHtml(item.id)}">Results</button>
      </span>
    </div>`;
}

function llsTestsForClass(cls) {
  const course = LLS_COURSES[cls.book];
  const range = LLS_PRACTICE.parseUnits(cls.book, cls.units);
  return (course.tests || [])
    .map((block, i) => ({ block, n: i + 1 }))
    .filter(({ block }) => block[0] >= range.from && block[1] <= range.to);
}

async function llsOpenClassResults(classId) {
  const cls = state.classes.find((c) => c.id === classId);
  if (!cls || !window.LLS_COURSES || !LLS_COURSES[cls.book]) return;
  const tests = llsTestsForClass(cls);
  text("classResultsTitle", `Results — ${cls.name}`);
  byId("classResultsHead").innerHTML = `<tr><th>Student</th><th>Practice</th>${tests.map(({ block }) =>
    `<th>Test ${block[0] === block[1] ? `U${block[0]}` : `U${block[0]}–${block[1]}`}</th>`).join("")}</tr>`;
  byId("classResultsBody").innerHTML = `<tr><td colspan="${2 + tests.length}">Loading…</td></tr>`;
  openModal("classResultsModal");

  try {
    const data = await llsApiGet("getClassResults", { classId });
    const setIds = new Set(LLS_PRACTICE.practiceSetIdsFor(cls.book, cls.units, cls.currentUnit));
    const rows = (data.students || []).sort((a, b) => a.name.localeCompare(b.name)).map((st) => {
      const results = (data.results || {})[st.id] || [];
      const byId_ = {};
      results.forEach((r) => { byId_[r.setId] = r; });
      const passedCount = [...setIds].filter((id) => {
        const r = byId_[id];
        return r && r.total > 0 && r.best / r.total >= LLS_PRACTICE.PASS_MARK;
      }).length;
      const cells = tests.map(({ n }) => {
        const r = byId_[`${cls.book}-T${n}`];
        if (!r) return `<td style="color:#8a93a6">—</td>`;
        const first = r.first != null ? r.first : r.best;
        const pct = Math.round((first / r.total) * 100);
        const colour = pct >= 70 ? "#177b52" : pct >= 50 ? "#9a5a0c" : "#b3261e";
        return `<td><strong style="color:${colour}">${first}/${r.total}</strong>${r.best !== first ? ` <span style="color:#8a93a6">(${r.best})</span>` : ""}</td>`;
      }).join("");
      return `<tr><td>${escapeHtml(st.name)}</td><td>${passedCount}/${setIds.size}</td>${cells}</tr>`;
    });
    byId("classResultsBody").innerHTML = rows.length ? rows.join("") : `<tr><td colspan="${2 + tests.length}">No students in this class yet.</td></tr>`;
  } catch (error) {
    console.error(error);
    byId("classResultsBody").innerHTML = `<tr><td colspan="${2 + tests.length}">${/unknown action/i.test(error.message || "") ? "Update the Apps Script to V20 to see results." : "Could not load results."}</td></tr>`;
  }
}


/* =========================================================
   V20 — 1-2-1 HOUR PACKS (Fees & Payments page)
   Apps Script getOneToOneHours: hours bought from fees whose plan
   is "N-hour pack", hours used from 1-2-1 attendance.
========================================================= */

let llsHourPacks = { loadedAt: 0, loading: false, students: [], error: "" };

function llsRenderHourPacks() {
  const card = byId("hourPacksCard");
  const body = byId("hourPacksBody");
  if (!card || !body) return;

  const signedIn = (typeof llsHasAdminSession !== "function" || llsHasAdminSession()) &&
    !(typeof llsIsTeacher === "function" && llsIsTeacher());
  if (signedIn && !llsHourPacks.loading && Date.now() - llsHourPacks.loadedAt > 60000) {
    llsHourPacks.loading = true;
    llsApiGet("getOneToOneHours")
      .then((data) => { llsHourPacks.students = data.students || []; llsHourPacks.error = ""; })
      .catch((error) => { llsHourPacks.error = error.message || "error"; })
      .finally(() => {
        llsHourPacks.loading = false;
        llsHourPacks.loadedAt = Date.now();
        llsRenderHourPacks();
        renderNotifications();
      });
  }

  const list = llsHourPacks.students.filter((e) => e.hoursBought > 0 || e.hoursUsed > 0);
  card.hidden = !list.length;
  if (!list.length) return;

  body.innerHTML = list
    .sort((a, b) => a.hoursLeft - b.hoursLeft)
    .map((e) => {
      const student = getStudent(e.studentId);
      const low = e.hoursLeft <= 2;
      const colour = e.hoursLeft <= 0 ? "#b3261e" : low ? "#9a5a0c" : "#177b52";
      const last = e.lessons && e.lessons[0];
      return `<tr>
        <td><strong>${escapeHtml(getStudentName(student) || e.studentId)}</strong></td>
        <td>${e.hoursBought} h</td>
        <td>${e.hoursUsed} h</td>
        <td><strong style="color:${colour}">${e.hoursLeft} h</strong></td>
        <td>${last ? `${escapeHtml(formatDate(llsDateOnly(last.date)))} · ${escapeHtml(last.status)}` : "—"}</td>
        <td class="table-actions-cell"><div class="row-actions">${low ? llsRenewLink(student, e) : ""}</div></td>
      </tr>`;
    })
    .join("");
}

function llsRenewLink(student, e) {
  if (!student) return "";
  const phone = llsWhatsAppNumber(student.phone);
  if (!phone) return "";
  const hours = String(e.hoursLeft).replace(".", ",");
  const left = e.hoursLeft <= 0 ? "le ore del pacchetto sono terminate"
    : e.hoursLeft === 1 ? "resta 1 ora" : `restano ${hours} ore`;
  const message =
    `Buongiorno! Vi informiamo che per le lezioni individuali${student.firstName ? " di " + student.firstName : ""} ${left}. ` +
    `Se volete continuare, potete rinnovare il pacchetto da 10 ore in segreteria o rispondendo a questo messaggio. ` +
    `Grazie! London Language School`;
  return `<a class="row-action" href="https://wa.me/${phone}?text=${encodeURIComponent(message)}" target="_blank" rel="noopener">WhatsApp renewal</a>`;
}


/* =========================================================
   V21 — STUDENT APP LINKS FOR A WHOLE CLASS
========================================================= */

function llsAppMessage(student, link, code) {
  const name = student?.firstName ? ` di ${student.firstName}` : "";
  const codeLine = code ? `Codice personale: ${code} (per entrare dal sito: londonlanguageschool.github.io/Bagheria- → ⭐ Student Portal)\n\n` : "";
  return `Ciao! Ecco l'app di inglese${name} della London Language School: compiti, esercizi e progressi.\n${link}\n\n` + codeLine +
    `Per averla come app sul telefono, apri il link e poi:\n` +
    `• iPhone (Safari): tocca Condividi, poi «Aggiungi alla schermata Home»\n` +
    `• Android (Chrome): tocca ⋮, poi «Aggiungi a schermata Home» o «Installa app»\n\n` +
    `Il link è personale: non condividerlo. Grazie!`;
}

function llsAppWhatsAppHref(student, link, code) {
  const phone = typeof llsWhatsAppNumber === "function" ? llsWhatsAppNumber(student?.phone) : "";
  return `https://wa.me/${phone}?text=${encodeURIComponent(llsAppMessage(student, link, code))}`;
}

async function llsOpenClassAppLinks(classId) {
  const cls = state.classes.find((c) => c.id === classId);
  if (!cls) return;
  const ids = new Set(
    (llsLivePortalData.enrolments || [])
      .filter((e) => String(e["Class ID"] || "").trim() === classId && String(e["Status"] || "").trim().toLowerCase() === "active")
      .map((e) => String(e["Student ID"] || "").trim())
  );
  const students = state.students.filter((s) => ids.has(s.id)).sort((a, b) => getStudentName(a).localeCompare(getStudentName(b)));
  text("appLinksTitle", `App links — ${cls.name}`);
  const list = byId("appLinksList");
  list.innerHTML = students.length
    ? students.map((s) => `
        <div class="homework-status-row" data-applink-row="${escapeHtml(s.id)}">
          <span>${escapeHtml(getStudentName(s))}${s.phone ? "" : ` <span style="color:#8a93a6;font-size:12px">(no phone saved)</span>`}</span>
          <span class="applink-actions" style="display:flex;gap:6px;flex-wrap:wrap">Creating link…</span>
        </div>`).join("")
    : `<div class="empty-state">No active students in this class.</div>`;
  openModal("appLinksModal");

  for (const s of students) {
    const row = list.querySelector(`[data-applink-row="${CSS.escape(s.id)}"] .applink-actions`);
    try {
      const result = await llsApiPost({ action: "createStudentLink", studentId: s.id });
      const link = llsHomeworkPageUrl(result.key);
      row.innerHTML = `${result.code ? `<code style="align-self:center;font-weight:700;letter-spacing:.06em">${escapeHtml(result.code)}</code>` : ""}
        <a class="button button-primary" href="${escapeHtml(llsAppWhatsAppHref(s, link, result.code))}" target="_blank" rel="noopener">Send on WhatsApp</a>
        <button class="button button-secondary" type="button" data-copy-link="${escapeHtml(link)}">Copy</button>`;
      row.querySelector("[data-copy-link]").addEventListener("click", async (event) => {
        const value_ = event.currentTarget.dataset.copyLink;
        try { await navigator.clipboard.writeText(llsAppMessage(s, value_, result.code)); showToast("Message and link copied.", "success"); }
        catch (_) { window.prompt("Copy this link:", value_); }
      });
    } catch (error) {
      row.textContent = "Could not create the link.";
    }
  }
}


function llsBooksForStudent(studentId) {
  const classIds = new Set(
    (llsLivePortalData.enrolments || [])
      .filter((e) => String(e["Student ID"] || "").trim() === studentId && String(e["Status"] || "").trim().toLowerCase() === "active")
      .map((e) => String(e["Class ID"] || "").trim())
  );
  const student = getStudent(studentId);
  if (student?.classId) classIds.add(student.classId);
  return state.classes
    .filter((c) => classIds.has(c.id) && c.book)
    .map((c) => ({ id: c.book, units: c.units, current: c.currentUnit }));
}


/* =========================================================
   V21 — TEACHERS' OWN TESTS (Homework page)
   Apps Script V21: createTeacherTest, getTeacherTestsForClass,
   deleteTeacherTest; students submit in the app and the server marks.
========================================================= */

let llsTeacherTests = { classId: "", tests: [], results: [] };
let llsOpenTestId = "";

// Quizzes can be made from the Homework page (office) or the Lesson page
// (teachers). llsTestClassId() is whichever class the teacher is working on.
let llsTestFromLesson = false;
function llsTestClassId() {
  return llsTestFromLesson ? (llsLesson.classId || "") : value("homeworkClassSelect");
}

async function renderTeacherTests() {
  if (llsTestFromLesson) { llsRenderLessonTests(); return; }
  const body = byId("teacherTestsBody");
  if (!body) return;
  const classId = value("homeworkClassSelect");
  if (!classId) { body.innerHTML = tableEmptyRow(5, "Choose a class."); return; }
  body.innerHTML = tableEmptyRow(5, "Loading…");
  try {
    const data = await llsApiGet("getTeacherTestsForClass", { classId });
    llsTeacherTests = { classId, tests: (data.tests || []).filter((t) => !(llsDeletedTests_ && llsDeletedTests_.has(t.testId))), results: data.results || [] };
    const totalStudents = llsStudentsForClass(classId).length;
    if (!llsTeacherTests.tests.length) {
      body.innerHTML = tableEmptyRow(5, "No tests yet for this class.");
      return;
    }
    body.innerHTML = llsTeacherTests.tests.map((t) => {
      const rs = llsTeacherTests.results.filter((r) => r.testId === t.testId);
      const avg = rs.length ? Math.round(rs.reduce((sum, r) => sum + (r.total ? r.first / r.total : 0), 0) / rs.length * 100) : null;
      return `<tr>
        <td><strong>${escapeHtml(t.title)}</strong><div style="font-size:12px;color:#56617a">${t.count} questions</div></td>
        <td>${t.dueDate ? escapeHtml(formatDate(llsDateOnly(t.dueDate))) : "—"}</td>
        <td>${rs.length} / ${totalStudents}</td>
        <td>${avg == null ? "—" : `${avg}%`}</td>
        <td class="table-actions-cell"><button class="row-action" type="button" data-test-results="${escapeHtml(t.testId)}">Results</button></td>
      </tr>`;
    }).join("");
    body.querySelectorAll("[data-test-results]").forEach((b) => b.addEventListener("click", () => llsOpenTestResults(b.dataset.testResults)));
  } catch (error) {
    body.innerHTML = tableEmptyRow(5, /unknown action/i.test(error.message || "")
      ? "Update the Apps Script to V21 to use tests."
      : "Could not load tests: " + error.message);
  }
}

function llsOpenTestResults(testId) {
  const t = llsTeacherTests.tests.find((x) => x.testId === testId);
  if (!t) return;
  llsOpenTestId = testId;
  text("testResultsTitle", t.title);
  const students = llsStudentsForClass(llsTeacherTests.classId);
  const rows = students.map((st) => {
    const id = String(st["Student ID"] || "").trim();
    const r = llsTeacherTests.results.find((x) => x.testId === testId && x.studentId === id);
    const pct = r && r.total ? Math.round((r.first / r.total) * 100) : 0;
    const colour = !r ? "#8a93a6" : pct >= 70 ? "#177b52" : pct >= 50 ? "#9a5a0c" : "#b3261e";
    return `<div class="homework-status-row">
      <span>${escapeHtml(llsStudentName(st))}</span>
      <strong style="color:${colour}">${r ? `${r.first}/${r.total}${r.best !== r.first ? ` (best ${r.best})` : ""}` : "Not taken"}</strong>
    </div>`;
  });
  byId("testResultsList").innerHTML = rows.join("") || `<div class="empty-state">No students in this class.</div>`;
  openModal("testResultsModal");
}

function llsAddTestQuestion(kind, data = {}) {
  const box = byId("testQuestions");
  const n = box.children.length + 1;
  const wrap = document.createElement("div");
  wrap.className = "panel";
  wrap.dataset.kind = kind;
  wrap.style.margin = "0";
  const uid = Math.random().toString(36).slice(2, 8);
  wrap.innerHTML = kind === "mc" ? `
      <div style="display:flex;justify-content:space-between;gap:8px;align-items:center">
        <strong class="q-number">Question ${n} · multiple choice</strong>
        <button class="row-action delete" type="button" data-remove-q>Remove</button>
      </div>
      <div class="form-field" style="margin-top:8px"><label>Question</label><textarea rows="2" data-q placeholder="e.g. She ___ to school every day."></textarea></div>
      <div style="display:grid;gap:6px">
        <label style="font-weight:700;margin-top:4px">Answers: type each answer, then tick the correct one</label>
        ${[0, 1, 2, 3].map((i) => `<label style="display:flex;gap:8px;align-items:center;font-weight:500">
          <input type="radio" name="correct-${uid}" value="${i}" ${i === 0 ? "checked" : ""} aria-label="Correct answer">
          <input type="text" data-o="${i}" placeholder="Type answer ${String.fromCharCode(65 + i)}${i > 1 ? " (optional)" : ""}${i === 0 ? ", e.g. go" : i === 1 ? ", e.g. goes" : ""}" style="flex:1">
        </label>`).join("")}
        <span style="font-size:12px;color:#56617a">Tick the correct option. Leave C and D empty for 2 options.</span>
      </div>
      <div class="form-field" style="margin-top:8px"><label>Explanation (optional, shown after the test)</label><input type="text" data-e></div>`
    : `
      <div style="display:flex;justify-content:space-between;gap:8px;align-items:center">
        <strong class="q-number">Question ${n} · typed answer</strong>
        <button class="row-action delete" type="button" data-remove-q>Remove</button>
      </div>
      <div class="form-field" style="margin-top:8px"><label>Question</label><textarea rows="2" data-q placeholder="e.g. I ___ (go) to Palermo yesterday."></textarea></div>
      <div class="form-field"><label>Correct answer(s), one per line</label><textarea rows="2" data-a placeholder="went"></textarea>
        <span style="font-size:12px;color:#56617a">Capitals, final full stops and short forms (don't / do not) are accepted automatically.</span></div>
      <div class="form-field"><label>Explanation (optional, shown after the test)</label><input type="text" data-e></div>`;
  wrap.querySelector("[data-remove-q]").addEventListener("click", () => {
    wrap.remove();
    byId("testQuestions").querySelectorAll(".q-number").forEach((el, i) => {
      el.textContent = el.textContent.replace(/Question \d+/, `Question ${i + 1}`);
    });
  });
  box.appendChild(wrap);
  wrap.querySelector("[data-q]").focus();
}

function llsOpenNewTest() {
  const session = llsGetTeacherSession();
  if (!session) { showToast("Log in first.", "error"); return; }
  if (!llsTestClassId()) { showToast("Choose a class first.", "error"); return; }
  byId("testForm").reset();
  byId("testQuestions").innerHTML = "";
  const cls = state.classes.find((c) => c.id === llsTestClassId()) || llsLessonClasses().find((c) => c.id === llsTestClassId());
  text("testModalTitle", `New test — ${cls ? cls.name : ""}`);
  llsAddTestQuestion("mc");
  openModal("testModal");
}

async function llsSaveTest(event) {
  event.preventDefault();
  const session = llsGetTeacherSession();
  const title = value("testTitle").trim();
  if (!title) { showToast("Give the test a title.", "error"); return; }
  const questions = [];
  for (const [i, box] of [...byId("testQuestions").children].entries()) {
    const q = box.querySelector("[data-q]").value.trim();
    const e = box.querySelector("[data-e]").value.trim();
    if (!q) { showToast(`Question ${i + 1} is empty.`, "error"); return; }
    if (box.dataset.kind === "mc") {
      const raw = [0, 1, 2, 3].map((k) => box.querySelector(`[data-o="${k}"]`).value.trim());
      const correct = Number(box.querySelector('input[type="radio"]:checked')?.value ?? 0);
      if (!raw[correct]) { showToast(`Question ${i + 1}: the ticked option is empty.`, "error"); return; }
      const options = [];
      let a = 0;
      raw.forEach((o, k) => { if (o) { if (k === correct) a = options.length; options.push(o); } });
      if (options.length < 2) { showToast(`Question ${i + 1} needs at least 2 options.`, "error"); return; }
      questions.push({ q, o: options, a, e });
    } else {
      const answers = box.querySelector("[data-a]").value.split("\n").map((x) => x.trim()).filter(Boolean);
      if (!answers.length) { showToast(`Question ${i + 1} needs the correct answer.`, "error"); return; }
      questions.push({ q, a: answers, e });
    }
  }
  if (!questions.length) { showToast("Add at least one question.", "error"); return; }

  const button = byId("testForm").querySelector('button[type="submit"]');
  // 30 Sept: the form closes at once; it reopens, filled in, only if Google refuses.
  llsBgStart("testModal");
  let bgOk = false;
  try {
    await llsApiPost({
      action: "createTeacherTest",
      classId: llsTestClassId(),
      teacherId: session?.teacherId || "",
      title,
      dueDate: value("testDue"),
      questions
    });
    closeModal("testModal");
    bgOk = true;
    showToast("Test saved. Students can take it in their app now.", "success");
    renderTeacherTests();
  } catch (error) {
    showToast(/unknown mutation/i.test(error.message || "") ? "Update the Apps Script to V21 first." : (error.message || "Could not save the test."), "error");
  } finally {
    button.disabled = false;
    button.textContent = "Save and give to class";
    llsBgEnd(bgOk, "testModal");
  }
}

async function llsDeleteOpenTest() {
  if (!llsOpenTestId) return;
  const button = byId("deleteTestButton");
  if (button.dataset.confirm !== "1") {
    button.dataset.confirm = "1";
    button.textContent = "Press again to delete";
    setTimeout(() => { button.dataset.confirm = ""; button.textContent = "Delete test"; }, 4000);
    return;
  }
  button.dataset.confirm = "";
  button.textContent = "Delete test";
  // 30 Sept: gone at once; Google catches up in the background.
  const testId = llsOpenTestId;
  llsDeletedTests_.add(testId);
  llsQueueSave("the test", { action: "deleteTeacherTest", testId });
  closeModal("testResultsModal");
  showToast("Test deleted.", "success");
  document.querySelectorAll(`[data-test-results="${CSS.escape(testId)}"]`).forEach((el) => el.closest("tr")?.remove());
  renderTeacherTests();
}

// Hide "Create with AI" until the AI key is set up (ping says aiReady).
// 27 Sept: also remembers the Apps Script version (V25+ = safe retries).
async function llsCheckAiPanel() {
  const panel = byId("homeworkAiPanel");
  try {
    const ping = await llsApiGet("ping");
    const m = String(ping.version || "").match(/V(\d+)/);
    window.llsServerVersion = m ? Number(m[1]) : 0;
    try { localStorage.setItem("lls_server_version", String(window.llsServerVersion)); } catch (_) {}
    if (panel) panel.hidden = ping.aiReady !== true;
  } catch (_) { /* leave as is */ }
}

// After a save whose reply was lost: reload what the current page shows.
function llsRefreshAfterUncertainSave_() {
  const page = (location.hash || "#dashboard").slice(1);
  setTimeout(async () => {
    try {
      if (page === "enquiries" && typeof llsLoadEnquiriesFromSheets === "function") { await llsLoadEnquiriesFromSheets(); return; }
      if (typeof loadLiveAttendanceFoundation === "function") await loadLiveAttendanceFoundation(true);
      if (typeof llsLoadCoreFromSheets === "function") await llsLoadCoreFromSheets(true);
      if (page === "fees" && typeof llsLoadFinanceFromSheets === "function") await llsLoadFinanceFromSheets(true);
      if (page === "teachers" && typeof llsLoadTeachersFromSheets === "function") await llsLoadTeachersFromSheets();
    } catch (_) {}
  }, 1500);
}

document.addEventListener("DOMContentLoaded", () => {
  byId("newTestButton")?.addEventListener("click", llsOpenNewTest);
  byId("addMcQuestion")?.addEventListener("click", () => llsAddTestQuestion("mc"));
  byId("addTypedQuestion")?.addEventListener("click", () => llsAddTestQuestion("typed"));
  byId("testForm")?.addEventListener("submit", llsSaveTest);
  byId("deleteTestButton")?.addEventListener("click", llsDeleteOpenTest);
  byId("homeworkClassSelect")?.addEventListener("change", () => { llsTestFromLesson = false; renderTeacherTests(); });
  // 30 Sept (speed): not on the login screen, where it would compete with the login itself.
  // Runs after the page-load data has been asked for, so it never takes a lane first.
  if (llsHasAdminSession()) window.addEventListener("load", () => setTimeout(llsCheckAiPanel, 0));
});


/* =========================================================
   V22 — ROLES: teacher logins see only the teaching pages;
   the office (admin) sees everything and can open any view.
========================================================= */

const LLS_TEACHER_PAGES = ["lesson", "classes", "timetable"]; // 27 Sept: register, feedback, homework and quizzes all on ★ Lesson

function llsCoachRequestLabel(student) {
  if (!student?.coachRequest) return "";
  const [date, plan] = student.coachRequest.split(" ");
  return ` Requested in the app on ${formatDate(date)} (${plan === "year" ? "€25 school year" : "€3 a month"}): take payment, then set the date.`;
}

function llsApplyRole() {
  if (!llsIsTeacher()) return;
  document.body.classList.add("role-teacher");
  document.querySelectorAll(".nav-item[data-page]").forEach((button) => {
    if (LLS_TEACHER_PAGES.indexOf(button.dataset.page) === -1) button.hidden = true;
  });
  ["quickEnquiryButton", "quickStudentButton"].forEach((id) => { if (byId(id)) byId(id).hidden = true; });
  ["statCollected", "statEnquiries", "recentEnquiriesList", "paymentProgressBar"].forEach((id) => {
    const card = byId(id)?.closest("article");
    if (card) card.hidden = true;
  });
  const session = llsGetTeacherSession();
  const userCopy = document.querySelector("#userMenuButton .user-copy");
  if (userCopy && session) {
    userCopy.querySelector("strong").textContent = session.name || "Teacher";
    userCopy.querySelector("span").textContent = "Teacher";
    const avatar = document.querySelector("#userMenuButton .avatar");
    if (avatar) avatar.textContent = (session.name || "T").trim().charAt(0).toUpperCase();
  }
  document.querySelectorAll('#userDropdown [data-page-target="settings"]').forEach((b) => { b.hidden = true; });
  if (byId("homeworkLogoutButton")) byId("homeworkLogoutButton").hidden = true;
  const page = (location.hash || "").replace("#", "");
  if (!page || page === "dashboard" || LLS_TEACHER_PAGES.indexOf(page) === -1) navigateTo("lesson");
}

// Teachers: class cards get "Change unit" instead of Edit / delete.
function llsTeacherClassControls() {
  if (!llsIsTeacher()) return;
  document.querySelectorAll("[data-edit-class], [data-delete-class]").forEach((b) => { b.hidden = true; });
  document.querySelectorAll("[data-class-results]").forEach((b) => {
    const classId = b.dataset.classResults;
    const cls = state.classes.find((c) => c.id === classId);
    if (!cls || !cls.book || b.parentElement.querySelector("[data-class-unit]")) return;
    const unit = document.createElement("button");
    unit.className = "row-action";
    unit.type = "button";
    unit.dataset.classUnit = classId;
    unit.textContent = `Unit ${cls.currentUnit || "?"} ✎`;
    unit.addEventListener("click", async () => {
      const next = window.prompt(`${cls.name}: which unit is the class on now?`, cls.currentUnit || "");
      if (next == null) return;
      const n = String(next).trim();
      if (n && !/^\d{1,2}$/.test(n)) { showToast("Type a unit number, e.g. 3.", "error"); return; }
      try {
        llsQueueSave(`${cls.name} unit`, { action: "updateClass", classId, fields: { "Current Unit": n } });
        cls.currentUnit = n;
        saveState();
        renderClasses();
        showToast(`${cls.name} is now on unit ${n}.`, "success");
      } catch (error) {
        showToast(error.message || "Could not save the unit.", "error");
      }
    });
    b.parentElement.prepend(unit);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  llsApplyRole();

  // Office: use the Homework page without a teacher PIN.
  byId("homeworkOfficeButton")?.addEventListener("click", () => {
    llsSetTeacherSession({ teacherId: "OFFICE", name: "Office", email: "", role: "Admin" });
    renderHomeworkLoginState();
  });
  if (llsIsTeacher() && byId("homeworkOfficeButton")) byId("homeworkOfficeButton").closest(".form-field").hidden = true;
});


/* ============================================================
   V23 — LESSON LOG (notes for the next teacher)
   Shown on the Attendance page for the chosen class and date.
   ============================================================ */
let llsLessonLogEntries = [];
let llsLessonLogClass = "";

// Special lessons (Halloween, Welcome back…) are stored in the Lesson Log
// "Unit" column as "Special: <title>". They count as a lesson but never
// change the class's Current Unit.
const LLS_SPECIAL_PREFIX = "Special: ";
function llsSpecialTitle(unit) {
  const m = String(unit || "").match(/^Special:\s*(.+)$/i);
  return m ? m[1].trim() : "";
}
function llsSetSpecial(on, title) {
  const box = byId("lessonSpecialOn");
  if (!box) return;
  box.checked = Boolean(on);
  byId("lessonSpecialPick").hidden = !on;
  byId("lessonSpecialBox").classList.toggle("on", Boolean(on));
  byId("lessonSpecialBox").hidden = !on;
  byId("lessonUnitPageField").hidden = Boolean(on) || llsChoiceOn();
  setValue("lessonSpecialTitle", on ? (title || "") : "");
  llsMarkSpecialChip();
  if (on && llsChoiceOn()) llsSetChoice(false);
  llsSyncLessonType_();
}

/* 5 Oct — "Teacher's choice" lessons: the teacher's own lesson instead of the
   book. Stored in the Lesson Log with Unit "Teacher's choice"; the title is
   the first line of "What we did" (🧑‍🏫 …), the links go in the private notes
   ("📎 Materials:"), photos/files in the Files sheet (V32). Skills are
   required as in a book lesson, so it counts towards progress the same way. */
const LLS_CHOICE_UNIT = "Teacher's choice";
const LLS_CHOICE_MARK = "🧑‍🏫 ";
const LLS_MATERIALS_MARK = "📎 Materials:";
let llsLessonFileMap = {}; // "classId|date" -> [files] (V32)
function llsIsChoiceUnit(unit) { return /^teacher'?s choice/i.test(String(unit || "").trim()); }
function llsChoiceOn() { return Boolean(byId("lessonChoiceBox") && !byId("lessonChoiceBox").hidden); }
function llsSetChoice(on, title, links) {
  const box = byId("lessonChoiceBox");
  if (!box) return;
  box.hidden = !on;
  if (on && byId("lessonSpecialOn")?.checked) llsSetSpecial(false);
  if (title !== undefined) setValue("lessonChoiceTitle", title || "");
  if (links !== undefined) setValue("lessonChoiceLinks", links || "");
  if (!on && title === undefined) { setValue("lessonChoiceTitle", ""); setValue("lessonChoiceLinks", ""); const f = byId("lessonChoiceFiles"); if (f) f.value = ""; llsChoiceFilesPicked_(); }
  byId("lessonUnitPageField").hidden = Boolean(on) || Boolean(byId("lessonSpecialOn")?.checked);
  const label = byId("lessonDoneLabel"), done = byId("lessonDone");
  if (label) label.innerHTML = on
    ? `What exactly did you do? <span class="muted">(required: activities in order, pages, games… students see this)</span>`
    : `Anything else? <span class="muted">(optional: students see this)</span>`;
  if (done) { done.placeholder = on ? "e.g. Warm-up quiz on the past simple, then Cambridge B1 Listening Part 1 (2 tests), then a speaking game with the answers." : "e.g. vocab game, p.19"; done.rows = on ? 4 : 2; }
  llsMarkChoiceChip_();
  llsSyncLessonType_();
}
function llsMarkChoiceChip_() {
  const t = value("lessonChoiceTitle").trim().toLowerCase();
  document.querySelectorAll("#lessonChoiceChips [data-choice]").forEach((b) => b.classList.toggle("active", b.dataset.choice.toLowerCase() === t));
}
function llsLessonType_() { return byId("lessonSpecialOn")?.checked ? "special" : llsChoiceOn() ? "choice" : "book"; }
function llsSyncLessonType_() {
  const t = llsLessonType_();
  document.querySelectorAll("#lessonTypeBar [data-ltype]").forEach((b) => { const on = b.dataset.ltype === t; b.classList.toggle("active", on); b.setAttribute("aria-checked", on ? "true" : "false"); });
}
function llsPickLessonType_(t) {
  if (t === "special") { llsSetSpecial(true, value("lessonSpecialTitle")); byId("lessonSpecialTitle")?.focus(); }
  else if (t === "choice") { llsSetChoice(true); byId("lessonChoiceTitle")?.focus(); }
  else { if (byId("lessonSpecialOn")?.checked) llsSetSpecial(false); if (llsChoiceOn()) llsSetChoice(false); }
  llsRenderSkills();
}
function llsChoiceFilesPicked_() {
  const input = byId("lessonChoiceFiles"), label = byId("lessonChoiceFilesPicked");
  if (!input || !label) return;
  const n = (input.files || []).length;
  label.textContent = (window.llsServerVersion || 0) < 32
    ? "Photos can be added once the office installs Apps Script V32. Until then, add links or describe the materials."
    : n ? `${n} file${n === 1 ? "" : "s"} chosen: they go up when you save the lesson.` : "";
}
// Notes text <-> {notes, links}
function llsSplitMaterials(text) {
  const s = String(text || "");
  const i = s.indexOf(LLS_MATERIALS_MARK);
  if (i < 0) return { notes: s, links: [] };
  return { notes: s.slice(0, i).trim(), links: s.slice(i + LLS_MATERIALS_MARK.length).split(/\n+/).map((x) => x.trim()).filter(Boolean) };
}
// "What we did" rest text -> {title, rest} for a Teacher's choice lesson
function llsSplitChoiceTitle(rest) {
  const lines = String(rest || "").split("\n");
  const k = lines.findIndex((l) => l.startsWith(LLS_CHOICE_MARK.trim()));
  if (k < 0) return { title: "", rest: String(rest || "") };
  const title = lines[k].slice(LLS_CHOICE_MARK.trim().length).trim();
  lines.splice(k, 1);
  return { title, rest: lines.join("\n").trim() };
}
function llsLessonFilesFor_(date) {
  const ids = [llsLesson && llsLesson.classId, llsLessonLogClass].filter(Boolean);
  for (const id of ids) { const f = llsLessonFileMap[id + "|" + date]; if (f && f.length) return f; }
  return [];
}
function llsStoreLessonFiles_(classId, files) {
  Object.keys(llsLessonFileMap).forEach((k) => { if (k.startsWith(classId + "|")) delete llsLessonFileMap[k]; });
  (files || []).forEach((f) => { const k = classId + "|" + f.lessonDate; (llsLessonFileMap[k] = llsLessonFileMap[k] || []).push(f); });
}
async function llsUploadLessonFiles_(classId, lessonDate, files) {
  let sent = 0;
  for (let i = 0; i < files.length; i++) {
    try {
      showToast(`Uploading ${i + 1} of ${files.length}: ${files[i].name}…`, "info");
      const up = await llsReadUpload_(files[i]);
      const res = await llsApiPost(Object.assign({ action: "uploadLessonFile", classId, lessonDate }, up));
      if (res.file) { const k = classId + "|" + lessonDate; (llsLessonFileMap[k] = llsLessonFileMap[k] || []).push(res.file); }
      sent++;
    } catch (error) {
      showToast(llsFileError_(error), "error");
    }
  }
  if (sent) {
    showToast(`📷 ${sent} file${sent === 1 ? "" : "s"} added to the lesson.`, "success");
    if (llsLesson.classId === classId) llsRenderLessonLogList(byId("lessonHistory"), llsLesson.entries);
  }
}
document.addEventListener("click", (e) => {
  const b = e.target && e.target.closest ? e.target.closest("[data-open-lfile]") : null;
  if (!b) return;
  const all = Object.values(llsLessonFileMap).flat();
  llsOpenFile_(b.dataset.openLfile, all.find((f) => f.fileId === b.dataset.openLfile));
});
function llsMarkSpecialChip() {
  const t = value("lessonSpecialTitle").trim().toLowerCase();
  document.querySelectorAll("#lessonSpecialChips [data-special]").forEach((b) => b.classList.toggle("active", b.dataset.special.toLowerCase() === t));
}

function llsLessonLogEntryHtml(entry) {
  const special = llsSpecialTitle(entry.unit);
  // 30 Sept: skill lines show as one line each with their icon.
  const parsed = typeof llsParseSkills === "function" ? llsParseSkills(entry.whatWeDid) : { skills: {}, rest: entry.whatWeDid };
  const skillText = typeof LLS_SKILLS !== "undefined"
    ? LLS_SKILLS.filter((s) => parsed.skills[s.k]).map((s) => `${s.icon} ${s.k}: ${[parsed.skills[s.k].topic, parsed.skills[s.k].focus].filter(Boolean).join(" · ")}`).join("\n")
    : "";
  const choice = llsIsChoiceUnit(entry.unit);
  const ct = choice ? llsSplitChoiceTitle(parsed.rest) : { title: "", rest: parsed.rest };
  const mat = llsSplitMaterials(entry.notes);
  const rows = [
    [special ? "⭐ Special lesson" : choice ? "🧑‍🏫 Teacher's choice" : "Unit", special || (choice ? (ct.title || "—") : entry.unit)],
    ["What we did", [skillText, ct.rest].filter(Boolean).join("\n")],
    ["Homework", entry.homeworkSet],
    ["Notes", mat.notes]
  ].filter(([, v]) => String(v || "").trim());
  const date = entry.lessonDate ? new Date(entry.lessonDate + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) : "";
  const linkHtml = (l) => /^https?:\/\/\S+$/i.test(l)
    ? `<a href="${escapeAttribute(l)}" target="_blank" rel="noopener noreferrer">${escapeHtml(l.length > 70 ? l.slice(0, 67) + "…" : l)}</a>`
    : escapeHtml(l);
  const files = llsLessonFilesFor_(entry.lessonDate);
  const matHtml = (mat.links.length || files.length)
    ? `<dt>📎 Materials</dt><dd>${mat.links.map((l) => `<div>🔗 ${linkHtml(l)}</div>`).join("")}${files.length ? `<div class="hw-file-chips">${files.map((f) => `<span class="hw-file-chip"><button type="button" class="hw-file-open" data-open-lfile="${escapeAttribute(f.fileId)}" title="Open">${LLS_FILE_ICON(f.type)} ${escapeHtml(f.name)}</button></span>`).join("")}</div>` : ""}</dd>`
    : "";
  return `
    <div class="lesson-log-entry">
      <div class="lesson-log-meta"><strong>${escapeHtml(date)}</strong> · ${escapeHtml(entry.teacherName || "—")}</div>
      <dl>${rows.map(([k, v]) => `<dt>${escapeHtml(k)}</dt><dd style="white-space:pre-line">${escapeHtml(v)}</dd>`).join("")}${matHtml}</dl>
    </div>`;
}

function llsFillLessonLogForm() {
  const lessonDate = document.getElementById("attendanceDate")?.value || "";
  const classId = document.getElementById("attendanceClassSelect")?.value || "";
  const own = llsLessonLogEntries.find(e => e.lessonDate === lessonDate);
  const cls = (llsLivePortalData.classes || []).find(c => String(c["Class ID"] || "") === classId) || {};
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v || ""; };
  set("lessonLogUnit", own ? own.unit : String(cls["Current Unit"] || ""));
  set("lessonLogDone", own ? own.whatWeDid : "");
  set("lessonLogHomework", own ? own.homeworkSet : "");
  set("lessonLogNotes", own ? own.notes : "");
  const btn = document.getElementById("lessonLogSaveButton");
  if (btn) btn.textContent = own ? "Update lesson notes" : "Save lesson notes";

  const latestBox = document.getElementById("lessonLogLatest");
  const list = document.getElementById("lessonLogList");
  const earlier = llsLessonLogEntries.filter(e => !lessonDate || e.lessonDate < lessonDate);
  if (latestBox) {
    if (earlier.length) {
      latestBox.hidden = false;
      latestBox.innerHTML = `<h3>📝 Last lesson in this class</h3>${llsLessonLogEntryHtml(earlier[0])}
        <p class="muted" style="margin:8px 0 0;">Write today's notes at the bottom of this page after the register.</p>`;
    } else {
      latestBox.hidden = true;
      latestBox.innerHTML = "";
    }
  }
  if (list) llsRenderLessonLogList(list, llsLessonLogEntries);
}

async function llsLoadLessonLog(force = false) {
  const classId = document.getElementById("attendanceClassSelect")?.value || "";
  const list = document.getElementById("lessonLogList");
  if (!classId) {
    llsLessonLogEntries = []; llsLessonLogClass = "";
    if (list) list.innerHTML = `<p class="muted">Choose a class.</p>`;
    const latestBox = document.getElementById("lessonLogLatest"); if (latestBox) latestBox.hidden = true;
    return;
  }
  if (force || llsLessonLogClass !== classId) {
    if (list) list.innerHTML = `<p class="muted">Loading…</p>`;
    try {
      const data = await llsApiGet("getLessonLog", { classId, limit: 1000 });
      llsLessonLogEntries = Array.isArray(data.entries) ? data.entries : [];
      llsLessonLogClass = classId;
      if (Array.isArray(data.files)) llsStoreLessonFiles_(classId, data.files);
    } catch (error) {
      llsLessonLogEntries = []; llsLessonLogClass = "";
      const msg = /Unknown action/i.test(error.message || "")
        ? "The lesson log needs the latest Apps Script (V23). Ask the office to update it."
        : "Could not load lesson notes: " + (error.message || "");
      if (list) list.innerHTML = `<p class="muted">${escapeHtml(msg)}</p>`;
      const latestBox = document.getElementById("lessonLogLatest"); if (latestBox) latestBox.hidden = true;
      return;
    }
  }
  llsFillLessonLogForm();
}

async function llsSaveLessonLog() {
  const classId = document.getElementById("attendanceClassSelect")?.value || "";
  const lessonDate = document.getElementById("attendanceDate")?.value || "";
  const val = id => (document.getElementById(id)?.value || "").trim();
  if (!classId || !lessonDate) { showToast("Choose a class and lesson date.", "error"); return; }
  const body = {
    action: "saveLessonLog", classId, lessonDate,
    unit: val("lessonLogUnit"), whatWeDid: val("lessonLogDone"),
    homeworkSet: val("lessonLogHomework"), notes: val("lessonLogNotes")
  };
  if (!body.whatWeDid && !body.homeworkSet && !body.notes) { showToast("Write at least one line.", "error"); return; }
  const btn = document.getElementById("lessonLogSaveButton");
  const label = btn ? btn.textContent : "";
  if (btn) { btn.disabled = true; btn.textContent = "Saving…"; }
  try {
    llsQueueSave("lesson notes", body);
    showToast("✓ Lesson notes saved. Sending to Google in the background.", "success");
    if (btn) llsFlashSaved(btn, "✓ Saved");
  } catch (error) {
    console.error(error);
    showToast(/Unknown action/i.test(error.message || "") ? "Update the Apps Script to V23 first." : (error.message || "Notes could not be saved."), "error");
    if (btn) btn.textContent = label;
  } finally {
    if (btn) btn.disabled = false;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const classSelect = document.getElementById("attendanceClassSelect");
  const dateInput = document.getElementById("attendanceDate");
  document.getElementById("lessonLogSaveButton")?.addEventListener("click", llsSaveLessonLog);
  classSelect?.addEventListener("change", () => llsLoadLessonLog());
  dateInput?.addEventListener("change", () => llsLoadLessonLog());
});


/* ============================================================
   V23 — LESSON PAGE: one screen per class for teachers.
   Pick the class (today's lessons first) → register, lesson
   notes, homework and results → one "Save lesson" button.
   Uses the same Apps Script actions as the other pages:
   getAttendance/saveAttendance, getLessonLog/saveLessonLog,
   getHomeworkForClass/createHomework, updateClass (unit).
   ============================================================ */

// Whole-course history, newest first; first 5 shown, rest behind a button.
function llsRenderLessonLogList(container, entries, shown = 5) {
  if (!container) return;
  if (!entries.length) {
    container.innerHTML = `<p class="muted">No lesson notes for this class yet.</p>`;
    return;
  }
  const visible = entries.slice(0, shown);
  const more = entries.length - visible.length;
  container.innerHTML = visible.map(llsLessonLogEntryHtml).join("") +
    (more > 0 ? `<button class="button button-secondary lesson-log-more" type="button">Show all ${entries.length} lessons</button>` : "");
  container.querySelector(".lesson-log-more")?.addEventListener("click", () => llsRenderLessonLogList(container, entries, entries.length));
}

const LLS_DAY_ABBR = { monday: "mon", tuesday: "tue", wednesday: "wed", thursday: "thu", friday: "fri", saturday: "sat", sunday: "sun" };
let llsLesson = { classId: "", date: "", entries: [], homework: [], status: [], loadedKey: "", showAll: false };

function llsMyNames() {
  const session = llsGetTeacherSession();
  if (!llsIsTeacher() || !session) return null;
  const first = String(session.name || "").trim().split(/\s+/)[0].toLowerCase();
  const names = new Set([first]);
  if (first === "colin") names.add("cole"); // Cole = Colin Bouchard
  return names;
}

// Who teaches this class on a given weekday ("Cole (Tue) / Helen (Thu)" → Cole on Tuesday).
function llsTeacherOnDay(cls, dayName) {
  const field = String(cls.teacherName || "");
  if (!field.includes("(")) return field;
  const abbr = LLS_DAY_ABBR[String(dayName).toLowerCase()] || "";
  const seg = field.split("/").find((p) => p.toLowerCase().includes(`(${abbr}`));
  return seg ? seg.replace(/\(.*?\)/g, "").trim() : field;
}

function llsIsMine(teacherText, names) {
  if (!names) return true;
  const t = String(teacherText || "").toLowerCase();
  return [...names].some((n) => n && new RegExp(`\\b${n}\\b`).test(t));
}

function llsLessonClasses() {
  return (state.classes || []).filter((c) => !/inactive|archived/i.test(c.status || ""));
}

// Lessons on a date: [{cls, time, room}] sorted by time.
function llsLessonsOn(dateIso, onlyMine) {
  const dayName = new Date(dateIso + "T12:00:00").toLocaleDateString("en-GB", { weekday: "long" }).toLowerCase();
  const names = onlyMine ? llsMyNames() : null;
  const out = [];
  llsLessonClasses().forEach((cls) => {
    [[cls.day, cls.time], [cls.day2, cls.time2]].forEach(([d, t]) => {
      if (String(d || "").toLowerCase() !== dayName) return;
      if (!llsIsMine(llsTeacherOnDay(cls, d), names)) return;
      out.push({ cls, time: t || "" });
    });
  });
  return out.sort((a, b) => a.time.localeCompare(b.time));
}

function llsNextLessonDate(cls, fromIso) {
  return (llsNextLessons_(cls, fromIso, 1)[0] || {}).date || "";
}
// 2 Oct: the class's next lessons after a date, skipping school holidays and
// cancelled lessons: [{ date, time }]. Used for homework due dates.
function llsNextLessons_(cls, fromIso, count) {
  const out = [];
  if (!cls) return out;
  const slots = [[cls.day, cls.time], [cls.day2, cls.time2]].filter(([d]) => d).map(([d, t]) => [String(d).toLowerCase(), t || ""]);
  if (!slots.length) return out;
  const d = new Date((fromIso || isoDate(new Date())) + "T12:00:00");
  for (let i = 1; i <= 120 && out.length < (count || 2); i++) {
    d.setDate(d.getDate() + 1);
    const iso = isoDate(d);
    const day = d.toLocaleDateString("en-GB", { weekday: "long" }).toLowerCase();
    const slot = slots.find(([sd]) => sd === day);
    if (!slot || llsSchoolClosed_(iso)) continue;
    if (typeof llsIsCancelled === "function" && llsIsCancelled(cls.id, iso)) continue;
    out.push({ date: iso, time: slot[1] });
  }
  return out;
}
// Tappable "next lessons" under a homework due-date box.
function llsRenderDueChips(inputId, cls, fromIso) {
  const input = byId(inputId);
  if (!input) return;
  let box = byId(inputId + "Chips");
  if (!box) {
    box = document.createElement("div");
    box.id = inputId + "Chips";
    box.className = "due-chips";
    input.insertAdjacentElement("afterend", box);
  }
  const next = llsNextLessons_(cls, fromIso, 2);
  if (!next.length) { box.innerHTML = ""; return; }
  const label = (x) => new Date(x.date + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) + (x.time ? " " + x.time : "");
  box.innerHTML = `<span class="muted">Next lessons:</span> ${next.map((x) => `<button type="button" class="sk-chip${input.value === x.date ? " on" : ""}" data-due="${escapeAttribute(x.date)}">${escapeHtml(label(x))}</button>`).join("")}`;
  box.querySelectorAll("[data-due]").forEach((b) => b.addEventListener("click", () => {
    input.value = b.dataset.due;
    input.dispatchEvent(new Event("change", { bubbles: true }));
    llsRenderDueChips(inputId, cls, fromIso);
  }));
  if (!input.dataset.dueChips) {
    input.dataset.dueChips = "1";
    input.addEventListener("change", () => box.querySelectorAll("[data-due]").forEach((b) => b.classList.toggle("on", b.dataset.due === input.value)));
  }
}
function llsHomeworkPageDueChips() {
  const classId = value("homeworkClassSelect");
  const cls = (state.classes || []).find((c) => String(c.id) === String(classId));
  if (!cls) { const b = byId("homeworkDueDateChips"); if (b) b.innerHTML = ""; return; }
  if (!value("homeworkDueDate")) setValue("homeworkDueDate", llsNextLessonDate(cls, isoDate(new Date())));
  llsRenderDueChips("homeworkDueDate", cls, isoDate(new Date()));
}
document.addEventListener("DOMContentLoaded", () => {
  byId("homeworkClassSelect")?.addEventListener("change", () => { setValue("homeworkDueDate", ""); llsHomeworkPageDueChips(); });
});

function llsRenderLessonPicker() {
  const box = byId("lessonPicker");
  if (!box) return;
  const date = byId("lessonDate")?.value || isoDate(new Date());
  const names = llsMyNames();
  const onlyMine = Boolean(names) && !llsLesson.showAll;
  const today = llsLessonsOn(date, onlyMine);
  const all = llsLessonClasses()
    .filter((c) => !onlyMine || llsIsMine(c.teacherName, names))
    .sort((a, b) => a.name.localeCompare(b.name));
  const chip = (cls, label) => {
    const st = llsLessonSaveState(cls.id, date);
    const off = typeof llsIsCancelled === "function" && llsIsCancelled(cls.id, date);
    const mark = off ? " 🚫" : st === "saved" ? " ✓" : st === "sending" ? " ⏳" : "";
    return `<button type="button" class="lesson-chip${cls.id === llsLesson.classId ? " active" : ""}${st ? " is-saved-" + st : ""}${off ? " is-cancelled" : ""}"${off ? ' title="Cancelled"' : ""} data-lesson-class="${escapeHtml(cls.id)}">${label}${mark}</button>`;
  };
  const dayLabel = new Date(date + "T12:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" });
  // 28 Sept: while Google is still sending the class list, say so (not "No lessons").
  const loading = !llsCoreSettled && !today.length;
  box.innerHTML = `
    <p class="section-label" style="margin:0 0 8px;">${onlyMine ? "My lessons" : "Lessons"} on ${escapeHtml(dayLabel)}</p>
    <div class="lesson-chips">${today.length ? today.map(({ cls, time }) => chip(cls, `<strong>${escapeHtml(time)}</strong> ${escapeHtml(cls.name)}`)).join("") : (loading ? `<span class="muted">⏳ Loading your classes from Google… (up to 30 seconds)</span>` : `<span class="muted">No lessons on this day.</span>`)}</div>
    <details class="lesson-all"${today.length ? "" : " open"}>
      <summary>${onlyMine ? "All my classes" : "All classes"} (${all.length})</summary>
      <div class="lesson-chips">${all.map((c) => chip(c, escapeHtml(c.name))).join("")}</div>
    </details>
    ${names ? `<label class="lesson-showall"><input type="checkbox" id="lessonShowAll"${llsLesson.showAll ? " checked" : ""}> Show other teachers' classes (e.g. to cover)</label>` : ""}`;
  box.querySelectorAll("[data-lesson-class]").forEach((b) => b.addEventListener("click", () => llsOpenLesson(b.dataset.lessonClass)));
  byId("lessonShowAll")?.addEventListener("change", (e) => { llsLesson.showAll = e.target.checked; llsRenderLessonPicker(); });
}

async function llsOpenLesson(classId) {
  llsLesson.classId = classId;
  llsLesson.loadedKey = "";
  llsRenderLessonPicker();
  await llsRenderLesson();
  byId("lessonWork")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function llsRenderLesson() {
  const work = byId("lessonWork");
  if (!work) return;
  const cls = llsLessonClasses().find((c) => c.id === llsLesson.classId);
  if (!cls) { work.hidden = true; return; }
  work.hidden = false;
  const date = byId("lessonDate")?.value || isoDate(new Date());
  const key = `${cls.id}|${date}`;
  const dayName = new Date(date + "T12:00:00").toLocaleDateString("en-GB", { weekday: "long" });

  byId("lessonClassName").textContent = cls.name;
  byId("lessonClassMeta").textContent = [llsTeacherOnDay(cls, dayName), cls.level, cls.book ? `${(window.LLS_COURSES && LLS_COURSES[cls.book]?.title) || cls.book}` : ""].filter(Boolean).join(" · ");
  const unitBox = byId("lessonUnitBox");
  unitBox.hidden = !cls.book;
  byId("lessonUnitValue").textContent = cls.currentUnit || "?";
  byId("lessonResultsButton").hidden = !cls.book;

  if (llsLesson.loadedKey === key) return;
  llsLesson.loadedKey = key;

  const regBody = byId("lessonRegister");
  const saveBtn = byId("lessonSaveButton");
  if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = "💾 Save lesson"; }
  byId("lessonLast").hidden = true;
  ["lessonDone", "lessonNotes", "lessonHwTitle", "lessonHwText"].forEach((id) => setValue(id, ""));
  llsSkillState = {};
  byId("lessonSkills")?.classList.remove("needs");
  setValue("lessonUnitPage", cls.currentUnit || "");
  llsSetSpecial(false);
  llsSetChoice(false);
  setValue("lessonHwDue", llsNextLessonDate(cls, date));
  llsRenderDueChips("lessonHwDue", cls, date);
  llsLesson.entries = [];
  llsPlanConfirm = "";
  llsRenderSkills();
  llsRenderHwSuggest(cls);
  if (llsWbState.lessonWbBox) delete llsWbState.lessonWbBox; // a new lesson starts with Workbook off
  llsLessonWb_();
  llsLesson.noteTouched = false;
  llsLesson.homework = [];
  llsLesson.status = [];

  // 27 Sept: show the register straight away from the class list we already
  // have; saved marks and notes fill in when Google answers. A lesson saved on
  // this device but still being sent (outbox) wins over what Google has.
  const pending = llsOutboxFor(cls.id, date);
  // 30 Sept: a lesson Google has already confirmed is also kept on this
  // device, so reopening it shows everything at once (Google's reads can
  // take 20–30 s). Google's copy still fills in when it answers.
  const local = pending || llsSavedFor(cls.id, date);
  llsPaintLessonState();
  try {
    if (!llsStudentsForClass(cls.id).length && !(llsLivePortalData.classes || []).length) {
      regBody.innerHTML = `<p class="muted">Loading…</p>`;
      await loadLiveAttendanceFoundation();
      if (llsLesson.loadedKey !== key) return;
    }
  } catch (_) { /* fall through: the register shows what we have */ }
  const students = llsStudentsForClass(cls.id);
  const fromPending = new Map(((local && local.rows) || []).map((r) => [r.studentId, { Status: r.status, Notes: r.notes }]));
  llsDrawRegister(regBody, students, fromPending);
  if (local && local.note) llsFillLessonNote(local.note, cls);

  // Saved register (only fills rows the teacher hasn't touched yet)
  llsApiGet("getAttendance", { classId: cls.id, lessonDate: date }).then((att) => {
    if (llsLesson.loadedKey !== key || pending) return;
    const saved = new Map((att.attendance || []).map((r) => [String(r["Student ID"] || "").trim(), r]));
    regBody.querySelectorAll(".reg-row:not([data-touched])").forEach((row) => {
      const rec = saved.get(row.dataset.student);
      if (rec) llsSetRegisterRow(row, String(rec["Status"] || "Present"), rec["Notes"]);
    });
    llsLessonCount();
  }).catch((e) => {
    if (llsLesson.loadedKey !== key) return;
    const n = document.createElement("p");
    n.className = "muted";
    n.textContent = "Couldn't fetch earlier marks for this date (" + (e.message || "no reply") + "). You can still take the register and save.";
    regBody.prepend(n);
  });

  // Lesson notes: this date's entry + last lesson + whole history.
  // 28 Sept: lessons saved on this device but still being sent show at once.
  llsLesson.entries = llsWithPendingEntries(cls.id, []);
  if (local && local.note && !llsLesson.entries.some((e) => e.lessonDate === date)) {
    llsLesson.entries = [{ lessonDate: date, ...local.note }, ...llsLesson.entries];
  }
  llsRenderLessonLogList(byId("lessonHistory"), llsLesson.entries);
  byId("lessonHistoryCount").textContent = llsLesson.entries.length ? `(${llsLesson.entries.length})` : "";
  const logCacheKey = "lls_cache_log_" + cls.id;
  const applyLog = (log) => {
    if (llsLesson.loadedKey !== key) return;
    llsLesson.entries = llsWithPendingEntries(cls.id, Array.isArray(log.entries) ? log.entries : []);
    if (Array.isArray(log.files)) llsStoreLessonFiles_(cls.id, log.files);
    llsNoteCancelFromEntries_(cls.id, Array.isArray(log.entries) ? log.entries : []);
    const own = llsLesson.entries.find((e) => e.lessonDate === date);
    if (own && !pending && !llsLesson.noteTouched && !llsIsCancelUnit(own.unit)) llsFillLessonNote(own, cls);
    else llsRenderSkills(); // class history now gives better suggestions
    const last = llsLesson.entries.find((e) => e.lessonDate < date && !llsIsCancelUnit(e.unit));
    const lastBox = byId("lessonLast");
    if (last) { lastBox.hidden = false; lastBox.innerHTML = `<h3>📝 Last lesson</h3>${llsLessonLogEntryHtml(last)}`; }
    llsRenderLessonLogList(byId("lessonHistory"), llsLesson.entries);
    byId("lessonHistoryCount").textContent = llsLesson.entries.length ? `(${llsLesson.entries.length})` : "";
    llsRenderPlanPanel();
  };
  // 30 Sept: this class's notes as saved on this device, at once; Google's copy replaces them.
  try { const c = JSON.parse(localStorage.getItem(logCacheKey) || "null"); if (c && Array.isArray(c.entries)) applyLog(c); } catch (_) {}
  llsApiGet("getLessonLog", { classId: cls.id, limit: 1000 }).then((log) => {
    try { localStorage.setItem(logCacheKey, JSON.stringify({ entries: (log.entries || []).slice(0, 60) })); } catch (_) {}
    applyLog(log);
  }).catch((e) => {
    if (llsLesson.loadedKey !== key || llsLesson.entries.length) return;
    byId("lessonHistory").innerHTML = `<p class="muted">${escapeHtml(e.message || "")}</p>`;
  });

  llsRenderPlanPanel();
  llsRenderCancelBanner();
  if (typeof llsRenderTellOffice === "function") llsRenderTellOffice();
  llsTestFromLesson = true;
  llsRenderLessonTests();

  // Homework already set for this class
  const hwCacheKey = "lls_cache_hw_" + cls.id;
  const applyHw = (hw) => {
    if (llsLesson.loadedKey !== key) return;
    llsLesson.homework = Array.isArray(hw.homework) ? hw.homework : [];
    llsLesson.status = Array.isArray(hw.status) ? hw.status : [];
    llsLesson.files = Array.isArray(hw.files) ? hw.files : [];
    llsRenderLessonHomework(students.length);
  };
  try { const c = JSON.parse(localStorage.getItem(hwCacheKey) || "null"); if (c) applyHw(c); } catch (_) {}
  llsApiGet("getHomeworkForClass", { classId: cls.id }).then((hw) => {
    try { localStorage.setItem(hwCacheKey, JSON.stringify({ homework: (hw.homework || []).slice(-30), status: (hw.status || []).slice(-400), files: (hw.files || []).slice(-200) })); } catch (_) {}
    applyHw(hw);
  }).catch(() => {});
}

// Section 4 of the Lesson page: this class's quizzes.
async function llsRenderLessonTests() {
  const box = byId("lessonTests");
  const classId = llsLesson.classId;
  if (!box || !classId) return;
  box.innerHTML = `<p class="muted">Loading…</p>`;
  try {
    const data = await llsApiGet("getTeacherTestsForClass", { classId });
    if (llsLesson.classId !== classId) return;
    llsTeacherTests = { classId, tests: (data.tests || []).filter((t) => !(llsDeletedTests_ && llsDeletedTests_.has(t.testId))), results: data.results || [] };
    const total = llsStudentsForClass(classId).length;
    box.innerHTML = llsTeacherTests.tests.length ? llsTeacherTests.tests.map((t) => {
      const rs = llsTeacherTests.results.filter((r) => r.testId === t.testId);
      const avg = rs.length ? Math.round(rs.reduce((sum, r) => sum + (r.total ? r.first / r.total : 0), 0) / rs.length * 100) : null;
      return `<div class="lesson-hw-item"><span>📝 ${escapeHtml(t.title)}<span class="muted"> · ${t.count} questions</span></span>
        <span style="display:flex;gap:8px;align-items:center"><strong>${rs.length}/${total} done${avg == null ? "" : ` · ${avg}%`}</strong>
        <button class="row-action" type="button" data-lesson-test="${escapeHtml(t.testId)}">Results</button></span></div>`;
    }).join("") : `<p class="muted">No quizzes yet for this class.</p>`;
    box.querySelectorAll("[data-lesson-test]").forEach((b) => b.addEventListener("click", () => llsOpenTestResults(b.dataset.lessonTest)));
  } catch (error) {
    box.innerHTML = `<p class="muted">Couldn't load quizzes: ${escapeHtml(error.message || "")}</p>`;
  }
}

function llsFillLessonNote(entry, cls) {
  const sp = llsSpecialTitle(entry.unit);
  const choice = llsIsChoiceUnit(entry.unit);
  const parsed = llsParseSkills(entry.whatWeDid || "");
  const ct = choice ? llsSplitChoiceTitle(parsed.rest) : { title: "", rest: parsed.rest };
  const mat = choice ? llsSplitMaterials(entry.notes) : { notes: entry.notes || "", links: [] };
  if (sp) { llsSetSpecial(true, sp); setValue("lessonUnitPage", cls.currentUnit || ""); }
  else if (choice) { llsSetChoice(true, ct.title, mat.links.join("\n")); setValue("lessonUnitPage", cls.currentUnit || ""); }
  else setValue("lessonUnitPage", entry.unit || "");
  llsSkillState = parsed.skills;
  setValue("lessonDone", ct.rest);
  setValue("lessonNotes", mat.notes || "");
  llsRenderSkills();
}

function llsSetRegisterRow(row, status, notes) {
  row.dataset.status = status;
  row.querySelectorAll(".reg-btn").forEach((x) => { const on = x.dataset.status === status; x.classList.toggle("on", on); x.setAttribute("aria-pressed", String(on)); });
  const parts = llsSplitRating(notes);
  const sel = row.querySelector(".reg-rating"); if (sel) sel.value = parts.rating;
  const note = row.querySelector(".reg-note"); if (note) note.value = parts.note;
}

function llsDrawRegister(regBody, students, saved) {
  regBody.innerHTML = students.length ? students.map((st) => {
    const id = String(st["Student ID"] || "").trim();
    const row = saved.get(id) || {};
    const status = String(row["Status"] || "Present");
    const btn = (s, label) => `<button type="button" class="reg-btn reg-${s.toLowerCase()}${status === s ? " on" : ""}" data-status="${s}" aria-pressed="${status === s}">${label}</button>`;
    return `<div class="reg-row" data-student="${escapeHtml(id)}" data-status="${escapeHtml(status)}">
      <div class="reg-name">${escapeHtml(llsStudentName(st))}</div>
      <div class="reg-btns">${btn("Present", "✓ Here")}${btn("Late", "Late")}${btn("Absent", "Absent")}${btn("Excused", "Excused")}</div>
      <div class="reg-how">
        <select class="reg-rating" aria-label="How did they do?">
          <option value="">How did they do?</option>
          ${["Excellent", "Good", "OK", "Needs support"].map((r) => `<option value="${r}" ${llsSplitRating(row["Notes"]).rating === r ? "selected" : ""}>${{ Excellent: "⭐ Excellent", Good: "👍 Good", OK: "🙂 OK", "Needs support": "🤝 Needs support" }[r]}</option>`).join("")}
        </select>
        <input class="reg-note" type="text" autocomplete="off" placeholder="Note (optional)" value="${escapeHtml(llsSplitRating(row["Notes"]).note)}">
      </div>
    </div>`;
  }).join("") : `<p class="muted">No students enrolled in this class yet.</p>`;
  regBody.querySelectorAll(".reg-row").forEach((row) => {
    const touch = () => { row.dataset.touched = "1"; row.classList.remove("needs"); };
    row.querySelectorAll(".reg-btn").forEach((b) => b.addEventListener("click", () => {
      touch();
      llsSetRegisterRow(row, b.dataset.status, llsJoinRating(row.querySelector(".reg-rating").value, row.querySelector(".reg-note").value));
      llsLessonCount();
    }));
    row.querySelector(".reg-rating").addEventListener("change", touch);
    row.querySelector(".reg-note").addEventListener("input", touch);
  });
  llsLessonCount();
  byId("lessonAllHere").hidden = !students.length;
}

function llsRenderLessonHomework(classSize) {
  const box = byId("lessonHwList");
  if (!box) return;
  const items = [...llsLesson.homework].sort((a, b) => String(b["Created At"] || b["Assigned Date"] || "").localeCompare(String(a["Created At"] || a["Assigned Date"] || ""))).slice(0, 4);
  box.innerHTML = items.length ? `<p class="section-label" style="margin:14px 0 6px;">Recent homework</p>` + items.map((h) => {
    const id = String(h["Homework ID"] || "");
    const done = llsLesson.status.filter((s) => String(s["Homework ID"] || "") === id && String(s["Status"] || "") === "Done").length;
    const due = h["Due Date"] ? ` · due ${formatDate(String(h["Due Date"]))}` : "";
    const f = id ? llsHwFileCounts_(id, llsLesson) : { teacher: 0, students: 0, toMark: 0 };
    return `<div class="lesson-hw-item"><span>${escapeHtml(String(h["Title"] || ""))}<span class="muted">${escapeHtml(due)}</span></span>
      <span class="lesson-hw-actions"><strong>${done}/${classSize} done</strong>
      ${id ? `<button type="button" class="row-action" data-lhw-files="${escapeAttribute(id)}">📎 Files${f.teacher ? " (" + f.teacher + ")" : ""}</button>
      <button type="button" class="row-action${f.toMark ? " has-new" : ""}" data-lhw-mark="${escapeAttribute(id)}">${f.students ? `📥 Work (${f.students})${f.toMark ? " · " + f.toMark + " to mark" : ""}` : "View / Mark"}</button>` : ""}</span></div>`;
  }).join("") : "";
  const useLesson = () => { llsHomeworkCache = { classId: llsLesson.classId, homework: llsLesson.homework, status: llsLesson.status, files: llsLesson.files || [], fromLesson: true }; };
  box.querySelectorAll("[data-lhw-files]").forEach((b) => b.addEventListener("click", () => { useLesson(); llsOpenHwFiles(b.dataset.lhwFiles); }));
  box.querySelectorAll("[data-lhw-mark]").forEach((b) => b.addEventListener("click", () => { useLesson(); openHomeworkStatusModal(b.dataset.lhwMark); }));
}

// "How did they do?" lives at the start of the attendance note: "[Good] note".
function llsSplitRating(notes) {
  const m = String(notes || "").match(/^\[(Excellent|Good|OK|Needs support)\]\s*/);
  return { rating: m ? m[1] : "", note: m ? String(notes).slice(m[0].length) : String(notes || "") };
}
function llsJoinRating(rating, note) {
  return [rating ? `[${rating}]` : "", note].filter(Boolean).join(" ");
}

function llsLessonCount() {
  const rows = [...document.querySelectorAll("#lessonRegister .reg-row")];
  const here = rows.filter((r) => ["Present", "Late"].includes(r.dataset.status)).length;
  const el = byId("lessonRegCount");
  if (el) el.textContent = rows.length ? `${here}/${rows.length} here` : "";
}

async function llsChangeLessonUnit(step) {
  const cls = llsLessonClasses().find((c) => c.id === llsLesson.classId);
  if (!cls) return;
  const current = Number(cls.currentUnit) || 0;
  const maxUnit = (window.LLS_COURSES && LLS_COURSES[cls.book] && LLS_COURSES[cls.book].unitCount) || 12;
  const next = Math.max(1, Math.min(maxUnit, current + step));
  if (next === current) return;
  try {
    llsQueueSave(`${cls.name} unit`, { action: "updateClass", classId: cls.id, fields: { "Current Unit": String(next) } });
    cls.currentUnit = String(next);
    saveState();
    byId("lessonUnitValue").textContent = next;
    llsRenderHwSuggest(cls);
    llsRenderSkills();
    if (/^\d+$/.test(value("lessonUnitPage")) || !value("lessonUnitPage")) setValue("lessonUnitPage", String(next));
    showToast(`${cls.name} is now on unit ${next}. Practice in the app follows it.`, "success");
  } catch (error) {
    showToast(error.message || "Could not change the unit.", "error");
  }
}

async function llsSaveLesson() {
  const cls = llsLessonClasses().find((c) => c.id === llsLesson.classId);
  const date = byId("lessonDate")?.value || "";
  if (!cls || !date) { showToast("Choose a class and date.", "error"); return; }
  const specialOn = byId("lessonSpecialOn")?.checked;
  const specialTitle = value("lessonSpecialTitle").trim();
  if (specialOn && !specialTitle) {
    showToast("Give the special lesson a name (e.g. Halloween), or untick ⭐ Special lesson.", "error");
    byId("lessonSpecialTitle")?.focus();
    return;
  }
  // 5 Oct: Teacher's choice needs a title and a clear description (it counts like a book lesson).
  const choiceOn = !specialOn && llsChoiceOn();
  const choiceTitle = value("lessonChoiceTitle").trim();
  const choiceLinks = value("lessonChoiceLinks").split(/\n+/).map((x) => x.trim()).filter(Boolean);
  if (choiceOn && !choiceTitle) {
    showToast("Give your lesson a title (e.g. Cambridge B1 Listening Part 1).", "error");
    byId("lessonChoiceTitle")?.classList.add("needs");
    byId("lessonChoiceTitle")?.focus();
    return;
  }
  byId("lessonChoiceTitle")?.classList.remove("needs");

  // Required (owner, 27 Sept): a rating for every student who was there,
  // and "What we did" (filled automatically for a special lesson).
  const rowEls = [...document.querySelectorAll("#lessonRegister .reg-row")];
  const unrated = rowEls.filter((r) => ["Present", "Late"].includes(r.dataset.status) && !r.querySelector(".reg-rating")?.value);
  rowEls.forEach((r) => r.classList.toggle("needs", unrated.includes(r)));
  // 30 Sept: normal lessons need at least one skill ticked, each with a topic.
  const skillBox = byId("lessonSkills");
  const ticked = LLS_SKILLS.filter((s) => llsSkillState[s.k]?.on);
  const noTopic = ticked.filter((s) => !String(llsSkillState[s.k].topic || "").trim());
  skillBox?.querySelectorAll(".sk-row").forEach((r) => r.classList.toggle("needs", noTopic.some((s) => s.k === r.dataset.skillRow)));
  const needSkill = !specialOn && !ticked.length;
  skillBox?.classList.toggle("needs", needSkill);
  const doneText = [...llsSkillLines(llsSkillState), choiceOn ? LLS_CHOICE_MARK + choiceTitle : "", value("lessonDone").trim()].filter(Boolean).join("\n") || (specialOn ? specialTitle + " lesson" : "");
  const needDone = choiceOn && value("lessonDone").trim().length < 30;
  byId("lessonDone")?.classList.toggle("needs", needDone);
  if (unrated.length || needSkill || noTopic.length || needDone) {
    const missing = [];
    if (needDone) missing.push(`"What exactly did you do?" (a few clear lines)`);
    if (unrated.length) missing.push(`"How did they do?" for ${unrated.length} ${unrated.length === 1 ? "student" : "students"}`);
    if (needSkill) missing.push(`"What did you do today?" (tap Grammar, Reading…)`);
    if (noTopic.length) missing.push(`a topic for ${noTopic.map((s) => s.k).join(", ")}`);
    showToast(`Almost done: fill in ${missing.join(" and ")}. They count towards each student's progress.`, "error");
    (unrated[0]?.querySelector(".reg-rating") || byId("lessonSkills")?.querySelector(".sk-row.needs input") || (needSkill || noTopic.length ? byId("lessonSkills")?.querySelector(".sk-toggle") : byId("lessonDone")))?.focus();
    return;
  }

  const rows = rowEls.map((r) => ({
    studentId: r.dataset.student,
    status: r.dataset.status || "Present",
    // 28 Sept: a rating only counts for students who were there.
    notes: llsJoinRating(["Present", "Late"].includes(r.dataset.status || "Present") ? (r.querySelector(".reg-rating")?.value || "") : "", r.querySelector(".reg-note")?.value.trim() || "")
  }));
  const hwTitle = value("lessonHwTitle").trim();
  const note = {
    unit: specialOn ? LLS_SPECIAL_PREFIX + specialTitle : choiceOn ? LLS_CHOICE_UNIT : value("lessonUnitPage").trim(),
    whatWeDid: doneText,
    notes: [value("lessonNotes").trim(), choiceOn && choiceLinks.length ? LLS_MATERIALS_MARK + "\n" + choiceLinks.join("\n") : ""].filter(Boolean).join("\n")
  };
  // Photos/files of the materials go up now (they are linked by class + date, not by the log row).
  const choiceFiles = choiceOn ? Array.from(byId("lessonChoiceFiles")?.files || []) : [];
  if (choiceFiles.length) {
    if ((window.llsServerVersion || 0) >= 32) llsUploadLessonFiles_(cls.id, date, choiceFiles);
    else showToast("Photos need Apps Script V32 (ask the office). Your lesson, links and description are saved.", "info");
    const fi = byId("lessonChoiceFiles"); if (fi) fi.value = ""; llsChoiceFilesPicked_();
  }
  const own = llsLesson.entries.find((e) => e.lessonDate === date);
  const homeworkSet = hwTitle || (own ? own.homeworkSet : "");
  const session = llsGetTeacherSession();
  const rid = () => (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : `r${Date.now()}${Math.random().toString(36).slice(2)}`;

  const steps = [];
  if (rows.length) steps.push({ what: "register", body: { action: "saveAttendance", classId: cls.id, lessonDate: date, rows, requestId: rid() } });
  if (hwTitle) steps.push({ what: "homework", body: { action: "createHomework", classId: cls.id, teacherId: session?.teacherId || "", title: hwTitle, description: value("lessonHwText").trim(), assignedDate: date, dueDate: value("lessonHwDue"), requestId: rid() } });
  // 2 Oct: files chosen for this homework go up once Google gives it a number.
  const hwFiles = Array.from(byId("lessonHwFiles")?.files || []);
  if (hwTitle && hwFiles.length) llsPendingHwFiles[steps[steps.length - 1].body.requestId] = { files: hwFiles, classId: cls.id };
  steps.push({ what: "notes", body: { action: "saveLessonLog", classId: cls.id, lessonDate: date, ...note, homeworkSet, requestId: rid() } });

  // A newer save of the same lesson replaces one still waiting to be sent
  // (the homework part is kept, so it is never lost).
  const box = llsOutboxLoad();
  const older = box.filter((j) => j.classId === cls.id && j.date === date && !j.sending);
  older.forEach((j) => j.steps.filter((st) => st.what === "homework" && !st.done).forEach((st) => steps.splice(1, 0, st)));
  const next = box.filter((j) => !older.includes(j));
  next.push({ id: rid(), classId: cls.id, className: cls.name, date, rows, note: { ...note, homeworkSet }, steps, createdAt: Date.now(), tries: 0 });
  llsOutboxSave(next);

  // Update the screen now, without waiting for Google.
  llsLesson.entries = [{ lessonDate: date, teacherName: session?.name || "", unit: note.unit, whatWeDid: note.whatWeDid, homeworkSet, notes: note.notes }, ...llsLesson.entries.filter((e) => e.lessonDate !== date)];
  // A cancelled lesson that took place after all: saving it replaces the cancellation.
  if (llsIsCancelled(cls.id, date)) { delete llsCancelled[cls.id + "|" + date]; llsCancelStore_(); llsAfterCancelChange_(); }
  llsRenderLessonLogList(byId("lessonHistory"), llsLesson.entries);
  if (hwTitle) {
    llsLesson.homework = [{ Title: hwTitle, "Due Date": value("lessonHwDue"), "Created At": new Date().toISOString() }, ...llsLesson.homework];
    llsRenderLessonHomework(rows.length);
    setValue("lessonHwTitle", ""); setValue("lessonHwText", "");
    delete llsWbState.lessonWbBox; llsLessonWb_();
    if (byId("lessonHwFiles")) { byId("lessonHwFiles").value = ""; llsLessonFilesPicked_(); }
  }
  const savedBtn = byId("lessonSaveButton");
  if (savedBtn) {
    savedBtn.textContent = "✓ Lesson saved";
    savedBtn.classList.add("is-saved");
    savedBtn.disabled = true;
    setTimeout(() => { savedBtn.textContent = "💾 Save lesson"; savedBtn.classList.remove("is-saved"); savedBtn.disabled = false; }, 4000);
  }
  showToast(`✓ ${cls.name} saved on this device. It's being sent to Google in the background: you can go to your next class.`, "success");
  llsRenderLessonPicker();
  llsPaintLessonState();
  llsOutboxRun();
}

/* ---------- Lesson outbox (27 Sept) ----------
   Saving a lesson used to wait for three slow Google calls (up to 1–2
   minutes). Now the lesson is kept on this device first ("lls_outbox"),
   then sent in the background, retrying until Google confirms. Each part
   carries a receipt number, so a re-send never saves twice (Apps Script V25). */
const LLS_OUTBOX_KEY = "lls_outbox";
let llsOutboxBusy = false;
let llsOutboxTimer = null;

function llsOutboxLoad() {
  try { return JSON.parse(localStorage.getItem(LLS_OUTBOX_KEY) || "[]") || []; } catch (_) { return []; }
}
function llsOutboxSave(list) {
  try { localStorage.setItem(LLS_OUTBOX_KEY, JSON.stringify(list)); } catch (_) {}
  llsOutboxPaint();
}
function llsOutboxFor(classId, date) {
  return llsOutboxLoad().find((j) => j.classId === classId && j.date === date) || null;
}

function llsOutboxPaint() {
  const box = llsOutboxLoad();
  let pill = byId("lessonOutbox");
  const bar = document.querySelector(".lesson-save-bar");
  if (!pill && bar) {
    pill = document.createElement("button");
    pill.type = "button";
    pill.id = "lessonOutbox";
    pill.className = "outbox-pill";
    pill.addEventListener("click", () => { llsOutboxRun(true); llsSaveQRun(true); });
    bar.prepend(pill);
  }
  let top = byId("topOutbox");
  const actions = document.querySelector(".topbar-actions");
  if (!top && actions) {
    top = document.createElement("button");
    top.type = "button";
    top.id = "topOutbox";
    top.className = "outbox-pill in-topbar";
    top.addEventListener("click", () => { llsOutboxRun(true); llsSaveQRun(true); });
    actions.insertBefore(top, actions.firstChild);
  }
  const failed = box.filter((j) => j.error);
  const queue = typeof llsSaveQLoad === "function" ? llsSaveQLoad() : [];
  const qFailed = queue.filter((j) => j.error);
  const count = box.length + queue.length;
  let text = "";
  if (failed.length) text = `⚠ ${failed.length === 1 ? failed[0].className + " " + failed[0].date : failed.length + " lessons"} not sent: ${failed[0].error}. Tap to retry`;
  else if (qFailed.length) text = `⚠ ${qFailed.length === 1 ? qFailed[0].label : qFailed.length + " changes"} not sent: ${qFailed[0].error}. Tap to retry`;
  else if (box.length && !queue.length) text = `⏳ Sending ${box.length === 1 ? box[0].className : box.length + " lessons"} to Google…`;
  else if (count === 1) text = `⏳ Sending ${queue[0].label} to Google…`;
  else if (count) text = `⏳ Sending ${count} changes to Google…`;
  [pill, top].forEach((el) => {
    if (!el) return;
    el.hidden = !count;
    el.textContent = text;
    el.classList.toggle("is-error", Boolean(failed.length || qFailed.length));
  });
  llsPaintLessonState();
}

async function llsOutboxRun(manual) {
  clearTimeout(llsOutboxTimer);
  if (llsOutboxBusy) return;
  if (!sessionStorage.getItem(LLS_ADMIN_TOKEN_KEY)) return; // resumes after login
  llsOutboxBusy = true;
  try {
    // 30 Sept: work from a snapshot but always write through llsOutboxPatch_,
    // which re-reads the list first, so a lesson saved while another is being
    // sent is never overwritten.
    const box = llsOutboxLoad();
    for (const job of box) {
      if (job.error && !manual) continue;
      if (!llsOutboxLoad().some((j) => j.id === job.id)) continue; // replaced by a newer save
      job.sending = true; job.error = ""; llsOutboxPatch_(job);
      let problem = "";
      // 30 Sept (Apps Script V27): the whole lesson in ONE call instead of
      // three. Older Apps Script answers "Unknown mutation action": then the
      // parts are sent one by one as before.
      const combined = llsCombinedLessonBody_(job);
      if (combined) {
        try {
          const res = await llsApiPost(combined);
          const hwStep = job.steps.find((st) => st.what === "homework");
          if (hwStep && res && res.homework && res.homework.homeworkId) llsAfterHomeworkSaved_(hwStep.body.requestId, res.homework.homeworkId);
          job.steps.forEach((st) => { st.done = true; });
          llsOutboxPatch_(job);
        } catch (e) {
          // Apps Script before V27: "Unknown mutation action" (office) or
          // "Teachers can't do that" (teacher login, action not on its list).
          if (/Unknown mutation action|Teachers can't do that/i.test(e?.message || "")) {
            window.llsNoSaveLesson = true;
          } else if (e && (e.transport || e.uncertain || /didn't answer|didn't confirm|no connection|HTTP/i.test(e.message || ""))) {
            problem = "retry";
          } else {
            problem = e?.message || "error";
          }
        }
      }
      for (const step of job.steps) {
        if (problem) break;
        if (step.done) continue;
        try {
          const res = await llsApiPost(step.body);
          if (step.what === "homework" && res && res.homeworkId) llsAfterHomeworkSaved_(step.body.requestId, res.homeworkId);
          step.done = true;
          llsOutboxPatch_(job);
        } catch (e) {
          if (e && (e.transport || e.uncertain || /didn't answer|didn't confirm|no connection|HTTP/i.test(e.message || ""))) { problem = "retry"; }
          else problem = e?.message || "error";
          break;
        }
      }
      job.sending = false;
      job.tries = (job.tries || 0) + 1;
      if (!problem) {
        llsSavedRemember(job);
        llsOutboxSave(llsOutboxLoad().filter((j) => j.id !== job.id));
        if (llsIsCurrentLesson(job)) llsAttendanceLoadedKey = "";
        llsRenderLessonPicker();
        showToast(`✓ ${job.className} (${job.date}) is safely in Google Sheets.`, "success");
      } else if (problem === "retry") {
        llsOutboxPatch_(job);
        break; // Google is slow or unreachable: try again later
      } else {
        job.error = problem === "UNAUTHORIZED" ? "please log in again" : problem;
        llsOutboxPatch_(job);
      }
    }
  } finally {
    llsOutboxBusy = false;
    const left = llsOutboxLoad().filter((j) => !j.error);
    if (left.length) {
      const tries = Math.max(...left.map((j) => j.tries || 0));
      llsOutboxTimer = setTimeout(() => llsOutboxRun(), Math.min(120000, 8000 * Math.max(1, tries)));
    }
  }
}

// 30 Sept: one saveLesson call for a whole outbox job (register + homework
// + notes). Its receipt number is kept with the job, so sending it again
// (retry, or the "closing the page" send below) never saves twice.
function llsCombinedLessonBody_(job) {
  if (window.llsNoSaveLesson || !job || !Array.isArray(job.steps)) return null;
  if (job.steps.some((st) => st.done)) return null;
  const reg = job.steps.find((st) => st.what === "register");
  const notes = job.steps.find((st) => st.what === "notes");
  const hws = job.steps.filter((st) => st.what === "homework");
  if (!notes || hws.length > 1) return null;
  if (!job.combinedId) {
    job.combinedId = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : `r${Date.now()}${Math.random().toString(36).slice(2)}`;
    const box = llsOutboxLoad();
    const same = box.find((j) => j.id === job.id);
    if (same) { same.combinedId = job.combinedId; try { localStorage.setItem(LLS_OUTBOX_KEY, JSON.stringify(box)); } catch (_) {} }
  }
  const n = notes.body, h = hws[0] && hws[0].body;
  return {
    action: "saveLesson",
    classId: job.classId,
    lessonDate: job.date,
    rows: reg ? reg.body.rows : [],
    homework: h ? { title: h.title, description: h.description, assignedDate: h.assignedDate, dueDate: h.dueDate, teacherId: h.teacherId } : null,
    log: { unit: n.unit, whatWeDid: n.whatWeDid, notes: n.notes, homeworkSet: n.homeworkSet, teacherId: n.teacherId },
    requestId: job.combinedId
  };
}

// 30 Sept: if the page is closed (or the phone switches app) while lessons
// are still waiting, hand them to Google one last time. The browser sends
// this even as the page closes. The lesson stays in the outbox until Google
// confirms it on the next visit, so nothing depends on this working.
function llsOutboxBeacon_() {
  try {
    if (!navigator.sendBeacon || window.llsNoSaveLesson) return;
    const token = sessionStorage.getItem(LLS_ADMIN_TOKEN_KEY);
    if (!token) return;
    llsOutboxLoad().filter((j) => !j.error).forEach((job) => {
      const body = llsCombinedLessonBody_(job);
      if (!body) return;
      const form = new URLSearchParams();
      form.set("action", "saveLesson");
      form.set("payload", JSON.stringify(Object.assign({}, body, { token })));
      navigator.sendBeacon(LLS_API_URL, form);
    });
  } catch (_) { /* the normal outbox still has it */ }
}

// Lesson-log entries for a class, with lessons still in the outbox on top
// (newest first, one per date).
function llsWithPendingEntries(classId, entries) {
  const pending = llsOutboxLoad().filter((j) => j.classId === classId && j.note).map((j) => ({
    lessonDate: j.date, teacherName: (llsGetTeacherSession() || {}).name || "", unit: j.note.unit || "",
    whatWeDid: j.note.whatWeDid || "", homeworkSet: j.note.homeworkSet || "", notes: j.note.notes || ""
  }));
  const dates = new Set(pending.map((e) => e.lessonDate));
  return [...pending, ...entries.filter((e) => !dates.has(e.lessonDate))]
    .sort((a, b) => String(b.lessonDate || "").localeCompare(String(a.lessonDate || "")));
}

function llsIsCurrentLesson(job) {
  return job.classId === llsLesson.classId && job.date === (byId("lessonDate")?.value || "");
}

document.addEventListener("DOMContentLoaded", () => {
  llsOutboxPaint();
  setTimeout(() => llsOutboxRun(), 1500);
  window.addEventListener("online", () => llsOutboxRun());
  // 30 Sept: back on the page (phone unlocked, tab re-opened): send at once.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") llsOutboxRun();
    else llsOutboxBeacon_();
  });
  window.addEventListener("pagehide", llsOutboxBeacon_);
  window.addEventListener("beforeunload", (e) => {
    if (llsOutboxLoad().some((j) => !j.error)) { e.preventDefault(); e.returnValue = ""; }
  });
});

function llsInitLessonPage() {
  if (llsRole() === "teacher") llsScheduleWeekPanels_();
  const dateInput = byId("lessonDate");
  if (dateInput && !dateInput.value) dateInput.value = isoDate(new Date());
  if (!llsLesson.classId) {
    const mine = llsLessonsOn(dateInput?.value || isoDate(new Date()), Boolean(llsMyNames()));
    if (mine.length) {
      // Pre-select the lesson on now (started < 60 min ago) or the next one.
      const d = new Date(), nowMin = d.getHours() * 60 + d.getMinutes();
      const mins = (t) => { const m = String(t).match(/^(\d{1,2}):(\d{2})/); return m ? Number(m[1]) * 60 + Number(m[2]) : -1; };
      const upcoming = mine.filter((l) => mins(l.time) >= nowMin - 60);
      llsLesson.classId = (upcoming[0] || mine[mine.length - 1]).cls.id;
    }
  }
  llsRenderLessonPicker();
  llsRenderLesson();
}

document.addEventListener("DOMContentLoaded", () => {
  byId("lessonDate")?.addEventListener("change", () => { llsLesson.loadedKey = ""; llsRenderLessonPicker(); llsRenderLesson(); });
  byId("lessonSaveButton")?.addEventListener("click", llsSaveLesson);
  byId("lessonNewTest")?.addEventListener("click", () => { llsTestFromLesson = true; llsOpenNewTest(); });
  ["lessonUnitPage", "lessonDone", "lessonNotes", "lessonChoiceTitle", "lessonChoiceLinks"].forEach((id) => byId(id)?.addEventListener("input", () => { llsLesson.noteTouched = true; byId("lessonDone")?.classList.remove("needs"); }));
  byId("lessonSpecialOn")?.addEventListener("change", (e) => { llsSetSpecial(e.target.checked, value("lessonSpecialTitle")); if (e.target.checked) byId("lessonSpecialTitle")?.focus(); });
  byId("lessonSpecialTitle")?.addEventListener("input", llsMarkSpecialChip);
  document.querySelectorAll("#lessonTypeBar [data-ltype]").forEach((b) => b.addEventListener("click", () => { llsLesson.noteTouched = true; llsPickLessonType_(b.dataset.ltype); }));
  byId("lessonChoiceTitle")?.addEventListener("input", () => { llsMarkChoiceChip_(); byId("lessonChoiceTitle").classList.remove("needs"); });
  byId("lessonChoiceTitle")?.addEventListener("change", () => llsRenderSkills());
  document.querySelectorAll("#lessonChoiceChips [data-choice]").forEach((b) => b.addEventListener("click", () => { setValue("lessonChoiceTitle", b.dataset.choice); llsMarkChoiceChip_(); llsRenderSkills(); byId("lessonChoiceTitle")?.focus(); }));
  byId("lessonChoiceFiles")?.addEventListener("change", llsChoiceFilesPicked_);
  byId("lessonChoiceFiles")?.addEventListener("click", (e) => { if ((window.llsServerVersion || 0) < 32) { e.preventDefault(); llsChoiceFilesPicked_(); } });
  document.querySelectorAll("#lessonSpecialChips [data-special]").forEach((b) => b.addEventListener("click", () => { setValue("lessonSpecialTitle", b.dataset.special); llsMarkSpecialChip(); }));
  byId("lessonUnitMinus")?.addEventListener("click", () => llsChangeLessonUnit(-1));
  byId("lessonUnitPlus")?.addEventListener("click", () => llsChangeLessonUnit(1));
  byId("lessonResultsButton")?.addEventListener("click", () => llsOpenClassResults(llsLesson.classId));
  byId("lessonAllHere")?.addEventListener("click", () => {
    document.querySelectorAll("#lessonRegister .reg-row").forEach((r) => r.querySelector('.reg-btn[data-status="Present"]')?.click());
  });
});


/* =========================================================
   28 Sept — VOID A PAYMENT (never delete money records)
   Payments tab gets Status / Voided Date / Voided By / Void Reason
   (Apps Script V26 adds the columns on first use). A voided payment
   stays in the sheet, is shown crossed out, and no longer counts
   towards the balance, reports or reminders. Rows with no Status
   (everything before V26) count as Active.
   Also: every payment says which instalment it is, and the form
   warns before saving the same payment twice.
========================================================= */

function llsPaymentIsVoid(payment) {
  return /^void/i.test(String((payment && payment["Status"]) || "").trim());
}

function llsFeeRecord(feeId) {
  return (llsLiveFinanceData.fees || []).find(
    (item) => String(item["Fee ID"] || "").trim() === String(feeId || "").trim()
  ) || null;
}

function llsActivePaymentsForFee(feeId) {
  return (llsLiveFinanceData.payments || []).filter(
    (item) => String(item["Fee ID"] || "").trim() === String(feeId || "").trim() && !llsPaymentIsVoid(item)
  );
}

// Best guess for "Which payment is this?", so the office rarely has to change it.
function llsDefaultInstalment(plan, fee, paid) {
  plan = String(plan || "");
  if (/hour pack/i.test(plan)) return "Hour pack";
  if (plan === "Monthly") return "Monthly";
  if (plan === "Full payment") return "Full payment";
  if (plan === "3 instalments") {
    if (!fee) return "Instalment 1";
    let cumulative = 0;
    for (let i = 1; i <= 3; i++) {
      const amount = number(fee[`Instalment ${i} Amount`]);
      if (!(amount > 0)) continue;
      cumulative += amount;
      if (cumulative - number(paid) > 0.001) return `Instalment ${i}`;
    }
    return "Other";
  }
  return "Other";
}

function llsSetInstalmentDefault() {
  const select = byId("paymentInstalment");
  if (!select) return;
  if (paymentModalMode === "payment") {
    const feeId = value("paymentId");
    const fee = llsFeeRecord(feeId);
    const row = (state.payments || []).find((p) => p.id === feeId);
    select.value = llsDefaultInstalment(fee ? fee["Payment Plan"] : "", fee, row ? row.paid : 0);
  } else {
    select.value = llsDefaultInstalment(value("paymentPlan") || "Full payment", null, 0);
  }
}

function llsHideDuplicateWarning() {
  const box = byId("paymentDuplicateWarning");
  if (box) { box.hidden = true; box.textContent = ""; }
  const form = byId("paymentForm");
  if (form) delete form.dataset.dupOk;
  const button = form?.querySelector('button[type="submit"]');
  if (button && button.dataset.normalLabel) { button.textContent = button.dataset.normalLabel; delete button.dataset.normalLabel; }
}

function llsPaymentFormReady() {
  llsHideDuplicateWarning();
  llsSetInstalmentDefault();
}

// Returns true when it's fine to save. The first time a likely duplicate is
// found it shows a warning and asks for a second press ("Save anyway").
function llsDuplicateCheckPassed(feeId, amount, date, instalment) {
  const form = byId("paymentForm");
  const signature = [feeId, amount, date, instalment].join("|");
  if (form && form.dataset.dupOk === signature) return true;

  const matches = llsActivePaymentsForFee(feeId).filter((p) => {
    const sameAmountAndDay = Math.abs(number(p["Amount"]) - number(amount)) < 0.005 &&
      llsDateOnly(p["Payment Date"]) === date;
    const sameInstalment = /^Instalment \d$/.test(instalment) &&
      String(p["Instalment"] || "").trim() === instalment;
    return sameAmountAndDay || sameInstalment;
  });
  if (!matches.length) return true;

  const first = matches[0];
  const box = byId("paymentDuplicateWarning");
  if (box) {
    box.textContent = `Possible duplicate: ${formatMoney(number(first["Amount"]))} on ${formatDate(llsDateOnly(first["Payment Date"]))}` +
      (String(first["Instalment"] || "").trim() ? ` (${String(first["Instalment"]).trim()})` : "") +
      " is already recorded for this fee. Check before saving. If it really is a second payment, press Save anyway.";
    box.hidden = false;
  }
  const button = form?.querySelector('button[type="submit"]');
  if (button) {
    if (!button.dataset.normalLabel) button.dataset.normalLabel = button.textContent;
    button.textContent = "Save anyway";
  }
  if (form) form.dataset.dupOk = signature;
  return false;
}

let llsFeePaymentsOpenId = "";

function llsOpenFeePayments(feeId) {
  const fee = llsFeeRecord(feeId);
  if (!fee) {
    showToast("That fee record could not be found. Try refreshing.", "error");
    return;
  }
  llsFeePaymentsOpenId = feeId;
  const student = getStudent(String(fee["Student ID"] || "").trim());
  text("feePaymentsTitle", `Payments — ${getStudentName(student) || "Student"}`);
  llsRenderFeePayments();
  openModal("feePaymentsModal");
}

function llsRenderFeePayments() {
  const body = byId("feePaymentsBody");
  if (!body) return;
  const feeId = llsFeePaymentsOpenId;
  const rows = (llsLiveFinanceData.payments || [])
    .filter((p) => String(p["Fee ID"] || "").trim() === feeId)
    .sort((a, b) => String(a["Payment Date"] || "").localeCompare(String(b["Payment Date"] || "")));

  if (!rows.length) {
    body.innerHTML = tableEmptyRow(6, "No payments recorded for this fee yet.");
    return;
  }

  body.innerHTML = rows.map((p) => {
    const id = String(p["Payment ID"] || "").trim();
    const isVoid = llsPaymentIsVoid(p);
    const strike = isVoid ? ' style="text-decoration: line-through; color: #8a93a6;"' : "";
    let action;
    if (isVoid) {
      action = `<span style="font-size: 12px; color: #b3261e; font-weight: 700;">Void</span>
        <div style="font-size: 12px; color: #56617a;">${escapeHtml(String(p["Void Reason"] || ""))}${p["Voided Date"] ? " · " + escapeHtml(formatDate(llsDateOnly(p["Voided Date"]))) : ""}${p["Voided By"] ? " · " + escapeHtml(String(p["Voided By"])) : ""}</div>`;
    } else if (!id) {
      action = `<span style="font-size: 12px; color: #56617a;">Still saving…</span>`;
    } else {
      action = `<button class="row-action delete" type="button" data-void-payment="${escapeHtml(id)}">Void payment</button>
        <div class="lls-void-box" data-void-box="${escapeHtml(id)}" hidden style="margin-top: 8px; gap: 6px; min-width: 200px;">
          <input type="text" data-void-reason placeholder="Reason, e.g. entered twice" maxlength="200">
          <input type="text" data-void-name placeholder="Your name" maxlength="60">
          <button class="button button-primary" type="button" data-void-confirm="${escapeHtml(id)}">Confirm void</button>
        </div>`;
    }
    return `<tr>
      <td${strike}>${escapeHtml(p["Payment Date"] ? formatDate(llsDateOnly(p["Payment Date"])) : "—")}</td>
      <td${strike}><strong>${escapeHtml(formatMoney(number(p["Amount"])))}</strong></td>
      <td${strike}>${escapeHtml(String(p["Instalment"] || "—"))}</td>
      <td${strike}>${escapeHtml(String(p["Payment Method"] || "—"))}</td>
      <td${strike}>${escapeHtml(String(p["Notes"] || ""))}</td>
      <td class="table-actions-cell">${action}</td>
    </tr>`;
  }).join("");

  let savedName = "";
  try { savedName = localStorage.getItem("lls_staff_name") || ""; } catch (_) {}

  body.querySelectorAll("[data-void-payment]").forEach((button) => {
    button.addEventListener("click", () => {
      const box = body.querySelector(`[data-void-box="${CSS.escape(button.dataset.voidPayment)}"]`);
      if (!box) return;
      box.hidden = false;
      box.style.display = "grid";
      button.hidden = true;
      const nameInput = box.querySelector("[data-void-name]");
      if (nameInput && !nameInput.value) nameInput.value = savedName;
      box.querySelector("[data-void-reason]")?.focus();
    });
  });
  body.querySelectorAll("[data-void-confirm]").forEach((button) => {
    button.addEventListener("click", () => llsVoidPayment(button.dataset.voidConfirm, button));
  });
}

async function llsVoidPayment(paymentId, button) {
  const box = button.closest("[data-void-box]");
  const reason = String(box?.querySelector("[data-void-reason]")?.value || "").trim();
  const name = String(box?.querySelector("[data-void-name]")?.value || "").trim();
  if (reason.length < 3) {
    showToast("Write why this payment is being voided (e.g. entered twice).", "error");
    box?.querySelector("[data-void-reason]")?.focus();
    return;
  }
  try { if (name) localStorage.setItem("lls_staff_name", name); } catch (_) {}

  const label = button.textContent;
  llsBgSaving++;
  try {
    llsQueueSave("the voided payment", { action: "voidPayment", paymentId, reason, voidedBy: name || "Office" });
    const result = null;
    const row = (llsLiveFinanceData.payments || []).find((p) => String(p["Payment ID"] || "").trim() === paymentId);
    if (row) {
      row["Status"] = "Void";
      row["Void Reason"] = reason;
      row["Voided By"] = (result && result.voidedBy) || name || "Office";
      row["Voided Date"] = (result && result.voidedDate) || isoDate(new Date());
    }
    llsRebuildPaymentsState();
    saveState();
    renderAll();
    llsRenderFeePayments();
    showToast("Payment voided. It no longer counts towards the balance.", "success");
  } catch (error) {
    console.error(error);
    const msg = String(error && error.message || "");
    showToast(
      /Unknown mutation action/i.test(msg)
        ? "Voiding needs the new Apps Script (V26). Paste and deploy it, then try again."
        : (msg || "The payment could not be voided."),
      "error"
    );
    button.disabled = false;
    button.textContent = label;
  } finally {
    llsBgSaving = Math.max(0, llsBgSaving - 1);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Runs after the V19 "open fee for this student" listener, so the
  // instalment guess uses the fee it picked.
  byId("paymentStudent")?.addEventListener("change", llsPaymentFormReady);
  byId("paymentPlan")?.addEventListener("change", () => { if (paymentModalMode !== "payment") llsSetInstalmentDefault(); });
  ["paymentPaid", "paymentDate", "paymentInstalment"].forEach((id) =>
    byId(id)?.addEventListener("input", llsHideDuplicateWarning)
  );
  byId("paymentInstalment")?.addEventListener("change", llsHideDuplicateWarning);
});


/* =========================================================
   TIMETABLE (29 Sept 2026)
   The whole week on one screen, like the board in the office.
   Read-only: built from state.classes (Classes sheet). Rows are
   start times, columns are weekdays; each lesson is a chip with
   class, time, teacher and room for THAT day ("Josie (Mon) /
   Helen (Wed)" → Josie on Monday). Archived/Inactive classes are
   left out; Provisional ones are shown dashed.
========================================================= */

const LLS_TT_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const LLS_TT_ROOM_CLASS = { oxf: "tt-room-oxf", pic: "tt-room-pic", lei: "tt-room-lei", online: "tt-room-online" };

// Same rule as llsTeacherOnDay, for the Room field ("Lei (Mon) / Pic (Wed)").
function llsRoomOnDay(cls, dayName) {
  const field = String(cls.room || "");
  if (!field.includes("(")) return field.trim();
  const abbr = LLS_DAY_ABBR[String(dayName).toLowerCase()] || "";
  const seg = field.split("/").find((p) => p.toLowerCase().includes(`(${abbr}`));
  return (seg || field).replace(/\(.*?\)/g, "").trim();
}

function llsTtAddMinutes(time, minutes) {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(time || ""));
  if (!m) return "";
  const total = Number(m[1]) * 60 + Number(m[2]) + (Number(minutes) || 0);
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function llsTimetableLessons() {
  const out = [];
  llsLessonClasses().forEach((cls) => {
    [[cls.day, cls.time], [cls.day2, cls.time2]].forEach(([d, t]) => {
      const day = LLS_TT_DAYS.find((x) => x.toLowerCase() === String(d || "").trim().toLowerCase());
      const time = String(t || cls.time || "").slice(0, 5);
      if (!day || !/^\d{1,2}:\d{2}$/.test(time)) return;
      const start = time.padStart(5, "0");
      out.push({
        cls,
        day,
        start,
        end: llsTtAddMinutes(start, cls.duration || 60),
        teacher: llsTeacherOnDay(cls, day) || "—",
        room: llsRoomOnDay(cls, day) || "—"
      });
    });
  });
  return out;
}

function llsTtFillSelect(select, label, values, keep) {
  if (!select) return "all";
  const current = keep ?? select.value ?? "all";
  select.innerHTML = [`<option value="all">${escapeHtml(label)}</option>`]
    .concat(values.map((v) => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`)).join("");
  select.value = values.includes(current) ? current : "all";
  return select.value;
}

let llsTtTeacherDefaultSet = false;

function llsRenderTimetable() {
  const board = byId("timetableBoard");
  if (!board) return;
  const all = llsTimetableLessons();

  // Filters (teachers start on their own lessons; they can pick "All teachers").
  const teachers = [...new Set(all.map((l) => l.teacher).filter((t) => t && t !== "—"))].sort();
  const rooms = [...new Set(all.map((l) => l.room).filter((r) => r && r !== "—"))].sort();
  let keepTeacher = null;
  if (!llsTtTeacherDefaultSet && all.length) {
    llsTtTeacherDefaultSet = true;
    const names = typeof llsMyNames === "function" ? llsMyNames() : null;
    if (names) keepTeacher = teachers.find((t) => llsIsMine(t, names)) || "all";
  }
  const teacher = llsTtFillSelect(byId("timetableTeacher"), "All teachers", teachers, keepTeacher);
  const room = llsTtFillSelect(byId("timetableRoom"), "All rooms", rooms);

  const legend = byId("timetableLegend");
  if (legend) {
    legend.innerHTML = rooms.map((r) =>
      `<span class="tt-key ${LLS_TT_ROOM_CLASS[r.toLowerCase()] || "tt-room-other"}"><i></i>${escapeHtml(r)}</span>`
    ).join("");
  }

  const lessons = all.filter((l) =>
    (teacher === "all" || l.teacher === teacher) && (room === "all" || l.room === room)
  );

  if (!all.length) {
    board.innerHTML = `<div class="empty-state"><p>${escapeHtml(llsCoreSettled ? "No lessons yet. Add a day and time to a class in Classes." : "Loading classes…")}</p></div>`;
    return;
  }

  const days = LLS_TT_DAYS.filter((d) => d !== "Saturday" || all.some((l) => l.day === "Saturday"));
  const times = [...new Set(lessons.map((l) => l.start))].sort();
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long" });

  // Clashes: same day, overlapping times, and the same room (not Online) or the same teacher.
  const mins = (t) => { const m = /^(\d{2}):(\d{2})/.exec(t || ""); return m ? Number(m[1]) * 60 + Number(m[2]) : 0; };
  const clash = new Map();
  all.forEach((a, i) => all.slice(i + 1).forEach((b) => {
    if (a.day !== b.day || mins(a.start) >= mins(b.end) || mins(b.start) >= mins(a.end)) return;
    const sameRoom = a.room !== "—" && a.room.toLowerCase() !== "online" && a.room.toLowerCase() === b.room.toLowerCase();
    const sameTeacher = a.teacher !== "—" && a.teacher.toLowerCase() === b.teacher.toLowerCase();
    if (!sameRoom && !sameTeacher) return;
    const why = sameRoom ? "Room clash" : "Teacher clash";
    clash.set(a, why); clash.set(b, why);
  }));

  const counts = {};
  days.forEach((d) => { counts[d] = lessons.filter((l) => l.day === d).length; });

  const chip = (l) => {
    const n = getClassStudents(l.cls.id).length;
    const provisional = /provisional/i.test(l.cls.status || "");
    const roomClass = LLS_TT_ROOM_CLASS[l.room.toLowerCase()] || "tt-room-other";
    return `<div class="tt-chip ${roomClass}${provisional ? " tt-provisional" : ""}" title="${escapeHtml([l.cls.name, l.cls.level, l.cls.notes].filter(Boolean).join(" · "))}">
      <strong>${escapeHtml(l.cls.name)}</strong>
      <span class="tt-time">${escapeHtml(l.start)}–${escapeHtml(l.end)}</span>
      <span class="tt-who"><span>${escapeHtml(l.teacher)}</span> · <span>${escapeHtml(l.room)}</span></span>
      <span class="tt-count">${n === 1 ? "1 student" : `${n} students`}</span>
      ${provisional ? `<span class="tt-flag">Provisional</span>` : ""}
      ${clash.has(l) ? `<span class="tt-flag tt-clash">${clash.get(l)}</span>` : ""}
    </div>`;
  };

  const head = `<div class="tt-corner"></div>` + days.map((d) =>
    `<div class="tt-day${d === today ? " tt-today" : ""}"><span>${d}</span><small>${counts[d] === 1 ? "1 lesson" : `${counts[d]} lessons`}</small></div>`
  ).join("");

  const rows = times.map((t) =>
    `<div class="tt-time-label">${escapeHtml(t)}</div>` + days.map((d) => {
      const here = lessons.filter((l) => l.day === d && l.start === t)
        .sort((a, b) => a.room.localeCompare(b.room));
      return `<div class="tt-cell${d === today ? " tt-today" : ""}">${here.map(chip).join("")}</div>`;
    }).join("")
  ).join("");

  board.innerHTML = lessons.length
    ? `<div class="tt-grid" style="grid-template-columns: 64px repeat(${days.length}, minmax(150px, 1fr))">${head}${rows}</div>`
    : `<div class="empty-state"><p>No lessons match these filters.</p></div>`;
}

document.addEventListener("DOMContentLoaded", () => {
  ["timetableTeacher", "timetableRoom"].forEach((id) =>
    byId(id)?.addEventListener("change", llsRenderTimetable)
  );
});


/* 30 Sept — lessons stay "saved" on screen.
   When Google confirms a lesson, a copy stays on this device (last 30 days,
   up to 120 lessons), so going back to it shows the register and notes at
   once and says "✓ Saved", instead of looking empty while Google's slow
   reads arrive. The lesson buttons get ✓ (in Google) or ⏳ (sending). */
const LLS_SAVED_KEY = "lls_saved_lessons";

function llsSavedLoad() {
  try { return JSON.parse(localStorage.getItem(LLS_SAVED_KEY) || "[]") || []; } catch (_) { return []; }
}
function llsSavedFor(classId, date) {
  return llsSavedLoad().find((j) => j.classId === classId && j.date === date) || null;
}
function llsSavedRemember(job) {
  try {
    const cutoff = Date.now() - 30 * 24 * 3600 * 1000;
    const list = llsSavedLoad().filter((j) => !(j.classId === job.classId && j.date === job.date) && (j.savedAt || 0) > cutoff);
    list.unshift({ classId: job.classId, className: job.className, date: job.date, rows: job.rows || [], note: job.note || null, savedAt: Date.now() });
    localStorage.setItem(LLS_SAVED_KEY, JSON.stringify(list.slice(0, 120)));
  } catch (_) { /* storage full or blocked: Google still has it */ }
}
function llsLessonSaveState(classId, date) {
  const job = llsOutboxFor(classId, date);
  if (job) return job.error ? "error" : "sending";
  return llsSavedFor(classId, date) ? "saved" : "";
}

function llsPaintLessonState() {
  const meta = byId("lessonClassMeta");
  if (!meta) return;
  let badge = byId("lessonSavedState");
  if (!badge) {
    badge = document.createElement("div");
    badge.id = "lessonSavedState";
    badge.setAttribute("role", "status");
    badge.style.cssText = "display:inline-block;margin-top:8px;padding:6px 12px;border-radius:999px;font-weight:700;font-size:14px;";
    meta.insertAdjacentElement("afterend", badge);
  }
  const date = byId("lessonDate")?.value || "";
  const st = llsLesson.classId ? llsLessonSaveState(llsLesson.classId, date) : "";
  const look = {
    saved: ["✓ Saved · in Google Sheets", "#e3f6ec", "#177b52"],
    sending: ["✓ Saved on this device · sending to Google…", "#fff4d6", "#6b5200"],
    error: ["⚠ Not sent yet: tap the orange pill to retry", "#fde8e6", "#b3261e"]
  }[st];
  badge.hidden = !look;
  if (look) { badge.textContent = look[0]; badge.style.background = look[1]; badge.style.color = look[2]; }
}


/* =========================================================
   30 Sept — SAVE QUEUE for every quick change (all pages)
   The screen changes at once; the change is kept on this device
   ("lls_save_queue") and sent to Google in the background, retrying
   until Google confirms (the receipt number means a re-send never saves
   twice). It survives closing the page and is sent as the page closes.
   Same pill as lessons: "⏳ Sending … to Google…".
   If Google refuses a change (a real error, not a slow reply) it is
   dropped, the person is told, and the page reloads Google's data.
========================================================= */
const LLS_SAVEQ_KEY = "lls_save_queue";
let llsSaveQBusy = false;
let llsSaveQTimer = null;
let llsSaveQSent = 0;
let llsSaveQNeedsRefresh = false;

function llsRid_() {
  return (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : `r${Date.now()}${Math.random().toString(36).slice(2)}`;
}
function llsSaveQLoad() {
  try { return JSON.parse(localStorage.getItem(LLS_SAVEQ_KEY) || "[]") || []; } catch (_) { return []; }
}
function llsSaveQStore(list) {
  try { localStorage.setItem(LLS_SAVEQ_KEY, JSON.stringify(list)); } catch (_) {}
  llsOutboxPaint();
}

// label: what the person would call it ("A2 Adults unit", "Giada's fee").
// bodies: one or more changes, sent in order.
function llsQueueSave(label, bodies) {
  const list = llsSaveQLoad();
  list.push({
    id: llsRid_(),
    label,
    steps: (Array.isArray(bodies) ? bodies : [bodies]).map((b) => ({ body: { ...b, requestId: b.requestId || llsRid_() }, done: false })),
    createdAt: Date.now(),
    tries: 0
  });
  llsSaveQStore(list);
  llsSaveQRun();
}

async function llsSaveQRun(manual) {
  clearTimeout(llsSaveQTimer);
  if (llsSaveQBusy) return;
  if (!sessionStorage.getItem(LLS_ADMIN_TOKEN_KEY)) return; // resumes after login
  llsSaveQBusy = true;
  try {
    const list = llsSaveQLoad();
    const patch = (job) => {
      const fresh = llsSaveQLoad();
      const i = fresh.findIndex((j) => j.id === job.id);
      if (i >= 0) { fresh[i] = job; llsSaveQStore(fresh); }
    };
    const drop = (job) => llsSaveQStore(llsSaveQLoad().filter((j) => j.id !== job.id));
    for (const job of list) {
      if (job.error && !manual) continue;
      job.error = "";
      let problem = "";
      for (const step of job.steps) {
        if (step.done) continue;
        try {
          await llsApiPost(step.body);
          step.done = true;
          patch(job);
        } catch (e) {
          const msg = String(e?.message || "");
          if (/not found/i.test(msg) && /^delete/i.test(String(step.body.action || ""))) { step.done = true; continue; } // already gone
          if (e && (e.transport || e.uncertain || e.timeout || /didn't answer|didn't confirm|no connection|HTTP|too long/i.test(msg))) problem = "retry";
          else if (/UNAUTHORIZED/i.test(msg)) problem = "login";
          else problem = msg || "error";
          break;
        }
      }
      job.tries = (job.tries || 0) + 1;
      if (!problem) {
        drop(job);
        llsSaveQSent++;
        if (job.steps.some((st) => /^(updateClass|updateStudent|endEnrolment|updateTeacher)$/.test(String(st.body.action || "")))) llsSaveQNeedsRefresh = true;
      } else if (problem === "retry") {
        patch(job);
        break; // Google slow or unreachable: try again shortly
      } else if (problem === "login") {
        job.error = "please log in again";
        patch(job);
      } else {
        drop(job);
        showToast(`Google didn't accept the change to ${job.label}: ${problem}. Showing Google's data again.`, "error");
        void llsRefreshCoreAfterSaveInBackground();
      }
    }
  } finally {
    llsSaveQBusy = false;
    const left = llsSaveQLoad().filter((j) => !j.error);
    if (left.length) {
      const tries = Math.max(...left.map((j) => j.tries || 0));
      llsSaveQTimer = setTimeout(() => llsSaveQRun(), Math.min(60000, 4000 * Math.max(1, tries)));
    } else if (llsSaveQSent) {
      llsSaveQSent = 0;
      showToast("✓ All changes are safely in Google Sheets.", "success");
      if (llsSaveQNeedsRefresh) { llsSaveQNeedsRefresh = false; void llsRefreshCoreAfterSaveInBackground(); }
    }
  }
}

// Page closing / phone switching app: hand what's waiting to Google one
// last time. It stays queued until Google confirms on the next visit.
function llsSaveQBeacon_() {
  try {
    if (!navigator.sendBeacon) return;
    const token = sessionStorage.getItem(LLS_ADMIN_TOKEN_KEY);
    if (!token) return;
    llsSaveQLoad().filter((j) => !j.error).forEach((job) => {
      const step = job.steps.find((st) => !st.done);
      if (!step) return;
      const form = new URLSearchParams();
      form.set("action", String(step.body.action || ""));
      form.set("payload", JSON.stringify(Object.assign({}, step.body, { token })));
      navigator.sendBeacon(LLS_API_URL, form);
    });
  } catch (_) {}
}

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => llsSaveQRun(), 1200);
  window.addEventListener("online", () => llsSaveQRun());
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") llsSaveQRun();
    else llsSaveQBeacon_();
  });
  window.addEventListener("pagehide", llsSaveQBeacon_);
  window.addEventListener("beforeunload", (e) => {
    if (llsSaveQLoad().some((j) => !j.error)) { e.preventDefault(); e.returnValue = ""; }
  });
});

// 30 Sept: repaint the homework table from what we have (no Google call).
function llsRepaintHomeworkCounts_() {
  // 2 Oct: the same file/mark windows open from the Lesson page too.
  if (llsHomeworkCache.fromLesson) {
    if (llsLesson.classId === llsHomeworkCache.classId) {
      llsLesson.files = llsHomeworkCache.files; llsLesson.status = llsHomeworkCache.status;
      llsRenderLessonHomework(llsStudentsForClass(llsLesson.classId).length);
    }
    return;
  }
  renderHomeworkList("cache");
}
// Ticks and new homework still on their way to Google stay visible after a reload.
function llsApplyQueuedHomework_(cache) {
  llsSaveQLoad().forEach((job) => job.steps.forEach((st) => {
    const b = st.body || {};
    if (b.action === "markHomeworkStatus") {
      const rec = cache.status.find((x) => String(x["Homework ID"] || "") === b.homeworkId && String(x["Student ID"] || "").trim() === b.studentId);
      if (rec) rec["Status"] = b.status;
      else cache.status.push({ "Homework ID": b.homeworkId, "Student ID": b.studentId, "Status": b.status });
    }
    if (b.action === "markHomeworkFeedback") {
      const rec = cache.status.find((x) => String(x["Homework ID"] || "") === b.homeworkId && String(x["Student ID"] || "").trim() === b.studentId);
      if (rec) Object.assign(rec, { Status: "Done", Mark: b.mark, Feedback: b.feedback });
      else cache.status.push({ "Homework ID": b.homeworkId, "Student ID": b.studentId, Status: "Done", Mark: b.mark, Feedback: b.feedback });
    }
  }));
}

// 30 Sept: tests deleted on this device stay hidden while Google catches up.
var llsDeletedTests_ = new Set();

// 30 Sept: update one lesson in the outbox without touching the others.
function llsOutboxPatch_(job) {
  const list = llsOutboxLoad();
  const i = list.findIndex((j) => j.id === job.id);
  if (i >= 0) {
    // keep a newer receipt number if one was stored meanwhile
    list[i] = { ...list[i], steps: job.steps, sending: job.sending, error: job.error, tries: job.tries, combinedId: list[i].combinedId || job.combinedId };
    llsOutboxSave(list);
  }
}

// 30 Sept: App link window: Open / WhatsApp / Copy only work once the link is ready.
function llsLinkButtonsReady_(ready) {
  ["homeworkLinkOpen", "homeworkLinkWhatsApp"].forEach((id) => {
    const el = byId(id);
    if (!el) return;
    if (!ready) el.removeAttribute("href"); // no link at all: nothing can open
    el.setAttribute("aria-disabled", String(!ready));
    el.classList.toggle("is-waiting", !ready);
  });
  const copy = byId("homeworkLinkCopy");
  if (copy) copy.disabled = !ready;
}
document.addEventListener("click", (e) => {
  const a = e.target.closest && e.target.closest("#homeworkLinkOpen, #homeworkLinkWhatsApp");
  if (a && a.getAttribute("aria-disabled") === "true") {
    e.preventDefault();
    showToast("One moment: the link is being made.", "info");
  }
}, true);


/* =========================================================
   30 Sept — "What did you do today?" skill ticks (Lesson page)
   Teachers tap the skills they covered and add a short topic (tap a
   suggestion: from the book unit, or for classes without a book / special
   lessons from this class's own recent lessons). Saved as short lines at
   the top of "What we did", e.g.
       Grammar: past simple
       Reading: a holiday blog · gist
   so the sheet stays readable and no Apps Script change is needed.
   The student app turns these lines into the road map's skill badges.
========================================================= */
const LLS_SKILLS = [
  { k: "Grammar", icon: "📘", ph: "e.g. past simple", focus: [] },
  { k: "Vocabulary", icon: "🔤", ph: "e.g. holidays, food", focus: [] },
  { k: "Reading", icon: "📖", ph: "topic, e.g. a holiday blog", focus: ["gist", "detail", "new words"] },
  { k: "Listening", icon: "🎧", ph: "topic, e.g. at the airport", focus: ["gist", "detail", "song"] },
  { k: "Speaking", icon: "🗣️", ph: "topic, e.g. my last weekend", focus: ["pairs", "groups", "role-play", "presentation"] },
  { k: "Writing", icon: "✍️", ph: "e.g. an email to a friend", focus: ["sentences", "email", "story", "paragraph"] },
  { k: "Games & songs", icon: "🎲", ph: "e.g. animals bingo, colours song", focus: [] }
];
const LLS_SKILL_RE = new RegExp("^(" + LLS_SKILLS.map((s) => s.k.replace(/[&]/g, "\\&")).join("|") + "):\\s*(.*)$", "i");
let llsSkillState = {};

// "Grammar: past simple\nReading: blog · gist\nfree text" -> { skills, rest }
function llsParseSkills(text) {
  const skills = {};
  const rest = [];
  String(text || "").split(/\r?\n/).forEach((line) => {
    const m = line.trim().match(LLS_SKILL_RE);
    if (m) {
      const def = LLS_SKILLS.find((s) => s.k.toLowerCase() === m[1].toLowerCase());
      const parts = m[2].split(" · ");
      let focus = "";
      if (def.focus.length && parts.length > 1 && def.focus.includes(parts[parts.length - 1].trim())) focus = parts.pop().trim();
      skills[def.k] = { on: true, topic: parts.join(" · ").trim(), focus };
    } else if (line.trim()) rest.push(line);
  });
  return { skills, rest: rest.join("\n") };
}
function llsSkillLines(state) {
  return LLS_SKILLS.filter((s) => state[s.k]?.on).map((s) => {
    const st = state[s.k];
    return `${s.k}: ${[st.topic.trim(), st.focus].filter(Boolean).join(" · ")}`;
  });
}

function llsSkillSuggestions(skill, cls) {
  const out = [];
  const add = (t) => { t = String(t || "").trim(); if (t && !out.some((x) => x.toLowerCase() === t.toLowerCase())) out.push(t); };
  const course = cls && cls.book && window.LLS_COURSES && LLS_COURSES[cls.book];
  const unit = Number(cls && cls.currentUnit) || 0;
  if (course && unit && !byId("lessonSpecialOn")?.checked && !llsChoiceOn()) {
    const lessons = course.lessons.filter((l) => parseInt(l.code, 10) === unit);
    lessons.forEach((l) => {
      if (skill === "Grammar") l.grammar.split(/,\s*(?![^()]*\))/).forEach(add);
      else if (skill === "Vocabulary") l.vocab.split(/,\s*(?![^()]*\))/).forEach(add);
      else if (skill !== "Games & songs") add(course.practice === false ? l.title : `${l.code} ${l.title}`);
      if (course.practice === false && (skill === "Vocabulary" || skill === "Games & songs")) add(l.title);
    });
  }
  // This class's own recent topics (the only source for classes without a book).
  (llsLesson.entries || []).slice(0, 12).forEach((e) => {
    const p = llsParseSkills(e.whatWeDid).skills[skill];
    if (p && p.topic) add(p.topic);
  });
  if (byId("lessonSpecialOn")?.checked && value("lessonSpecialTitle").trim()) add(value("lessonSpecialTitle").trim());
  if (llsChoiceOn() && value("lessonChoiceTitle").trim()) add(value("lessonChoiceTitle").trim());
  return out.slice(0, 8);
}

function llsRenderSkills() {
  const box = byId("lessonSkills");
  if (!box) return;
  const cls = llsLessonClasses().find((c) => c.id === llsLesson.classId);
  const rows = LLS_SKILLS.filter((s) => llsSkillState[s.k]?.on);
  box.innerHTML = `
    <p class="sk-q">What did you do today? <span class="muted" style="font-weight:600">Tap all that apply · students see this on their road map</span></p>
    <div class="sk-toggles">${LLS_SKILLS.map((s) => `<button type="button" class="sk-toggle" data-skill="${escapeHtml(s.k)}" aria-pressed="${Boolean(llsSkillState[s.k]?.on)}">${s.icon} ${escapeHtml(s.k)}</button>`).join("")}</div>
    ${rows.length ? `<div class="sk-rows">${rows.map((s) => {
      const st = llsSkillState[s.k];
      const sug = llsSkillSuggestions(s.k, cls);
      return `<div class="sk-row" data-skill-row="${escapeHtml(s.k)}">
        <label>${s.icon} ${escapeHtml(s.k)}${s.k === "Grammar" ? ": which grammar?" : s.k === "Vocabulary" ? ": which words?" : ": topic"}</label>
        <input type="text" maxlength="80" autocomplete="off" data-skill-topic="${escapeHtml(s.k)}" placeholder="${escapeHtml(s.ph)}" value="${escapeHtml(st.topic || "")}">
        ${sug.length ? `<div class="sk-chips">${sug.map((t) => `<button type="button" class="sk-chip${st.topic === t ? " on" : ""}" data-skill-sug="${escapeHtml(s.k)}" title="${escapeHtml(t)}">${escapeHtml(t)}</button>`).join("")}</div>` : ""}
        ${s.focus.length ? `<div class="sk-chips">${s.focus.map((f) => `<button type="button" class="sk-chip${st.focus === f ? " on" : ""}" data-skill-focus="${escapeHtml(s.k)}" data-value="${escapeHtml(f)}">${escapeHtml(f)}</button>`).join("")}</div>` : ""}
      </div>`;
    }).join("")}</div>` : ""}`;
  box.querySelectorAll("[data-skill]").forEach((b) => b.addEventListener("click", () => {
    const k = b.dataset.skill;
    const st = llsSkillState[k] || { on: false, topic: "", focus: "" };
    st.on = !st.on;
    llsSkillState[k] = st;
    llsLesson.noteTouched = true;
    box.classList.remove("needs");
    llsRenderSkills();
    if (st.on) box.querySelector(`[data-skill-topic="${CSS.escape(k)}"]`)?.focus();
  }));
  box.querySelectorAll("[data-skill-topic]").forEach((i) => i.addEventListener("input", () => {
    llsSkillState[i.dataset.skillTopic].topic = i.value;
    llsLesson.noteTouched = true;
    i.closest(".sk-row")?.classList.remove("needs");
  }));
  box.querySelectorAll("[data-skill-sug]").forEach((b) => b.addEventListener("click", () => {
    llsSkillState[b.dataset.skillSug].topic = b.title;
    llsLesson.noteTouched = true;
    llsRenderSkills();
  }));
  box.querySelectorAll("[data-skill-focus]").forEach((b) => b.addEventListener("click", () => {
    const st = llsSkillState[b.dataset.skillFocus];
    st.focus = st.focus === b.dataset.value ? "" : b.dataset.value;
    llsRenderSkills();
  }));
}

// 30 Sept: restore the student/class lists saved on this device, so the
// register opens without waiting for Google; Google's copy replaces them.
document.addEventListener("DOMContentLoaded", () => {
  try {
    if (!sessionStorage.getItem(LLS_ADMIN_TOKEN_KEY)) return;
    if ((llsLivePortalData.classes || []).length) return;
    const c = JSON.parse(localStorage.getItem("lls_core_rows") || "null");
    if (c && Array.isArray(c.classes) && c.classes.length) llsLivePortalData = c;
  } catch (_) {}
});
// Logging out forgets the school data kept on this device (shared computers).
function llsForgetCachedData_() {
  try {
    Object.keys(localStorage).filter((k) => k === "lls_core_rows" || k === "lls_saved_lessons" || k.startsWith("lls_cache_")).forEach((k) => localStorage.removeItem(k));
  } catch (_) {}
}


/* =========================================================
   30 Sept — "TUT TUT" reminder (owner's request)
   When a teacher logs in, check their lessons on the last school days
   (up to 7 days back, from 28 Sept, skipping closures). Any lesson with
   no notes in the Lesson Log gets a cheeky reminder with a "Fill it in
   now" button. Once per login. Reads Google in the background, so
   logging in is never slowed down.
========================================================= */
const LLS_SCHOOL_START = "2026-09-28";
const LLS_CLOSED_DAYS = [["2026-12-07", "2026-12-08"], ["2026-12-23", "2027-01-06"], ["2027-03-19", "2027-03-19"], ["2027-04-25", "2027-04-30"], ["2027-05-31", "2027-06-02"]];

function llsSchoolClosed_(iso) {
  return iso < LLS_SCHOOL_START || LLS_CLOSED_DAYS.some(([a, b]) => iso >= a && iso <= b);
}

async function llsTutTutCheck() {
  if (llsRole() !== "teacher") return;
  const session = llsGetTeacherSession();
  if (!session) return;
  const flag = "lls_tuttut_" + (session.teacherId || session.name || "t");
  try { if (sessionStorage.getItem(flag)) return; sessionStorage.setItem(flag, "1"); } catch (_) {}

  // The teacher's lessons on the last school days before today.
  const today = isoDate(new Date());
  const due = [];
  const d = new Date(today + "T12:00:00");
  for (let i = 1; i <= 7; i++) {
    d.setDate(d.getDate() - 1);
    const iso = isoDate(d);
    if (llsSchoolClosed_(iso)) continue;
    llsLessonsOn(iso, true).forEach(({ cls, time }) => due.push({ cls, time, date: iso }));
  }
  if (!due.length) return;

  // Saved on this device (sending or confirmed) already counts as done,
  // and so do notes this device already knows about.
  const knownDone = (classId, date) => {
    try {
      const c = JSON.parse(localStorage.getItem("lls_cache_log_" + classId) || "null");
      return Boolean(c && Array.isArray(c.entries) && c.entries.some((e) => String(e.lessonDate || "").slice(0, 10) === date));
    } catch (_) { return false; }
  };
  const todo = due.filter((x) => !llsLessonSaveState(x.cls.id, x.date) && !knownDone(x.cls.id, x.date));
  if (!todo.length) return;
  const missing = [];
  const byClass = {};
  todo.forEach((x) => { (byClass[x.cls.id] = byClass[x.cls.id] || []).push(x); });
  // 2 Oct: this check waits in the background lane, so it never holds up
  // what the teacher opens. With Apps Script V29 it is ONE call for all
  // classes (it used to be one call per class, ~10 calls after each login).
  for (let i = 0; i < 20 && window.llsServerVersion === undefined; i++) await new Promise((r) => setTimeout(r, 500));
  if ((window.llsServerVersion || 0) >= 29) {
    try {
      const since = todo.map((x) => x.date).sort()[0];
      const res = await llsApiGet("getLessonDates", { classIds: Object.keys(byClass).join(","), since: LLS_SCHOOL_START > since ? LLS_SCHOOL_START : since }, { background: true });
      // A lesson someone reported (covered / cancelled / not my class) isn't nagged about.
      const reported = new Set((res.issues || []).map((i) => i.classId + "|" + i.lessonDate));
      Object.keys(byClass).forEach((classId) => {
        const done = new Set((res.dates && res.dates[classId]) || []);
        byClass[classId].forEach((x) => { if (!done.has(x.date) && !reported.has(classId + "|" + x.date)) missing.push(x); });
      });
      // Lessons this teacher covered for someone else.
      (res.cover || []).forEach((c) => {
        const cls = (llsLessonClasses() || []).find((k) => k.id === c.classId);
        const done = new Set((res.dates && res.dates[c.classId]) || []);
        if (cls && c.lessonDate < today && !done.has(c.lessonDate) && !llsLessonSaveState(c.classId, c.lessonDate) && !missing.some((m) => m.cls.id === c.classId && m.date === c.lessonDate)) {
          missing.push({ cls, time: c.lessonTime || "", date: c.lessonDate, cover: c.reportedBy || true });
        }
      });
    } catch (_) { return; /* Google didn't answer: don't nag on a guess */ }
  } else {
    for (const classId of Object.keys(byClass)) {
      try {
        const log = await llsApiGet("getLessonLog", { classId, limit: 20 }, { background: true });
        const done = new Set((log.entries || []).map((e) => String(e.lessonDate || "").slice(0, 10)));
        byClass[classId].forEach((x) => { if (!done.has(x.date)) missing.push(x); });
      } catch (_) { /* Google didn't answer: don't nag on a guess */ }
    }
  }
  if (!missing.length) return;
  missing.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  llsShowTutTut(session, missing);
}

function llsShowTutTut(session, missing) {
  const first = String(session.name || "").split(/\s+/)[0] || "you";
  let modal = byId("tutTutModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.className = "modal-backdrop";
    modal.id = "tutTutModal";
    document.body.appendChild(modal);
  }
  const when = (iso) => new Date(iso + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  modal.innerHTML = `
    <div class="modal modal-small" role="dialog" aria-modal="true" aria-labelledby="tutTutTitle" style="text-align:center;">
      <div style="font-size:54px;line-height:1;margin:4px 0 6px;">👀</div>
      <h2 id="tutTutTitle" style="margin:0 0 6px;">TUT TUT, ${escapeHtml(first)}!</h2>
      <p style="margin:0 0 12px;">Cole can see you haven't filled in ${missing.length === 1 ? "this lesson" : "these lessons"}:</p>
      <div style="display:grid;gap:8px;text-align:left;margin-bottom:14px;">
        ${missing.map((x, i) => `<div class="tut-row" data-tut-row="${i}">
          <div class="tut-line">
            <span><strong>${escapeHtml(when(x.date))}</strong> · ${escapeHtml(x.time)} ${escapeHtml(x.cls.name)}${x.cover ? ` <em class="muted">(you covered${typeof x.cover === "string" ? " for " + escapeHtml(x.cover) : ""})</em>` : ""}</span>
            <span class="tut-buttons">
              <button type="button" class="button button-primary" data-tuttut="${i}" style="min-height:40px;padding:6px 14px;">Fill it in now</button>
              ${x.cover || (window.llsServerVersion || 0) < 29 ? "" : `<button type="button" class="button button-secondary" data-tut-other="${i}" style="min-height:40px;padding:6px 12px;">Not mine / cancelled?</button>`}
            </span>
          </div>
          <div class="tut-other" hidden>
            <label><input type="radio" name="tutKind${i}" value="Covered" checked> 👥 Another teacher covered it:</label>
            <select data-tut-cover>${llsTutTeacherOptions_(session)}</select>
            <label><input type="radio" name="tutKind${i}" value="Cancelled"> 🚫 The lesson was cancelled</label>
            <label><input type="radio" name="tutKind${i}" value="Not my class"> ❓ This isn't my class</label>
            <input type="text" data-tut-note maxlength="300" placeholder="Anything Rosanna should know? (optional)">
            <button type="button" class="button button-primary" data-tut-send="${i}">Tell Rosanna</button>
          </div>
        </div>`).join("")}
      </div>
      ${(window.llsServerVersion || 0) < 29 ? "" : `<p class="muted" style="margin:0 0 10px;font-size:14px;">Not your lesson, or it didn't happen? Press <strong>Not mine / cancelled?</strong> and Rosanna will sort it out.</p>`}
      <p style="margin:0 0 4px;font-weight:800;font-size:18px;">PWWWEEEAAASSSEEEE do it when you get a chance 🙏</p>
      <p style="margin:0 0 16px;">Cole is watching you ❤️</p>
      <button type="button" class="button button-secondary" data-tuttut-later>Later, I promise</button>
    </div>`;
  modal.querySelectorAll("[data-tuttut]").forEach((b) => b.addEventListener("click", () => {
    const x = missing[Number(b.dataset.tuttut)];
    closeModal("tutTutModal");
    llsGoToLesson(x.cls.id, x.date);
  }));
  modal.querySelectorAll("[data-tut-other]").forEach((b) => b.addEventListener("click", () => {
    const box = b.closest("[data-tut-row]").querySelector(".tut-other");
    box.hidden = !box.hidden;
  }));
  modal.querySelectorAll("[data-tut-send]").forEach((b) => b.addEventListener("click", () => {
    const row = b.closest("[data-tut-row]");
    const x = missing[Number(b.dataset.tutSend)];
    const kind = row.querySelector('input[type="radio"]:checked')?.value || "Covered";
    const sel = row.querySelector("[data-tut-cover]");
    if (kind === "Covered" && !sel.value) { showToast("Choose who covered the lesson.", "error"); return; }
    const opt = sel.options[sel.selectedIndex];
    const coveredById = kind === "Covered" && sel.value !== "other" ? sel.value : "";
    const coveredBy = kind === "Covered" ? (sel.value === "other" ? "Someone else" : opt.textContent.trim()) : "";
    llsQueueSave("lesson report", { action: "reportLessonIssue", classId: x.cls.id, lessonDate: x.date, lessonTime: x.time, kind, coveredBy, coveredById, note: row.querySelector("[data-tut-note]").value.trim() });
    row.innerHTML = `<div class="tut-line"><span><strong>${escapeHtml(when(x.date))}</strong> · ${escapeHtml(x.cls.name)}</span><span class="tut-sent">✓ Sent to Rosanna${kind === "Covered" ? " · " + escapeHtml(coveredBy) + " will be reminded" : ""}</span></div>`;
  }));
  modal.querySelector("[data-tuttut-later]")?.addEventListener("click", () => closeModal("tutTutModal"));
  openModal("tutTutModal");
}

// Run once the class list is there (from this device or Google).
document.addEventListener("DOMContentLoaded", () => {
  let tries = 0;
  const wait = setInterval(() => {
    tries++;
    const ready = (state.classes || []).length && sessionStorage.getItem(LLS_ADMIN_TOKEN_KEY) && llsRole() === "teacher";
    if (ready) { clearInterval(wait); setTimeout(() => llsTutTutCheck().catch(() => {}), 2500); }
    else if (tries > 600) clearInterval(wait); // ~10 minutes: covers logging in later
  }, 1000);
});


// 1 Oct: who is reporting a problem (report.js). Never contact details.
window.llsReportWho = function () {
  const t = typeof llsGetTeacherSession === "function" ? llsGetTeacherSession() : null;
  const role = typeof llsRole === "function" ? llsRole() : "";
  return t ? `Teacher: ${t.name || t.teacherId || ""}` : (role ? `Office (${role})` : "Not logged in");
};
window.llsReportExtra = function () {
  const page = document.querySelector(".page.active")?.id || "";
  const parts = [];
  if (page) parts.push("Portal page: " + page.replace(/^page-/, ""));
  if (window.llsServerVersion) parts.push("Apps Script: V" + window.llsServerVersion);
  try {
    const waiting = (typeof llsOutboxLoad === "function" ? llsOutboxLoad().length : 0) + (typeof llsSaveQLoad === "function" ? llsSaveQLoad().length : 0);
    if (waiting) parts.push("Changes still waiting to be sent: " + waiting);
  } catch (_) {}
  return parts.join("\n");
};


/* =========================================================
   1 Oct — in-app GUIDE (❓ Guide in the left menu)
   Two short how-tos, Teachers and Office, in English and Italian.
   Opens on the right tab for who is logged in and in the portal's
   language. The words in quotes match the buttons on screen.
========================================================= */
const LLS_GUIDE = {
  teacher: {
    en: {
      intro: "Everything for a lesson is on one page. It takes a couple of minutes between classes.",
      steps: [
        ["Log in", "Choose Teacher, then your Teacher ID (e.g. TCH0002) or email, and your PIN."],
        ["★ Lesson", "Today's lessons are buttons at the top. Tap yours. ✓ = saved, ⏳ = still sending."],,
        ["📋 My week", "At the top of the Lesson page: every lesson you had this week. ✅ filled in, ⚠ to complete. Tap \"✏️ Complete now\" (or the lesson itself) and it opens, ready to fill in; \"✏️ Edit\" changes one already saved. ‹ goes back a week. The office sees the same list."],
        ["📚 Lesson plans", "Classes with a course (English File A2, B1 exam, Kitchen English) show the PowerPoint lessons in order. ✓ = this class has already had it (date and teacher), ➡ = next one. \"Teach today\" fills in Unit / page, What we did and the skills for you: check them and save as usual. A lesson already taught asks you to tap twice, so nobody repeats it by mistake."],
        ["🚫 Cancelled lessons and make-ups", "A cancelled lesson shows 🚫 and doesn't need filling in. If it took place after all, fill it in as usual. A make-up lesson: open the class on the day you teach it (Lesson page → date → All my classes) and save as usual; it counts as a make-up by itself."]
        ["1 · Register", "Tap Here / Late / Absent / Excused (\"Everyone here\" does it in one go). Choose \"How did they do?\" for everyone who came: it counts towards their progress."],
        ["2 · What did you do today?", "Tap the skills you covered (Grammar, Reading, Speaking…) and tap a suggested topic or type one. Students see this on their road map. For a ⭐ Special lesson (Halloween, Christmas…) tick the box instead."],
        ["Notes for the next teacher", "Private: only staff see them. \"Anything else?\" is optional and students can see it."],
        ["3 · Homework (optional)", "Title + instructions. The due date is the next lesson. It goes straight to the students' app. \"📎 Attach files\" adds a worksheet, a photo of the page or audio."],
        ["📎 Files and 📥 work to mark", "Under \"Recent homework\": \"📎 Files\" adds or removes files. When students hand in photos of their work you see \"📥 Work · to mark\": open each photo, write a mark and a comment, press \"Save mark\". Students see it in their app."],
        ["💾 Save lesson", "It's saved on your device at once and sent to Google in the background: you can go to your next class. The badge turns \"✓ Saved · in Google Sheets\"."],
        ["Unit − / +", "When the class starts a new unit of the book, press + (the practice in the students' app follows)."],
        ["Tests", "Homework page → \"+ New test\": multiple choice or typed answers. Students take it in their app; you see the results."],
        ["Forgot a lesson?", "When you log in, a \"TUT TUT\" reminder lists lessons without notes. Tap \"Fill it in now\". Not your lesson, or cancelled? Tap \"Not mine / cancelled?\" and choose: another teacher covered it, it was cancelled, or it isn't your class. Rosanna sorts it out; whoever covered gets the reminder."]
      ],
      tip: "Something not working? Use 🐞 Report a problem in the left menu: it emails the school with the details."
    },
    it: {
      intro: "Tutto quello che serve per una lezione è in una pagina. Bastano un paio di minuti tra una classe e l'altra.",
      steps: [
        ["Accesso", "Scegli Insegnante, poi il tuo ID (es. TCH0002) o la tua email, e il PIN."],
        ["★ Lezione", "Le lezioni di oggi sono i pulsanti in alto. Tocca la tua. ✓ = salvata, ⏳ = in invio."],,
        ["📋 La mia settimana", "In cima alla pagina Lezione: tutte le tue lezioni della settimana. ✅ compilata, ⚠ da compilare. Tocca \"✏️ Compila ora\" (o la lezione) e si apre, pronta da compilare; \"✏️ Modifica\" cambia una già salvata. ‹ torna alla settimana prima. La segreteria vede lo stesso elenco."],
        ["📚 Piani di lezione", "Le classi con un corso (English File A2, B1 esame, Kitchen English) mostrano le lezioni PowerPoint in ordine. ✓ = la classe l'ha già fatta (data e insegnante), ➡ = la prossima. \"Faccio questa oggi\" compila Unità / pagina, Cosa abbiamo fatto e le abilità: controlla e salva come sempre. Una lezione già fatta chiede due tocchi, così nessuno la ripete per sbaglio."],
        ["🚫 Lezioni annullate e recuperi", "Una lezione annullata ha 🚫 e non va compilata. Se invece si è fatta, compilala come sempre. Un recupero: apri la classe il giorno in cui lo fai (pagina Lezione → data → Tutte le mie classi) e salva come sempre; conta da solo come recupero."]
        ["1 · Appello", "Tocca Presente / In ritardo / Assente / Giustificato (\"Tutti presenti\" li segna tutti). Scegli \"Com'è andata?\" per ogni studente presente: conta nei suoi progressi."],
        ["2 · Cosa avete fatto oggi?", "Tocca le abilità (Grammatica, Lettura, Parlato…) e tocca un argomento suggerito o scrivilo. Gli studenti lo vedono nel loro percorso. Per una ⭐ lezione speciale (Halloween, Natale…) spunta la casella."],
        ["Note per il prossimo insegnante", "Private: le vede solo lo staff. \"Altro?\" è facoltativo e lo vedono gli studenti."],
        ["3 · Compiti (facoltativi)", "Titolo + istruzioni. La consegna è la lezione successiva. Vanno subito nell'app degli studenti. \"📎 Attach files\" aggiunge una scheda, la foto della pagina o un audio."],
        ["📎 File e 📥 lavori da correggere", "Sotto \"Recent homework\": \"📎 Files\" aggiunge o toglie file. Quando gli studenti consegnano le foto dei compiti vedi \"📥 Work · to mark\": apri ogni foto, scrivi voto e commento, premi \"Save mark\". Gli studenti li vedono nell'app."],
        ["💾 Salva lezione", "Si salva subito sul dispositivo e parte verso Google in sottofondo: puoi andare alla classe successiva. Il badge diventa \"✓ Salvata · su Google Sheets\"."],
        ["Unità − / +", "Quando la classe inizia una nuova unità del libro, premi + (gli esercizi nell'app seguono)."],
        ["Test", "Pagina Compiti → \"+ Nuovo test\": scelta multipla o risposta scritta. Gli studenti lo fanno nell'app; tu vedi i risultati."],
        ["Lezione dimenticata?", "Quando entri, il promemoria \"TUT TUT\" mostra le lezioni senza note. Tocca \"Fill it in now\". Non era tua, o è stata annullata? Tocca \"Not mine / cancelled?\" e scegli: l'ha coperta un altro insegnante, è stata annullata, o non è la tua classe. Rosanna sistema; il promemoria va a chi l'ha coperta."]
      ],
      tip: "Qualcosa non funziona? Usa 🐞 Segnala un problema nel menu a sinistra: manda un'email alla scuola con i dettagli."
    }
  },
  office: {
    en: {
      intro: "The office side of the portal: students, payments, enquiries and app links.",
      steps: [
        ["Log in", "Choose Office / Admin and the office password."],
        ["Students", "\"+ Add student\" and choose the class. \"Edit\" to change details. \"Deactivate\" when someone leaves (their history is kept)."],
        ["📱 App link", "On a student: open their app (\"Open app\"), copy the link or \"Send on WhatsApp\" (private chats only, never groups). \"Make new link\" if a slip is lost: the old one stops working."],
        ["Fees & Payments · new course", "\"+ Record payment\": total fee, payment plan and due dates, plus the first payment if they pay now."],
        ["Fees & Payments · later payments", "\"Add payment\" on the fee and choose \"Which payment is this?\". A yellow warning appears if it looks like a duplicate."],
        ["A payment entered by mistake", "\"Payments\" on the fee → \"Void payment\" with a reason. It's never deleted: it stays crossed out and stops counting."],
        ["Reminders", "Filter \"Overdue\" and use the WhatsApp reminder button on the fee."],
        ["Enquiries", "\"+ New enquiry\" for calls and visits (the website form adds them by itself). Move the stage, then \"Convert to Student\" when they enrol."],
        ["Classes & Teachers", "Edit days, times, rooms and book unit. \"📱 App links\" on a class gives every student's link. Teachers: \"+ Add teacher\" with a PIN."],
        ["🛠 Lessons to sort out", "On the Dashboard: lessons a teacher says were covered by someone else, cancelled, or not theirs. Do what it says (\"Open lesson\" / \"Open class\"), then press \"Sorted ✓\"."],,
        ["💶 In class, but no payment details", "On the Dashboard (and in 🔔): students coming to lessons with no course fee recorded. Press \"+ Record payment\", put the total fee and payment plan, Amount paid = what they paid today (or 0), Save. They leave the list. \"How to fix it\" on the panel has the steps."],
        ["📋 This week's lessons", "On the Dashboard: which lessons teachers haven't filled in yet this week, with a count per teacher. \"Show all\" lists every lesson. A gentle WhatsApp to the teacher is usually enough."],
        ["🚫 Cancel lessons", "Dashboard → \"🚫 Cancel lessons\": choose the teacher (or class), the dates and the times they're away. Check the list (lessons that only partly clash are explained), then \"Cancel N lessons\". Copy the ready-made message for each class and send it on WhatsApp. Cancelled lessons don't count for attendance or progress; \"Lessons owed\" shows how many to add at the end of the course. A teacher's \"cancelled\" report has \"🚫 Record as cancelled\"."]
        ["The ⏳ pill at the top", "Changes still on their way to Google. Wait for it to go before closing the page. If it turns ⚠, tap it to try again."]
      ],
      tip: "Something not working? 🐞 Report a problem (left menu) emails the school with the details."
    },
    it: {
      intro: "La parte segreteria del portale: studenti, pagamenti, richieste e link dell'app.",
      steps: [
        ["Accesso", "Scegli Segreteria / Direzione e la password della segreteria."],
        ["Studenti", "\"+ Aggiungi studente\" e scegli la classe. \"Modifica\" per cambiare i dati. \"Disattiva\" chi lascia la scuola (lo storico resta)."],
        ["📱 Link app", "Su uno studente: apri la sua app, copia il link o \"Invia su WhatsApp\" (solo in privato, mai nei gruppi). \"Nuovo link\" se perde il foglietto: quello vecchio smette di funzionare."],
        ["Quote e pagamenti · nuovo corso", "\"+ Registra pagamento\": quota totale, piano di pagamento e scadenze, più il primo pagamento se paga subito."],
        ["Quote e pagamenti · pagamenti successivi", "\"Aggiungi pagamento\" sulla quota e scegli \"Quale pagamento è?\". Se sembra un doppione compare un avviso giallo."],
        ["Pagamento inserito per errore", "\"Pagamenti\" sulla quota → \"Annulla pagamento\" con il motivo. Non si cancella mai: resta barrato e non conta più."],
        ["Promemoria", "Filtra \"Scaduto\" e usa il pulsante WhatsApp di promemoria sulla quota."],
        ["Richieste", "\"+ Nuova richiesta\" per telefonate e visite (il modulo del sito le aggiunge da solo). Aggiorna la fase, poi \"Trasforma in studente\" quando si iscrive."],
        ["Classi e insegnanti", "Modifica giorni, orari, aule e unità del libro. \"📱 Link app\" su una classe dà i link di tutti gli studenti. Insegnanti: \"+ Add teacher\" con un PIN."],
        ["🛠 Lezioni da sistemare", "Nella Dashboard: lezioni che un insegnante segnala come coperte da un collega, annullate o non sue. Fai quello che dice (\"Open lesson\" / \"Open class\"), poi premi \"Sorted ✓\"."],,
        ["💶 In classe, ma senza dati di pagamento", "Nella Dashboard (e nelle 🔔): studenti che vengono a lezione senza quota del corso registrata. Premi \"+ Registra pagamento\", inserisci quota totale e piano di pagamento, Importo pagato = quanto hanno pagato oggi (o 0), Salva. Spariscono dall'elenco. \"Come sistemarlo\" nel riquadro ha i passaggi."],
        ["📋 Le lezioni della settimana", "Nella Dashboard: le lezioni che gli insegnanti non hanno ancora compilato questa settimana, con il conto per insegnante. \"Mostra tutte\" elenca ogni lezione. Di solito basta un WhatsApp gentile all'insegnante."],
        ["🚫 Annulla lezioni", "Dashboard → \"🚫 Annulla lezioni\": scegli l'insegnante (o la classe), le date e gli orari in cui manca. Controlla l'elenco (le lezioni che si sovrappongono solo in parte sono spiegate), poi \"Annulla N lezioni\". Copia il messaggio pronto per ogni classe e mandalo su WhatsApp. Le lezioni annullate non contano per presenze e progressi; \"Lezioni da recuperare\" dice quante aggiungere alla fine del corso. La segnalazione \"annullata\" di un insegnante ha \"🚫 Registra come annullata\"."]
        ["Il pulsante ⏳ in alto", "Modifiche ancora in viaggio verso Google. Aspetta che sparisca prima di chiudere la pagina. Se diventa ⚠, toccalo per riprovare."]
      ],
      tip: "Qualcosa non funziona? 🐞 Segnala un problema (menu a sinistra) manda un'email alla scuola con i dettagli."
    }
  }
};
let llsGuideState = { tab: "", lang: "" };

function llsRenderGuide() {
  const g = LLS_GUIDE[llsGuideState.tab][llsGuideState.lang];
  const body = byId("guideBody");
  if (!body) return;
  body.innerHTML = `<p class="guide-intro">${escapeHtml(g.intro)}</p>
    <ol>${g.steps.map(([t, d]) => `<li><div><strong>${escapeHtml(t)}</strong><span>${escapeHtml(d)}</span></div></li>`).join("")}</ol>
    <p class="guide-tip">🐞 ${escapeHtml(g.tip.replace(/^🐞\s*/, ""))}</p>`;
  document.querySelectorAll("[data-guide-tab]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.guideTab === llsGuideState.tab)));
  const lb = document.querySelector("[data-guide-lang]");
  if (lb) lb.textContent = llsGuideState.lang === "it" ? "🇬🇧 English" : "🇮🇹 Italiano";
}

function llsOpenGuide() {
  let lang = "en";
  try { lang = localStorage.getItem("lls_lang") === "it" ? "it" : "en"; } catch (_) {}
  const teacher = typeof llsRole === "function" && llsRole() === "teacher";
  llsGuideState = { tab: llsGuideState.tab || (teacher ? "teacher" : "office"), lang: llsGuideState.lang || lang };
  llsRenderGuide();
  openModal("guideModal");
}

document.addEventListener("DOMContentLoaded", () => {
  byId("openGuide")?.addEventListener("click", (e) => { e.preventDefault(); llsOpenGuide(); });
  document.querySelectorAll("[data-guide-tab]").forEach((b) => b.addEventListener("click", () => { llsGuideState.tab = b.dataset.guideTab; llsRenderGuide(); }));
  document.querySelector("[data-guide-lang]")?.addEventListener("click", () => { llsGuideState.lang = llsGuideState.lang === "it" ? "en" : "it"; llsRenderGuide(); });
});


/* 1 Oct — homework suggestion from the book (Power Up 1 for Starters):
   one tap fills the homework with the current unit and its Pupil's Book
   pages. The teacher can change anything before saving. */
function llsRenderHwSuggest(cls) {
  const box = byId("lessonHwSuggest");
  if (!box) return;
  const course = cls && cls.book && window.LLS_COURSES && LLS_COURSES[cls.book];
  const unit = Number(cls && cls.currentUnit) || 0;
  const lesson = course && course.pages && course.lessons.find((l) => l.unit === unit);
  if (!lesson) { box.hidden = true; box.innerHTML = ""; return; }
  const from = course.pages[unit];
  const next = course.pages[unit + 1];
  const pages = from ? (next ? `p. ${from}–${next - 1}` : `p. ${from}`) : "";
  const title = `${course.title} · Unit ${unit}: ${lesson.title}`;
  const text = [pages ? `${course.pagesLabel || "Book"} ${pages}` : "", "Activity Book: Unit " + unit].filter(Boolean).join(" · ");
  box.hidden = false;
  box.innerHTML = `<button type="button" class="sk-chip" title="${escapeHtml(text)}">📗 Unit ${unit} · ${escapeHtml(lesson.title)}${pages ? ` (${escapeHtml(pages)})` : ""}</button>`;
  box.querySelector("button").addEventListener("click", () => {
    setValue("lessonHwTitle", title);
    if (!value("lessonHwText").trim()) setValue("lessonHwText", text);
    byId("lessonHwText")?.focus();
  });
}



/* =========================================================
   2 Oct — HOMEWORK FILES (needs Apps Script V29)
   Teachers attach worksheets / photos / audio to a homework; every
   teacher and the students of that class can open them. Students hand
   in photos or PDFs of their work from the app; here the teacher opens
   it and saves a mark + comment the student sees in the app.
   Files live privately in the school's Google Drive; they are opened
   through Apps Script after a login check (no public links).
========================================================= */
const LLS_FILE_MAX = 8 * 1024 * 1024;
const LLS_FILE_ICON = (type) => /^image\//.test(type) ? "🖼️" : /pdf/.test(type) ? "📄" : /^audio\//.test(type) ? "🎧" : "📎";

function llsHwFileCounts_(homeworkId, from) {
  from = from || llsHomeworkCache;
  const files = (from.files || []).filter((f) => f.homeworkId === homeworkId);
  const studentsIn = new Set(files.filter((f) => f.kind === "Work").map((f) => f.studentId));
  let toMark = 0;
  studentsIn.forEach((sid) => {
    const rec = (from.status || []).find((s) => String(s["Homework ID"] || "") === homeworkId && String(s["Student ID"] || "").trim() === sid);
    if (!rec || (!String(rec["Mark"] || "").trim() && !String(rec["Feedback"] || "").trim())) toMark++;
  });
  return { teacher: files.filter((f) => f.kind === "Homework").length, students: studentsIn.size, toMark };
}

function llsHwWorkFor_(homeworkId, studentId) {
  return (llsHomeworkCache.files || []).filter((f) => f.kind === "Work" && f.homeworkId === homeworkId && f.studentId === studentId);
}

function llsFileChip_(f, removable) {
  const when = f.addedAt ? new Date(f.addedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "";
  return `<span class="hw-file-chip"><button type="button" class="hw-file-open" data-open-file="${escapeAttribute(f.fileId)}" title="Open">${LLS_FILE_ICON(f.type)} ${escapeHtml(f.name)}</button>${when ? `<small>${escapeHtml(when)}${f.addedBy && f.kind === "Homework" ? " · " + escapeHtml(f.addedBy) : ""}</small>` : ""}${removable ? `<button type="button" class="hw-file-remove" data-remove-file="${escapeAttribute(f.fileId)}" title="Remove" aria-label="Remove ${escapeAttribute(f.name)}">✕</button>` : ""}</span>`;
}

function llsWireFileChips_(root, onRemoved) {
  root.querySelectorAll("[data-open-file]").forEach((b) => b.addEventListener("click", () => {
    const f = (llsHomeworkCache.files || []).find((x) => x.fileId === b.dataset.openFile);
    llsOpenFile_(b.dataset.openFile, f);
  }));
  root.querySelectorAll("[data-remove-file]").forEach((b) => b.addEventListener("click", async () => {
    const f = (llsHomeworkCache.files || []).find((x) => x.fileId === b.dataset.removeFile);
    if (!window.confirm(`Remove "${f ? f.name : "this file"}"? Students won't see it any more.`)) return;
    b.disabled = true;
    try {
      await llsApiPost({ action: "removeFile", fileId: b.dataset.removeFile });
      llsHomeworkCache.files = (llsHomeworkCache.files || []).filter((x) => x.fileId !== b.dataset.removeFile);
      showToast("File removed.", "success");
      if (onRemoved) onRemoved();
      llsRepaintHomeworkCounts_();
    } catch (error) {
      b.disabled = false;
      showToast(llsFileError_(error), "error");
    }
  }));
}

function llsFileError_(error) {
  const m = String(error && error.message || error || "");
  return /Unknown (mutation )?action/.test(m) ? "Files need the Google update V29. Ask Cole to install it." : m;
}

// Opens the file in a new tab (the tab is opened straight away so the
// browser doesn't block it, then filled when Google sends the file).
async function llsOpenFile_(fileId, meta) {
  const win = window.open("", "_blank");
  if (win) { try { win.document.title = "Opening…"; win.document.body.innerHTML = '<p style="font:16px system-ui;padding:24px;color:#16275c">Opening the file…</p>'; } catch (_) {} }
  try {
    const url = new URL(LLS_API_URL);
    url.searchParams.set("action", "getFile");
    url.searchParams.set("fileId", fileId);
    url.searchParams.set("token", sessionStorage.getItem(LLS_ADMIN_TOKEN_KEY) || "");
    url.searchParams.set("t", Date.now());
    const response = await llsFetch_(url.toString(), { method: "GET", cache: "no-store", redirect: "follow" }, { timeoutMs: 90000, save: true });
    const data = JSON.parse(await response.text());
    if (!data.success) throw new Error(data.error || "Could not open the file.");
    const file = data.file || meta || {};
    const bytes = Uint8Array.from(atob(data.data), (c) => c.charCodeAt(0));
    const blobUrl = URL.createObjectURL(new Blob([bytes], { type: file.type || "application/octet-stream" }));
    const viewable = /^(image\/|audio\/|application\/pdf|text\/plain)/.test(file.type || "");
    if (win && viewable) { win.location.href = blobUrl; }
    else {
      if (win) win.close();
      const a = document.createElement("a");
      a.href = blobUrl; a.download = file.name || "file"; document.body.appendChild(a); a.click(); a.remove();
    }
    setTimeout(() => URL.revokeObjectURL(blobUrl), 120000);
  } catch (error) {
    if (win) win.close();
    showToast(llsFileError_(error.timeout ? new Error("The file took too long to arrive. Try again.") : error), "error");
  }
}

// Photos are made smaller (max 1800 px, JPEG) so they upload fast on a phone.
async function llsReadUpload_(file) {
  let blob = file, type = file.type || "", name = file.name || "file";
  if (/^image\/(jpeg|png|webp|heic|heif)$/i.test(type) && file.size > 500 * 1024 && typeof createImageBitmap === "function") {
    try {
      const img = await createImageBitmap(file);
      const scale = Math.min(1, 1800 / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale); canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const small = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
      if (small && small.size < file.size) { blob = small; type = "image/jpeg"; name = name.replace(/\.[a-z0-9]+$/i, "") + ".jpg"; }
    } catch (_) { /* keep the original */ }
  }
  if (!type && /\.pdf$/i.test(name)) type = "application/pdf";
  if (blob.size > LLS_FILE_MAX) throw new Error(`"${name}" is too big (max 8 MB).`);
  const data = await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).replace(/^data:[^,]*,/, ""));
    r.onerror = () => reject(new Error(`Couldn't read "${name}".`));
    r.readAsDataURL(blob);
  });
  return { name, type, data };
}

async function llsUploadHwFiles_(homeworkId, files) {
  let sent = 0;
  for (let i = 0; i < files.length; i++) {
    try {
      showToast(`Uploading ${i + 1} of ${files.length}: ${files[i].name}…`, "info");
      const up = await llsReadUpload_(files[i]);
      const res = await llsApiPost(Object.assign({ action: "uploadHomeworkFile", homeworkId }, up));
      if (res.file) llsHomeworkCache.files = (llsHomeworkCache.files || []).concat(res.file);
      sent++;
    } catch (error) {
      showToast(llsFileError_(error), "error");
    }
  }
  return sent;
}

function llsOpenHwFiles(homeworkId) {
  const hw = (llsHomeworkCache.homework || []).find((h) => String(h["Homework ID"] || "") === homeworkId);
  if (!hw) return;
  const render = () => {
    const files = (llsHomeworkCache.files || []).filter((f) => f.kind === "Homework" && f.homeworkId === homeworkId);
    text("homeworkFilesTitle", String(hw["Title"] || "Homework"));
    const list = byId("homeworkFilesList");
    list.innerHTML = files.length
      ? `<div class="hw-file-chips">${files.map((f) => llsFileChip_(f, true)).join("")}</div>`
      : `<p class="muted" style="margin:0;">No files yet. Add a worksheet, a photo of the page or an audio file.</p>`;
    llsWireFileChips_(list, render);
  };
  render();
  const input = byId("homeworkFilesAdd");
  input.value = "";
  input.onchange = async () => {
    const picked = Array.from(input.files || []);
    if (!picked.length) return;
    input.disabled = true;
    const sent = await llsUploadHwFiles_(homeworkId, picked);
    input.disabled = false; input.value = "";
    if (sent) showToast(sent + " file" + (sent === 1 ? "" : "s") + " added. Students can open " + (sent === 1 ? "it" : "them") + " in their app.", "success");
    render();
    llsRepaintHomeworkCounts_();
  };
  openModal("homeworkFilesModal");
}

async function llsSaveHwMark_(homeworkId, studentId, mark, feedback) {
  mark = String(mark || "").trim(); feedback = String(feedback || "").trim();
  if (!mark && !feedback) { showToast("Write a mark or a comment first.", "error"); return; }
  const rec = llsHomeworkCache.status.find((s) => String(s["Homework ID"] || "") === homeworkId && String(s["Student ID"] || "").trim() === studentId);
  if (rec) Object.assign(rec, { Status: "Done", Mark: mark, Feedback: feedback });
  else llsHomeworkCache.status.push({ "Homework ID": homeworkId, "Student ID": studentId, Status: "Done", Mark: mark, Feedback: feedback });
  llsQueueSave("homework mark", { action: "markHomeworkFeedback", homeworkId, studentId, mark, feedback });
  showToast("Mark saved. The student sees it in their app.", "success");
  openHomeworkStatusModal(homeworkId);
  llsRepaintHomeworkCounts_();
}

function llsHwFilesPickedLabel_() {
  const input = byId("homeworkFiles");
  const label = byId("homeworkFilesPicked");
  if (!input || !label) return;
  const n = (input.files || []).length;
  label.textContent = n ? `${n} file${n === 1 ? "" : "s"} chosen: ${Array.from(input.files).map((f) => f.name).join(", ")}` : "";
}

document.addEventListener("DOMContentLoaded", () => {
  byId("homeworkFiles")?.addEventListener("change", llsHwFilesPickedLabel_);
});



/* =========================================================
   2 Oct — LESSON PROBLEMS (needs Apps Script V29)
   From the TUT TUT reminder a teacher can say a lesson was covered by
   another teacher, cancelled, or isn't their class. The covering teacher
   gets the reminder instead; the office sees a "Lessons to sort out"
   box on the Dashboard with what to do and a button to go there.
========================================================= */
function llsTutTeacherOptions_(session) {
  const me = String(session?.teacherId || "");
  const list = (state.teachers || []).filter((t) => t.id && t.id !== me && String(t.status || "Active") === "Active");
  return `<option value="">Choose…</option>${list.map((t) => `<option value="${escapeAttribute(t.id)}">${escapeHtml(t.name || t.id)}</option>`).join("")}<option value="other">Someone else</option>`;
}

let llsIssues = { open: [], sorted: [] };
async function llsLoadLessonIssues() {
  if (llsRole() !== "admin" || !llsHasAdminSession()) return;
  try {
    const res = await llsApiGet("getLessonIssues", {}, { background: true });
    llsIssues = { open: res.open || [], sorted: res.sorted || [] };
  } catch (_) { llsIssues = { open: [], sorted: [] }; }
  llsRenderLessonIssues();
}

function llsIssueWhatToDo_(i) {
  if (i.kind === "Add student") return `Add ${escapeHtml(i.studentName || "the student")} to ${escapeHtml(i.className || "the class")} (Students → Add student, choose the class), then record the course fee.`;
  if (i.kind === "Remove student") return `Take ${escapeHtml(i.studentName || "the student")} off ${escapeHtml(i.className || "the class")} (open the student → class → end the enrolment) and check their fees.`;
  if (i.kind === "Covered") return `${escapeHtml(i.coveredBy || "The covering teacher")} covered it. ${i.coveredById ? "They get a reminder to fill in the lesson notes." : "Fill in the lesson notes (or ask who covered)."} If the class has a new teacher for good, change it in Classes.`;
  if (i.kind === "Cancelled") return llsIsCancelled(i.classId, i.lessonDate) ? "Already recorded as cancelled (a make-up is owed). Press Sorted." : "Press \"🚫 Record as cancelled\": the class is owed a make-up lesson at the end of the course. Tell the families.";
  return "The timetable may be wrong: check who teaches this class (Classes → Edit → Teacher).";
}

function llsRenderLessonIssues() {
  const box = byId("lessonIssuesPanel");
  if (!box) return;
  const open = llsIssues.open || [];
  box.hidden = !open.length;
  if (!open.length) { box.innerHTML = ""; return; }
  const when = (iso) => new Date(iso + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  const icon = { Covered: "👥", Cancelled: "🚫", "Not my class": "❓", "Add student": "➕", "Remove student": "➖" };
  const head = (i) => i.kind === "Covered" ? `Change the teacher: ${i.reportedBy || "the teacher"} → ${i.coveredBy || "another teacher"}`
    : i.kind === "Cancelled" ? "Lesson cancelled" : i.kind === "Add student" ? `Add ${i.studentName || "a student"} to the class`
    : i.kind === "Remove student" ? `Take ${i.studentName || "a student"} off the class` : "Not my class";
  box.innerHTML = `
    <p class="section-label" style="margin-top:0;">📋 Rosanna's to-do (${open.length})</p>
    <p class="muted" style="margin:4px 0 12px;">Teachers sent these. Do what it says, then press <strong>Sorted</strong>.</p>
    ${open.map((i) => `<div class="issue-row">
      <div>
        <strong>${icon[i.kind] || "•"} ${escapeHtml(head(i))}</strong>
        · ${escapeHtml(i.className || i.classId)} · ${escapeHtml(when(i.lessonDate))}${i.lessonTime ? " " + escapeHtml(i.lessonTime) : ""}
        <div class="muted" style="font-size:14px;margin-top:2px;">Reported by ${escapeHtml(i.reportedBy || "a teacher")}${i.note ? ` — “${escapeHtml(i.note)}”` : ""}</div>
        <div style="font-size:14px;margin-top:4px;">👉 ${llsIssueWhatToDo_(i)}</div>
      </div>
      <div class="issue-actions">
        ${i.kind === "Add student"
          ? `<button type="button" class="button button-secondary" data-issue-addst="${escapeAttribute(i.issueId)}">➕ Add student</button>`
          : i.kind === "Remove student"
          ? `<button type="button" class="button button-secondary" data-issue-st="${escapeAttribute(i.studentId)}" ${i.studentId ? "" : "disabled"}>Open student</button>`
          : i.kind === "Not my class"
          ? `<button type="button" class="button button-secondary" data-issue-class="${escapeAttribute(i.classId)}">Open class</button>`
          : i.kind === "Cancelled" && !llsIsCancelled(i.classId, i.lessonDate)
          ? `<button type="button" class="button button-secondary" data-issue-cancel="${escapeAttribute(i.issueId)}" title="Records it as cancelled (a make-up is owed) and marks it sorted">🚫 Record as cancelled</button>`
          : `<button type="button" class="button button-secondary" data-issue-lesson="${escapeAttribute(i.issueId)}">Open lesson</button>`}
        <button type="button" class="button button-primary" data-issue-sorted="${escapeAttribute(i.issueId)}">Sorted ✓</button>
      </div>
    </div>`).join("")}`;
  box.querySelectorAll("[data-issue-addst]").forEach((b) => b.addEventListener("click", () => {
    const i = open.find((x) => x.issueId === b.dataset.issueAddst);
    if (!i) return;
    navigateTo("students");
    openNewStudent();
    const parts = String(i.studentName || "").trim().split(/\s+/);
    setValue("studentFirstName", parts.shift() || "");
    setValue("studentLastName", parts.join(" "));
    if (byId("studentClass") && [...byId("studentClass").options].some((o) => o.value === i.classId)) setValue("studentClass", i.classId);
    if (i.note) setValue("studentNotes", i.note);
  }));
  box.querySelectorAll("[data-issue-st]").forEach((b) => b.addEventListener("click", () => {
    navigateTo("students");
    try { openEditStudent(b.dataset.issueSt); } catch (_) {}
  }));
  box.querySelectorAll("[data-issue-class]").forEach((b) => b.addEventListener("click", () => {
    navigateTo("classes");
    try { openEditClass(b.dataset.issueClass); } catch (_) {}
  }));
  box.querySelectorAll("[data-issue-lesson]").forEach((b) => b.addEventListener("click", () => {
    const i = open.find((x) => x.issueId === b.dataset.issueLesson);
    if (!i) return;
    navigateTo("lesson");
    const dateInput = byId("lessonDate");
    if (dateInput) dateInput.value = i.lessonDate;
    llsLesson.loadedKey = "";
    llsLesson.showAll = true;
    llsRenderLessonPicker();
    llsOpenLesson(i.classId);
  }));
  box.querySelectorAll("[data-issue-cancel]").forEach((b) => b.addEventListener("click", () => {
    const i = open.find((x) => x.issueId === b.dataset.issueCancel);
    const cls = i && llsLessonClasses().find((c) => c.id === i.classId);
    if (!i || !cls) return;
    llsCancelLessons_([{ cls, date: i.lessonDate, time: i.lessonTime || "" }], i.note || "Reported by " + (i.reportedBy || "the teacher"));
    llsIssues.open = llsIssues.open.filter((x) => x.issueId !== i.issueId);
    llsQueueSave("lesson sorted", { action: "resolveLessonIssue", issueId: i.issueId });
    llsRenderLessonIssues();
    showToast(`${cls.name} recorded as cancelled: a make-up lesson is owed.`, "success");
  }));
  box.querySelectorAll("[data-issue-sorted]").forEach((b) => b.addEventListener("click", () => {
    const id = b.dataset.issueSorted;
    llsIssues.open = llsIssues.open.filter((x) => x.issueId !== id);
    llsQueueSave("lesson sorted", { action: "resolveLessonIssue", issueId: id });
    llsRenderLessonIssues();
    showToast("Marked as sorted.", "success");
  }));
}

document.addEventListener("DOMContentLoaded", () => {
  // After the page has its data; quietly, so opening is never slowed down.
  setTimeout(() => {
    const wait = () => (window.llsServerVersion === undefined ? setTimeout(wait, 1000) : (window.llsServerVersion >= 29 && llsLoadLessonIssues()));
    wait();
  }, 3000);
});


// Lesson page: files chosen with the homework wait here (this tab only) until
// the lesson is saved and Google gives the homework its number.
const llsPendingHwFiles = {};
async function llsAfterHomeworkSaved_(requestId, homeworkId) {
  const pending = llsPendingHwFiles[requestId];
  if (!pending) return;
  delete llsPendingHwFiles[requestId];
  const keep = llsHomeworkCache;
  llsHomeworkCache = { classId: pending.classId, homework: [], status: [], files: [] };
  const sent = await llsUploadHwFiles_(homeworkId, pending.files);
  const added = llsHomeworkCache.files;
  llsHomeworkCache = keep;
  if (sent) showToast(`📎 ${sent} file${sent === 1 ? "" : "s"} added to the homework. Students can open ${sent === 1 ? "it" : "them"} in their app.`, "success");
  if (llsLesson.classId === pending.classId) {
    llsLesson.files = (llsLesson.files || []).concat(added);
    const own = llsLesson.homework.find((h) => !h["Homework ID"]);
    if (own) own["Homework ID"] = homeworkId;
    llsRenderLessonHomework(llsStudentsForClass(llsLesson.classId).length);
  }
}
function llsLessonFilesPicked_() {
  const input = byId("lessonHwFiles"), label = byId("lessonHwFilesPicked");
  if (!input || !label) return;
  const n = (input.files || []).length;
  label.textContent = n ? `${n} file${n === 1 ? "" : "s"} chosen: they go up when you save the lesson.` : "";
}
document.addEventListener("DOMContentLoaded", () => {
  byId("lessonHwFiles")?.addEventListener("change", llsLessonFilesPicked_);
});


/* =========================================================
   2 Oct — owner's requests:
   1. Lesson plans: the owner's PowerPoint lessons for each course appear
      on the Lesson page. Teachers open the slides, press "Teach today",
      and see which lessons this class has already had (and when, and by
      whom), so the same lesson is never taught twice by mistake.
      A lesson counts as taught when its code (e.g. 4B, 6B-1, L3, R1-2)
      starts "Unit / page" in the class's lesson notes.
   2. The week's lessons: every scheduled lesson this week, filled in or
      still to complete. Teachers see theirs (Lesson page), the office
      sees everyone's (Dashboard).
   3. Office reminder: students in a class with no course fee recorded.
========================================================= */

// ---------- 1. Lesson plans ----------
function llsPlanCode_(unit) {
  const m = String(unit || "").trim().replace(/^(unit|lesson)\s+/i, "").match(/^(R\d{1,2}-\d{1,2}|\d{1,2}[A-C](?:-\d)?|L\d{1,2}|U\d{1,2}-L\d|[SR]-L\d|PE\d{1,2})(?![\w])/i);
  return m ? m[1].toUpperCase() : "";
}
function llsPlansFor_(cls) {
  const all = (window.LLS_PLANS && LLS_PLANS.courses && cls && LLS_PLANS.courses[cls.book]) || [];
  const m = String((cls && cls.units) || "").match(/^(\d+)\s*-\s*(\d+)$/);
  return m ? all.filter((p) => p.unit >= Number(m[1]) && p.unit <= Number(m[2])) : all;
}
function llsPlanUrl_(p, field) {
  const P = window.LLS_PLANS || {};
  const f = p && p[field || "file"];
  if (!f) return "";
  if (P.links && P.links[f]) return P.links[f];
  return P.base ? P.base + f.split("/").map(encodeURIComponent).join("/") : "";
}
// 4 Oct — the materials a teacher can use for one lesson (all optional).
function llsPlanMaterials_(p) {
  return { slides: llsPlanUrl_(p, "file"), hw: llsPlanUrl_(p, "hw"), easy: llsPlanUrl_(p, "easy"), key: llsPlanUrl_(p, "key"), pcm: llsPlanUrl_(p, "pcm") };
}
function llsPlanMaterialLinks_(p, big) {
  const m = llsPlanMaterials_(p), c = big ? "button button-secondary" : "row-action";
  // 6 Oct: Drive opens .pptx in Google Slides, which drops the embedded audio/video. A direct download link
  // fails with 403 when the browser's first Google account isn't the one the file is shared with, so the
  // button opens the Drive page (it picks the right account) and the teacher clicks ⬇ Download there.
  return [m.slides ? `<a class="${c}" href="${escapeAttribute(m.slides)}" target="_blank" rel="noopener" title="Opens Google Drive: click ⬇ Download (top right), then open the file in PowerPoint – audio and video work there">🖥 Slides (PowerPoint)</a>` : "",
    m.hw ? `<a class="${c}" href="${escapeAttribute(m.hw)}" target="_blank" rel="noopener">📝 Homework sheet</a>` : "",
    m.easy ? `<a class="${c}" href="${escapeAttribute(m.easy)}" target="_blank" rel="noopener">📝 Easier homework</a>` : "",
    m.key ? `<a class="${c}" href="${escapeAttribute(m.key)}" target="_blank" rel="noopener">🔑 Answer key</a>` : "",
    m.pcm ? `<a class="${c}" href="${escapeAttribute(m.pcm)}" target="_blank" rel="noopener">🖨 Photocopiables</a>` : ""].join("");
}
// 6 Oct: make the audio route obvious. Drive/Google Slides drop the sound inside a .pptx, so teachers must
// download the deck and open it in PowerPoint. Courses whose decks carry their audio are listed in LLS_PLANS.audioInside.
function llsPlanAudioTip_(cls) {
  const inside = !!(window.LLS_PLANS && LLS_PLANS.audioInside && cls && LLS_PLANS.audioInside[cls.book]);
  return `<div class="plan-audio"><strong>🔊 Listening and video</strong>
    <ol>
      <li>Click <b>🖥 Slides (PowerPoint)</b>: Google Drive opens. Click <b>⬇ Download</b> (top right).</li>
      <li>Open the downloaded file in <b>PowerPoint</b> (not Google Slides) and start the Slide Show.</li>
      ${inside ? `<li>On a listening slide, click the <b>🔈 speaker icon</b> (top of the slide) to play the track. Videos play on the slide too.</li>`
        : `<li>The audio isn't inside these slides yet: play the track shown on the slide (🎧 e.g. 6.11) from the book's audio.</li>`}
    </ol>
    <span class="plan-audio-warn">⚠ Don't click "Open with Google Slides": there is <b>no sound</b> there. Download it and use PowerPoint.</span></div>`;
}
// Hint above "📎 Attach files" when today's lesson has a homework sheet.
function llsRenderHwSheetHint_() {
  const box = byId("lessonHwSheetHint");
  if (!box) return;
  const cls = llsLessonClasses().find((c) => c.id === llsLesson.classId);
  const code = llsPlanCode_(value("lessonUnitPage"));
  const p = cls && code ? llsPlansFor_(cls).find((x) => x.id === code) : null;
  const url = p ? llsPlanUrl_(p, "hw") : "";
  box.hidden = !url;
  box.innerHTML = url ? `📝 <strong>${escapeHtml(p.id)} has a homework sheet.</strong> If you want to use it: <a href="${escapeAttribute(url)}" target="_blank" rel="noopener">open it</a>, download the PDF, then attach it here with <b>📎 Attach files</b>. Students get it in their app. <span class="muted">(Optional.)</span>` : "";
}
// When each plan was taught with this class: { code: [{ date, teacher }] }.
function llsPlanTaught_(entries) {
  const out = {};
  (entries || []).forEach((e) => {
    const code = llsPlanCode_(e.unit);
    if (!code) return;
    (out[code] = out[code] || []).push({ date: String(e.lessonDate || "").slice(0, 10), teacher: String(e.teacherName || "").split(/\s+/)[0] });
  });
  return out;
}
let llsPlanShowAll = false;
let llsPlanConfirm = "";
function llsRenderPlanPanel() {
  const box = byId("lessonPlanPanel");
  if (!box) return;
  const cls = llsLessonClasses().find((c) => c.id === llsLesson.classId);
  const plans = cls ? llsPlansFor_(cls) : [];
  box.hidden = !plans.length;
  if (!plans.length) { box.innerHTML = ""; llsRenderHwSheetHint_(); return; }
  const date = byId("lessonDate")?.value || "";
  const taught = llsPlanTaught_((llsLesson.entries || []).filter((e) => String(e.lessonDate || "").slice(0, 10) !== date));
  const todayCode = llsPlanCode_(value("lessonUnitPage"));
  const doneCount = plans.filter((p) => taught[p.id]).length;
  let lastIdx = -1;
  plans.forEach((p, i) => { if (taught[p.id]) lastIdx = i; });
  const nextIdx = plans.findIndex((p, i) => i > lastIdx && !taught[p.id]);
  const when = (iso) => new Date(iso + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const shown = llsPlanShowAll ? plans : plans.filter((p, i) => p.id === todayCode || i === lastIdx || (nextIdx >= 0 && i >= nextIdx && i <= nextIdx + 2));
  const name = (LLS_PLANS.names && LLS_PLANS.names[cls.book]) || cls.book;
  const feat = plans.find((p) => p.id === todayCode) || (nextIdx >= 0 ? plans[nextIdx] : null);
  box.innerHTML = `
    <div class="plan-head"><p class="section-label" style="margin:0;">📚 Lesson materials for this class <span class="plan-optional">optional</span></p><span class="muted">${escapeHtml(name)} · <strong>${doneCount}/${plans.length}</strong> taught${window.LLS_PLANS && LLS_PLANS.folder ? ` · <a href="${escapeAttribute(LLS_PLANS.folder)}" target="_blank" rel="noopener">📂 All on Google Drive</a>` : ""}</span></div>
    <p class="plan-intro">Ready-made slides for each lesson, with a homework sheet you can attach at the end (step 3 · Homework). Use them if they help — you don't have to.</p>
    <p class="plan-report">These lessons are new and not perfect yet. Seen a mistake or something that doesn't work in class? <a href="#" data-report-lesson="${escapeAttribute((feat ? feat.id + " " + feat.title : "") + " · " + name)}">⚠ Report a problem with a lesson</a> – say the lesson, the slide number and what's wrong, and attach a screenshot.</p>
    ${feat ? `<div class="plan-feature">
      <div><span class="plan-code">${escapeHtml(feat.id)}</span> <strong>${feat.id === todayCode ? "Today" : "Next"}: ${escapeHtml(feat.title)}</strong><small>${escapeHtml(feat.focus)}</small></div>
      <div class="plan-feature-actions">${llsPlanMaterialLinks_(feat, true) || '<span class="muted">Slides are being uploaded – ask the office.</span>'}${feat.id === todayCode ? "" : `<button type="button" class="button" data-plan-use="${escapeAttribute(feat.id)}">Teach this today</button>`}</div>
    </div>` : ""}
    ${feat && llsPlanUrl_(feat, "file") ? llsPlanAudioTip_(cls) : ""}
    <div class="plan-bar" aria-hidden="true"><i style="width:${Math.round(doneCount / plans.length * 100)}%"></i></div>
    <div class="plan-list">${shown.map((p) => {
      const t = taught[p.id];
      const i = plans.indexOf(p);
      const isToday = p.id === todayCode;
      const cls2 = isToday ? "today" : t ? "done" : i === nextIdx ? "next" : "";
      const badge = isToday ? "📌 Today's lesson" : t ? "✓ Taught " + t.map((x) => when(x.date) + (x.teacher ? " (" + x.teacher + ")" : "")).join(", ") : i === nextIdx ? "➡ Next" : "";
      const confirm = llsPlanConfirm === p.id;
      return `<div class="plan-row ${cls2}">
        <span class="plan-code">${escapeHtml(p.id)}</span>
        <span class="plan-text"><strong>${escapeHtml(p.title)}</strong><small>${escapeHtml(p.focus)}${p.pages ? " · " + escapeHtml(p.pages) : ""}</small>${badge ? `<em>${escapeHtml(badge)}</em>` : ""}${confirm ? `<b class="plan-warn">⚠ This class has already had this lesson. Tap again to teach it again.</b>` : ""}</span>
        <span class="plan-actions">
          ${llsPlanMaterialLinks_(p)}<a class="plan-flag" href="#" title="Report a problem with this lesson" aria-label="Report a problem with ${escapeAttribute(p.id)}" data-report-lesson="${escapeAttribute(p.id + " " + p.title + " · " + name)}">⚠</a>
          ${isToday ? "" : `<button type="button" class="row-action${t ? " warn" : ""}" data-plan-use="${escapeAttribute(p.id)}">${confirm ? "Yes, teach again" : t ? "Teach again" : "Teach today"}</button>`}
        </span></div>`;
    }).join("")}</div>
    ${plans.length > shown.length || llsPlanShowAll ? `<button type="button" class="row-action plan-all" data-plan-all>${llsPlanShowAll ? "Show fewer" : `Show all ${plans.length} lessons`}</button>` : ""}`;
  llsRenderHwSheetHint_();
  box.querySelector("[data-plan-all]")?.addEventListener("click", () => { llsPlanShowAll = !llsPlanShowAll; llsRenderPlanPanel(); });
  box.querySelectorAll("[data-plan-use]").forEach((b) => b.addEventListener("click", () => {
    const p = plans.find((x) => x.id === b.dataset.planUse);
    if (!p) return;
    if (taught[p.id] && llsPlanConfirm !== p.id) { llsPlanConfirm = p.id; llsRenderPlanPanel(); return; }
    llsPlanConfirm = "";
    if (byId("lessonSpecialOn")?.checked) llsSetSpecial(false);
    if (llsChoiceOn()) llsSetChoice(false);
    setValue("lessonUnitPage", p.id + (p.pages ? " · " + p.pages : ""));
    try { const st = llsWbState.lessonWbBox; if (!st || !st.touchedLesson) llsLessonWb_(); } catch (_) {}
    if (!value("lessonDone").trim()) setValue("lessonDone", `${p.title}: ${p.focus}`);
    // Tick the skills this deck covers, with its topics (teachers can untick or edit).
    Object.entries(p.skills || {}).forEach(([k, topic]) => {
      const st = llsSkillState[k];
      if (st && st.on && String(st.topic || "").trim()) return;
      llsSkillState[k] = { on: true, topic: String(topic || ""), focus: (st && st.focus) || "" };
    });
    if (p.skills) { byId("lessonSkills")?.classList.remove("needs"); llsRenderSkills(); }
    llsLesson.noteTouched = true;
    byId("lessonDone")?.classList.remove("needs");
    llsRenderPlanPanel();
    showToast(`${p.id} "${p.title}" is today's lesson. Take the register and save as usual.`, "info");
  }));
}
document.addEventListener("DOMContentLoaded", () => {
  byId("lessonUnitPage")?.addEventListener("input", () => { llsPlanConfirm = ""; llsRenderPlanPanel(); });
});

// ---------- 2. The week's lessons ----------
let llsWeekOffset = 0;
const llsWeekCache = {};
let llsWeekShowAll = false;
function llsMonday_(offset) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + offset * 7);
  return isoDate(d);
}
function llsWeekLessons_(monday, mine) {
  const out = [];
  const d = new Date(monday + "T12:00:00");
  for (let i = 0; i < 6; i++) {
    const iso = isoDate(d);
    const dayName = d.toLocaleDateString("en-GB", { weekday: "long" });
    if (!llsSchoolClosed_(iso)) {
      llsLessonsOn(iso, mine).forEach(({ cls, time }) => {
        if (/^demo/i.test(cls.name || "")) return;
        out.push({ cls, time, date: iso, teacher: llsTeacherOnDay(cls, dayName) });
      });
    }
    d.setDate(d.getDate() + 1);
  }
  return out;
}
async function llsLoadWeek_(monday, classIds, force) {
  const key = monday + "|" + classIds.slice().sort().join(",");
  const hit = llsWeekCache[key];
  if (hit && !force && Date.now() - hit.at < 5 * 60 * 1000) return hit;
  for (let i = 0; i < 20 && window.llsServerVersion === undefined; i++) await new Promise((r) => setTimeout(r, 500));
  const info = { dates: {}, issues: [], at: Date.now(), failed: false };
  if ((window.llsServerVersion || 0) >= 29) {
    try {
      const res = await llsApiGet("getLessonDates", { classIds: classIds.join(","), since: monday }, { background: true });
      info.dates = res.dates || {};
      info.issues = res.issues || [];
      llsNoteCancelMap_(res.cancelled, classIds, monday);
    } catch (_) { info.failed = true; }
  } else {
    for (const id of classIds) {
      try {
        const log = await llsApiGet("getLessonLog", { classId: id, limit: 30 }, { background: true });
        info.dates[id] = (log.entries || []).map((e) => String(e.lessonDate || "").slice(0, 10));
        llsNoteCancelFromEntries_(id, log.entries);
      } catch (_) { info.failed = true; }
    }
  }
  if (!info.failed) llsWeekCache[key] = info;
  return info;
}
function llsWeekStatus_(x, info) {
  const now = new Date();
  const today = isoDate(now);
  const hhmm = String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");
  if (llsIsCancelled(x.cls.id, x.date)) return "cancelled";
  const saved = llsLessonSaveState(x.cls.id, x.date);
  if (saved === "saved" || ((info && info.dates[x.cls.id]) || []).includes(x.date)) return "done";
  if (saved === "sending") return "sending";
  if (info && (info.issues || []).some((i) => i.classId === x.cls.id && i.lessonDate === x.date)) return "reported";
  if (x.date > today || (x.date === today && String(x.time || "") > hhmm)) return "upcoming";
  return info ? "todo" : "checking";
}
const LLS_WEEK_LABEL = { done: "✅ Filled in", sending: "⏳ Sending", reported: "🛠 Reported", upcoming: "🔜 Coming up", todo: "⚠ To complete", cancelled: "🚫 Cancelled", checking: "…" };
async function llsRenderWeekPanel(boxId, mine) {
  const box = byId(boxId);
  if (!box) return;
  const monday = llsMonday_(llsWeekOffset);
  const lessons = llsWeekLessons_(monday, mine);
  const classIds = [...new Set(lessons.map((x) => x.cls.id))];
  const draw = (info) => {
    const rows = lessons.map((x) => ({ ...x, status: llsWeekStatus_(x, info) }));
    const count = (s) => rows.filter((r) => r.status === s).length;
    const sat = new Date(monday + "T12:00:00"); sat.setDate(sat.getDate() + 5);
    const range = `${new Date(monday + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${sat.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;
    const when = (iso) => new Date(iso + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric" });
    // Office: one line per teacher, then only the lessons that need doing (unless "Show all").
    const teachers = mine ? [] : [...new Set(rows.map((r) => r.teacher || "?"))].sort();
    const list = mine || llsWeekShowAll ? rows : rows.filter((r) => r.status === "todo" || r.status === "reported");
    box.hidden = false;
    box.innerHTML = `
      <div class="week-head">
        <p class="section-label" style="margin:0;">📋 ${mine ? "My week" : "This week's lessons"}</p>
        <span class="week-nav">
          <button type="button" class="row-action" data-week="-1" aria-label="Previous week">‹</button>
          <strong>${escapeHtml(range)}</strong>
          <button type="button" class="row-action" data-week="1" aria-label="Next week"${llsWeekOffset >= 0 ? " disabled" : ""}>›</button>
        </span>
      </div>
      <div class="week-chips">
        <span class="week-chip done">✅ ${count("done")} filled in</span>
        <span class="week-chip todo">⚠ ${count("todo")} to complete</span>
        ${count("reported") ? `<span class="week-chip">🛠 ${count("reported")} reported</span>` : ""}
        ${count("upcoming") ? `<span class="week-chip">🔜 ${count("upcoming")} coming up</span>` : ""}
        ${count("cancelled") ? `<span class="week-chip">🚫 ${count("cancelled")} cancelled</span>` : ""}
        ${!info ? `<span class="muted">checking with Google…</span>` : info.failed ? `<span class="muted">Google didn't answer: some lessons may show as "to complete" by mistake.</span>` : ""}
      </div>
      ${info && count("todo") ? `<p class="week-msg">${mine
        ? `⚠ You have ${count("todo")} lesson${count("todo") === 1 ? "" : "s"} to complete. Tap "✏️ Complete now" and it opens the lesson, ready to fill in.`
        : `⚠ ${count("todo")} lesson${count("todo") === 1 ? "" : "s"} still to complete. "✏️ Complete now" opens the lesson so you can fill it in or check it.`}</p>`
        : info && mine && count("done") ? `<p class="week-msg ok">✅ All your lessons so far are filled in. Thank you!</p>` : ""}
      ${teachers.length ? `<div class="week-teachers">${teachers.map((t) => {
        const mineRows = rows.filter((r) => (r.teacher || "?") === t);
        const todo = mineRows.filter((r) => r.status === "todo").length;
        return `<span class="week-teacher${todo ? " has-todo" : ""}"><strong>${escapeHtml(t)}</strong> ${mineRows.filter((r) => r.status === "done").length}/${mineRows.filter((r) => r.status !== "upcoming").length} done${todo ? ` · ⚠ ${todo}` : ""}</span>`;
      }).join("")}</div>` : ""}
      <div class="week-list">${list.length ? list.map((r) => `
        <div class="week-row ${r.status}"${r.status === "todo" ? ` data-week-open="${escapeAttribute(r.cls.id + "|" + r.date)}" role="button" tabindex="0" title="Open this lesson to fill it in"` : ""}>
          <span class="week-when">${escapeHtml(when(r.date))} ${escapeHtml(r.time)}</span>
          <span class="week-class">${escapeHtml(r.cls.name)}${mine ? "" : ` <span class="muted">· ${escapeHtml(r.teacher || "?")}</span>`}</span>
          <span class="week-status">${LLS_WEEK_LABEL[r.status]}</span>
          ${r.status === "todo" || r.status === "done" ? `<button type="button" class="row-action${r.status === "todo" ? " week-go" : ""}" data-week-open="${escapeAttribute(r.cls.id + "|" + r.date)}">${r.status === "todo" ? "✏️ Complete now" : "✏️ Edit"}</button>` : "<span></span>"}
        </div>`).join("") : `<p class="muted" style="margin:6px 0 0;">${rows.length ? "Nothing to complete. 🎉" : "No lessons in the timetable this week."}</p>`}</div>
      ${!mine && rows.length ? `<button type="button" class="row-action" data-week-all style="margin-top:8px;">${llsWeekShowAll ? "Show only what needs doing" : `Show all ${rows.length} lessons`}</button>` : ""}`;
    box.querySelectorAll("[data-week]").forEach((b) => b.addEventListener("click", () => { llsWeekOffset = Math.min(0, llsWeekOffset + Number(b.dataset.week)); llsRenderWeekPanel(boxId, mine); }));
    box.querySelector("[data-week-all]")?.addEventListener("click", () => { llsWeekShowAll = !llsWeekShowAll; draw(info); });
    box.querySelectorAll("[data-week-open]").forEach((b) => b.addEventListener("click", (e) => {
      e.stopPropagation();
      const [classId, date] = b.dataset.weekOpen.split("|");
      llsGoToLesson(classId, date);
    }));
    box.querySelectorAll(".week-row[data-week-open]").forEach((r) => r.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      const [classId, date] = r.dataset.weekOpen.split("|");
      llsGoToLesson(classId, date);
    }));
  };
  draw(null);
  if (!classIds.length) return;
  const info = await llsLoadWeek_(monday, classIds, false);
  if (llsMonday_(llsWeekOffset) === monday) draw(info);
}
// 3 Oct: open one lesson (class + date) ready to fill in or edit.
function llsGoToLesson(classId, date) {
  navigateTo("lesson");
  const dateInput = byId("lessonDate");
  if (dateInput) dateInput.value = date;
  llsLesson.loadedKey = "";
  llsRenderLessonPicker();
  llsOpenLesson(classId).then(() => {
    const cls = llsLessonClasses().find((c) => c.id === classId);
    const day = new Date(date + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
    const work = byId("lessonWork");
    if (work) { work.classList.remove("lesson-flash"); void work.offsetWidth; work.classList.add("lesson-flash"); }
    showToast(`✏️ ${cls ? cls.name : "Lesson"} · ${day}: fill it in and press Save lesson.`, "info");
  });
}
let llsWeekPanelTimer = null;
function llsScheduleWeekPanels_() {
  clearTimeout(llsWeekPanelTimer);
  llsWeekPanelTimer = setTimeout(() => {
    if (!llsHasAdminSession()) return;
    if (llsRole() === "teacher") llsRenderWeekPanel("myWeekPanel", true);
    else llsRenderWeekPanel("weekPanel", false);
  }, 1500);
}

// ---------- 3. Students in class with no payment details ----------
let llsNoFeeShowAll = false;
function llsStudentsWithoutFee_() {
  if (llsRole() !== "admin" || !window.llsFinanceReady) return [];
  const today = isoDate(new Date());
  const classById = new Map((state.classes || []).map((c) => [String(c.id), c]));
  const feeTotal = new Map();
  (llsLiveFinanceData.fees || []).forEach((f) => {
    const sid = String(f["Student ID"] || "").trim();
    feeTotal.set(sid, (feeTotal.get(sid) || 0) + number(f["Amount Due"]));
  });
  const bySid = new Map();
  (llsLivePortalData.enrolments || []).forEach((e) => {
    if (String(e["Status"] || "").trim().toLowerCase() !== "active") return;
    const start = String(e["Start Date"] || "").slice(0, 10);
    if (start && start > today) return;
    const cls = classById.get(String(e["Class ID"] || "").trim());
    if (!cls || /inactive|archived/i.test(cls.status || "") || /^demo/i.test(cls.name || "")) return;
    const sid = String(e["Student ID"] || "").trim();
    const st = getStudent(sid);
    if (!st || String(st.status || "Active") !== "Active") return;
    if (feeTotal.has(sid) && feeTotal.get(sid) > 0) return;
    const row = bySid.get(sid) || { sid, name: getStudentName(st) || sid, classes: [], zero: feeTotal.has(sid) };
    row.classes.push(cls.name);
    bySid.set(sid, row);
  });
  return [...bySid.values()].sort((a, b) => a.name.localeCompare(b.name));
}
function llsRenderNoFeePanel() {
  const box = byId("noFeePanel");
  if (!box) return;
  const list = llsStudentsWithoutFee_();
  box.hidden = !list.length;
  if (!list.length) { box.innerHTML = ""; return; }
  const shown = llsNoFeeShowAll ? list : list.slice(0, 8);
  box.innerHTML = `
    <p class="section-label" style="margin-top:0;">💶 In class, but no payment details (${list.length})</p>
    <p class="muted" style="margin:4px 0 10px;">These students are coming to lessons, but no course fee has been recorded for them yet.</p>
    <details class="nofee-how"><summary>How to fix it</summary>
      <ol>
        <li>Press "+ Record payment" next to the student (or: Fees &amp; payments → "+ Record payment").</li>
        <li>Fill in the total fee agreed with the family and the payment plan (one payment, 3 instalments, monthly…).</li>
        <li>If they paid something today, put it in "Amount paid". If not, put 0: the fee is recorded and the portal reminds you when each instalment is due.</li>
        <li>Press "Save payment". The student disappears from this list.</li>
      </ol>
      <p class="muted">"Fee is €0" means a fee exists but has no amount: press "Edit plan" on Fees &amp; payments and put the real amount.</p>
    </details>
    <div class="nofee-list">${shown.map((r) => `
      <div class="nofee-row">
        <span><strong>${escapeHtml(r.name)}</strong> <span class="muted">· ${escapeHtml(r.classes.join(", "))}${r.zero ? " · fee is €0" : ""}</span></span>
        <button type="button" class="row-action" data-nofee="${escapeAttribute(r.sid)}">${r.zero ? "Fees & payments" : "+ Record payment"}</button>
      </div>`).join("")}</div>
    ${list.length > 8 ? `<button type="button" class="row-action" data-nofee-all style="margin-top:8px;">${llsNoFeeShowAll ? "Show fewer" : `Show all ${list.length}`}</button>` : ""}`;
  box.querySelector("[data-nofee-all]")?.addEventListener("click", () => { llsNoFeeShowAll = !llsNoFeeShowAll; llsRenderNoFeePanel(); });
  box.querySelectorAll("[data-nofee]").forEach((b) => b.addEventListener("click", () => {
    const row = list.find((r) => r.sid === b.dataset.nofee);
    if (row && row.zero) { navigateTo("fees"); return; }
    openNewPayment();
    setValue("paymentStudent", b.dataset.nofee);
    if (!value("paymentDescription")) setValue("paymentDescription", "Course 2026/27");
    setValue("paymentPaid", "0");
  }));
}

/* =========================================================
   2 Oct (afternoon) — CANCELLED LESSONS AND MAKE-UPS
   A cancelled lesson is a Lesson Log row whose Unit is "CANCELLED"
   (saved with the normal saveLessonLog, so it works on every Apps
   Script version). A cancelled lesson:
   - isn't a lesson to fill in (no TUT TUT, "🚫 Cancelled" in the week);
   - doesn't count against anyone's attendance or progress (no register);
   - is owed to the class: a lesson logged on a day the class is NOT in
     the timetable (or the school is closed) counts as a make-up.
   If a cancelled lesson did take place after all, the teacher fills it
   in as usual: saving replaces the cancellation.
========================================================= */
const LLS_CANCEL_UNIT = "CANCELLED";
const LLS_CANCEL_KEY = "lls_cancelled";
function llsIsCancelUnit(u) { return String(u || "").trim().toUpperCase() === LLS_CANCEL_UNIT; }
let llsCancelled = (() => { try { return JSON.parse(localStorage.getItem(LLS_CANCEL_KEY) || "{}") || {}; } catch (_) { return {}; } })();
function llsCancelStore_() { try { localStorage.setItem(LLS_CANCEL_KEY, JSON.stringify(llsCancelled)); } catch (_) {} }
function llsIsCancelled(classId, date) { return Boolean(llsCancelled[classId + "|" + String(date || "").slice(0, 10)]); }
let llsCancelRenderTimer = null;
function llsAfterCancelChange_() {
  clearTimeout(llsCancelRenderTimer);
  llsCancelRenderTimer = setTimeout(() => {
    try { if (byId("lessonPicker")) llsRenderLessonPicker(); } catch (_) {}
    try { llsRenderCancelBanner(); } catch (_) {}
    try { llsRenderCancelPanel(); } catch (_) {}
    try { if (llsRole() === "admin" && byId("todayClassesList")) renderTodayClasses(); } catch (_) {}
    try { llsScheduleWeekPanels_(); } catch (_) {}
  }, 300);
}
// Entries from getLessonLog (or a lesson just saved) say exactly which of those dates are cancelled.
function llsNoteCancelFromEntries_(classId, entries) {
  let changed = false;
  (entries || []).forEach((e) => {
    const k = classId + "|" + String(e.lessonDate || "").slice(0, 10);
    if (llsIsCancelUnit(e.unit)) {
      if (!llsCancelled[k] || llsCancelled[k].pending) { llsCancelled[k] = { note: e.notes || (llsCancelled[k] || {}).note || "" }; changed = true; }
    } else if (llsCancelled[k] && !llsCancelled[k].pending) { delete llsCancelled[k]; changed = true; }
  });
  if (changed) { llsCancelStore_(); llsAfterCancelChange_(); }
}
// Apps Script V30: getLessonDates also says which dates are cancelled ({classId: [{date, note}]}).
function llsNoteCancelMap_(map, classIds, since) {
  if (!map) return;
  let changed = false;
  classIds.forEach((id) => {
    const list = map[id] || [];
    const want = new Set(list.map((x) => x.date));
    Object.keys(llsCancelled).forEach((k) => {
      const [c, d] = k.split("|");
      if (c !== id || d < since || want.has(d)) return;
      if (llsCancelled[k].pending && Date.now() - (llsCancelled[k].at || 0) < 10 * 60 * 1000) return; // still on its way
      delete llsCancelled[k]; changed = true;
    });
    list.forEach((x) => {
      const k = id + "|" + x.date;
      if (!llsCancelled[k] || llsCancelled[k].pending) { llsCancelled[k] = { note: x.note || "" }; changed = true; }
    });
  });
  if (changed) { llsCancelStore_(); llsAfterCancelChange_(); }
}

function llsCancelBody_(classId, date, reason) {
  const why = String(reason || "").trim();
  return {
    action: "saveLessonLog", classId, lessonDate: date, unit: LLS_CANCEL_UNIT,
    whatWeDid: `Lesson cancelled${why ? " (" + why + ")" : ""}. It will be made up at the end of the course.`,
    homeworkSet: "", notes: why || "Lesson cancelled"
  };
}
function llsCancelLessons_(items, reason) {
  if (!items.length) return;
  items.forEach((x) => { llsCancelled[x.cls.id + "|" + x.date] = { note: reason || "", pending: true, at: Date.now() }; });
  llsCancelStore_();
  llsQueueSave(items.length === 1 ? `${items[0].cls.name} cancelled` : `${items.length} lessons cancelled`, items.map((x) => llsCancelBody_(x.cls.id, x.date, reason)));
  Object.keys(llsWeekCache).forEach((k) => delete llsWeekCache[k]);
  llsAfterCancelChange_();
}
function llsUndoCancel_(classId, date) {
  delete llsCancelled[classId + "|" + date];
  llsCancelStore_();
  const cls = llsLessonClasses().find((c) => c.id === classId);
  llsQueueSave(`${cls ? cls.name : classId} reinstated`, {
    action: "saveLessonLog", classId, lessonDate: date, unit: "", whatWeDid: "", homeworkSet: "",
    notes: "Cancellation undone by the office: the lesson goes ahead."
  });
  Object.keys(llsWeekCache).forEach((k) => delete llsWeekCache[k]);
  llsAfterCancelChange_();
}

function llsLessonEnd_(time, minutes) {
  const [h, m] = String(time || "00:00").split(":").map(Number);
  const t = (h || 0) * 60 + (m || 0) + (Number(minutes) || 60);
  return String(Math.floor(t / 60)).padStart(2, "0") + ":" + String(t % 60).padStart(2, "0");
}
function llsDayLabel_(iso, long) {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-GB", long ? { weekday: "long", day: "numeric", month: "long" } : { weekday: "short", day: "numeric", month: "short" });
}
const LLS_IT_DAYS = ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"];
const LLS_IT_MONTHS = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
function llsItDay_(iso) {
  const d = new Date(iso + "T12:00:00");
  return `${LLS_IT_DAYS[d.getDay()]} ${d.getDate()} ${LLS_IT_MONTHS[d.getMonth()]}`;
}

// ---------- Lesson page: banner on a cancelled lesson ----------
function llsRenderCancelBanner() {
  const box = byId("lessonCancelBanner");
  if (!box) return;
  const date = byId("lessonDate")?.value || isoDate(new Date());
  const c = llsLesson.classId && llsCancelled[llsLesson.classId + "|" + date];
  box.hidden = !c;
  if (!c) { box.innerHTML = ""; return; }
  const admin = llsRole() === "admin";
  box.innerHTML = `
    <p style="margin:0;font-weight:800;">🚫 This lesson is cancelled${c.note ? ` <span class="muted" style="font-weight:600;">· ${escapeHtml(c.note)}</span>` : ""}</p>
    <p class="muted" style="margin:4px 0 0;">It doesn't count for attendance or progress, and it will be made up at the end of the course. If it took place after all, fill it in as usual: saving replaces the cancellation.</p>
    ${admin ? `<button type="button" class="row-action" data-cancel-undo style="margin-top:8px;">Undo cancellation</button>` : ""}`;
  box.querySelector("[data-cancel-undo]")?.addEventListener("click", () => {
    llsUndoCancel_(llsLesson.classId, date);
    showToast("Cancellation undone: the lesson goes ahead.", "success");
  });
}

// ---------- Office: "Cancel lessons" window ----------
function llsCancelTeachers_() {
  const set = new Set();
  llsLessonClasses().forEach((cls) => {
    [cls.day, cls.day2].filter(Boolean).forEach((d) => {
      const t = llsTeacherOnDay(cls, d);
      if (t && !/^demo/i.test(t)) set.add(t.trim());
    });
  });
  return [...set].sort();
}
function llsCancelMatches_(teacher, classId, rows) {
  const out = [];
  rows.forEach((r) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(r.date)) return;
    const dayName = new Date(r.date + "T12:00:00").toLocaleDateString("en-GB", { weekday: "long" });
    const closed = llsSchoolClosed_(r.date);
    llsLessonsOn(r.date, false).forEach(({ cls, time }) => {
      if (/^demo/i.test(cls.name || "")) return;
      if (classId && cls.id !== classId) return;
      const who = llsTeacherOnDay(cls, dayName);
      if (teacher) {
        const names = new Set([teacher.toLowerCase().split(/\s+/)[0]]);
        if (names.has("cole")) names.add("colin");
        if (names.has("colin")) names.add("cole");
        if (!llsIsMine(who, names)) return;
      }
      const end = llsLessonEnd_(time, cls.duration);
      const from = r.from || "00:00";
      const to = r.to || "23:59";
      if (!(time < to && end > from)) return; // no overlap
      // Starts while the teacher is away = it can't go ahead (ticked). Started
      // before = the teacher would leave half-way (not ticked: the office decides).
      const full = time >= from && time < to;
      const runsOver = full && end > to;
      out.push({ cls, time, end, date: r.date, teacher: who, full, runsOver, closed, already: llsIsCancelled(cls.id, r.date) });
    });
  });
  const seen = new Set();
  return out.filter((x) => { const k = x.cls.id + "|" + x.date; if (seen.has(k)) return false; seen.add(k); return true; })
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
}
function llsFamilyMessage_(items) {
  const byClass = {};
  items.forEach((x) => { (byClass[x.cls.id] = byClass[x.cls.id] || { cls: x.cls, list: [] }).list.push(x); });
  return Object.values(byClass).map(({ cls, list }) => {
    const when = list.map((x) => `• ${llsItDay_(x.date)} alle ${x.time}`).join("\n");
    const one = list.length === 1;
    return {
      cls,
      text: `Gentili famiglie e studenti,\nvi informiamo che ${one ? "la lezione" : "le lezioni"} di inglese del corso ${cls.name} ${one ? "è annullata" : "sono annullate"}:\n${when}\n\n${one ? "La lezione sarà recuperata" : "Le lezioni saranno recuperate"} alla fine del corso, quindi non perderete nessuna ora. Ci scusiamo per il disagio.\n\nGrazie,\nLondon Language School`
    };
  });
}
let llsCancelForm = null;
function llsOpenCancelModal(prefill) {
  let modal = byId("cancelLessonsModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.className = "modal-backdrop";
    modal.id = "cancelLessonsModal";
    document.body.appendChild(modal);
  }
  llsCancelForm = Object.assign({ teacher: "", classId: "", rows: [{ date: "", from: "", to: "" }], reason: (() => { try { return localStorage.getItem("lls_lang") === "it" ? "Insegnante non disponibile" : "Teacher not available"; } catch (_) { return "Teacher not available"; } })(), unticked: {}, ticked: {}, done: null }, prefill || {});
  llsDrawCancelModal();
  openModal("cancelLessonsModal");
}
function llsDrawCancelModal() {
  const modal = byId("cancelLessonsModal");
  const f = llsCancelForm;
  if (!modal || !f) return;
  if (f.done) {
    const msgs = llsFamilyMessage_(f.done);
    modal.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="cancelTitle">
        <h2 id="cancelTitle" style="margin:0 0 6px;">✓ ${f.done.length} lesson${f.done.length === 1 ? "" : "s"} cancelled</h2>
        <p class="muted" style="margin:0 0 12px;">They're off the teacher's list, they don't count for attendance or progress, and each class is owed a make-up lesson at the end of the course. Now tell the families: copy the message for each class and send it on WhatsApp.</p>
        ${msgs.map((m, i) => `<div class="cancel-msg">
          <p style="margin:0 0 6px;font-weight:800;">${escapeHtml(m.cls.name)}</p>
          <textarea readonly rows="8" data-no-translate>${escapeHtml(m.text)}</textarea>
          <button type="button" class="button button-secondary" data-cancel-copy="${i}">📋 Copy message</button>
        </div>`).join("")}
        <div class="modal-actions" style="margin-top:12px;"><button type="button" class="button button-primary" data-cancel-close>Done</button></div>
      </div>`;
    modal.querySelectorAll("[data-cancel-copy]").forEach((b) => b.addEventListener("click", async () => {
      const text = msgs[Number(b.dataset.cancelCopy)].text;
      try { await navigator.clipboard.writeText(text); } catch (_) { const t = b.previousElementSibling; t.select(); document.execCommand("copy"); }
      b.textContent = "✓ Copied";
    }));
    modal.querySelector("[data-cancel-close]").addEventListener("click", () => closeModal("cancelLessonsModal"));
    return;
  }
  const matches = llsCancelMatches_(f.teacher, f.classId, f.rows);
  const isTicked = (x) => {
    const k = x.cls.id + "|" + x.date;
    if (x.already || x.closed) return false;
    if (f.unticked[k]) return false;
    return x.full || Boolean(f.ticked[k]);
  };
  const chosen = matches.filter(isTicked);
  const classes = llsLessonClasses().filter((c) => !/^demo/i.test(c.name || "")).sort((a, b) => a.name.localeCompare(b.name));
  modal.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="cancelTitle">
      <h2 id="cancelTitle" style="margin:0 0 4px;">🚫 Cancel lessons</h2>
      <p class="muted" style="margin:0 0 12px;">For a teacher who isn't available, or a class that can't take place. Cancelled lessons are made up at the end of the course.</p>
      <div class="cancel-grid">
        <label>Teacher<select data-cf="teacher"><option value="">Any teacher</option>${llsCancelTeachers_().map((t) => `<option value="${escapeAttribute(t)}"${t === f.teacher ? " selected" : ""}>${escapeHtml(t)}</option>`).join("")}</select></label>
        <label>Class<select data-cf="classId"><option value="">All their classes</option>${classes.map((c) => `<option value="${escapeAttribute(c.id)}"${c.id === f.classId ? " selected" : ""}>${escapeHtml(c.name)}</option>`).join("")}</select></label>
      </div>
      <p class="section-label" style="margin:12px 0 6px;">Dates and times</p>
      <div class="cancel-rows">${f.rows.map((r, i) => `<div class="cancel-row">
        <label>Date<input type="date" data-cr="${i}" data-k="date" value="${escapeAttribute(r.date)}"></label>
        <label>From<input type="time" data-cr="${i}" data-k="from" value="${escapeAttribute(r.from)}"></label>
        <label>To<input type="time" data-cr="${i}" data-k="to" value="${escapeAttribute(r.to)}"></label>
        ${f.rows.length > 1 ? `<button type="button" class="row-action" data-cr-del="${i}" aria-label="Remove this date">✕</button>` : "<span></span>"}
      </div>`).join("")}</div>
      <button type="button" class="row-action" data-cr-add style="margin-top:6px;">+ Add another date</button>
      <p class="muted" style="margin:4px 0 0;font-size:13px;">No times = the whole day.</p>
      <label style="display:block;margin-top:12px;">Reason <span class="muted">(staff only; families get the message below)</span><input type="text" data-cf="reason" maxlength="120" value="${escapeAttribute(f.reason)}"></label>
      <p class="section-label" style="margin:14px 0 6px;">Lessons that will be cancelled</p>
      <div class="cancel-list">${matches.length ? matches.map((x) => {
        const k = x.cls.id + "|" + x.date;
        const note = x.already ? "already cancelled" : x.closed ? "school closed that day" : !x.full ? `⚠ starts before these times (${x.time}–${x.end}): tick it if it can't go ahead` : x.runsOver ? `ends after these times (${x.time}–${x.end}): untick it if it can start late instead` : "";
        return `<label class="cancel-item${x.full ? "" : " partly"}">
          <input type="checkbox" data-ck="${escapeAttribute(k)}"${isTicked(x) ? " checked" : ""}${x.already || x.closed ? " disabled" : ""}>
          <span><strong>${escapeHtml(llsDayLabel_(x.date))} ${escapeHtml(x.time)}</strong> ${escapeHtml(x.cls.name)} <span class="muted">· ${escapeHtml(x.teacher || "?")}</span>${note ? `<br><span class="muted" style="font-size:13px;">${escapeHtml(note)}</span>` : ""}</span>
        </label>`;
      }).join("") : `<p class="muted" style="margin:0;">${f.rows.some((r) => r.date) ? "No lessons in the timetable at these times." : "Choose a date."}</p>`}</div>
      <div class="modal-actions" style="margin-top:14px;">
        <button type="button" class="button button-secondary" data-cancel-close>Close</button>
        <button type="button" class="button button-primary" data-cancel-go${chosen.length ? "" : " disabled"}>Cancel ${chosen.length} lesson${chosen.length === 1 ? "" : "s"}</button>
      </div>
    </div>`;
  modal.querySelectorAll("[data-cf]").forEach((el) => el.addEventListener("change", () => { f[el.dataset.cf] = el.value; if (el.dataset.cf !== "reason") llsDrawCancelModal(); }));
  modal.querySelector('[data-cf="reason"]').addEventListener("input", (e) => { f.reason = e.target.value; });
  modal.querySelectorAll("[data-cr]").forEach((el) => el.addEventListener("change", () => { f.rows[Number(el.dataset.cr)][el.dataset.k] = el.value; llsDrawCancelModal(); }));
  modal.querySelectorAll("[data-cr-del]").forEach((b) => b.addEventListener("click", () => { f.rows.splice(Number(b.dataset.crDel), 1); llsDrawCancelModal(); }));
  modal.querySelector("[data-cr-add]").addEventListener("click", () => { const last = f.rows[f.rows.length - 1] || {}; f.rows.push({ date: "", from: last.from || "", to: last.to || "" }); llsDrawCancelModal(); });
  modal.querySelectorAll("[data-ck]").forEach((el) => el.addEventListener("change", () => {
    const k = el.dataset.ck;
    if (el.checked) { delete f.unticked[k]; f.ticked[k] = true; } else { f.unticked[k] = true; delete f.ticked[k]; }
    llsDrawCancelModal();
  }));
  modal.querySelector("[data-cancel-close]").addEventListener("click", () => closeModal("cancelLessonsModal"));
  modal.querySelector("[data-cancel-go]").addEventListener("click", () => {
    if (!chosen.length) return;
    llsCancelLessons_(chosen, f.reason);
    f.done = chosen;
    llsDrawCancelModal();
    showToast(`✓ ${chosen.length} lesson${chosen.length === 1 ? "" : "s"} cancelled. Sending to Google in the background.`, "success");
  });
}

// ---------- Office Dashboard: cancelled lessons and lessons owed ----------
let llsOwedInfo = null; // { dates: {classId: [iso]}, at }
let llsOwedLoading = false;
async function llsLoadOwed_(force) {
  if (llsOwedLoading || (llsOwedInfo && !force && Date.now() - llsOwedInfo.at < 5 * 60 * 1000)) return;
  for (let i = 0; i < 20 && window.llsServerVersion === undefined; i++) await new Promise((r) => setTimeout(r, 500));
  if ((window.llsServerVersion || 0) < 29) return;
  llsOwedLoading = true;
  try {
    const ids = llsLessonClasses().filter((c) => !/^demo/i.test(c.name || "")).map((c) => c.id);
    const res = await llsApiGet("getLessonDates", { classIds: ids.join(","), since: LLS_SCHOOL_START }, { background: true });
    llsOwedInfo = { dates: res.dates || {}, at: Date.now(), v30: Boolean(res.cancelled) };
    llsNoteCancelMap_(res.cancelled, ids, LLS_SCHOOL_START);
  } catch (_) { /* try again next time */ }
  llsOwedLoading = false;
  llsRenderCancelPanel();
}
function llsOwedByClass_() {
  const today = isoDate(new Date());
  const out = {};
  Object.keys(llsCancelled).forEach((k) => {
    const [classId, date] = k.split("|");
    const cls = llsLessonClasses().find((c) => c.id === classId);
    if (!cls) return;
    const o = out[classId] || (out[classId] = { cls, cancelled: [], makeups: [] });
    o.cancelled.push({ date, note: llsCancelled[k].note || "", upcoming: date >= today });
  });
  Object.entries((llsOwedInfo && llsOwedInfo.dates) || {}).forEach(([classId, dates]) => {
    const o = out[classId];
    if (!o) return;
    [...new Set(dates)].forEach((d) => {
      if (llsIsCancelled(classId, d)) return;
      const scheduled = !llsSchoolClosed_(d) && llsLessonsOn(d, false).some((x) => x.cls.id === classId);
      if (!scheduled) o.makeups.push(d);
    });
  });
  Object.values(out).forEach((o) => { o.cancelled.sort((a, b) => a.date.localeCompare(b.date)); o.makeups.sort(); o.owed = Math.max(0, o.cancelled.length - o.makeups.length); });
  return Object.values(out).sort((a, b) => b.owed - a.owed || a.cls.name.localeCompare(b.cls.name));
}
function llsRenderCancelPanel() {
  const box = byId("cancelPanel");
  if (!box) return;
  if (llsRole() !== "admin") { box.hidden = true; return; }
  box.hidden = false;
  const list = llsOwedByClass_();
  const today = isoDate(new Date());
  const upcoming = [];
  list.forEach((o) => o.cancelled.filter((c) => c.upcoming).forEach((c) => upcoming.push({ ...c, cls: o.cls })));
  upcoming.sort((a, b) => a.date.localeCompare(b.date));
  const owedTotal = list.reduce((s, o) => s + o.owed, 0);
  box.innerHTML = `
    <div class="week-head">
      <p class="section-label" style="margin:0;">🚫 Cancelled lessons and make-ups</p>
      <button type="button" class="button button-secondary" data-cancel-open style="min-height:38px;padding:6px 14px;">🚫 Cancel lessons</button>
    </div>
    ${list.length ? `
      ${upcoming.length ? `<p class="muted" style="margin:10px 0 4px;font-weight:700;">Coming up, cancelled</p>
      <div class="week-list">${upcoming.map((c) => `<div class="week-row cancelled">
        <span class="week-when">${escapeHtml(llsDayLabel_(c.date))}</span>
        <span class="week-class">${escapeHtml(c.cls.name)}${c.note ? ` <span class="muted">· ${escapeHtml(c.note)}</span>` : ""}</span>
        <span class="week-status">🚫 Cancelled</span>
        <button type="button" class="row-action" data-cancel-undo="${escapeAttribute(c.cls.id + "|" + c.date)}">Undo</button>
      </div>`).join("")}</div>` : ""}
      <p class="muted" style="margin:12px 0 4px;font-weight:700;">Lessons owed (to add at the end of the course): ${owedTotal}</p>
      <div class="week-teachers">${list.map((o) => `<span class="week-teacher${o.owed ? " has-todo" : ""}" title="${escapeAttribute("Cancelled: " + o.cancelled.map((c) => c.date).join(", ") + (o.makeups.length ? " · Made up: " + o.makeups.join(", ") : ""))}"><strong>${escapeHtml(o.cls.name)}</strong> ${o.owed} owed${o.makeups.length ? ` · ${o.makeups.length} made up` : ""}</span>`).join("")}</div>
      <p class="muted" style="margin:8px 0 0;font-size:13px;">A make-up is any lesson a teacher fills in on a day the class isn't in the timetable.${(window.llsServerVersion || 0) >= 29 ? "" : "<br>Make-ups are counted once Apps Script V29 or later is installed."}</p>`
    : `<p class="muted" style="margin:8px 0 0;">No cancelled lessons. If a teacher can't come, press "🚫 Cancel lessons": their lessons come off the list and each class is owed a make-up.</p>`}`;
  box.querySelector("[data-cancel-open]").addEventListener("click", () => llsOpenCancelModal());
  box.querySelectorAll("[data-cancel-undo]").forEach((b) => b.addEventListener("click", () => {
    const [classId, date] = b.dataset.cancelUndo.split("|");
    llsUndoCancel_(classId, date);
    showToast("Cancellation undone: the lesson goes ahead.", "success");
  }));
  if (!llsOwedInfo) llsLoadOwed_();
}

/* =========================================================
   3 Oct — WORKBOOK PAGES AS HOMEWORK
   The Workbook's page numbers don't match the Student's Book, so the
   teacher ticks "Set Workbook pages as homework", picks the lesson (6B…)
   and ticks the pages; each page has a short description of what's on it.
   Title and instructions are filled in for them (workbook.js).
========================================================= */
const LLS_WB_KIND_ICON = { Grammar: "📘", Vocabulary: "🔤", Pronunciation: "🗣️", Reading: "📖", Listening: "🎧", Writing: "✍️" };
const llsWbState = {}; // hostId -> { on, lesson, pages:Set, auto:{title,text}, touchedLesson }
function llsWbBook_(cls) { return cls && cls.book && window.LLS_WORKBOOK && LLS_WORKBOOK[cls.book]; }
function llsWbDefaultLesson_(wb, cls, hint) {
  const codes = Object.keys(wb.lessons);
  const m = String(hint || "").trim().match(/^(\d{1,2})([A-C])/i);
  if (m && wb.lessons[m[1] + m[2].toUpperCase()]) return m[1] + m[2].toUpperCase();
  const unit = m ? m[1] : String(Number(cls.currentUnit) || "");
  return codes.find((c) => c.startsWith(unit) && /^\d+[A-C]$/.test(c) && parseInt(c, 10) === Number(unit)) || codes[0];
}
function llsRenderWbPicker(hostId, cls, titleId, textId, hint) {
  const host = byId(hostId);
  if (!host) return;
  const wb = llsWbBook_(cls);
  if (!wb) { host.innerHTML = ""; host.hidden = true; return; }
  host.hidden = false;
  const key = hostId + "|" + cls.id;
  let st = llsWbState[hostId];
  if (!st || st.key !== key) st = llsWbState[hostId] = { key, on: false, lesson: "", pages: new Set(), auto: { title: "", text: "" }, touchedLesson: false };
  if (!st.touchedLesson || !wb.lessons[st.lesson]) st.lesson = llsWbDefaultLesson_(wb, cls, hint);
  const lesson = wb.lessons[st.lesson];
  host.innerHTML = `
    <label class="wb-toggle"><input type="checkbox" data-wb-on${st.on ? " checked" : ""}> 📗 Set Workbook pages as homework?</label>
    ${st.on ? `<div class="wb-panel">
      <label class="wb-lesson">Lesson in the Student's Book
        <select data-wb-lesson>${Object.entries(wb.lessons).map(([c, l]) => `<option value="${escapeAttribute(c)}"${c === st.lesson ? " selected" : ""}>${escapeHtml(c)} · ${escapeHtml(l.title)}</option>`).join("")}</select>
      </label>
      <p class="muted wb-note">Students' books have the Workbook at the back with different page numbers, so homework names the lesson and exercises, not pages.</p>
      <div class="wb-pages">${lesson.pages.map((pg) => `
        <label class="wb-page${st.pages.has(pg.p) ? " on" : ""}">
          <input type="checkbox" data-wb-page="${pg.p}"${st.pages.has(pg.p) ? " checked" : ""}>
          <span class="wb-p">Workbook ${escapeHtml(st.lesson)} · part ${lesson.pages.indexOf(pg) + 1}</span>
          <span class="wb-items">${pg.items.map(([k, what, audio]) => `<span class="wb-item"><b>${LLS_WB_KIND_ICON[k] || "•"} ${escapeHtml(k)}:</b> ${escapeHtml(what)}${audio ? ' <span class="wb-audio" title="Needs the Workbook audio">🎧 audio</span>' : ""}</span>`).join("")}</span>
        </label>`).join("")}</div>
    </div>` : ""}`;
  const fill = () => {
    const chosen = lesson.pages.filter((pg) => st.pages.has(pg.p));
    const curTitle = value(titleId).trim();
    const curText = value(textId).trim();
    if (!chosen.length) {
      if (curTitle === st.auto.title) setValue(titleId, "");
      if (curText === st.auto.text) setValue(textId, "");
      st.auto = { title: "", text: "" };
      return;
    }
    // 4 Oct: no page numbers — the students' combined book numbers the Workbook differently.
    const exOf = (what) => (String(what).match(/\(([^)]+)\)\s*$/) || [])[1] || "";
    const exs = chosen.flatMap((pg) => pg.items.map(([, what]) => exOf(what))).filter(Boolean);
    const title = `Workbook ${st.lesson} ${lesson.title}${exs.length ? ": ex. " + exs.join(", ") : ""}`;
    const text = `Workbook section, lesson ${st.lesson} (${lesson.title}):\n` + chosen.map((pg) => pg.items.map(([k, what]) => `• ${k} – ${what}`).join("\n")).join("\n") +
      (chosen.some((pg) => pg.items.some((i) => i[2])) ? "\n🎧 Pronunciation exercises use the Workbook audio." : "");
    if (!curTitle || curTitle === st.auto.title) setValue(titleId, title);
    if (!curText || curText === st.auto.text) setValue(textId, text);
    st.auto = { title, text };
  };
  host.querySelector("[data-wb-on]").addEventListener("change", (e) => { st.on = e.target.checked; if (!st.on) { st.pages.clear(); fill(); } llsRenderWbPicker(hostId, cls, titleId, textId, hint); });
  host.querySelector("[data-wb-lesson]")?.addEventListener("change", (e) => { st.lesson = e.target.value; st.touchedLesson = true; st.pages.clear(); fill(); llsRenderWbPicker(hostId, cls, titleId, textId, hint); });
  host.querySelectorAll("[data-wb-page]").forEach((c) => c.addEventListener("change", () => {
    const p = Number(c.dataset.wbPage);
    if (c.checked) st.pages.add(p); else st.pages.delete(p);
    fill();
    c.closest(".wb-page").classList.toggle("on", c.checked);
  }));
}
function llsLessonWb_() {
  const cls = llsLessonClasses().find((c) => c.id === llsLesson.classId);
  if (cls) llsRenderWbPicker("lessonWbBox", cls, "lessonHwTitle", "lessonHwText", value("lessonUnitPage"));
}
function llsHomeworkPageWb_() {
  const classId = value("homeworkClassSelect");
  const cls = (state.classes || []).find((c) => String(c.id) === String(classId));
  if (cls) llsRenderWbPicker("homeworkWbBox", cls, "homeworkTitle", "homeworkDescription", "");
  else if (byId("homeworkWbBox")) byId("homeworkWbBox").innerHTML = "";
}
document.addEventListener("DOMContentLoaded", () => {
  byId("lessonUnitPage")?.addEventListener("input", () => { const st = llsWbState.lessonWbBox; if (st && !st.touchedLesson) llsLessonWb_(); });
  byId("homeworkClassSelect")?.addEventListener("change", llsHomeworkPageWb_);
});

/* =========================================================
   5 Oct — "Tell Rosanna" (Lesson page, teachers) and the office to-do.
   A teacher can say: I didn't teach this lesson (someone covered /
   cancelled / not my class), a new student is in the class, or a student
   has left. It goes to the office as a Lesson Issue (V29; student
   requests need V33). Rosanna sees everything on the Dashboard.
========================================================= */
function llsRenderTellOffice() {
  const box = byId("lessonTellOffice");
  if (!box) return;
  const v = window.llsServerVersion || 0;
  box.hidden = !(llsRole() === "teacher" && v >= 29 && llsLesson.classId);
  box.querySelectorAll('[data-tell="add"],[data-tell="remove"]').forEach((b) => { b.hidden = v < 33; });
  const form = byId("lessonTellForm");
  if (form) { form.hidden = true; form.innerHTML = ""; }
}
function llsTellForm_(kind) {
  const form = byId("lessonTellForm");
  const cls = llsLessonClasses().find((c) => c.id === llsLesson.classId);
  const date = byId("lessonDate")?.value || "";
  if (!form || !cls || !date) return;
  const session = llsGetTeacherSession();
  const when = new Date(date + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  let body = "";
  if (kind === "lesson") body = `
    <p style="margin:0 0 8px;"><strong>${escapeHtml(cls.name)} · ${escapeHtml(when)}</strong>: what happened?</p>
    <label><input type="radio" name="tellKind" value="Covered" checked> 👥 Another teacher taught it:</label>
    <select data-tell-cover>${llsTutTeacherOptions_(session)}</select>
    <label><input type="radio" name="tellKind" value="Cancelled"> 🚫 The lesson was cancelled</label>
    <label><input type="radio" name="tellKind" value="Not my class"> ❓ This isn't my class</label>`;
  else if (kind === "add") body = `
    <p style="margin:0 0 8px;"><strong>New student in ${escapeHtml(cls.name)}</strong>: Rosanna adds them to the class (and the fees).</p>
    <input type="text" data-tell-student maxlength="80" placeholder="Student's name and surname" required>`;
  else {
    const kids = llsStudentsForClass(cls.id).map((st) => ({ id: String(st["Student ID"] || ""), name: [st["First Name"], st["Last Name"] || st["Surname"]].filter(Boolean).join(" ") || String(st["Student ID"] || "") })).sort((a, b) => a.name.localeCompare(b.name));
    body = `
    <p style="margin:0 0 8px;"><strong>A student has left ${escapeHtml(cls.name)}</strong>: Rosanna takes them off the class.</p>
    <select data-tell-pick><option value="">Choose the student…</option>${kids.map((k) => `<option value="${escapeAttribute(k.id)}">${escapeHtml(k.name)}</option>`).join("")}</select>`;
  }
  form.innerHTML = body + `
    <input type="text" data-tell-note maxlength="300" placeholder="${kind === "lesson" ? "Anything Rosanna should know? (optional)" : kind === "add" ? "Level, start date, parent's phone… (optional)" : "Since when? Why? (optional)"}">
    <div style="display:flex;gap:8px;flex-wrap:wrap;"><button type="button" class="button button-primary" data-tell-send>Send to Rosanna</button><button type="button" class="button button-secondary" data-tell-cancel>Cancel</button></div>`;
  form.hidden = false;
  form.querySelector("[data-tell-cancel]").addEventListener("click", () => { form.hidden = true; form.innerHTML = ""; });
  form.querySelector("[data-tell-send]").addEventListener("click", () => {
    const note = form.querySelector("[data-tell-note]").value.trim();
    const base = { action: "reportLessonIssue", classId: cls.id, lessonDate: date, lessonTime: String(cls.time || "").slice(0, 10), note };
    let msg = "";
    if (kind === "lesson") {
      const k = form.querySelector('input[name="tellKind"]:checked')?.value || "Covered";
      const sel = form.querySelector("[data-tell-cover]");
      if (k === "Covered" && !sel.value) { showToast("Choose who taught the lesson.", "error"); sel.focus(); return; }
      const coveredBy = k === "Covered" ? (sel.value === "other" ? "Someone else" : sel.options[sel.selectedIndex].textContent.trim()) : "";
      llsQueueSave("lesson report", { ...base, kind: k, coveredBy, coveredById: k === "Covered" && sel.value !== "other" ? sel.value : "" });
      msg = k === "Covered" ? `Rosanna will change the teacher to ${coveredBy}${sel.value !== "other" ? `, and ${coveredBy} gets the reminder to fill in the notes` : ""}.` : k === "Cancelled" ? "Rosanna will record it as cancelled (a make-up is owed)." : "Rosanna will check the timetable.";
    } else if (kind === "add") {
      const name = form.querySelector("[data-tell-student]").value.trim();
      if (!name) { showToast("Write the student's name.", "error"); form.querySelector("[data-tell-student]").focus(); return; }
      llsQueueSave("student request", { ...base, kind: "Add student", studentName: name });
      msg = `Rosanna will add ${name} to ${cls.name}.`;
    } else {
      const sel = form.querySelector("[data-tell-pick]");
      if (!sel.value) { showToast("Choose the student.", "error"); sel.focus(); return; }
      const name = sel.options[sel.selectedIndex].textContent.trim();
      llsQueueSave("student request", { ...base, kind: "Remove student", studentName: name, studentId: sel.value });
      msg = `Rosanna will take ${name} off ${cls.name}.`;
    }
    form.innerHTML = `<p class="tell-sent">✓ Sent to Rosanna. ${escapeHtml(msg)}</p>`;
    setTimeout(() => { if (form.querySelector(".tell-sent")) { form.hidden = true; form.innerHTML = ""; } }, 8000);
  });
}
document.addEventListener("click", (e) => {
  const b = e.target && e.target.closest ? e.target.closest("#lessonTellOffice [data-tell]") : null;
  if (b) llsTellForm_(b.dataset.tell);
});

// Dashboard: payments that are late (from the fee plans), with one-tap actions.
let llsOverdueShowAll = false;
function llsRenderOverduePanel() {
  const box = byId("overduePanel");
  if (!box) return;
  const list = llsRole() === "admin" && window.llsFinanceReady
    ? (state.payments || []).filter((p) => p.overdue && paymentStatus(p) !== "Paid").sort((a, b) => String(a.nextDue).localeCompare(String(b.nextDue)))
    : [];
  box.hidden = !list.length;
  if (!list.length) { box.innerHTML = ""; return; }
  const shown = llsOverdueShowAll ? list : list.slice(0, 8);
  box.innerHTML = `
    <p class="section-label" style="margin-top:0;">⏰ Payments overdue (${list.length})</p>
    <p class="muted" style="margin:4px 0 10px;">An instalment date has passed and the money isn't recorded. If they have paid, press <strong>Record payment</strong>. If not, send a reminder.</p>
    <div class="nofee-list">${shown.map((p) => {
      const st = getStudent(p.studentId);
      return `<div class="nofee-row">
        <span><strong>${escapeHtml(getStudentName(st) || p.studentId)}</strong> <span class="muted">· ${escapeHtml(formatMoney(p.nextAmount))} due since ${escapeHtml(formatDate(p.nextDue))}${p.description ? " · " + escapeHtml(p.description) : ""}</span></span>
        <span style="display:flex;gap:6px;flex-wrap:wrap;"><button type="button" class="row-action" data-overdue-pay="${escapeAttribute(p.id)}">Record payment</button>${llsReminderLink(p, st)}</span>
      </div>`;
    }).join("")}</div>
    ${list.length > 8 ? `<button type="button" class="row-action" data-overdue-all style="margin-top:8px;">${llsOverdueShowAll ? "Show fewer" : `Show all ${list.length}`}</button>` : ""}`;
  box.querySelector("[data-overdue-all]")?.addEventListener("click", () => { llsOverdueShowAll = !llsOverdueShowAll; llsRenderOverduePanel(); });
  box.querySelectorAll("[data-overdue-pay]").forEach((b) => b.addEventListener("click", () => openAddPayment(b.dataset.overduePay)));
}
