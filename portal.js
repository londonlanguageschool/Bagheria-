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
    if (typeof renderHomeworkLoginState === "function") renderHomeworkLoginState();
  }

  if (page === "lesson" && typeof llsInitLessonPage === "function") llsInitLessonPage();

  if (page === "reports") {
    renderReports();
  }

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
            <strong>${escapeHtml(item.name)}</strong>
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
          startDate: value("studentJoined") || isoDate(new Date())
        });
      }
    }

    if (isConversion) {
      const enquiry = state.enquiries.find(
        (item) => item.id === pendingConversionEnquiryId
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
        await llsApiPost({
          action: "updateStudent",
          studentId: id,
          fields: { "Status": "Inactive" }
        });

        const activeEnrolments = (llsLivePortalData.enrolments || []).filter((item) =>
          String(item["Student ID"] || "").trim() === id &&
          String(item["Status"] || "").trim().toLowerCase() === "active"
        );

        for (const enrolment of activeEnrolments) {
          const enrolmentId = String(enrolment["Enrolment ID"] || "").trim();
          if (enrolmentId) {
            await llsApiPost({ action: "endEnrolment", enrolmentId });
            enrolment["Status"] = "Completed";
          }
        }

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
    return;
  }

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
        await llsApiPost({
          action: "updateClass",
          classId: id,
          fields: { "Status": "Archived" }
        });

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
                class="row-action delete"
                type="button"
                data-delete-payment="${payment.id}"
              >
                Delete
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

  const button = byId("paymentForm")?.querySelector('button[type="submit"]');
  const oldLabel = button?.textContent || "Save payment";

  if (button) {
    button.disabled = true;
    button.textContent = "Saving…";
  }

  try {
    let feeId = value("paymentId");

    if (mode === "create") {
      const plan = value("paymentPlan") || "Full payment";
      if (plan === "Full payment" && !value("paymentDue1")) setValue("paymentDue1", paymentDate);
      const planFields = { "Payment Plan": plan, ...llsInstalmentFields(plan, courseFee, "payment") };

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
        await llsApiPost({
          action: "createPayment",
          fields: {
            "Fee ID": feeId,
            "Student ID": studentId,
            "Payment Date": paymentDate,
            "Amount": paidNow,
            "Payment Method": method,
            "Notes": notes
          }
        });

        llsLiveFinanceData.payments.push({
          "Fee ID": feeId,
          "Student ID": studentId,
          "Payment Date": paymentDate,
          "Amount": paidNow,
          "Payment Method": method,
          "Notes": notes
        });
      }
    } else {
      if (!feeId) {
        throw new Error("No fee was selected for this payment.");
      }

      await llsApiPost({
        action: "createPayment",
        fields: {
          "Fee ID": feeId,
          "Student ID": studentId,
          "Payment Date": paymentDate,
          "Amount": paidNow,
          "Payment Method": method,
          "Notes": notes
        }
      });

      llsLiveFinanceData.payments.push({
        "Fee ID": feeId,
        "Student ID": studentId,
        "Payment Date": paymentDate,
        "Amount": paidNow,
        "Payment Method": method,
        "Notes": notes
      });
    }

    // Show the result straight away...
    llsRebuildPaymentsState();
    saveState();
    renderAll();
    closeModal("paymentModal");

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
  }
}

function deletePayment(id) {
  showToast(
    "Deleting fees or payments isn't available in the portal yet — correct or remove the row directly in the Fees/Payments tabs of the Google Sheet.",
    "error"
  );
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
    });
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

  try {
    await llsApiPost(
      id
        ? { action: "updateEnquiry", enquiryId: id, fields }
        : { action: "createEnquiry", fields }
    );

    await llsLoadEnquiriesFromSheets();
    closeModal("enquiryModal");

    showToast(
      id ? "Enquiry updated in Google Sheets." : "Enquiry added to Google Sheets.",
      "success"
    );
  } catch (error) {
    console.error("LLS enquiry save failed:", error);
    if (error.uncertain) {
      closeModal("enquiryModal");
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
  }
}

function deleteEnquiry(id) {
  const enquiry = state.enquiries.find((item) => item.id === id);

  if (!enquiry) return;

  openConfirm(
    "Delete enquiry?",
    `Delete the enquiry for ${enquiry.name}?`,
    async () => {
      try {
        await llsApiPost({
          action: "deleteEnquiry",
          enquiryId: id
        });

        await llsLoadEnquiriesFromSheets();
        showToast("Enquiry deleted from Google Sheets.", "success");
      } catch (error) {
        console.error("LLS enquiry delete failed:", error);
        showToast(
          error.uncertain ? error.message : `Could not delete the enquiry: ${error.message || "please try again"}.`,
          "error"
        );
      }
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

  if (button) {
    button.disabled = true;
    button.textContent = "Saving…";
  }

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

  setTimeout(() => {
    toast.remove();
  }, 3500);
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
  await Promise.all(llsIsTeacher()
    ? [llsLoadCoreFromSheets(true), llsLoadTeachersFromSheets()]
    : [
        llsLoadCoreFromSheets(true),
        llsLoadEnquiriesFromSheets(),
        llsLoadFinanceFromSheets(true),
        llsLoadTeachersFromSheets()
      ]);
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

      const feePayments = payments.filter(
        (item) => String(item["Fee ID"] || "").trim() === feeId
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
   when a browser fires many requests at once. Send at most 2 at a time. */
let llsActiveRequests = 0;
const llsRequestWaiters = [];
async function llsFetch_(url, options) {
  if (llsActiveRequests >= 2) await new Promise((resolve) => llsRequestWaiters.push(resolve));
  llsActiveRequests++;
  try {
    return await fetch(url, options);
  } finally {
    llsActiveRequests--;
    const next = llsRequestWaiters.shift();
    if (next) next();
  }
}

// Changes that are safe to send twice (logins, "set to this value" edits,
// registers and notes that replace the same row). Anything that ADDS a row
// is only retried with Apps Script V25, which recognises the receipt.
const LLS_SAFE_TO_RESEND = new Set([
  "adminLogin", "teacherPortalLogin", "teacherLogin", "studentCodeLogin",
  "saveAttendance", "saveLessonLog", "updateClass", "updateStudent", "updateEnquiry",
  "updateFee", "updateTeacher", "updateHomework", "markHomeworkStatus", "setSpeakingCoach"
]);
const LLS_LOGIN_ACTIONS = new Set(["adminLogin", "teacherPortalLogin", "teacherLogin"]);

async function llsApiGet(action, params = {}) {
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
      const response = await llsFetch_(url.toString(), { method: "GET", cache: "no-store", redirect: "follow" });
      if (!response.ok) { problem = `HTTP ${response.status}`; continue; }
      const raw = await response.text();
      try { data = JSON.parse(raw); } catch (_) { problem = "Apps Script did not return JSON."; continue; }
      break;
    } catch (_) {
      problem = "no connection";
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
    });
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
    });
  }
  } catch (_) {
    throw transportError("no connection");
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

async function renderLiveAttendance() {
  const body = document.getElementById("attendanceTableBody");
  if (!body) return;

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
      llsLiveAttendance = Array.isArray(data.attendance) ? data.attendance : [];
      llsAttendanceLoadedKey = key;
    }

    const byStudent = new Map(llsLiveAttendance.map(item => [String(item["Student ID"] || "").trim(), item]));

    body.innerHTML = students.length ? students.map(student => {
      const studentId = String(student["Student ID"] || "").trim();
      const existing = byStudent.get(studentId) || {};
      const status = String(existing["Status"] || "Present");
      return `
        <tr data-live-attendance-row="${escapeHtml(studentId)}">
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
    if (typeof llsLoadLessonLog === "function") llsLoadLessonLog();
  } catch (error) {
    console.error(error);
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

  const rows = [...document.querySelectorAll("[data-live-attendance-row]")].map(row => {
    const studentId = row.dataset.liveAttendanceRow;
    return {
      studentId,
      status: row.querySelector(".live-attendance-status")?.value || "Present",
      notes: row.querySelector(".live-attendance-note")?.value || ""
    };
  });

  if (!rows.length) {
    showToast("There are no students in this class.", "error");
    return;
  }

  const button = document.getElementById("saveAttendanceButton");
  if (button) { button.disabled = true; button.textContent = "Saving…"; }

  try {
    await llsApiPost({ action: "saveAttendance", classId, lessonDate, rows });
    llsAttendanceLoadedKey = "";
    showToast("Attendance saved to Google Sheets.", "success");
    await renderLiveAttendance();
  } catch (error) {
    console.error(error);
    showToast(error.message || "Attendance could not be saved.", "error");
  } finally {
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

  if (llsHasAdminSession()) {
    loadLiveAttendanceFoundation(true).then(renderLiveAttendance).catch(console.error);
  }
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
let llsHomeworkCache = { classId: "", homework: [], status: [] };

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
}

async function renderHomeworkList() {
  const body = byId("homeworkListBody");
  if (!body) return;

  const classId = value("homeworkClassSelect");

  if (!classId) {
    body.innerHTML = tableEmptyRow(4, "Choose a class.");
    return;
  }

  try {
    const data = await llsApiGet("getHomeworkForClass", { classId });
    llsHomeworkCache = { classId, homework: data.homework || [], status: data.status || [] };

    const totalStudents = llsStudentsForClass(classId).length;

    if (!llsHomeworkCache.homework.length) {
      body.innerHTML = tableEmptyRow(4, "No homework assigned yet for this class.");
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

        return `
          <tr>
            <td><strong>${escapeHtml(String(item["Title"] || ""))}</strong></td>
            <td>${item["Due Date"] ? escapeHtml(formatDate(llsDateOnly(item["Due Date"]))) : "—"}</td>
            <td>${done} / ${totalStudents}</td>
            <td class="table-actions-cell">
              <button class="row-action" type="button" data-view-homework="${escapeAttribute(homeworkId)}">
                View / Mark
              </button>
            </td>
          </tr>
        `;
      })
      .join("");

    body.querySelectorAll("[data-view-homework]").forEach(button => {
      button.addEventListener("click", () => openHomeworkStatusModal(button.dataset.viewHomework));
    });
  } catch (error) {
    console.error(error);
    body.innerHTML = tableEmptyRow(4, "Could not load homework: " + error.message);
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

        return `
          <div class="homework-status-row">
            <span>${escapeHtml(llsStudentName(student))}</span>
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
        `;
      }).join("")
    : `<div class="empty-state">No active students are enrolled in this class.</div>`;

  list.querySelectorAll("[data-mark-homework]").forEach(button => {
    button.addEventListener("click", async () => {
      button.disabled = true;
      try {
        await llsApiPost({
          action: "markHomeworkStatus",
          homeworkId: button.dataset.markHomework,
          studentId: button.dataset.markStudent,
          status: button.dataset.markNext
        });
        await renderHomeworkList();
        openHomeworkStatusModal(homeworkId);
      } catch (error) {
        showToast(error.message || "Could not save that.", "error");
        button.disabled = false;
      }
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

  const button = byId("homeworkAssignButton");
  if (button) { button.disabled = true; button.textContent = "Assigning…"; }

  try {
    await llsApiPost({
      action: "createHomework",
      classId,
      teacherId: session.teacherId,
      title,
      description,
      assignedDate: isoDate(new Date()),
      dueDate
    });

    setValue("homeworkTitle", "");
    setValue("homeworkDescription", "");
    setValue("homeworkDueDate", "");
    showToast("Homework assigned.", "success");
    renderHomeworkList();
  } catch (error) {
    showToast(error.message || "Could not assign homework.", "error");
  } finally {
    if (button) { button.disabled = false; button.textContent = "+ Assign homework"; }
  }
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

function llsAdminGateShow() {
  const gate = byId("adminLoginGate");
  if (gate) gate.style.display = "flex";
}

function llsAdminGateHide() {
  const gate = byId("adminLoginGate");
  if (gate) gate.style.display = "none";
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
  openModal("homeworkLinkModal");

  try {
    const result = await llsApiPost({ action: "createStudentLink", studentId, reset });
    const link = llsHomeworkPageUrl(result.key);
    setValue("homeworkLinkUrl", link);

    byId("homeworkLinkWhatsApp").href = llsAppWhatsAppHref(student, link, result.code);
    if (byId("homeworkLinkOpen")) byId("homeworkLinkOpen").href = link;
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
    await llsApiPost({ action: "setSpeakingCoach", studentId, until });
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
  button.disabled = true;
  button.textContent = "Saving…";
  try {
    await llsApiPost({ action: "updateFee", feeId, fields });
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

async function renderTeacherTests() {
  const body = byId("teacherTestsBody");
  if (!body) return;
  const classId = value("homeworkClassSelect");
  if (!classId) { body.innerHTML = tableEmptyRow(5, "Choose a class."); return; }
  body.innerHTML = tableEmptyRow(5, "Loading…");
  try {
    const data = await llsApiGet("getTeacherTestsForClass", { classId });
    llsTeacherTests = { classId, tests: data.tests || [], results: data.results || [] };
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
        ${[0, 1, 2, 3].map((i) => `<label style="display:flex;gap:8px;align-items:center;font-weight:500">
          <input type="radio" name="correct-${uid}" value="${i}" ${i === 0 ? "checked" : ""} aria-label="Correct answer">
          <input type="text" data-o="${i}" placeholder="Option ${String.fromCharCode(65 + i)}${i > 1 ? " (optional)" : ""}" style="flex:1">
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
  if (!value("homeworkClassSelect")) { showToast("Choose a class first.", "error"); return; }
  byId("testForm").reset();
  byId("testQuestions").innerHTML = "";
  const cls = state.classes.find((c) => c.id === value("homeworkClassSelect"));
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
  button.disabled = true;
  button.textContent = "Saving…";
  try {
    await llsApiPost({
      action: "createTeacherTest",
      classId: value("homeworkClassSelect"),
      teacherId: session?.teacherId || "",
      title,
      dueDate: value("testDue"),
      questions
    });
    closeModal("testModal");
    showToast("Test saved. Students can take it in their app now.", "success");
    renderTeacherTests();
  } catch (error) {
    showToast(/unknown mutation/i.test(error.message || "") ? "Update the Apps Script to V21 first." : (error.message || "Could not save the test."), "error");
  } finally {
    button.disabled = false;
    button.textContent = "Save and give to class";
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
  try {
    await llsApiPost({ action: "deleteTeacherTest", testId: llsOpenTestId });
    closeModal("testResultsModal");
    showToast("Test deleted.", "success");
    renderTeacherTests();
  } catch (error) {
    showToast(error.message || "Could not delete the test.", "error");
  }
}

// Hide "Create with AI" until the AI key is set up (ping says aiReady).
// 27 Sept: also remembers the Apps Script version (V25+ = safe retries).
async function llsCheckAiPanel() {
  const panel = byId("homeworkAiPanel");
  try {
    const ping = await llsApiGet("ping");
    const m = String(ping.version || "").match(/V(\d+)/);
    window.llsServerVersion = m ? Number(m[1]) : 0;
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
  byId("homeworkClassSelect")?.addEventListener("change", renderTeacherTests);
  llsCheckAiPanel();
});


/* =========================================================
   V22 — ROLES: teacher logins see only the teaching pages;
   the office (admin) sees everything and can open any view.
========================================================= */

const LLS_TEACHER_PAGES = ["dashboard", "lesson", "classes", "homework"]; // 27 Sept: register lives on ★ Lesson

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
        await llsApiPost({ action: "updateClass", classId, fields: { "Current Unit": n } });
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
  byId("lessonUnitPageField").hidden = Boolean(on);
  setValue("lessonSpecialTitle", on ? (title || "") : "");
  llsMarkSpecialChip();
}
function llsMarkSpecialChip() {
  const t = value("lessonSpecialTitle").trim().toLowerCase();
  document.querySelectorAll("#lessonSpecialChips [data-special]").forEach((b) => b.classList.toggle("active", b.dataset.special.toLowerCase() === t));
}

function llsLessonLogEntryHtml(entry) {
  const special = llsSpecialTitle(entry.unit);
  const rows = [
    [special ? "⭐ Special lesson" : "Unit", special || entry.unit],
    ["What we did", entry.whatWeDid],
    ["Homework", entry.homeworkSet],
    ["Notes", entry.notes]
  ].filter(([, v]) => String(v || "").trim());
  const date = entry.lessonDate ? new Date(entry.lessonDate + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) : "";
  return `
    <div class="lesson-log-entry">
      <div class="lesson-log-meta"><strong>${escapeHtml(date)}</strong> · ${escapeHtml(entry.teacherName || "—")}</div>
      <dl>${rows.map(([k, v]) => `<dt>${escapeHtml(k)}</dt><dd>${escapeHtml(v)}</dd>`).join("")}</dl>
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
    await llsApiPost(body);
    showToast("Lesson notes saved. Other teachers can see them now.", "success");
    await llsLoadLessonLog(true);
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
  const days = [cls.day, cls.day2].map((d) => String(d || "").toLowerCase()).filter(Boolean);
  if (!days.length) return "";
  const d = new Date(fromIso + "T12:00:00");
  for (let i = 1; i <= 7; i++) {
    d.setDate(d.getDate() + 1);
    if (days.includes(d.toLocaleDateString("en-GB", { weekday: "long" }).toLowerCase())) return isoDate(d);
  }
  return "";
}

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
  const chip = (cls, label) =>
    `<button type="button" class="lesson-chip${cls.id === llsLesson.classId ? " active" : ""}" data-lesson-class="${escapeHtml(cls.id)}">${label}</button>`;
  const dayLabel = new Date(date + "T12:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" });
  box.innerHTML = `
    <p class="section-label" style="margin:0 0 8px;">${onlyMine ? "My lessons" : "Lessons"} on ${escapeHtml(dayLabel)}</p>
    <div class="lesson-chips">${today.length ? today.map(({ cls, time }) => chip(cls, `<strong>${escapeHtml(time)}</strong> ${escapeHtml(cls.name)}`)).join("") : `<span class="muted">No lessons on this day.</span>`}</div>
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
  setValue("lessonUnitPage", cls.currentUnit || "");
  llsSetSpecial(false);
  setValue("lessonHwDue", llsNextLessonDate(cls, date));
  llsLesson.entries = [];
  llsLesson.noteTouched = false;
  llsLesson.homework = [];
  llsLesson.status = [];

  // 27 Sept: show the register straight away from the class list we already
  // have; saved marks and notes fill in when Google answers. A lesson saved on
  // this device but still being sent (outbox) wins over what Google has.
  const pending = llsOutboxFor(cls.id, date);
  try {
    if (!llsStudentsForClass(cls.id).length && !(llsLivePortalData.classes || []).length) {
      regBody.innerHTML = `<p class="muted">Loading…</p>`;
      await loadLiveAttendanceFoundation();
      if (llsLesson.loadedKey !== key) return;
    }
  } catch (_) { /* fall through: the register shows what we have */ }
  const students = llsStudentsForClass(cls.id);
  const fromPending = new Map(((pending && pending.rows) || []).map((r) => [r.studentId, { Status: r.status, Notes: r.notes }]));
  llsDrawRegister(regBody, students, fromPending);
  if (pending && pending.note) llsFillLessonNote(pending.note, cls);

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

  // Lesson notes: this date's entry + last lesson + whole history
  llsApiGet("getLessonLog", { classId: cls.id, limit: 1000 }).then((log) => {
    if (llsLesson.loadedKey !== key) return;
    llsLesson.entries = Array.isArray(log.entries) ? log.entries : [];
    const own = llsLesson.entries.find((e) => e.lessonDate === date);
    if (own && !pending && !llsLesson.noteTouched) llsFillLessonNote(own, cls);
    const last = llsLesson.entries.find((e) => e.lessonDate < date);
    const lastBox = byId("lessonLast");
    if (last) { lastBox.hidden = false; lastBox.innerHTML = `<h3>📝 Last lesson</h3>${llsLessonLogEntryHtml(last)}`; }
    llsRenderLessonLogList(byId("lessonHistory"), llsLesson.entries);
    byId("lessonHistoryCount").textContent = llsLesson.entries.length ? `(${llsLesson.entries.length})` : "";
  }).catch((e) => {
    if (llsLesson.loadedKey !== key) return;
    byId("lessonHistory").innerHTML = `<p class="muted">${escapeHtml(e.message || "")}</p>`;
  });

  // Homework already set for this class
  llsApiGet("getHomeworkForClass", { classId: cls.id }).then((hw) => {
    if (llsLesson.loadedKey !== key) return;
    llsLesson.homework = Array.isArray(hw.homework) ? hw.homework : [];
    llsLesson.status = Array.isArray(hw.status) ? hw.status : [];
    llsRenderLessonHomework(students.length);
  }).catch(() => {});
}

function llsFillLessonNote(entry, cls) {
  const sp = llsSpecialTitle(entry.unit);
  if (sp) { llsSetSpecial(true, sp); setValue("lessonUnitPage", cls.currentUnit || ""); }
  else setValue("lessonUnitPage", entry.unit || "");
  setValue("lessonDone", entry.whatWeDid || "");
  setValue("lessonNotes", entry.notes || "");
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
        <input class="reg-note" type="text" placeholder="Note (optional)" value="${escapeHtml(llsSplitRating(row["Notes"]).note)}">
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
    return `<div class="lesson-hw-item"><span>${escapeHtml(String(h["Title"] || ""))}<span class="muted">${escapeHtml(due)}</span></span><strong>${done}/${classSize} done</strong></div>`;
  }).join("") : "";
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
  const next = Math.max(1, Math.min(12, current + step));
  if (next === current) return;
  try {
    await llsApiPost({ action: "updateClass", classId: cls.id, fields: { "Current Unit": String(next) } });
    cls.currentUnit = String(next);
    saveState();
    byId("lessonUnitValue").textContent = next;
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

  // Required (owner, 27 Sept): a rating for every student who was there,
  // and "What we did" (filled automatically for a special lesson).
  const rowEls = [...document.querySelectorAll("#lessonRegister .reg-row")];
  const unrated = rowEls.filter((r) => ["Present", "Late"].includes(r.dataset.status) && !r.querySelector(".reg-rating")?.value);
  rowEls.forEach((r) => r.classList.toggle("needs", unrated.includes(r)));
  const doneText = value("lessonDone").trim() || (specialOn ? specialTitle + " lesson" : "");
  byId("lessonDone")?.classList.toggle("needs", !doneText);
  if (unrated.length || !doneText) {
    const missing = [];
    if (unrated.length) missing.push(`"How did they do?" for ${unrated.length} ${unrated.length === 1 ? "student" : "students"}`);
    if (!doneText) missing.push(`"What we did"`);
    showToast(`Almost done: fill in ${missing.join(" and ")}. They count towards each student's progress.`, "error");
    (unrated[0]?.querySelector(".reg-rating") || byId("lessonDone"))?.focus();
    return;
  }

  const rows = rowEls.map((r) => ({
    studentId: r.dataset.student,
    status: r.dataset.status || "Present",
    notes: llsJoinRating(r.querySelector(".reg-rating")?.value || "", r.querySelector(".reg-note")?.value.trim() || "")
  }));
  const hwTitle = value("lessonHwTitle").trim();
  const note = { unit: specialOn ? LLS_SPECIAL_PREFIX + specialTitle : value("lessonUnitPage").trim(), whatWeDid: doneText, notes: value("lessonNotes").trim() };
  const own = llsLesson.entries.find((e) => e.lessonDate === date);
  const homeworkSet = hwTitle || (own ? own.homeworkSet : "");
  const session = llsGetTeacherSession();
  const rid = () => (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : `r${Date.now()}${Math.random().toString(36).slice(2)}`;

  const steps = [];
  if (rows.length) steps.push({ what: "register", body: { action: "saveAttendance", classId: cls.id, lessonDate: date, rows, requestId: rid() } });
  if (hwTitle) steps.push({ what: "homework", body: { action: "createHomework", classId: cls.id, teacherId: session?.teacherId || "", title: hwTitle, description: value("lessonHwText").trim(), assignedDate: date, dueDate: value("lessonHwDue"), requestId: rid() } });
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
  llsRenderLessonLogList(byId("lessonHistory"), llsLesson.entries);
  if (hwTitle) {
    llsLesson.homework = [{ Title: hwTitle, "Due Date": value("lessonHwDue"), "Created At": new Date().toISOString() }, ...llsLesson.homework];
    llsRenderLessonHomework(rows.length);
    setValue("lessonHwTitle", ""); setValue("lessonHwText", "");
  }
  showToast(`✓ ${cls.name} saved on this device. It's being sent to Google in the background: you can go to your next class.`, "success");
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
    pill.addEventListener("click", () => { llsOutboxRun(true); });
    bar.prepend(pill);
  }
  let top = byId("topOutbox");
  const actions = document.querySelector(".topbar-actions");
  if (!top && actions) {
    top = document.createElement("button");
    top.type = "button";
    top.id = "topOutbox";
    top.className = "outbox-pill in-topbar";
    top.addEventListener("click", () => { llsOutboxRun(true); });
    actions.insertBefore(top, actions.firstChild);
  }
  const failed = box.filter((j) => j.error);
  const text = !box.length ? "" : failed.length
    ? `⚠ ${failed.length === 1 ? failed[0].className + " " + failed[0].date : failed.length + " lessons"} not sent: ${failed[0].error}. Tap to retry`
    : `⏳ Sending ${box.length === 1 ? box[0].className : box.length + " lessons"} to Google…`;
  [pill, top].forEach((el) => {
    if (!el) return;
    el.hidden = !box.length;
    el.textContent = text;
    el.classList.toggle("is-error", Boolean(failed.length));
  });
}

async function llsOutboxRun(manual) {
  clearTimeout(llsOutboxTimer);
  if (llsOutboxBusy) return;
  if (!sessionStorage.getItem(LLS_ADMIN_TOKEN_KEY)) return; // resumes after login
  llsOutboxBusy = true;
  try {
    let box = llsOutboxLoad();
    for (const job of box) {
      if (job.error && !manual) continue;
      job.sending = true; job.error = ""; llsOutboxSave(box);
      let problem = "";
      for (const step of job.steps) {
        if (step.done) continue;
        try {
          await llsApiPost(step.body);
          step.done = true;
          llsOutboxSave(box);
        } catch (e) {
          if (e && (e.transport || e.uncertain || /didn't answer|didn't confirm|no connection|HTTP/i.test(e.message || ""))) { problem = "retry"; }
          else problem = e?.message || "error";
          break;
        }
      }
      job.sending = false;
      job.tries = (job.tries || 0) + 1;
      if (!problem) {
        box = box.filter((j) => j !== job);
        llsOutboxSave(box);
        if (llsIsCurrentLesson(job)) llsAttendanceLoadedKey = "";
        showToast(`✓ ${job.className} (${job.date}) is safely in Google Sheets.`, "success");
      } else if (problem === "retry") {
        llsOutboxSave(box);
        break; // Google is slow or unreachable: try again later
      } else {
        job.error = problem === "UNAUTHORIZED" ? "please log in again" : problem;
        llsOutboxSave(box);
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

function llsIsCurrentLesson(job) {
  return job.classId === llsLesson.classId && job.date === (byId("lessonDate")?.value || "");
}

document.addEventListener("DOMContentLoaded", () => {
  llsOutboxPaint();
  setTimeout(() => llsOutboxRun(), 1500);
  window.addEventListener("online", () => llsOutboxRun());
  window.addEventListener("beforeunload", (e) => {
    if (llsOutboxLoad().some((j) => !j.error)) { e.preventDefault(); e.returnValue = ""; }
  });
});

function llsInitLessonPage() {
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
  ["lessonUnitPage", "lessonDone", "lessonNotes"].forEach((id) => byId(id)?.addEventListener("input", () => { llsLesson.noteTouched = true; byId("lessonDone")?.classList.remove("needs"); }));
  byId("lessonSpecialOn")?.addEventListener("change", (e) => { llsSetSpecial(e.target.checked, value("lessonSpecialTitle")); if (e.target.checked) byId("lessonSpecialTitle")?.focus(); });
  byId("lessonSpecialTitle")?.addEventListener("input", llsMarkSpecialChip);
  document.querySelectorAll("#lessonSpecialChips [data-special]").forEach((b) => b.addEventListener("click", () => { setValue("lessonSpecialTitle", b.dataset.special); llsMarkSpecialChip(); }));
  byId("lessonUnitMinus")?.addEventListener("click", () => llsChangeLessonUnit(-1));
  byId("lessonUnitPlus")?.addEventListener("click", () => llsChangeLessonUnit(1));
  byId("lessonResultsButton")?.addEventListener("click", () => llsOpenClassResults(llsLesson.classId));
  byId("lessonAllHere")?.addEventListener("click", () => {
    document.querySelectorAll("#lessonRegister .reg-row").forEach((r) => r.querySelector('.reg-btn[data-status="Present"]')?.click());
  });
});
