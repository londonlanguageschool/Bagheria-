"use strict";

/* =========================================================
   LONDON LANGUAGE SCHOOL PORTAL
   Browser-based production front end
========================================================= */

const STORAGE_KEY = "lls_portal_v1";

const LLS_API_URL =
  "https://script.google.com/macros/s/AKfycbyHbfFoaiMOT1rpY2DcbXAkuNwMoOHVdLlG2aQLgPgCe5gqPuyk8VYm7i4eGQRm8iqi/exec";

let class1LiveLoaded = false;
let class1LiveLessons = [];
let studentsLiveLoaded = false;
let studentsLiveRecords = [];

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
  "Trial booked",
  "Interested",
  "Enrolled",
  "Lost"
];

const PAGE_TITLES = {
  dashboard: "Dashboard",
  students: "Students",
  classes: "Classes",
  attendance: "Attendance",
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

  if (page === "classes") {
    loadClass1Live();
  }

  if (page === "students") {
    loadStudentsLive();
  }

  if (page === "attendance") {
    populateAttendanceClassSelect();
    renderAttendance();
  }

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

  byId("attendanceClassSelect").addEventListener(
    "change",
    renderAttendance
  );

  byId("attendanceDate").addEventListener(
    "change",
    renderAttendance
  );

  byId("saveAttendanceButton").addEventListener(
    "click",
    saveAttendance
  );
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
  renderAttendance();
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

  const classes = state.classes
    .filter((item) => item.day === todayName)
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
      const teacher = getTeacher(item.teacherId);

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

function renderStudentsLocalLegacy() {
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
                class="row-action delete"
                type="button"
                data-delete-student="${student.id}"
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
    .querySelectorAll("[data-edit-student]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        openEditStudent(button.dataset.editStudent);
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
  byId("studentForm").reset();
  setValue("studentId", "");
  setValue("studentJoined", isoDate(new Date()));
  setValue("studentStatus", "Active");

  populateStudentClassSelect();

  text("studentModalTitle", "Add student");
  openModal("studentModal");
}

function openEditStudent(id) {
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
}

function saveStudentForm(event) {
  event.preventDefault();

  const id = value("studentId");
  const firstName = value("studentFirstName").trim();
  const lastName = value("studentLastName").trim();

  if (!firstName || !lastName) {
    showToast(
      "First name and surname are required.",
      "error"
    );
    return;
  }

  const record = {
    id: id || makeId("student"),
    firstName,
    lastName,
    email: value("studentEmail").trim(),
    phone: value("studentPhone").trim(),
    dob: value("studentDob"),
    level: value("studentLevel"),
    classId: value("studentClass"),
    status: value("studentStatus"),
    joined: value("studentJoined"),
    parent: value("studentParent").trim(),
    notes: value("studentNotes").trim()
  };

  if (id) {
    state.students = state.students.map(
      (student) =>
        student.id === id
          ? record
          : student
    );
  } else {
    state.students.push(record);
  }

  saveState();
  closeModal("studentModal");
  renderAll();

  showToast(
    id ? "Student updated." : "Student added.",
    "success"
  );
}

function deleteStudent(id) {
  const student = state.students.find(
    (item) => item.id === id
  );

  if (!student) {
    return;
  }

  openConfirm(
    "Delete student?",
    `Delete ${student.firstName} ${student.lastName}? The student record will be removed from this browser.`,
    () => {
      state.students = state.students.filter(
        (item) => item.id !== id
      );

      saveState();
      renderAll();
      showToast("Student deleted.", "success");
    }
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
    .filter((item) => {
      const teacher = getTeacher(item.teacherId);

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
        (day === "all" || item.day === day)
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
      const teacher = getTeacher(item.teacherId);
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
              <strong>${escapeHtml(item.day)}</strong>
            </div>

            <div class="class-detail">
              <span>Time</span>
              <strong>${escapeHtml(formatTime(item.time))}</strong>
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
}

function openNewClass() {
  byId("classForm").reset();
  setValue("classId", "");
  setValue("classDuration", "90");
  setValue("classCapacity", "10");
  setValue("classDay", "Monday");

  populateTeacherSelect();

  text("classModalTitle", "Create class");
  openModal("classModal");
}

function openEditClass(id) {
  const item = getClass(id);

  if (!item) {
    return;
  }

  populateTeacherSelect();

  setValue("classId", item.id);
  setValue("className", item.name);
  setValue("classLevel", item.level);
  setValue("classTeacher", item.teacherId);
  setValue("classDay", item.day);
  setValue("classTime", item.time);
  setValue("classDuration", item.duration);
  setValue("classRoom", item.room);
  setValue("classCapacity", item.capacity);
  setValue("classNotes", item.notes);

  text("classModalTitle", "Edit class");
  openModal("classModal");
}

function saveClassForm(event) {
  event.preventDefault();

  const id = value("classId");

  const record = {
    id: id || makeId("class"),
    name: value("className").trim(),
    level: value("classLevel"),
    teacherId: value("classTeacher"),
    day: value("classDay"),
    time: value("classTime"),
    duration: number(value("classDuration")) || 90,
    room: value("classRoom").trim(),
    capacity: number(value("classCapacity")) || 10,
    notes: value("classNotes").trim()
  };

  if (!record.name || !record.level || !record.time) {
    showToast(
      "Class name, level and time are required.",
      "error"
    );
    return;
  }

  if (id) {
    state.classes = state.classes.map(
      (item) =>
        item.id === id
          ? record
          : item
    );
  } else {
    state.classes.push(record);
  }

  saveState();
  closeModal("classModal");
  renderAll();

  showToast(
    id ? "Class updated." : "Class created.",
    "success"
  );
}

function deleteClass(id) {
  const item = getClass(id);

  if (!item) {
    return;
  }

  const studentCount =
    getClassStudents(id).length;

  openConfirm(
    "Delete class?",
    studentCount
      ? `${item.name} currently has ${studentCount} student record${studentCount === 1 ? "" : "s"} assigned. Deleting the class will leave those students unassigned.`
      : `Delete ${item.name}?`,
    () => {
      state.classes = state.classes.filter(
        (record) => record.id !== id
      );

      state.students = state.students.map(
        (student) => ({
          ...student,
          classId:
            student.classId === id
              ? ""
              : student.classId
        })
      );

      saveState();
      renderAll();
      showToast("Class deleted.", "success");
    }
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
          status === filterStatus)
      );
    })
    .sort((a, b) =>
      String(b.date).localeCompare(String(a.date))
    );

  updateFinanceStats();

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
          </td>

          <td class="table-actions-cell">
            <div class="row-actions">
              <button
                class="row-action"
                type="button"
                data-edit-payment="${payment.id}"
              >
                Edit
              </button>

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
        openEditPayment(button.dataset.editPayment);
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

  byId("paymentForm").reset();

  setValue("paymentId", "");
  setValue("paymentDate", isoDate(new Date()));
  setValue("paymentMethod", "Cash");

  populatePaymentStudentSelect();

  text(
    "paymentModalTitle",
    "Record payment"
  );

  openModal("paymentModal");
}

function openEditPayment(id) {
  const payment = state.payments.find(
    (item) => item.id === id
  );

  if (!payment) {
    return;
  }

  populatePaymentStudentSelect();

  setValue("paymentId", payment.id);
  setValue("paymentStudent", payment.studentId);
  setValue("paymentDescription", payment.description);
  setValue("paymentFee", payment.fee);
  setValue("paymentPaid", payment.paid);
  setValue("paymentDate", payment.date);
  setValue("paymentMethod", payment.method);
  setValue("paymentNotes", payment.notes);

  text(
    "paymentModalTitle",
    "Edit payment"
  );

  openModal("paymentModal");
}

function savePaymentForm(event) {
  event.preventDefault();

  const id = value("paymentId");
  const fee = number(value("paymentFee"));
  const paid = number(value("paymentPaid"));

  if (!value("paymentStudent")) {
    showToast(
      "Select a student.",
      "error"
    );
    return;
  }

  if (fee < 0 || paid < 0) {
    showToast(
      "Payment amounts cannot be negative.",
      "error"
    );
    return;
  }

  const record = {
    id: id || makeId("payment"),
    studentId: value("paymentStudent"),
    description:
      value("paymentDescription").trim(),
    fee,
    paid,
    date: value("paymentDate"),
    method: value("paymentMethod"),
    notes: value("paymentNotes").trim()
  };

  if (id) {
    state.payments = state.payments.map(
      (payment) =>
        payment.id === id
          ? record
          : payment
    );
  } else {
    state.payments.push(record);
  }

  saveState();
  closeModal("paymentModal");
  renderAll();

  showToast(
    id
      ? "Payment updated."
      : "Payment recorded.",
    "success"
  );
}

function deletePayment(id) {
  const payment = state.payments.find(
    (item) => item.id === id
  );

  if (!payment) {
    return;
  }

  openConfirm(
    "Delete payment record?",
    "This payment record will be permanently removed from the portal data stored in this browser.",
    () => {
      state.payments = state.payments.filter(
        (item) => item.id !== id
      );

      saveState();
      renderAll();
      showToast(
        "Payment deleted.",
        "success"
      );
    }
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
  setValue("enquiryNotes", enquiry.notes);

  text(
    "enquiryModalTitle",
    "Edit enquiry"
  );

  openModal("enquiryModal");
}

function saveEnquiryForm(event) {
  event.preventDefault();

  const id = value("enquiryId");

  const record = {
    id: id || makeId("enquiry"),
    name: value("enquiryName").trim(),
    age: value("enquiryStudentAge"),
    phone: value("enquiryPhone").trim(),
    email: value("enquiryEmail").trim(),
    course: value("enquiryCourse").trim(),
    source: value("enquirySource"),
    status: value("enquiryStatus"),
    followup: value("enquiryFollowup"),
    created:
      value("enquiryCreated") ||
      isoDate(new Date()),
    notes: value("enquiryNotes").trim()
  };

  if (!record.name || !record.course) {
    showToast(
      "Name and course interest are required.",
      "error"
    );
    return;
  }

  if (id) {
    state.enquiries = state.enquiries.map(
      (enquiry) =>
        enquiry.id === id
          ? record
          : enquiry
    );
  } else {
    state.enquiries.push(record);
  }

  saveState();
  closeModal("enquiryModal");
  renderAll();

  showToast(
    id
      ? "Enquiry updated."
      : "Enquiry added.",
    "success"
  );
}

function deleteEnquiry(id) {
  const enquiry = state.enquiries.find(
    (item) => item.id === id
  );

  if (!enquiry) {
    return;
  }

  openConfirm(
    "Delete enquiry?",
    `Delete the enquiry for ${enquiry.name}?`,
    () => {
      state.enquiries =
        state.enquiries.filter(
          (item) => item.id !== id
        );

      saveState();
      renderAll();

      showToast(
        "Enquiry deleted.",
        "success"
      );
    }
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

  text(
    "teacherModalTitle",
    "Edit teacher"
  );

  openModal("teacherModal");
}

function saveTeacherForm(event) {
  event.preventDefault();

  const id = value("teacherId");

  const record = {
    id: id || makeId("teacher"),
    name: value("teacherName").trim(),
    email: value("teacherEmail").trim(),
    phone: value("teacherPhone").trim(),
    role: value("teacherRole").trim(),
    status: value("teacherStatus"),
    notes: value("teacherNotes").trim()
  };

  if (!record.name) {
    showToast(
      "Teacher name is required.",
      "error"
    );
    return;
  }

  if (id) {
    state.teachers = state.teachers.map(
      (teacher) =>
        teacher.id === id
          ? record
          : teacher
    );
  } else {
    state.teachers.push(record);
  }

  saveState();
  closeModal("teacherModal");
  renderAll();

  showToast(
    id
      ? "Teacher updated."
      : "Teacher added.",
    "success"
  );
}

function deleteTeacher(id) {
  const teacher =
    getTeacher(id);

  if (!teacher) {
    return;
  }

  const assignedClasses =
    state.classes.filter(
      (item) =>
        item.teacherId === id
    ).length;

  openConfirm(
    "Delete teacher?",
    assignedClasses
      ? `${teacher.name} is assigned to ${assignedClasses} class${assignedClasses === 1 ? "" : "es"}. Those classes will remain but will no longer have a teacher assigned.`
      : `Delete ${teacher.name}?`,
    () => {
      state.teachers =
        state.teachers.filter(
          (item) => item.id !== id
        );

      state.classes =
        state.classes.map((item) => ({
          ...item,
          teacherId:
            item.teacherId === id
              ? ""
              : item.teacherId
        }));

      saveState();
      renderAll();

      showToast(
        "Teacher deleted.",
        "success"
      );
    }
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
        paymentStatus(payment) !== "Paid"
    )
    .forEach((payment) => {
      const student =
        getStudent(payment.studentId);

      notifications.push({
        icon: "€",
        title: "Outstanding balance",
        message:
          `${getStudentName(student) || "Student"} · ${formatMoney(Math.max(0, number(payment.fee) - number(payment.paid)))} due`
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
  populateAttendanceClassSelect();
}

function populateStudentClassSelect() {
  const select = byId("studentClass");

  if (!select) {
    return;
  }

  const current = select.value;

  select.innerHTML =
    `<option value="">Not assigned</option>` +
    state.classes
      .sort((a, b) =>
        a.name.localeCompare(b.name)
      )
      .map((item) => `
        <option value="${escapeAttribute(item.id)}">
          ${escapeHtml(item.name)} — ${escapeHtml(item.level)}
        </option>
      `)
      .join("");

  if (
    current &&
    state.classes.some(
      (item) => item.id === current
    )
  ) {
    select.value = current;
  }
}

function populateTeacherSelect() {
  const select = byId("classTeacher");

  if (!select) {
    return;
  }

  const current = select.value;

  select.innerHTML =
    `<option value="">Not assigned</option>` +
    state.teachers
      .filter(
        (teacher) =>
          teacher.status === "Active"
      )
      .sort((a, b) =>
        a.name.localeCompare(b.name)
      )
      .map((teacher) => `
        <option value="${escapeAttribute(teacher.id)}">
          ${escapeHtml(teacher.name)}
        </option>
      `)
      .join("");

  if (
    current &&
    state.teachers.some(
      (teacher) =>
        teacher.id === current
    )
  ) {
    select.value = current;
  }
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

function exportAttendanceCsv() {
  const classId =
    value("attendanceClassSelect");

  const date =
    value("attendanceDate");

  const classRecord =
    getClass(classId);

  if (!classRecord || !date) {
    showToast(
      "Choose an attendance class and date first.",
      "error"
    );
    return;
  }

  const key =
    attendanceKey(classId, date);

  const saved =
    state.attendance[key] ||
    attendanceDraft;

  const students =
    getClassStudents(classId);

  const rows = [
    [
      "Class",
      "Date",
      "Student",
      "Level",
      "Status"
    ],
    ...students.map((student) => [
      classRecord.name,
      date,
      `${student.firstName} ${student.lastName}`,
      student.level,
      saved[student.id] || ""
    ])
  ];

  downloadCsv(
    `lls-attendance-${slug(classRecord.name)}-${date}.csv`,
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

/* =========================================================
   CLASS 1 NEW — LIVE GOOGLE SHEETS CONNECTION
   Uses the deployed Apps Script web app.
========================================================= */

async function loadClass1Live(force = false) {
  const panel = byId("class1LivePanel");

  if (!panel) {
    return;
  }

  if (class1LiveLoaded && !force) {
    return;
  }

  panel.innerHTML = `
    <div class="live-sheet-status">
      <div>
        <p class="section-label">Google Sheets</p>
        <h3>Class 1 NEW</h3>
      </div>
      <span class="live-status live-status-loading">Connecting…</span>
    </div>
    <p class="muted">Reading the test register from the school Google Sheet.</p>
  `;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(
      `${LLS_API_URL}?action=getClassRegister&class=${encodeURIComponent("Class 1 NEW")}&t=${Date.now()}`,
      {
        method: "GET",
        cache: "no-store",
        redirect: "follow",
        signal: controller.signal
      }
    );

    const raw = await response.text();

    let data;

    try {
      data = JSON.parse(raw);
    } catch (parseError) {
      throw new Error(
        "The Apps Script did not return JSON. Check the web-app deployment permissions."
      );
    }

    if (!data || data.success !== true) {
      throw new Error(
        data?.error || "Google Sheets returned an unsuccessful response."
      );
    }

    const lessons = Array.isArray(data.lessons)
      ? data.lessons
      : [];

    const filledLessons = lessons.filter((lesson) => {
      const usefulKeys = [
        "Month",
        "Lesson",
        "Date",
        "Teacher",
        "Record of work / pages covered",
        "Homework set"
      ];

      return usefulKeys.some((key) =>
        String(lesson?.[key] ?? "").trim()
      );
    });

    class1LiveLoaded = true;
    class1LiveLessons = filledLessons;

    panel.innerHTML = `
      <div class="live-sheet-status">
        <div>
          <p class="section-label">Google Sheets</p>
          <h3>Class 1 NEW</h3>
        </div>

        <div class="live-sheet-actions">
          <span class="live-status live-status-connected">● Connected</span>
          <button
            class="button button-secondary button-small"
            id="refreshClass1Live"
            type="button"
          >
            Refresh
          </button>
        </div>
      </div>

      <p class="muted">
        Live data from the test register. ${filledLessons.length} lesson row${filledLessons.length === 1 ? "" : "s"} contain register data.
      </p>

      ${renderClass1LessonPreview(filledLessons)}
    `;

    byId("refreshClass1Live")?.addEventListener(
      "click",
      () => loadClass1Live(true)
    );

    panel
      .querySelectorAll("[data-edit-live-lesson]")
      .forEach((button) => {
        button.addEventListener("click", () => {
          openClass1LessonEditor(
            Number(button.dataset.editLiveLesson)
          );
        });
      });

    console.log("Class 1 NEW live data loaded:", data);

  } catch (error) {
    class1LiveLoaded = false;

    const message =
      error?.name === "AbortError"
        ? "The connection timed out after 15 seconds."
        : error?.message || "Unknown connection error.";

    panel.innerHTML = `
      <div class="live-sheet-status">
        <div>
          <p class="section-label">Google Sheets</p>
          <h3>Class 1 NEW</h3>
        </div>
        <span class="live-status live-status-error">Connection error</span>
      </div>

      <p class="muted">${escapeHtml(message)}</p>

      <button
        class="button button-secondary button-small"
        id="retryClass1Live"
        type="button"
      >
        Retry connection
      </button>
    `;

    byId("retryClass1Live")?.addEventListener(
      "click",
      () => loadClass1Live(true)
    );

    console.error("Class 1 connection error:", error);

  } finally {
    clearTimeout(timeout);
  }
}

function renderClass1LessonPreview(lessons) {
  if (!lessons.length) {
    return emptyState(
      "The connection works, but no lesson rows currently contain data."
    );
  }

  const rows = lessons
    .slice(0, 12)
    .map((lesson) => `
      <tr>
        <td>${escapeHtml(lesson["Month"] || "—")}</td>
        <td>${escapeHtml(lesson["Lesson"] || "—")}</td>
        <td>${escapeHtml(lesson["Date"] || "—")}</td>
        <td>${escapeHtml(lesson["Teacher"] || "—")}</td>
        <td>${escapeHtml(lesson["Record of work / pages covered"] || "—")}</td>
        <td>${escapeHtml(lesson["Homework set"] || "—")}</td>
        <td class="table-actions-cell">
          <button
            class="row-action"
            type="button"
            data-edit-live-lesson="${Number(lesson.rowNumber)}"
          >
            Edit
          </button>
        </td>
      </tr>
    `)
    .join("");

  return `
    <div class="table-wrap live-register-table">
      <table>
        <thead>
          <tr>
            <th>Month</th>
            <th>Lesson</th>
            <th>Date</th>
            <th>Teacher</th>
            <th>Record of work</th>
            <th>Homework</th>
            <th class="table-actions-cell">Admin</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>

    ${lessons.length > 12
      ? `<p class="muted live-preview-note">Showing the first 12 populated lesson rows.</p>`
      : ""}
  `;
}

function getClass1StudentFields(lesson) {
  const groups = new Map();
  const pattern = /^Student\s+(\d+)\s+(Attendance|Homework|Feedback|Advice)$/i;

  Object.keys(lesson || {}).forEach((header) => {
    const match = header.match(pattern);

    if (!match) {
      return;
    }

    const number = Number(match[1]);
    const field = match[2];

    if (!groups.has(number)) {
      groups.set(number, {});
    }

    groups.get(number)[field] = {
      header,
      value: lesson[header] || ""
    };
  });

  return [...groups.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([number, fields]) => ({
      number,
      fields
    }));
}

function renderClass1StudentEditorFields(lesson) {
  const students = getClass1StudentFields(lesson);

  if (!students.length) {
    return `
      <p class="muted">
        No Student Attendance / Homework / Feedback / Advice columns were found in this register row.
      </p>
    `;
  }

  return students
    .map((student, index) => {
      const fieldOrder = ["Attendance", "Homework", "Feedback", "Advice"];

      const fieldsHtml = fieldOrder
        .map((fieldName) => {
          const field = student.fields[fieldName];

          if (!field) {
            return "";
          }

          const inputId = `liveStudent${student.number}${fieldName}`;

          if (fieldName === "Feedback" || fieldName === "Advice") {
            return `
              <div class="form-field">
                <label for="${inputId}">${escapeHtml(fieldName)}</label>
                <textarea
                  id="${inputId}"
                  rows="3"
                  data-live-sheet-header="${escapeHtml(field.header)}"
                >${escapeHtml(field.value)}</textarea>
              </div>
            `;
          }

          return `
            <div class="form-field">
              <label for="${inputId}">${escapeHtml(fieldName)}</label>
              <input
                id="${inputId}"
                type="text"
                value="${escapeHtml(field.value)}"
                data-live-sheet-header="${escapeHtml(field.header)}"
              >
            </div>
          `;
        })
        .join("");

      return `
        <details class="live-student-editor" ${index === 0 ? "open" : ""}>
          <summary>
            <span>Student ${student.number}</span>
            <span class="muted">Attendance · Homework · Feedback · Advice</span>
          </summary>
          <div class="live-student-editor-grid">
            ${fieldsHtml}
          </div>
        </details>
      `;
    })
    .join("");
}

function openClass1LessonEditor(rowNumber) {
  const lesson = class1LiveLessons.find(
    (item) => Number(item.rowNumber) === Number(rowNumber)
  );

  if (!lesson) {
    showToast("Could not find that lesson row.", "error");
    return;
  }

  let modal = byId("class1LessonEditor");

  if (!modal) {
    modal = document.createElement("div");
    modal.id = "class1LessonEditor";
    modal.className = "live-editor-backdrop";
    modal.innerHTML = `
      <div class="live-editor-card" role="dialog" aria-modal="true" aria-labelledby="liveEditorTitle">
        <div class="live-editor-header">
          <div>
            <p class="section-label">Administrator</p>
            <h3 id="liveEditorTitle">Edit Class 1 lesson</h3>
          </div>
          <button class="icon-button" id="closeLiveLessonEditor" type="button" aria-label="Close">×</button>
        </div>

        <form id="class1LessonEditorForm">
          <input id="liveLessonRowNumber" type="hidden">

          <div class="live-editor-section">
            <div class="live-editor-section-heading">
              <h4>Lesson details</h4>
            </div>

            <div class="live-editor-grid">
              <div class="form-field">
                <label for="liveLessonDate">Date</label>
                <input id="liveLessonDate" type="text" placeholder="dd/mm/yyyy">
              </div>

              <div class="form-field">
                <label for="liveLessonTeacher">Teacher</label>
                <input id="liveLessonTeacher" type="text">
              </div>

              <div class="form-field live-editor-wide">
                <label for="liveLessonRecord">Record of work / pages covered</label>
                <textarea id="liveLessonRecord" rows="4"></textarea>
              </div>

              <div class="form-field live-editor-wide">
                <label for="liveLessonHomework">Homework set</label>
                <textarea id="liveLessonHomework" rows="3"></textarea>
              </div>

              <div class="form-field">
                <label for="liveLessonDueDate">Due date</label>
                <input id="liveLessonDueDate" type="text" placeholder="dd/mm/yyyy">
              </div>

              <div class="form-field">
                <label for="liveLessonMaterialLink">Where to find it / material link</label>
                <input id="liveLessonMaterialLink" type="text">
              </div>
            </div>
          </div>

          <div class="live-editor-section">
            <div class="live-editor-section-heading">
              <div>
                <h4>Student progress records</h4>
                <p class="muted">
                  These fields come directly from the Student Attendance, Homework, Feedback and Advice columns in the test register.
                </p>
              </div>
            </div>

            <div id="liveStudentEditorFields"></div>
          </div>

          <p class="live-editor-help">
            Saving here updates the TEST Google Sheet through the deployed Apps Script.
          </p>

          <div class="live-editor-actions">
            <button class="button button-secondary" id="cancelLiveLessonEdit" type="button">
              Cancel
            </button>
            <button class="button button-primary" id="saveLiveLessonEdit" type="submit">
              Save to Google Sheet
            </button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    byId("closeLiveLessonEditor").addEventListener(
      "click",
      closeClass1LessonEditor
    );

    byId("cancelLiveLessonEdit").addEventListener(
      "click",
      closeClass1LessonEditor
    );

    modal.addEventListener("mousedown", (event) => {
      if (event.target === modal) {
        closeClass1LessonEditor();
      }
    });

    byId("class1LessonEditorForm").addEventListener(
      "submit",
      saveClass1LessonEdit
    );
  }

  setValue("liveLessonRowNumber", String(lesson.rowNumber || ""));
  setValue("liveLessonDate", lesson["Date"] || "");
  setValue("liveLessonTeacher", lesson["Teacher"] || "");
  setValue("liveLessonRecord", lesson["Record of work / pages covered"] || "");
  setValue("liveLessonHomework", lesson["Homework set"] || "");
  setValue("liveLessonDueDate", lesson["Due date"] || "");
  setValue(
    "liveLessonMaterialLink",
    lesson["Where to find it / material link"] || ""
  );

  const studentFields = byId("liveStudentEditorFields");

  if (studentFields) {
    studentFields.innerHTML = renderClass1StudentEditorFields(lesson);
  }

  modal.classList.add("visible");
  document.body.classList.add("modal-open");
}

function closeClass1LessonEditor() {
  const modal = byId("class1LessonEditor");

  if (modal) {
    modal.classList.remove("visible");
  }

  document.body.classList.remove("modal-open");
}

async function saveClass1LessonEdit(event) {
  event.preventDefault();

  const rowNumber = Number(value("liveLessonRowNumber"));
  const saveButton = byId("saveLiveLessonEdit");

  if (!rowNumber) {
    showToast("The Google Sheet row number is missing.", "error");
    return;
  }

  const updates = {
    "Date": value("liveLessonDate").trim(),
    "Teacher": value("liveLessonTeacher").trim(),
    "Record of work / pages covered": value("liveLessonRecord").trim(),
    "Homework set": value("liveLessonHomework").trim(),
    "Due date": value("liveLessonDueDate").trim(),
    "Where to find it / material link": value("liveLessonMaterialLink").trim()
  };

  document
    .querySelectorAll(
      "#liveStudentEditorFields [data-live-sheet-header]"
    )
    .forEach((field) => {
      const header = field.dataset.liveSheetHeader;

      if (header) {
        updates[header] = field.value.trim();
      }
    });

  const originalText = saveButton.textContent;
  saveButton.disabled = true;
  saveButton.textContent = "Saving…";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    /*
     * text/plain keeps this a CORS simple request and avoids an OPTIONS
     * preflight. Apps Script still receives the JSON text in postData.
     */
    const response = await fetch(LLS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify({
        action: "updateClassRegister",
        className: "Class 1 NEW",
        rowNumber,
        updates
      }),
      cache: "no-store",
      redirect: "follow",
      signal: controller.signal
    });

    const raw = await response.text();

    let data;

    try {
      data = JSON.parse(raw);
    } catch (parseError) {
      throw new Error(
        "The Apps Script save response was not JSON. Check the web-app deployment."
      );
    }

    if (!data || data.success !== true) {
      throw new Error(
        data?.error || "Google Sheets did not confirm the save."
      );
    }

    closeClass1LessonEditor();
    showToast("Lesson and student records saved to Google Sheets.", "success");

    class1LiveLoaded = false;
    await loadClass1Live(true);

  } catch (error) {
    const message =
      error?.name === "AbortError"
        ? "The save timed out after 15 seconds."
        : error?.message || "Unknown save error.";

    showToast(message, "error");
    console.error("Class 1 save error:", error);

  } finally {
    clearTimeout(timeout);
    saveButton.disabled = false;
    saveButton.textContent = originalText;
  }
}



/* =========================================================
   LIVE STUDENTS — GOOGLE SHEETS
========================================================= */

function renderStudents() {
  const body = byId("studentsTableBody");
  if (!body) return;

  if (studentsLiveLoaded) {
    renderStudentsLiveTable(studentsLiveRecords);
    return;
  }

  body.innerHTML = `
    <tr><td colspan="6">
      <div class="live-students-loading">
        <strong>Loading students from Google Sheets…</strong>
        <span class="muted">Using the TEST Students register.</span>
      </div>
    </td></tr>
  `;

  loadStudentsLive();
}

async function loadStudentsLive(force = false) {
  const body = byId("studentsTableBody");
  if (!body) return;

  if (studentsLiveLoaded && !force) {
    renderStudentsLiveTable(studentsLiveRecords);
    return;
  }

  body.innerHTML = `
    <tr><td colspan="6">
      <div class="live-students-loading">
        <strong>Connecting to Google Sheets…</strong>
        <span class="muted">Loading the TEST Students register.</span>
      </div>
    </td></tr>
  `;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(
      `${LLS_API_URL}?action=getStudents`,
      {
        method: "GET",
        redirect: "follow",
        signal: controller.signal
      }
    );

    const raw = await response.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch (_) {
      throw new Error("The Students API response was not JSON.");
    }

    if (!data || data.success !== true) {
      throw new Error(data?.error || "Google Sheets did not return the Students list.");
    }

    studentsLiveRecords = Array.isArray(data.students) ? data.students : [];
    studentsLiveLoaded = true;
    renderStudentsLiveTable(studentsLiveRecords);
  } catch (error) {
    const message = error?.name === "AbortError"
      ? "The Students request timed out after 30 seconds."
      : error?.message || "Unknown Students connection error.";

    body.innerHTML = `
      <tr><td colspan="6">
        <div class="live-students-error">
          <strong>Could not load Students from Google Sheets.</strong>
          <span>${escapeHtml(message)}</span>
          <button class="button button-secondary" id="retryStudentsLive" type="button">Try again</button>
        </div>
      </td></tr>
    `;
    byId("retryStudentsLive")?.addEventListener("click", () => loadStudentsLive(true));
    console.error("Students live-data error:", error);
  } finally {
    clearTimeout(timeout);
  }
}

function renderStudentsLiveTable(students) {
  const body = byId("studentsTableBody");
  if (!body) return;

  // V4.3: first prove the live Students data displays correctly.
  // Filters will be reconnected after the live-data table is confirmed.
  const records = Array.isArray(students) ? students : [];

  if (!records.length) {
    body.innerHTML = `
      <tr>
        <td colspan="7">
          ${emptyState("The Students sheet is connected, but it does not contain any student records.")}
        </td>
      </tr>
    `;
    return;
  }

  body.innerHTML = records.map((student) => {
    const fullName = [
      student["First Name"] || "",
      student["Surname"] || ""
    ].join(" ").trim();

    return `
      <tr>
        <td>
          <strong>${escapeHtml(fullName || "Unnamed student")}</strong>
          <div class="live-student-id">${escapeHtml(student["Student ID"] || "—")}</div>
        </td>
        <td>${escapeHtml(student["Class"] || "—")}</td>
        <td>—</td>
        <td>${escapeHtml(student["Email"] || "—")}</td>
        <td><span class="status-pill">${escapeHtml(student["Status"] || "—")}</span></td>
        <td>—</td>
        <td><span class="live-readonly-badge">Live · read-only</span></td>
      </tr>
    `;
  }).join("");

  const countElement =
    byId("studentCount") ||
    byId("studentsCount");

  if (countElement) {
    countElement.textContent =
      `${records.length} student${records.length === 1 ? "" : "s"}`;
  }
}



/* =========================================================
   V6 — CORE DATA ARCHITECTURE
   Students + Classes + Enrolments + dynamic class registers
   ---------------------------------------------------------
   This block deliberately overrides selected V5 functions.
   V5 remains the known-good rollback package.
========================================================= */

let v6PortalDataLoaded = false;
let v6PortalData = {
  students: [],
  classes: [],
  enrolments: []
};

let v6SelectedClassId = "";
let v6CurrentClass = null;
let v6CurrentRegisterLessons = [];

async function loadV6PortalData(force = false) {
  if (v6PortalDataLoaded && !force) {
    return v6PortalData;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(
      `${LLS_API_URL}?action=getPortalData&t=${Date.now()}`,
      {
        method: "GET",
        cache: "no-store",
        redirect: "follow",
        signal: controller.signal
      }
    );

    const raw = await response.text();
    let data;

    try {
      data = JSON.parse(raw);
    } catch (error) {
      throw new Error(
        "The Apps Script did not return JSON. Check the deployed web app."
      );
    }

    if (!data || data.success !== true) {
      throw new Error(
        data?.error || "The portal data request was unsuccessful."
      );
    }

    v6PortalData = {
      students: Array.isArray(data.students) ? data.students : [],
      classes: Array.isArray(data.classes) ? data.classes : [],
      enrolments: Array.isArray(data.enrolments) ? data.enrolments : []
    };

    studentsLiveRecords = v6PortalData.students;
    studentsLiveLoaded = true;
    v6PortalDataLoaded = true;

    if (
      !v6SelectedClassId ||
      !v6PortalData.classes.some(
        (item) => String(item["Class ID"] || "") === v6SelectedClassId
      )
    ) {
      const firstActive =
        v6PortalData.classes.find(
          (item) =>
            String(item["Status"] || "").toLowerCase() === "active"
        ) ||
        v6PortalData.classes[0];

      v6SelectedClassId =
        String(firstActive?.["Class ID"] || "");
    }

    return v6PortalData;

  } finally {
    clearTimeout(timeout);
  }
}

function v6GetClassById(classId) {
  return v6PortalData.classes.find(
    (item) =>
      String(item["Class ID"] || "") === String(classId || "")
  ) || null;
}

function v6GetStudentById(studentId) {
  return v6PortalData.students.find(
    (item) =>
      String(item["Student ID"] || "") === String(studentId || "")
  ) || null;
}

function v6ActiveEnrolmentsForClass(classId) {
  return v6PortalData.enrolments
    .filter((item) => {
      const matchesClass =
        String(item["Class ID"] || "") === String(classId || "");

      const status =
        String(item["Status"] || "").trim().toLowerCase();

      return matchesClass && (!status || status === "active");
    })
    .sort(
      (a, b) =>
        Number(a["Register Slot"] || 999) -
        Number(b["Register Slot"] || 999)
    );
}

function v6StudentNameForSlot(classId, slotNumber) {
  const enrolment = v6ActiveEnrolmentsForClass(classId)
    .find(
      (item) =>
        Number(item["Register Slot"]) === Number(slotNumber)
    );

  if (!enrolment) {
    return "";
  }

  const student =
    v6GetStudentById(enrolment["Student ID"]);

  if (!student) {
    return String(enrolment["Student ID"] || "");
  }

  return [
    student["First Name"] || "",
    student["Surname"] || ""
  ].join(" ").trim();
}

/* -------------------------
   CLASSES — LIVE DATABASE
------------------------- */

function renderClasses() {
  const container = byId("classGrid");
  if (!container) return;

  if (!v6PortalDataLoaded) {
    container.innerHTML = `
      <div class="panel">
        <strong>Loading classes from Google Sheets…</strong>
        <p class="muted">The Classes and Enrolments tables are now the source of truth.</p>
      </div>
    `;
    return;
  }

  const query =
    String(byId("classSearch")?.value || "")
      .trim()
      .toLowerCase();

  const day =
    String(byId("classDayFilter")?.value || "all");

  const records = v6PortalData.classes
    .filter((item) => {
      const status =
        String(item["Status"] || "").toLowerCase();

      if (status && status !== "active") {
        return false;
      }

      const haystack = [
        item["Class ID"],
        item["Class Name"],
        item["School Year"],
        item["Level"],
        item["Teacher"],
        item["Day"],
        item["Time"],
        item["Room"]
      ].join(" ").toLowerCase();

      const matchesSearch =
        !query || haystack.includes(query);

      const matchesDay =
        day === "all" ||
        String(item["Day"] || "") === day;

      return matchesSearch && matchesDay;
    });

  if (!records.length) {
    container.innerHTML =
      emptyState("No live classes match the current filters.");
    return;
  }

  container.innerHTML = records.map((item) => {
    const classId = String(item["Class ID"] || "");
    const className =
      String(item["Class Name"] || classId || "Unnamed class");
    const enrolmentCount =
      v6ActiveEnrolmentsForClass(classId).length;
    const selected =
      classId === v6SelectedClassId;

    return `
      <article class="class-card ${selected ? "class-card-selected" : ""}">
        <div class="class-card-top">
          <div>
            <p class="section-label">${escapeHtml(item["School Year"] || "School year")}</p>
            <h3>${escapeHtml(className)}</h3>
          </div>
          <span class="status-pill">${escapeHtml(item["Status"] || "Active")}</span>
        </div>

        <div class="class-meta-grid">
          <div>
            <span>Level</span>
            <strong>${escapeHtml(item["Level"] || "—")}</strong>
          </div>
          <div>
            <span>Teacher</span>
            <strong>${escapeHtml(item["Teacher"] || "—")}</strong>
          </div>
          <div>
            <span>Schedule</span>
            <strong>${escapeHtml(
              [item["Day"], item["Time"]].filter(Boolean).join(" · ") || "—"
            )}</strong>
          </div>
          <div>
            <span>Students</span>
            <strong>${enrolmentCount}</strong>
          </div>
        </div>

        <button
          class="button ${selected ? "button-soft" : "button-secondary"} full-width"
          type="button"
          data-v6-open-class="${escapeHtml(classId)}"
        >
          ${selected ? "Register selected" : "Open register"}
        </button>
      </article>
    `;
  }).join("");

  container
    .querySelectorAll("[data-v6-open-class]")
    .forEach((button) => {
      button.addEventListener("click", async () => {
        v6SelectedClassId =
          String(button.dataset.v6OpenClass || "");

        renderClasses();
        await loadV6ClassRegister(v6SelectedClassId, true);
      });
    });
}

async function loadClass1Live(force = false) {
  const panel = byId("class1LivePanel");
  if (!panel) return;

  panel.innerHTML = `
    <div class="live-sheet-status">
      <div>
        <p class="section-label">Google Sheets</p>
        <h3>Classes</h3>
      </div>
      <span class="live-status live-status-loading">Connecting…</span>
    </div>
    <p class="muted">Loading Classes, Students and Enrolments from the live test database.</p>
  `;

  try {
    await loadV6PortalData(force);
    renderClasses();
    renderStudents();

    if (!v6SelectedClassId) {
      panel.innerHTML = `
        <div class="live-sheet-status">
          <div>
            <p class="section-label">Google Sheets</p>
            <h3>No classes configured</h3>
          </div>
          <span class="live-status live-status-error">Setup required</span>
        </div>
        <p class="muted">
          Add at least one row to the Classes sheet.
        </p>
      `;
      return;
    }

    await loadV6ClassRegister(v6SelectedClassId, force);

  } catch (error) {
    const message =
      error?.name === "AbortError"
        ? "The connection timed out."
        : error?.message || "Unknown connection error.";

    panel.innerHTML = `
      <div class="live-sheet-status">
        <div>
          <p class="section-label">Google Sheets</p>
          <h3>Portal database</h3>
        </div>
        <span class="live-status live-status-error">Connection error</span>
      </div>

      <p class="muted">${escapeHtml(message)}</p>

      <button
        class="button button-secondary button-small"
        id="retryClass1Live"
        type="button"
      >
        Retry connection
      </button>
    `;

    byId("retryClass1Live")?.addEventListener(
      "click",
      () => loadClass1Live(true)
    );

    console.error("V6 portal data error:", error);
  }
}

async function loadV6ClassRegister(classId, force = false) {
  const panel = byId("class1LivePanel");
  if (!panel) return;

  const classRecord = v6GetClassById(classId);

  if (!classRecord) {
    throw new Error("The selected class could not be found.");
  }

  const className =
    String(classRecord["Class Name"] || classId);

  panel.innerHTML = `
    <div class="live-sheet-status">
      <div>
        <p class="section-label">Live register</p>
        <h3>${escapeHtml(className)}</h3>
      </div>
      <span class="live-status live-status-loading">Loading…</span>
    </div>
    <p class="muted">Reading this class register from Google Sheets.</p>
  `;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(
      `${LLS_API_URL}?action=getClassRegister&classId=${encodeURIComponent(classId)}&t=${Date.now()}`,
      {
        method: "GET",
        cache: "no-store",
        redirect: "follow",
        signal: controller.signal
      }
    );

    const raw = await response.text();
    let data;

    try {
      data = JSON.parse(raw);
    } catch (error) {
      throw new Error("The class register response was not JSON.");
    }

    if (!data || data.success !== true) {
      throw new Error(
        data?.error || "The class register could not be loaded."
      );
    }

    const lessons = Array.isArray(data.lessons)
      ? data.lessons
      : [];

    const filledLessons = lessons.filter((lesson) => {
      return [
        "Month",
        "Lesson",
        "Date",
        "Teacher",
        "Record of work / pages covered",
        "Homework set"
      ].some((key) =>
        String(lesson?.[key] ?? "").trim()
      );
    });

    v6CurrentClass = classRecord;
    v6CurrentRegisterLessons = filledLessons;

    // Keep the existing editor's working storage compatible.
    class1LiveLessons = filledLessons;
    class1LiveLoaded = true;

    const enrolmentCount =
      v6ActiveEnrolmentsForClass(classId).length;

    panel.innerHTML = `
      <div class="live-sheet-status">
        <div>
          <p class="section-label">Live register</p>
          <h3>${escapeHtml(className)}</h3>
          <p class="muted">
            ${escapeHtml(classRecord["School Year"] || "")}
            ${classRecord["Level"] ? ` · ${escapeHtml(classRecord["Level"])}` : ""}
            · ${enrolmentCount} enrolled student${enrolmentCount === 1 ? "" : "s"}
          </p>
        </div>

        <div class="live-sheet-actions">
          <span class="live-status live-status-connected">● Connected</span>
          <button
            class="button button-secondary button-small"
            id="refreshClass1Live"
            type="button"
          >
            Refresh
          </button>
        </div>
      </div>

      <p class="muted">
        ${filledLessons.length} register row${filledLessons.length === 1 ? "" : "s"} loaded.
      </p>

      ${renderClass1LessonPreview(filledLessons)}
    `;

    byId("refreshClass1Live")?.addEventListener(
      "click",
      async () => {
        v6PortalDataLoaded = false;
        await loadV6PortalData(true);
        renderClasses();
        renderStudents();
        await loadV6ClassRegister(classId, true);
      }
    );

    panel
      .querySelectorAll("[data-edit-live-lesson]")
      .forEach((button) => {
        button.addEventListener("click", () => {
          openClass1LessonEditor(
            Number(button.dataset.editLiveLesson)
          );
        });
      });

  } finally {
    clearTimeout(timeout);
  }
}

/* -------------------------
   NAMED STUDENTS IN EDITOR
------------------------- */

function renderClass1StudentEditorFields(lesson) {
  const students = getClass1StudentFields(lesson);

  if (!students.length) {
    return `
      <p class="muted">
        No Attendance / Homework / Feedback / Advice student columns were found.
      </p>
    `;
  }

  return students
    .map((student, index) => {
      const studentName =
        v6StudentNameForSlot(
          v6CurrentClass?.["Class ID"],
          student.number
        );

      const label =
        studentName
          ? `${studentName} · Student ${student.number}`
          : `Student ${student.number}`;

      const fieldOrder = [
        "Attendance",
        "Homework",
        "Feedback",
        "Advice"
      ];

      const fieldsHtml = fieldOrder
        .map((fieldName) => {
          const field = student.fields[fieldName];
          if (!field) return "";

          const inputId =
            `liveStudent${student.number}${fieldName}`;

          if (
            fieldName === "Feedback" ||
            fieldName === "Advice"
          ) {
            return `
              <div class="form-field">
                <label for="${inputId}">${escapeHtml(fieldName)}</label>
                <textarea
                  id="${inputId}"
                  rows="3"
                  data-live-sheet-header="${escapeHtml(field.header)}"
                >${escapeHtml(field.value)}</textarea>
              </div>
            `;
          }

          return `
            <div class="form-field">
              <label for="${inputId}">${escapeHtml(fieldName)}</label>
              <input
                id="${inputId}"
                type="text"
                value="${escapeHtml(field.value)}"
                data-live-sheet-header="${escapeHtml(field.header)}"
              >
            </div>
          `;
        })
        .join("");

      return `
        <details class="live-student-editor" ${index === 0 ? "open" : ""}>
          <summary>
            <span>${escapeHtml(label)}</span>
            <span class="muted">Attendance · Homework · Feedback · Advice</span>
          </summary>
          <div class="live-student-editor-grid">
            ${fieldsHtml}
          </div>
        </details>
      `;
    })
    .join("");
}

function openClass1LessonEditor(rowNumber) {
  const lesson = class1LiveLessons.find(
    (item) => Number(item.rowNumber) === Number(rowNumber)
  );

  if (!lesson) {
    showToast("Could not find that lesson row.", "error");
    return;
  }

  let modal = byId("class1LessonEditor");

  if (!modal) {
    modal = document.createElement("div");
    modal.id = "class1LessonEditor";
    modal.className = "live-editor-backdrop";
    modal.innerHTML = `
      <div class="live-editor-card" role="dialog" aria-modal="true" aria-labelledby="liveEditorTitle">
        <div class="live-editor-header">
          <div>
            <p class="section-label">Administrator</p>
            <h3 id="liveEditorTitle">Edit lesson</h3>
          </div>
          <button class="icon-button" id="closeLiveLessonEditor" type="button" aria-label="Close">×</button>
        </div>

        <form id="class1LessonEditorForm">
          <input id="liveLessonRowNumber" type="hidden">

          <div class="live-editor-section">
            <div class="live-editor-section-heading">
              <h4>Lesson details</h4>
            </div>

            <div class="live-editor-grid">
              <div class="form-field">
                <label for="liveLessonDate">Date</label>
                <input id="liveLessonDate" type="text" placeholder="dd/mm/yyyy">
              </div>

              <div class="form-field">
                <label for="liveLessonTeacher">Teacher</label>
                <input id="liveLessonTeacher" type="text">
              </div>

              <div class="form-field live-editor-wide">
                <label for="liveLessonRecord">Record of work / pages covered</label>
                <textarea id="liveLessonRecord" rows="4"></textarea>
              </div>

              <div class="form-field live-editor-wide">
                <label for="liveLessonHomework">Homework set</label>
                <textarea id="liveLessonHomework" rows="3"></textarea>
              </div>

              <div class="form-field">
                <label for="liveLessonDueDate">Due date</label>
                <input id="liveLessonDueDate" type="text" placeholder="dd/mm/yyyy">
              </div>

              <div class="form-field">
                <label for="liveLessonMaterialLink">Where to find it / material link</label>
                <input id="liveLessonMaterialLink" type="text">
              </div>
            </div>
          </div>

          <div class="live-editor-section">
            <div class="live-editor-section-heading">
              <div>
                <h4>Student progress records</h4>
                <p class="muted">
                  Student names come from Enrolments; register data still writes to the existing Student N columns.
                </p>
              </div>
            </div>

            <div id="liveStudentEditorFields"></div>
          </div>

          <p class="live-editor-help">
            Saving here updates the TEST Google Sheet through the deployed Apps Script.
          </p>

          <div class="live-editor-actions">
            <button class="button button-secondary" id="cancelLiveLessonEdit" type="button">
              Cancel
            </button>
            <button class="button button-primary" id="saveLiveLessonEdit" type="submit">
              Save to Google Sheet
            </button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    byId("closeLiveLessonEditor").addEventListener(
      "click",
      closeClass1LessonEditor
    );

    byId("cancelLiveLessonEdit").addEventListener(
      "click",
      closeClass1LessonEditor
    );

    modal.addEventListener("mousedown", (event) => {
      if (event.target === modal) {
        closeClass1LessonEditor();
      }
    });

    byId("class1LessonEditorForm").addEventListener(
      "submit",
      saveClass1LessonEdit
    );
  }

  const className =
    String(v6CurrentClass?.["Class Name"] || "Class register");

  text("liveEditorTitle", `Edit ${className} lesson`);

  setValue("liveLessonRowNumber", String(lesson.rowNumber || ""));
  setValue("liveLessonDate", lesson["Date"] || "");
  setValue("liveLessonTeacher", lesson["Teacher"] || "");
  setValue("liveLessonRecord", lesson["Record of work / pages covered"] || "");
  setValue("liveLessonHomework", lesson["Homework set"] || "");
  setValue("liveLessonDueDate", lesson["Due date"] || "");
  setValue(
    "liveLessonMaterialLink",
    lesson["Where to find it / material link"] || ""
  );

  const studentFields = byId("liveStudentEditorFields");
  if (studentFields) {
    studentFields.innerHTML =
      renderClass1StudentEditorFields(lesson);
  }

  modal.classList.add("visible");
  document.body.classList.add("modal-open");
}

async function saveClass1LessonEdit(event) {
  event.preventDefault();

  const rowNumber =
    Number(value("liveLessonRowNumber"));

  const saveButton =
    byId("saveLiveLessonEdit");

  const classId =
    String(v6CurrentClass?.["Class ID"] || "");

  if (!rowNumber || !classId) {
    showToast(
      "The class or Google Sheet row number is missing.",
      "error"
    );
    return;
  }

  const updates = {
    "Date": value("liveLessonDate").trim(),
    "Teacher": value("liveLessonTeacher").trim(),
    "Record of work / pages covered": value("liveLessonRecord").trim(),
    "Homework set": value("liveLessonHomework").trim(),
    "Due date": value("liveLessonDueDate").trim(),
    "Where to find it / material link": value("liveLessonMaterialLink").trim()
  };

  document
    .querySelectorAll(
      "#liveStudentEditorFields [data-live-sheet-header]"
    )
    .forEach((field) => {
      const header =
        field.dataset.liveSheetHeader;

      if (header) {
        updates[header] =
          field.value.trim();
      }
    });

  const originalText =
    saveButton.textContent;

  saveButton.disabled = true;
  saveButton.textContent = "Saving…";

  const controller =
    new AbortController();

  const timeout =
    setTimeout(
      () => controller.abort(),
      30000
    );

  try {
    const response = await fetch(
      LLS_API_URL,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "text/plain;charset=utf-8"
        },
        body: JSON.stringify({
          action: "updateClassRegister",
          classId,
          rowNumber,
          updates
        }),
        cache: "no-store",
        redirect: "follow",
        signal: controller.signal
      }
    );

    const raw =
      await response.text();

    let data;

    try {
      data = JSON.parse(raw);
    } catch (error) {
      throw new Error(
        "The Apps Script save response was not JSON."
      );
    }

    if (!data || data.success !== true) {
      throw new Error(
        data?.error ||
        "Google Sheets did not confirm the save."
      );
    }

    closeClass1LessonEditor();

    showToast(
      "Lesson and student records saved to Google Sheets.",
      "success"
    );

    await loadV6ClassRegister(
      classId,
      true
    );

  } catch (error) {
    const message =
      error?.name === "AbortError"
        ? "The save timed out."
        : error?.message ||
          "Unknown save error.";

    showToast(message, "error");
    console.error("V6 class save error:", error);

  } finally {
    clearTimeout(timeout);
    saveButton.disabled = false;
    saveButton.textContent = originalText;
  }
}

/* -------------------------
   STUDENTS — LIVE + FILTERS
------------------------- */

function renderStudents() {
  const body = byId("studentsTableBody");
  if (!body) return;

  if (!v6PortalDataLoaded) {
    body.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="live-students-loading">
            <strong>Loading students from Google Sheets…</strong>
            <span class="muted">Classes are now derived from Enrolments.</span>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  renderStudentsLiveTable(
    v6PortalData.students
  );
}

async function loadStudentsLive(force = false) {
  const body = byId("studentsTableBody");
  if (!body) return;

  try {
    await loadV6PortalData(force);
    renderStudents();
    renderClasses();
  } catch (error) {
    body.innerHTML = `
      <tr>
        <td colspan="7">
          ${emptyState(
            `Could not load the live student database: ${escapeHtml(
              error?.message || "Unknown error"
            )}`
          )}
        </td>
      </tr>
    `;
  }
}

function renderStudentsLiveTable(students) {
  const body = byId("studentsTableBody");
  if (!body) return;

  const query =
    String(byId("studentSearch")?.value || "")
      .trim()
      .toLowerCase();

  const statusFilter =
    String(byId("studentStatusFilter")?.value || "all");

  const levelFilter =
    String(byId("studentLevelFilter")?.value || "all");

  const records =
    (Array.isArray(students) ? students : [])
      .map((student) => {
        const studentId =
          String(student["Student ID"] || "");

        const enrolments =
          v6PortalData.enrolments.filter((item) => {
            const matches =
              String(item["Student ID"] || "") === studentId;

            const status =
              String(item["Status"] || "").trim().toLowerCase();

            return matches && (!status || status === "active");
          });

        const classRecords =
          enrolments
            .map((item) =>
              v6GetClassById(item["Class ID"])
            )
            .filter(Boolean);

        const classNames =
          classRecords
            .map((item) =>
              String(item["Class Name"] || item["Class ID"] || "")
            )
            .filter(Boolean);

        const levels =
          classRecords
            .map((item) =>
              String(item["Level"] || "")
            )
            .filter(Boolean);

        const startDates =
          enrolments
            .map((item) =>
              String(item["Start Date"] || "")
            )
            .filter(Boolean);

        return {
          student,
          studentId,
          classNames,
          levels,
          joined: startDates[0] || ""
        };
      })
      .filter((item) => {
        const student = item.student;

        const fullName = [
          student["First Name"] || "",
          student["Surname"] || ""
        ].join(" ").trim();

        const haystack = [
          item.studentId,
          fullName,
          student["Email"],
          student["Phone"],
          ...item.classNames,
          ...item.levels
        ].join(" ").toLowerCase();

        const matchesSearch =
          !query || haystack.includes(query);

        const status =
          String(student["Status"] || "");

        const matchesStatus =
          statusFilter === "all" ||
          status === statusFilter;

        const matchesLevel =
          levelFilter === "all" ||
          item.levels.includes(levelFilter);

        return (
          matchesSearch &&
          matchesStatus &&
          matchesLevel
        );
      });

  if (!records.length) {
    body.innerHTML = `
      <tr>
        <td colspan="7">
          ${emptyState("No live students match the current filters.")}
        </td>
      </tr>
    `;
  } else {
    body.innerHTML = records.map((item) => {
      const student = item.student;

      const fullName = [
        student["First Name"] || "",
        student["Surname"] || ""
      ].join(" ").trim();

      return `
        <tr>
          <td>
            <strong>${escapeHtml(fullName || "Unnamed student")}</strong>
            <div class="live-student-id">${escapeHtml(item.studentId || "—")}</div>
          </td>
          <td>${escapeHtml(item.classNames.join(", ") || "—")}</td>
          <td>${escapeHtml(item.levels.join(", ") || "—")}</td>
          <td>${escapeHtml(student["Email"] || student["Phone"] || "—")}</td>
          <td><span class="status-pill">${escapeHtml(student["Status"] || "—")}</span></td>
          <td>${escapeHtml(item.joined || "—")}</td>
          <td><span class="live-readonly-badge">Live · read-only</span></td>
        </tr>
      `;
    }).join("");
  }

  const countElement =
    byId("studentsTableCount");

  if (countElement) {
    countElement.textContent =
      `${records.length} student${records.length === 1 ? "" : "s"}`;
  }
}


/* =========================================================
   V7 — ADMINISTRATOR PORTAL FOUNDATION
   ---------------------------------------------------------
   Builds on the proven V6 Google Sheets architecture.
   - Live administrator dashboard
   - Searchable student profiles
   - Class profiles with enrolled students
   - Enrolment relationships visible throughout
   - Existing V6 register editor remains writable
   - Master Students / Classes / Enrolments remain read-only
     until authenticated write endpoints are introduced.
========================================================= */

let v7BootError = "";

function initialisePortal() {
  ensureStateStructure();
  bindNavigation();
  bindGlobalControls();
  bindForms();
  bindFilters();
  initialiseDates();
  populateSelects();
  renderAll();
  v7PrepareAdministratorUi();
  navigateTo(readPageFromHash() || "dashboard", false);
  v7LoadAdministratorData();
}

async function v7LoadAdministratorData(force = false) {
  v7SetDatabaseStrip("loading", "Connecting to the live TEST database…");

  try {
    await loadV6PortalData(force);
    v7BootError = "";

    renderStudents();
    renderClasses();
    v7RenderDashboardLive();
    v7SetDatabaseStrip(
      "connected",
      `${v6PortalData.students.length} students · ${v6PortalData.classes.length} classes · ${v6PortalData.enrolments.length} enrolments`
    );
  } catch (error) {
    v7BootError = error?.message || "Unknown database connection error.";
    v7SetDatabaseStrip("error", v7BootError);
    console.error("V7 administrator bootstrap error:", error);
  }
}

function v7PrepareAdministratorUi() {
  const hero = document.querySelector("#page-dashboard .hero");
  if (hero && !byId("v7DatabaseStrip")) {
    const strip = document.createElement("div");
    strip.id = "v7DatabaseStrip";
    strip.className = "v7-database-strip";
    strip.innerHTML = `
      <div>
        <strong>TEST database</strong>
        <span id="v7DatabaseMessage">Connecting…</span>
      </div>
      <button class="button button-secondary button-small" id="v7RefreshDatabase" type="button">
        Refresh live data
      </button>
    `;
    hero.insertAdjacentElement("afterend", strip);

    byId("v7RefreshDatabase")?.addEventListener("click", async () => {
      v6PortalDataLoaded = false;
      await v7LoadAdministratorData(true);
      if (v6SelectedClassId && document.querySelector("#page-classes.active")) {
        await loadV6ClassRegister(v6SelectedClassId, true);
      }
    });
  }

  const studentDescription = document.querySelector("#page-students .page-description");
  if (studentDescription) {
    studentDescription.textContent =
      "Live student records and enrolments from Google Sheets. Open a student to view their current class relationships.";
  }

  const classDescription = document.querySelector("#page-classes .page-description");
  if (classDescription) {
    classDescription.textContent =
      "Live class metadata, enrolments and lesson registers from Google Sheets.";
  }

  [
    ["addStudentButton", "Master student editing will be enabled after secure authenticated write access is added."],
    ["quickStudentButton", "Master student editing will be enabled after secure authenticated write access is added."],
    ["addClassButton", "Master class editing will be enabled after secure authenticated write access is added."]
  ].forEach(([id, title]) => {
    const button = byId(id);
    if (!button) return;
    button.disabled = true;
    button.title = title;
    button.classList.add("v7-disabled-master-write");
  });

  v7EnsureProfileModal();
}

function v7SetDatabaseStrip(status, message) {
  const strip = byId("v7DatabaseStrip");
  const messageEl = byId("v7DatabaseMessage");
  if (!strip || !messageEl) return;

  strip.dataset.status = status;
  messageEl.textContent = message;

  const refresh = byId("v7RefreshDatabase");
  if (refresh) {
    refresh.disabled = status === "loading";
    refresh.textContent = status === "loading" ? "Connecting…" : "Refresh live data";
  }
}

function v7ActiveEnrolmentsForStudent(studentId) {
  return v6PortalData.enrolments.filter((item) => {
    const matches =
      String(item["Student ID"] || "") === String(studentId || "");
    const status =
      String(item["Status"] || "").trim().toLowerCase();
    return matches && (!status || status === "active");
  });
}

function v7StudentFullName(student) {
  return [
    student?.["First Name"] || "",
    student?.["Surname"] || ""
  ].join(" ").trim() || String(student?.["Student ID"] || "Unnamed student");
}

function v7RenderDashboardLive() {
  if (!v6PortalDataLoaded) return;

  const activeStudents = v6PortalData.students.filter((student) => {
    const status = String(student["Status"] || "").trim().toLowerCase();
    return !status || status === "active";
  });

  const activeClasses = v6PortalData.classes.filter((item) => {
    const status = String(item["Status"] || "").trim().toLowerCase();
    return !status || status === "active";
  });

  text("statStudents", activeStudents.length);
  text(
    "statStudentsSub",
    `${v6PortalData.students.length} live student record${v6PortalData.students.length === 1 ? "" : "s"}`
  );

  text("statClasses", activeClasses.length);
  text(
    "statClassesSub",
    `${v6PortalData.enrolments.length} enrolment record${v6PortalData.enrolments.length === 1 ? "" : "s"}`
  );

  renderTodayClasses();
  renderStudentBreakdown();
}

function renderTodayClasses() {
  const container = byId("todayClassesList");
  if (!container) return;

  if (!v6PortalDataLoaded) {
    container.innerHTML = `
      <div class="empty-mini">
        <strong>Loading live classes…</strong>
        <span>Connecting to Google Sheets.</span>
      </div>
    `;
    return;
  }

  const todayName = new Intl.DateTimeFormat("en-GB", {
    weekday: "long"
  }).format(new Date());

  const classes = v6PortalData.classes.filter((item) => {
    const status = String(item["Status"] || "").trim().toLowerCase();
    return (
      (!status || status === "active") &&
      String(item["Day"] || "").trim().toLowerCase() === todayName.toLowerCase()
    );
  });

  if (!classes.length) {
    container.innerHTML = `
      <div class="empty-mini">
        <strong>No live classes scheduled for ${escapeHtml(todayName)}.</strong>
        <span>Add the Day field in the Classes sheet to populate this list.</span>
      </div>
    `;
    return;
  }

  container.innerHTML = classes.map((item) => {
    const classId = String(item["Class ID"] || "");
    const count = v6ActiveEnrolmentsForClass(classId).length;
    return `
      <button class="v7-today-class" type="button" data-v7-dashboard-class="${escapeHtml(classId)}">
        <div>
          <strong>${escapeHtml(item["Class Name"] || classId)}</strong>
          <span>${escapeHtml([item["Time"], item["Room"]].filter(Boolean).join(" · ") || "Schedule not completed")}</span>
        </div>
        <span>${count} student${count === 1 ? "" : "s"} →</span>
      </button>
    `;
  }).join("");

  container.querySelectorAll("[data-v7-dashboard-class]").forEach((button) => {
    button.addEventListener("click", async () => {
      v6SelectedClassId = button.dataset.v7DashboardClass;
      navigateTo("classes");
      renderClasses();
      await loadV6ClassRegister(v6SelectedClassId, true);
    });
  });
}

function renderStudentBreakdown() {
  const container = byId("studentBreakdown");
  if (!container) return;

  if (!v6PortalDataLoaded) {
    container.innerHTML = `<p class="muted">Loading live enrolment levels…</p>`;
    return;
  }

  const counts = {};
  v6PortalData.enrolments.forEach((enrolment) => {
    const status = String(enrolment["Status"] || "").trim().toLowerCase();
    if (status && status !== "active") return;
    const classRecord = v6GetClassById(enrolment["Class ID"]);
    const level = String(classRecord?.["Level"] || "Not set").trim() || "Not set";
    counts[level] = (counts[level] || 0) + 1;
  });

  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  if (!entries.length) {
    container.innerHTML = `<p class="muted">No active enrolments yet.</p>`;
    return;
  }

  const total = entries.reduce((sumValue, [, count]) => sumValue + count, 0);

  container.innerHTML = entries.map(([level, count]) => `
    <div class="breakdown-row">
      <div class="breakdown-label">
        <span>${escapeHtml(level)}</span>
        <strong>${count}</strong>
      </div>
      <div class="breakdown-bar">
        <div style="width:${Math.max(4, Math.round((count / total) * 100))}%"></div>
      </div>
    </div>
  `).join("");
}

/* -------------------------
   STUDENTS — V7 PROFILES
------------------------- */

function renderStudentsLiveTable(students) {
  const body = byId("studentsTableBody");
  if (!body) return;

  const query = String(byId("studentSearch")?.value || "").trim().toLowerCase();
  const statusFilter = String(byId("studentStatusFilter")?.value || "all");
  const levelFilter = String(byId("studentLevelFilter")?.value || "all");

  const records = (Array.isArray(students) ? students : [])
    .map((student) => {
      const studentId = String(student["Student ID"] || "");
      const enrolments = v7ActiveEnrolmentsForStudent(studentId);
      const classRecords = enrolments
        .map((item) => v6GetClassById(item["Class ID"]))
        .filter(Boolean);
      const classNames = classRecords
        .map((item) => String(item["Class Name"] || item["Class ID"] || ""))
        .filter(Boolean);
      const levels = classRecords
        .map((item) => String(item["Level"] || ""))
        .filter(Boolean);
      const joined =
        enrolments.map((item) => String(item["Start Date"] || "")).find(Boolean) || "";

      return { student, studentId, enrolments, classRecords, classNames, levels, joined };
    })
    .filter((item) => {
      const student = item.student;
      const fullName = v7StudentFullName(student);
      const haystack = [
        item.studentId,
        fullName,
        student["Email"],
        student["Phone"],
        ...item.classNames,
        ...item.levels
      ].join(" ").toLowerCase();

      const status = String(student["Status"] || "");
      return (
        (!query || haystack.includes(query)) &&
        (statusFilter === "all" || status === statusFilter) &&
        (levelFilter === "all" || item.levels.includes(levelFilter))
      );
    });

  if (!records.length) {
    body.innerHTML = `
      <tr><td colspan="7">${emptyState("No live students match the current filters.")}</td></tr>
    `;
  } else {
    body.innerHTML = records.map((item) => {
      const student = item.student;
      return `
        <tr class="v7-clickable-row" data-v7-student-row="${escapeHtml(item.studentId)}">
          <td>
            <strong>${escapeHtml(v7StudentFullName(student))}</strong>
            <div class="live-student-id">${escapeHtml(item.studentId || "—")}</div>
          </td>
          <td>${escapeHtml(item.classNames.join(", ") || "—")}</td>
          <td>${escapeHtml(item.levels.join(", ") || "—")}</td>
          <td>${escapeHtml(student["Email"] || student["Phone"] || "—")}</td>
          <td><span class="status-pill">${escapeHtml(student["Status"] || "—")}</span></td>
          <td>${escapeHtml(item.joined || "—")}</td>
          <td>
            <button class="button button-secondary button-small" type="button"
              data-v7-open-student="${escapeHtml(item.studentId)}">
              Open profile
            </button>
          </td>
        </tr>
      `;
    }).join("");
  }

  const countElement = byId("studentsTableCount");
  if (countElement) {
    countElement.textContent =
      `${records.length} student${records.length === 1 ? "" : "s"}`;
  }

  body.querySelectorAll("[data-v7-open-student]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      v7OpenStudentProfile(button.dataset.v7OpenStudent);
    });
  });

  body.querySelectorAll("[data-v7-student-row]").forEach((row) => {
    row.addEventListener("click", () => {
      v7OpenStudentProfile(row.dataset.v7StudentRow);
    });
  });
}

/* -------------------------
   CLASSES — V7 PROFILES
------------------------- */

function renderClasses() {
  const container = byId("classGrid");
  if (!container) return;

  if (!v6PortalDataLoaded) {
    container.innerHTML = `
      <div class="panel">
        <strong>Loading classes from Google Sheets…</strong>
        <p class="muted">Classes and Enrolments are the source of truth.</p>
      </div>
    `;
    return;
  }

  const query = String(byId("classSearch")?.value || "").trim().toLowerCase();
  const day = String(byId("classDayFilter")?.value || "all");

  const records = v6PortalData.classes.filter((item) => {
    const status = String(item["Status"] || "").trim().toLowerCase();
    if (status && status !== "active") return false;

    const haystack = [
      item["Class ID"], item["Class Name"], item["School Year"], item["Level"],
      item["Teacher"], item["Day"], item["Time"], item["Room"]
    ].join(" ").toLowerCase();

    return (
      (!query || haystack.includes(query)) &&
      (day === "all" || String(item["Day"] || "") === day)
    );
  });

  if (!records.length) {
    container.innerHTML = emptyState("No live classes match the current filters.");
    return;
  }

  container.innerHTML = records.map((item) => {
    const classId = String(item["Class ID"] || "");
    const className = String(item["Class Name"] || classId || "Unnamed class");
    const enrolments = v6ActiveEnrolmentsForClass(classId);
    const capacity = Number(item["Capacity"] || 0);
    const studentNames = enrolments
      .slice(0, 4)
      .map((enrolment) => v7StudentFullName(v6GetStudentById(enrolment["Student ID"])))
      .filter(Boolean);
    const selected = classId === v6SelectedClassId;

    return `
      <article class="class-card v7-class-card ${selected ? "class-card-selected" : ""}">
        <div class="class-card-top">
          <div>
            <p class="section-label">${escapeHtml(item["School Year"] || "School year")}</p>
            <h3>${escapeHtml(className)}</h3>
            <div class="live-student-id">${escapeHtml(classId)}</div>
          </div>
          <span class="status-pill">${escapeHtml(item["Status"] || "Active")}</span>
        </div>

        <div class="class-meta-grid">
          <div><span>Level</span><strong>${escapeHtml(item["Level"] || "—")}</strong></div>
          <div><span>Teacher</span><strong>${escapeHtml(item["Teacher"] || "—")}</strong></div>
          <div><span>Schedule</span><strong>${escapeHtml([item["Day"], item["Time"]].filter(Boolean).join(" · ") || "—")}</strong></div>
          <div><span>Room</span><strong>${escapeHtml(item["Room"] || "—")}</strong></div>
        </div>

        <div class="v7-class-enrolments">
          <div class="v7-class-enrolments-head">
            <span>Active enrolments</span>
            <strong>${enrolments.length}${capacity ? ` / ${capacity}` : ""}</strong>
          </div>
          <p>${escapeHtml(studentNames.join(", ") || "No students enrolled")}${enrolments.length > 4 ? ` +${enrolments.length - 4} more` : ""}</p>
        </div>

        <div class="v7-class-actions">
          <button class="button button-secondary" type="button"
            data-v7-class-profile="${escapeHtml(classId)}">
            Class details
          </button>
          <button class="button ${selected ? "button-soft" : "button-primary"}" type="button"
            data-v6-open-class="${escapeHtml(classId)}">
            ${selected ? "Open selected register" : "Open register"}
          </button>
        </div>
      </article>
    `;
  }).join("");

  container.querySelectorAll("[data-v7-class-profile]").forEach((button) => {
    button.addEventListener("click", () => {
      v7OpenClassProfile(button.dataset.v7ClassProfile);
    });
  });

  container.querySelectorAll("[data-v6-open-class]").forEach((button) => {
    button.addEventListener("click", async () => {
      v6SelectedClassId = String(button.dataset.v6OpenClass || "");
      renderClasses();
      await loadV6ClassRegister(v6SelectedClassId, true);
      byId("class1LivePanel")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

/* -------------------------
   PROFILE MODAL
------------------------- */

function v7EnsureProfileModal() {
  if (byId("v7ProfileModal")) return;

  const modal = document.createElement("div");
  modal.id = "v7ProfileModal";
  modal.className = "live-editor-backdrop";
  modal.innerHTML = `
    <div class="live-editor-card v7-profile-card" role="dialog" aria-modal="true" aria-labelledby="v7ProfileTitle">
      <div class="live-editor-header">
        <div>
          <p class="section-label" id="v7ProfileKicker">Administrator</p>
          <h3 id="v7ProfileTitle">Profile</h3>
        </div>
        <button class="icon-button" id="v7CloseProfile" type="button" aria-label="Close">×</button>
      </div>
      <div id="v7ProfileBody"></div>
    </div>
  `;

  document.body.appendChild(modal);
  byId("v7CloseProfile").addEventListener("click", v7CloseProfile);
  modal.addEventListener("mousedown", (event) => {
    if (event.target === modal) v7CloseProfile();
  });
}

function v7CloseProfile() {
  byId("v7ProfileModal")?.classList.remove("visible");
  document.body.classList.remove("modal-open");
}

function v7ShowProfile(kicker, title, html) {
  v7EnsureProfileModal();
  text("v7ProfileKicker", kicker);
  text("v7ProfileTitle", title);
  byId("v7ProfileBody").innerHTML = html;
  byId("v7ProfileModal").classList.add("visible");
  document.body.classList.add("modal-open");
}

function v7InfoField(label, value) {
  return `
    <div class="v7-info-field">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(String(value || "—"))}</strong>
    </div>
  `;
}

function v7OpenStudentProfile(studentId) {
  const student = v6GetStudentById(studentId);
  if (!student) {
    showToast("Student not found in the live database.", "error");
    return;
  }

  const enrolments = v7ActiveEnrolmentsForStudent(studentId);

  const enrolmentHtml = enrolments.length
    ? enrolments.map((enrolment) => {
        const classRecord = v6GetClassById(enrolment["Class ID"]);
        const classId = String(enrolment["Class ID"] || "");
        return `
          <div class="v7-enrolment-card">
            <div>
              <strong>${escapeHtml(classRecord?.["Class Name"] || classId)}</strong>
              <span>${escapeHtml([
                classRecord?.["Level"],
                classRecord?.["Day"],
                classRecord?.["Time"]
              ].filter(Boolean).join(" · ") || "Class details not completed")}</span>
            </div>
            <div class="v7-enrolment-meta">
              <span>Slot ${escapeHtml(enrolment["Register Slot"] || "—")}</span>
              <span>${escapeHtml(enrolment["School Year"] || classRecord?.["School Year"] || "—")}</span>
              <button class="button button-secondary button-small" type="button"
                data-v7-profile-open-class="${escapeHtml(classId)}">Open class</button>
            </div>
          </div>
        `;
      }).join("")
    : `<p class="muted">No active enrolments found for this student.</p>`;

  v7ShowProfile(
    "Student profile · Live TEST data",
    v7StudentFullName(student),
    `
      <div class="v7-profile-status-row">
        <span class="status-pill">${escapeHtml(student["Status"] || "—")}</span>
        <span class="live-readonly-badge">Master record · read-only</span>
      </div>

      <div class="v7-info-grid">
        ${v7InfoField("Student ID", student["Student ID"])}
        ${v7InfoField("Email", student["Email"])}
        ${v7InfoField("Phone", student["Phone"])}
        ${v7InfoField("Date of birth", student["Date of Birth"] || student["DOB"])}
        ${v7InfoField("Parent / guardian", student["Parent / Guardian"] || student["Parent"])}
        ${v7InfoField("Notes", student["Notes"])}
      </div>

      <div class="v7-profile-section">
        <div class="v7-profile-section-head">
          <h4>Current enrolments</h4>
          <span>${enrolments.length}</span>
        </div>
        ${enrolmentHtml}
      </div>

      <p class="live-editor-help">
        V7 intentionally keeps master student data read-only. Register feedback and attendance continue to save through the proven V6 register editor.
      </p>
    `
  );

  byId("v7ProfileBody")
    .querySelectorAll("[data-v7-profile-open-class]")
    .forEach((button) => {
      button.addEventListener("click", async () => {
        const classId = button.dataset.v7ProfileOpenClass;
        v7CloseProfile();
        v6SelectedClassId = classId;
        navigateTo("classes");
        renderClasses();
        await loadV6ClassRegister(classId, true);
      });
    });
}

function v7OpenClassProfile(classId) {
  const classRecord = v6GetClassById(classId);
  if (!classRecord) {
    showToast("Class not found in the live database.", "error");
    return;
  }

  const enrolments = v6ActiveEnrolmentsForClass(classId);
  const studentsHtml = enrolments.length
    ? enrolments.map((enrolment) => {
        const student = v6GetStudentById(enrolment["Student ID"]);
        const studentId = String(enrolment["Student ID"] || "");
        return `
          <button class="v7-student-link-card" type="button"
            data-v7-class-student="${escapeHtml(studentId)}">
            <div>
              <strong>${escapeHtml(v7StudentFullName(student))}</strong>
              <span>${escapeHtml(studentId)}</span>
            </div>
            <span>Register slot ${escapeHtml(enrolment["Register Slot"] || "—")} →</span>
          </button>
        `;
      }).join("")
    : `<p class="muted">No active enrolments found for this class.</p>`;

  v7ShowProfile(
    "Class profile · Live TEST data",
    String(classRecord["Class Name"] || classId),
    `
      <div class="v7-profile-status-row">
        <span class="status-pill">${escapeHtml(classRecord["Status"] || "Active")}</span>
        <span class="live-readonly-badge">${escapeHtml(classId)}</span>
      </div>

      <div class="v7-info-grid">
        ${v7InfoField("School year", classRecord["School Year"])}
        ${v7InfoField("Level", classRecord["Level"])}
        ${v7InfoField("Teacher", classRecord["Teacher"])}
        ${v7InfoField("Day", classRecord["Day"])}
        ${v7InfoField("Time", classRecord["Time"])}
        ${v7InfoField("Room", classRecord["Room"])}
        ${v7InfoField("Capacity", classRecord["Capacity"])}
        ${v7InfoField("Register sheet", classRecord["Register Sheet"])}
      </div>

      <div class="v7-profile-section">
        <div class="v7-profile-section-head">
          <h4>Enrolled students</h4>
          <span>${enrolments.length}</span>
        </div>
        <div class="v7-student-link-list">${studentsHtml}</div>
      </div>

      <div class="v7-profile-footer-actions">
        <button class="button button-primary" id="v7ProfileOpenRegister" type="button">
          Open lesson register
        </button>
      </div>
    `
  );

  byId("v7ProfileBody")
    .querySelectorAll("[data-v7-class-student]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        v7OpenStudentProfile(button.dataset.v7ClassStudent);
      });
    });

  byId("v7ProfileOpenRegister")?.addEventListener("click", async () => {
    v7CloseProfile();
    v6SelectedClassId = classId;
    navigateTo("classes");
    renderClasses();
    await loadV6ClassRegister(classId, true);
    byId("class1LivePanel")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}


/* =========================================================
   V8 — STUDENT & ENROLMENT MANAGEMENT
   ---------------------------------------------------------
   Live TEST Google Sheets writes:
   - create/update student master record
   - create enrolment
   - automatically allocate register slot
   - end enrolment without deleting history
========================================================= */

async function v8Post(action, payload = {}) {
  const response = await fetch(LLS_API_URL, {
    method: "POST",
    cache: "no-store",
    redirect: "follow",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify({
      action,
      ...payload
    })
  });

  const raw = await response.text();
  let data;

  try {
    data = JSON.parse(raw);
  } catch (error) {
    throw new Error("The Apps Script did not return JSON.");
  }

  if (!data || data.success !== true) {
    throw new Error(data?.error || "The Google Sheets update failed.");
  }

  return data;
}

async function v8ReloadLiveData() {
  v6PortalDataLoaded = false;
  studentsLiveLoaded = false;
  await loadV6PortalData(true);
  renderAll();
}

function v8SetBusy(buttonId, busy, busyText, normalText) {
  const button = byId(buttonId);
  if (!button) return;

  button.disabled = busy;
  button.textContent = busy ? busyText : normalText;
}

/* -------------------------
   STUDENT FORM — LIVE
------------------------- */

function openNewStudent() {
  byId("studentForm").reset();
  setValue("studentId", "");
  setValue("studentStatus", "Active");
  setValue("studentJoined", isoDate(new Date()));

  text("studentModalTitle", "Add student");
  openModal("studentModal");
}

function openEditStudent(id) {
  const student = v6GetStudentById(id);

  if (!student) {
    showToast("Student not found in the live database.", "error");
    return;
  }

  setValue("studentId", student["Student ID"] || "");
  setValue("studentFirstName", student["First Name"] || "");
  setValue("studentLastName", student["Surname"] || "");
  setValue("studentEmail", student["Email"] || "");
  setValue("studentPhone", student["Phone"] || "");
  setValue("studentDob", student["Date of Birth"] || student["DOB"] || "");
  setValue("studentLevel", student["Level"] || "");
  setValue("studentStatus", student["Status"] || "Active");
  setValue("studentJoined", student["Joined"] || "");
  setValue(
    "studentParent",
    student["Parent / Guardian"] || student["Parent"] || ""
  );
  setValue("studentNotes", student["Notes"] || "");

  text("studentModalTitle", `Edit ${v7StudentFullName(student)}`);
  openModal("studentModal");
}

async function saveStudentForm(event) {
  event.preventDefault();

  const studentId = value("studentId").trim();
  const firstName = value("studentFirstName").trim();
  const surname = value("studentLastName").trim();

  if (!firstName || !surname) {
    showToast("First name and surname are required.", "error");
    return;
  }

  const fields = {
    "First Name": firstName,
    "Surname": surname,
    "Email": value("studentEmail").trim(),
    "Phone": value("studentPhone").trim(),
    "Date of Birth": value("studentDob"),
    "Level": value("studentLevel"),
    "Status": value("studentStatus") || "Active",
    "Joined": value("studentJoined"),
    "Parent / Guardian": value("studentParent").trim(),
    "Notes": value("studentNotes").trim()
  };

  v8SetBusy(
    "studentSaveButton",
    true,
    "Saving…",
    studentId ? "Save changes" : "Save student"
  );

  try {
    const result = await v8Post(
      studentId ? "updateStudent" : "createStudent",
      studentId
        ? { studentId, fields }
        : { fields }
    );

    closeModal("studentModal");
    await v8ReloadLiveData();

    const savedId = String(result.studentId || studentId || "");
    showToast(
      studentId ? "Student updated in Google Sheets." : `Student ${savedId} created.`,
      "success"
    );

    if (savedId) {
      v7OpenStudentProfile(savedId);
    }

  } catch (error) {
    showToast(error.message, "error");
  } finally {
    v8SetBusy(
      "studentSaveButton",
      false,
      "",
      studentId ? "Save changes" : "Save student"
    );
  }
}

/* -------------------------
   ENROLMENT FORM
------------------------- */

function v8PopulateEnrolmentClassSelect() {
  const select = byId("enrolmentClassId");
  if (!select) return;

  const activeClasses = v6PortalData.classes.filter((item) => {
    const status = String(item["Status"] || "").trim().toLowerCase();
    return !status || status === "active";
  });

  select.innerHTML = `
    <option value="">Select class</option>
    ${activeClasses.map((item) => `
      <option value="${escapeHtml(item["Class ID"] || "")}">
        ${escapeHtml(item["Class Name"] || item["Class ID"] || "Unnamed class")}
        ${item["School Year"] ? ` · ${escapeHtml(item["School Year"])}` : ""}
      </option>
    `).join("")}
  `;
}

function v8OpenEnrolment(studentId) {
  const student = v6GetStudentById(studentId);

  if (!student) {
    showToast("Student not found in the live database.", "error");
    return;
  }

  byId("enrolmentForm").reset();
  setValue("enrolmentStudentId", studentId);
  setValue("enrolmentStudentName", v7StudentFullName(student));
  setValue("enrolmentSchoolYear", "2026-27");
  setValue("enrolmentStartDate", isoDate(new Date()));

  v8PopulateEnrolmentClassSelect();
  text("enrolmentModalTitle", `Enrol ${v7StudentFullName(student)}`);
  openModal("enrolmentModal");
}

async function v8SaveEnrolment(event) {
  event.preventDefault();

  const studentId = value("enrolmentStudentId").trim();
  const classId = value("enrolmentClassId").trim();
  const schoolYear = value("enrolmentSchoolYear").trim();
  const startDate = value("enrolmentStartDate");

  if (!studentId || !classId || !schoolYear) {
    showToast("Student, class and school year are required.", "error");
    return;
  }

  v8SetBusy("enrolmentSaveButton", true, "Creating…", "Create enrolment");

  try {
    const result = await v8Post("createEnrolment", {
      studentId,
      classId,
      schoolYear,
      startDate
    });

    closeModal("enrolmentModal");
    await v8ReloadLiveData();

    showToast(
      `Enrolment created · register slot ${result.registerSlot}.`,
      "success"
    );

    v7OpenStudentProfile(studentId);

  } catch (error) {
    showToast(error.message, "error");
  } finally {
    v8SetBusy("enrolmentSaveButton", false, "", "Create enrolment");
  }
}

async function v8EndEnrolment(enrolmentId, studentId) {
  openConfirm(
    "End this enrolment?",
    "The enrolment will be marked Completed and kept in Google Sheets for history. It will not be deleted.",
    async () => {
      try {
        await v8Post("endEnrolment", { enrolmentId });
        await v8ReloadLiveData();
        showToast("Enrolment completed.", "success");
        v7OpenStudentProfile(studentId);
      } catch (error) {
        showToast(error.message, "error");
      }
    },
    "End enrolment"
  );
}

/* -------------------------
   STUDENT PROFILE — V8
------------------------- */

function v7OpenStudentProfile(studentId) {
  const student = v6GetStudentById(studentId);

  if (!student) {
    showToast("Student not found in the live database.", "error");
    return;
  }

  const enrolments = v7ActiveEnrolmentsForStudent(studentId);

  const enrolmentHtml = enrolments.length
    ? enrolments.map((enrolment) => {
        const classRecord = v6GetClassById(enrolment["Class ID"]);
        const classId = String(enrolment["Class ID"] || "");
        const enrolmentId = String(enrolment["Enrolment ID"] || "");

        return `
          <div class="v7-enrolment-card">
            <div>
              <strong>${escapeHtml(classRecord?.["Class Name"] || classId)}</strong>
              <span>${escapeHtml([
                classRecord?.["Level"],
                classRecord?.["Day"],
                classRecord?.["Time"]
              ].filter(Boolean).join(" · ") || "Class details not completed")}</span>
            </div>

            <div class="v7-enrolment-meta">
              <span>Slot ${escapeHtml(enrolment["Register Slot"] || "—")}</span>
              <span>${escapeHtml(enrolment["School Year"] || classRecord?.["School Year"] || "—")}</span>

              <div class="v8-enrolment-actions">
                <button class="button button-secondary button-small" type="button"
                  data-v7-profile-open-class="${escapeHtml(classId)}">
                  Open class
                </button>

                <button class="button button-secondary button-small v8-danger-button" type="button"
                  data-v8-end-enrolment="${escapeHtml(enrolmentId)}">
                  End enrolment
                </button>
              </div>
            </div>
          </div>
        `;
      }).join("")
    : `<p class="muted">No active enrolments found for this student.</p>`;

  v7ShowProfile(
    "Student profile · Live TEST data",
    v7StudentFullName(student),
    `
      <div class="v7-profile-status-row">
        <span class="status-pill">${escapeHtml(student["Status"] || "—")}</span>
        <span class="v8-test-badge">Google Sheets master record</span>
      </div>

      <div class="v8-profile-actions">
        <button class="button button-secondary" id="v8EditStudentButton" type="button">
          Edit student
        </button>
        <button class="button button-primary" id="v8AddEnrolmentButton" type="button">
          + Add enrolment
        </button>
      </div>

      <div class="v7-info-grid">
        ${v7InfoField("Student ID", student["Student ID"])}
        ${v7InfoField("Email", student["Email"])}
        ${v7InfoField("Phone", student["Phone"])}
        ${v7InfoField("Date of birth", student["Date of Birth"] || student["DOB"])}
        ${v7InfoField("Current level", student["Level"])}
        ${v7InfoField("Joined", student["Joined"])}
        ${v7InfoField("Parent / guardian", student["Parent / Guardian"] || student["Parent"])}
        ${v7InfoField("Notes", student["Notes"])}
      </div>

      <div class="v7-profile-section">
        <div class="v7-profile-section-head">
          <h4>Current enrolments</h4>
          <span>${enrolments.length}</span>
        </div>
        ${enrolmentHtml}
      </div>

      <p class="live-editor-help">
        V8 TEST mode: student and enrolment changes now save to Google Sheets.
        Do not enter real personal data until authentication and permissions are implemented.
      </p>
    `
  );

  byId("v8EditStudentButton")?.addEventListener("click", () => {
    v7CloseProfile();
    openEditStudent(studentId);
  });

  byId("v8AddEnrolmentButton")?.addEventListener("click", () => {
    v7CloseProfile();
    v8OpenEnrolment(studentId);
  });

  byId("v7ProfileBody")
    .querySelectorAll("[data-v7-profile-open-class]")
    .forEach((button) => {
      button.addEventListener("click", async () => {
        const classId = button.dataset.v7ProfileOpenClass;
        v7CloseProfile();
        v6SelectedClassId = classId;
        navigateTo("classes");
        renderClasses();
        await loadV6ClassRegister(classId, true);
      });
    });

  byId("v7ProfileBody")
    .querySelectorAll("[data-v8-end-enrolment]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const enrolmentId = button.dataset.v8EndEnrolment;
        v8EndEnrolment(enrolmentId, studentId);
      });
    });
}

/* -------------------------
   V8 INITIALISATION ADD-ON
------------------------- */

document.addEventListener("DOMContentLoaded", () => {
  byId("enrolmentForm")?.addEventListener("submit", v8SaveEnrolment);

  // V7 intentionally disabled master-data writes. V8 enables student
  // creation/editing while class creation remains locked for a later release.
  ["addStudentButton", "quickStudentButton"].forEach((id) => {
    const button = byId(id);
    if (!button) return;
    button.disabled = false;
    button.title = "";
    button.classList.remove("v7-disabled-master-write");
  });
});

