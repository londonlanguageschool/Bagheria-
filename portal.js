/* =========================================================
   ATTENDANCE — V2 LIVE GOOGLE SHEETS
========================================================= */

let attendanceDraft = {};
let attendanceStudents = [];
let attendanceLoading = false;


/* ---------------------------------------------------------
   Populate class selector
--------------------------------------------------------- */

function populateAttendanceClassSelect() {
  const select = byId("attendanceClassSelect");

  if (!select) return;

  const current = select.value;

  const classes = [...state.classes]
    .filter((item) => !item.status || item.status === "Active")
    .sort((a, b) =>
      String(a.name || "").localeCompare(String(b.name || ""))
    );

  if (!classes.length) {
    select.innerHTML =
      `<option value="">No active classes available</option>`;
    return;
  }

  select.innerHTML = classes
    .map((item) => `
      <option value="${escapeAttribute(item.id)}">
        ${escapeHtml(item.name)}
        ${item.level ? ` — ${escapeHtml(item.level)}` : ""}
      </option>
    `)
    .join("");

  if (
    current &&
    classes.some((item) => item.id === current)
  ) {
    select.value = current;
  }
}


/* ---------------------------------------------------------
   Get students belonging to selected class
--------------------------------------------------------- */

function getAttendanceStudents(classId) {
  if (!classId) return [];

  let students = [];

  /*
   * Preferred V2 method:
   * Students are connected to classes through Enrolments.
   */

  if (
    Array.isArray(state.enrolments) &&
    state.enrolments.length
  ) {
    const studentIds = new Set(
      state.enrolments
        .filter((enrolment) =>
          enrolment.classId === classId &&
          String(enrolment.status || "").toLowerCase() === "active"
        )
        .map((enrolment) => enrolment.studentId)
    );

    students = state.students.filter((student) =>
      studentIds.has(student.id)
    );
  } else {

    /*
     * Temporary compatibility fallback.
     */

    students = state.students.filter(
      (student) => student.classId === classId
    );
  }

  return students
    .filter(
      (student) =>
        !student.status ||
        student.status === "Active"
    )
    .sort((a, b) => {
      const surnameCompare =
        String(a.lastName || "").localeCompare(
          String(b.lastName || "")
        );

      return surnameCompare !== 0
        ? surnameCompare
        : String(a.firstName || "").localeCompare(
            String(b.firstName || "")
          );
    });
}


/* ---------------------------------------------------------
   Main attendance renderer
--------------------------------------------------------- */

async function renderAttendance() {
  populateAttendanceClassSelect();

  const classId = value("attendanceClassSelect");
  const lessonDate = value("attendanceDate");

  const body = byId("attendanceTableBody");

  if (!body) return;

  attendanceDraft = {};
  attendanceStudents = [];

  if (!classId) {
    body.innerHTML =
      tableEmptyRow(
        4,
        "Choose a class to record attendance."
      );

    updateAttendanceSummary([]);

    return;
  }

  if (!lessonDate) {
    body.innerHTML =
      tableEmptyRow(
        4,
        "Choose a lesson date."
      );

    updateAttendanceSummary([]);

    return;
  }

  attendanceStudents =
    getAttendanceStudents(classId);

  if (!attendanceStudents.length) {
    body.innerHTML =
      tableEmptyRow(
        4,
        "No active students are enrolled in this class."
      );

    updateAttendanceSummary([]);

    return;
  }

  attendanceLoading = true;

  body.innerHTML =
    tableEmptyRow(
      4,
      "Loading attendance..."
    );

  setAttendanceSaveState(true);

  try {

    const result =
      await getLiveAttendance(
        classId,
        lessonDate
      );

    const savedByStudent = {};

    (result.attendance || []).forEach(
      (record) => {

        const studentId =
          String(
            record["Student ID"] || ""
          ).trim();

        if (studentId) {
          savedByStudent[studentId] =
            normaliseAttendanceStatus(
              record["Status"]
            );
        }
      }
    );

    /*
     * Default students to Present when there is no
     * previously saved attendance record.
     */

    attendanceStudents.forEach(
      (student) => {

        attendanceDraft[student.id] =
          savedByStudent[student.id] ||
          "Present";
      }
    );

    renderAttendanceRows();

  } catch (error) {

    console.error(
      "Attendance load failed:",
      error
    );

    body.innerHTML =
      tableEmptyRow(
        4,
        "Attendance could not be loaded. Please try again."
      );

    updateAttendanceSummary([]);

    showToast(
      error.message ||
      "Could not load attendance.",
      "error"
    );

  } finally {

    attendanceLoading = false;

    setAttendanceSaveState(false);
  }
}


/* ---------------------------------------------------------
   Load saved attendance from Google Sheets
--------------------------------------------------------- */

async function getLiveAttendance(
  classId,
  lessonDate
) {

  const url =
    `${API_BASE_URL}?action=getAttendance` +
    `&classId=${encodeURIComponent(classId)}` +
    `&lessonDate=${encodeURIComponent(lessonDate)}` +
    `&_=${Date.now()}`;

  const response =
    await fetch(
      url,
      {
        method: "GET",
        cache: "no-store"
      }
    );

  if (!response.ok) {
    throw new Error(
      `Attendance request failed (${response.status}).`
    );
  }

  const result =
    await response.json();

  if (!result.success) {
    throw new Error(
      result.error ||
      "The attendance API returned an error."
    );
  }

  return result;
}


/* ---------------------------------------------------------
   Render student attendance rows
--------------------------------------------------------- */

function renderAttendanceRows() {
  const body =
    byId("attendanceTableBody");

  if (!body) return;

  if (!attendanceStudents.length) {

    body.innerHTML =
      tableEmptyRow(
        4,
        "No students are enrolled in this class."
      );

    updateAttendanceSummary([]);

    return;
  }

  body.innerHTML =
    attendanceStudents
      .map((student) => {

        const current =
          attendanceDraft[student.id] ||
          "Present";

        return `
          <tr>

            <td>
              <div class="student-cell">

                <div class="student-avatar">
                  ${escapeHtml(
                    getInitials(
                      `${student.firstName || ""} ${student.lastName || ""}`
                    )
                  )}
                </div>

                <div>
                  <strong>
                    ${escapeHtml(student.firstName || "")}
                    ${escapeHtml(student.lastName || "")}
                  </strong>

                  <small class="muted">
                    ${escapeHtml(student.id)}
                  </small>
                </div>

              </div>
            </td>

            <td>
              <strong>
                ${escapeHtml(student.level || "—")}
              </strong>
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
                id="attendance-status-${escapeAttribute(student.id)}"
              >
                ${statusBadge(current)}
              </span>
            </td>

          </tr>
        `;
      })
      .join("");

  /*
   * Attach buttons after rows have been rendered.
   */

  body
    .querySelectorAll(
      "[data-attendance-student]"
    )
    .forEach((button) => {

      button.addEventListener(
        "click",
        () => {

          if (attendanceLoading) {
            return;
          }

          const studentId =
            button.dataset.attendanceStudent;

          const status =
            normaliseAttendanceStatus(
              button.dataset.attendanceStatus
            );

          attendanceDraft[studentId] =
            status;

          renderAttendanceChoiceState(
            studentId,
            status
          );

          updateAttendanceSummary(
            attendanceStudents
          );
        }
      );
    });

  updateAttendanceSummary(
    attendanceStudents
  );
}


/* ---------------------------------------------------------
   Attendance status button
--------------------------------------------------------- */

function attendanceButton(
  studentId,
  status,
  current
) {

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


/* ---------------------------------------------------------
   Update button state
--------------------------------------------------------- */

function renderAttendanceChoiceState(
  studentId,
  status
) {

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
        button.dataset.attendanceStatus ===
        status
      ) {
        button.classList.add(
          `selected-${slug(status)}`
        );
      }
    });

  const badge =
    byId(
      `attendance-status-${studentId}`
    );

  if (badge) {
    badge.innerHTML =
      statusBadge(status);
  }
}


/* ---------------------------------------------------------
   Attendance summary cards
--------------------------------------------------------- */

function updateAttendanceSummary(
  students
) {

  const total =
    students.length;

  const statuses =
    students.map(
      (student) =>
        attendanceDraft[student.id] ||
        "Present"
    );

  /*
   * Late counts as attended for attendance-rate purposes.
   */

  const present =
    statuses.filter(
      (status) =>
        status === "Present" ||
        status === "Late"
    ).length;

  const absent =
    statuses.filter(
      (status) =>
        status === "Absent"
    ).length;

  const rate =
    total > 0
      ? Math.round(
          (present / total) * 100
        )
      : 0;

  text(
    "attendanceTotal",
    total
  );

  text(
    "attendancePresent",
    present
  );

  text(
    "attendanceAbsent",
    absent
  );

  text(
    "attendanceRate",
    `${rate}%`
  );
}


/* ---------------------------------------------------------
   Normalise attendance status
--------------------------------------------------------- */

function normaliseAttendanceStatus(
  status
) {

  const value =
    String(status || "")
      .trim()
      .toLowerCase();

  if (value === "absent") {
    return "Absent";
  }

  if (value === "late") {
    return "Late";
  }

  return "Present";
}


/* ---------------------------------------------------------
   Save attendance to Google Sheets
--------------------------------------------------------- */

async function saveAttendance() {

  const classId =
    value(
      "attendanceClassSelect"
    );

  const lessonDate =
    value(
      "attendanceDate"
    );

  if (
    !classId ||
    !lessonDate
  ) {

    showToast(
      "Choose a class and lesson date.",
      "error"
    );

    return;
  }

  if (!attendanceStudents.length) {

    showToast(
      "There are no students to save.",
      "error"
    );

    return;
  }

  const rows =
    attendanceStudents.map(
      (student) => ({
        studentId:
          student.id,

        status:
          attendanceDraft[student.id] ||
          "Present",

        notes: ""
      })
    );

  setAttendanceSaveState(true);

  try {

    const result =
      await sendAttendanceMutation({
        action:
          "saveAttendance",

        classId:
          classId,

        lessonDate:
          lessonDate,

        rows:
          rows
      });

    if (!result.success) {
      throw new Error(
        result.error ||
        "Attendance could not be saved."
      );
    }

    showToast(
      `Attendance saved for ${rows.length} student${
        rows.length === 1 ? "" : "s"
      }.`,
      "success"
    );

    /*
     * Reload from Google Sheets after saving.
     * This verifies that the backend actually saved it.
     */

    await renderAttendance();

    renderNotifications();

  } catch (error) {

    console.error(
      "Attendance save failed:",
      error
    );

    showToast(
      error.message ||
      "Could not save attendance.",
      "error"
    );

  } finally {

    setAttendanceSaveState(false);
  }
}


/* ---------------------------------------------------------
   Send attendance mutation
--------------------------------------------------------- */

async function sendAttendanceMutation(
  payload
) {

  /*
   * Uses the Apps Script V12.3 GET mutation gateway.
   * This avoids the cross-origin POST redirect problem
   * described in the backend.
   */

  const encodedPayload =
    encodeURIComponent(
      JSON.stringify(payload)
    );

  const url =
    `${API_BASE_URL}?action=mutate` +
    `&payload=${encodedPayload}` +
    `&_=${Date.now()}`;

  const response =
    await fetch(
      url,
      {
        method: "GET",
        cache: "no-store"
      }
    );

  if (!response.ok) {
    throw new Error(
      `Attendance save request failed (${response.status}).`
    );
  }

  const result =
    await response.json();

  if (!result.success) {
    throw new Error(
      result.error ||
      "The attendance API returned an error."
    );
  }

  return result;
}


/* ---------------------------------------------------------
   Save button state
--------------------------------------------------------- */

function setAttendanceSaveState(
  busy
) {

  const button =
    byId(
      "saveAttendanceButton"
    );

  if (!button) return;

  button.disabled =
    Boolean(busy);

  button.textContent =
    busy
      ? "Saving..."
      : "Save attendance";
}