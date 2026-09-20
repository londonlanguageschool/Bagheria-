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
}

async function saveStudentForm(event) {
  event.preventDefault();
  const id=value("studentId").trim();
  const firstName=value("studentFirstName").trim();
  const lastName=value("studentLastName").trim();
  const isConversion=!id && Boolean(pendingConversionEnquiryId);
  const classId=value("studentClass");
  if(!firstName||!lastName){showToast("First name and surname are required.","error");return;}
  if(isConversion&&!classId){showToast("Choose a class before completing enrolment.","error");return;}

  const schoolYear=String(byId("conversionSchoolYear")?.value||"2026-27").trim();
  const courseFee=Number(byId("conversionCourseFee")?.value||0);
  const discount=Number(byId("conversionDiscount")?.value||0);
  const paymentPlan=String(byId("conversionPaymentPlan")?.value||"3 instalments");
  if(isConversion&&courseFee<=0){showToast("Enter the agreed course fee.","error");return;}
  if(isConversion&&(discount<0||discount>courseFee)){showToast("Check the discount amount.","error");return;}

  const button=byId("studentForm")?.querySelector('button[type="submit"]');
  const oldLabel=button?.textContent||(id?"Save changes":"Save student");
  if(button){button.disabled=true;button.textContent=isConversion?"Completing enrolment…":"Saving…";}

  const fields={"First Name":firstName,"Surname":lastName,"Email":value("studentEmail").trim(),"Phone":value("studentPhone").trim(),"Date of Birth":value("studentDob"),"Level":value("studentLevel"),"Class":classId,"Status":value("studentStatus")||"Active","Joined":value("studentJoined")||isoDate(new Date()),"Parent / Guardian":value("studentParent").trim(),"Notes":value("studentNotes").trim()};

  try{
    const result=await llsApiPost(id?{action:"updateStudent",studentId:id,fields}:{action:"createStudent",fields});
    const studentId=String(result.studentId||id||"").trim();
    if(!studentId) throw new Error("Student saved but no Student ID was returned.");

    if(isConversion){
      const enquiry=state.enquiries.find(item=>item.id===pendingConversionEnquiryId);
      if(!enquiry) throw new Error("Original enquiry could not be found.");

      const enrolment=await llsApiPost({action:"createEnrolment",studentId,classId,schoolYear,startDate:value("studentJoined")||isoDate(new Date())});
      await llsApiPost({action:"createFee",fields:{"Student ID":studentId,"Enrolment ID":enrolment.enrolmentId||"","School Year":schoolYear,"Course Fee":courseFee,"Discount":discount,"Amount Due":Math.max(0,courseFee-discount),"Payment Plan":paymentPlan,"Status":"Open","Notes":`Created from enquiry ${enquiry.id}.`}});

      await llsApiPost({action:"updateEnquiry",enquiryId:enquiry.id,fields:{"Name":enquiry.name,"Age":enquiry.age,"Phone":enquiry.phone,"Email":enquiry.email,"Course":enquiry.course,"Source":enquiry.source,"Stage":"Enrolled","Follow-up":"","Enquiry Date":enquiry.created,"Level Result":enquiry.finalLevel||enquiry.levelResult||"","Trial Requested":enquiry.trialDate?"Yes":(enquiry.trialRequested||""),"Notes":[enquiry.notes||"",enquiry.trialDate?`Placement/Trial date: ${enquiry.trialDate}`:"",enquiry.assessment?`Teacher assessment: ${enquiry.assessment}`:"",`Student created: ${studentId}`,enrolment.enrolmentId?`Enrolment created: ${enrolment.enrolmentId}`:""].filter(Boolean).join("\n")}});
    }

    pendingConversionEnquiryId="";
    closeModal("studentModal");
    await Promise.all([llsLoadStudentsFromSheets(),llsLoadEnquiriesFromSheets()]);
    renderAll();
    showToast(isConversion?"Student enrolled: class enrolment and fee account created.":id?"Student updated in Google Sheets.":`Student ${studentId} created in Google Sheets.`,"success");
  }catch(error){
    console.error("LLS student/enrolment save failed:",error);
    showToast(error?.message||"Could not complete enrolment.","error");
  }finally{
    if(button){button.disabled=false;button.textContent=oldLabel;}
  }
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
  setValue("classSchoolYear", "2026-27");
  setValue("classCapacity", "10");
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
  setValue("classRoom", item.room);
  setValue("classCapacity", item.capacity || 10);
  setValue("classRegisterSheet", item.registerSheet || "");
  setValue("classStatus", item.status || "Active");

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

  try {
    await llsApiPost(
      id
        ? { action: "updateClass", classId: id, fields }
        : { action: "createClass", fields }
    );

    closeModal("classModal");
    await llsLoadClassesFromSheets();
    renderAll();

    showToast(
      id ? "Class updated in Google Sheets." : "Class created in Google Sheets.",
      "success"
    );
  } catch (error) {
    console.error("LLS class save failed:", error);
    showToast(
      "Could not save the class. Nothing was changed.",
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
  const response = await fetch(LLS_API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const result = await response.json();

  if (!result || result.success === false) {
    throw new Error(
      (result && (result.error || result.message)) ||
      "The server did not confirm the change."
    );
  }

  return result;
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
    showToast(
      "Could not save the enquiry. Nothing was changed. Please try again.",
      "error"
    );
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
          "Could not delete the enquiry. Nothing was changed.",
          "error"
        );
      }
    }
  );
}


let pendingConversionEnquiryId = "";

function convertEnquiryToStudent(id) {
  const enquiry = state.enquiries.find((item) => item.id === id);
  if (!enquiry) return;

  pendingConversionEnquiryId = id;

  const parts = String(enquiry.name || "").trim().split(/\s+/);
  const firstName = parts.shift() || "";
  const lastName = parts.join(" ");

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

async function llsLoadStudentsFromSheets() {
  try {
    const response = await fetch(`${LLS_API_URL}?action=getStudents&_=${Date.now()}`, {
      method: "GET",
      cache: "no-store"
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const payload = await response.json();
    if (!payload || payload.success === false) {
      throw new Error(
        (payload && (payload.error || payload.message)) ||
        "The server did not return students."
      );
    }

    const rows = Array.isArray(payload.students) ? payload.students : [];

    state.students = rows.map((r) => ({
      id: r["Student ID"] || r.id || "",
      firstName: r["First Name"] || r.firstName || "",
      lastName: r["Surname"] || r.lastName || "",
      email: r["Email"] || r.email || "",
      phone: r["Phone"] || r.phone || "",
      dob: llsDateOnly(r["Date of Birth"] || r.dob || ""),
      level: r["Level"] || r.level || "",
      classId: r["Class"] || r.classId || "",
      status: r["Status"] || r.status || "Active",
      joined: llsDateOnly(r["Joined"] || r.joined || ""),
      parent: r["Parent / Guardian"] || r.parent || "",
      notes: r["Notes"] || r.notes || ""
    })).filter((student) => student.id);

    saveState();
    renderAll();

    console.info(`LLS: loaded ${state.students.length} students from Google Sheets.`);
    return state.students;
  } catch (error) {
    console.error("LLS: could not load students from Google Sheets:", error);
    showToast(
      "Could not refresh students from Google Sheets. Showing the last available data.",
      "error"
    );
    return null;
  }
}

async function llsLoadClassesFromSheets() {
  try {
    const response = await fetch(`${LLS_API_URL}?action=getClasses&_=${Date.now()}`, {
      method: "GET",
      cache: "no-store"
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const payload = await response.json();
    if (!payload || payload.success === false) {
      throw new Error(
        (payload && (payload.error || payload.message)) ||
        "The server did not return classes."
      );
    }

    const rows = Array.isArray(payload.classes)
      ? payload.classes
      : (Array.isArray(payload.data) ? payload.data : []);

    if (!rows.length) {
      console.info("LLS V2: no remote class rows returned; retaining current classes.");
      return state.classes;
    }

    state.classes = rows.map((r) => ({
      id: String(r["Class ID"] || r.id || ""),
      name: String(r["Class Name"] || r.name || ""),
      schoolYear: String(r["School Year"] || r.schoolYear || "2026-27"),
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
      registerSheet: String(r["Register Sheet"] || r.registerSheet || ""),
      status: String(r["Status"] || r.status || "Active"),
      notes: String(r["Notes"] || r.notes || "")
    })).filter((item) => item.id || item.name);

    saveState();
    populateStudentClassSelect();
    populateAttendanceClassSelect();
    renderAll();

    console.info(`LLS: loaded ${state.classes.length} classes from Google Sheets.`);
    return state.classes;
  } catch (error) {
    console.error("LLS: could not load classes from Google Sheets:", error);
    console.warn("LLS V2: Google class refresh unavailable; retaining current class data.");
    return null;
  }
}

async function llsLoadEnquiriesFromSheets() {
  try {
    const response = await fetch(`${LLS_API_URL}?action=getEnquiries&_=${Date.now()}`, {
      method: "GET",
      cache: "no-store"
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const payload = await response.json();

    if (payload && payload.success === false) {
      throw new Error(payload.error || payload.message || "API returned an error");
    }

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

window.addEventListener("load", () => {
  llsLoadEnquiriesFromSheets();
  llsLoadStudentsFromSheets();
  llsLoadClassesFromSheets();
});


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

