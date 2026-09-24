/* =========================================================
   ATTENDANCE V2 — INITIALISE
========================================================= */

function initialiseAttendanceV2() {
  const classSelect = byId("attendanceClassSelect");
  const dateInput = byId("attendanceDate");
  const saveButton = byId("saveAttendanceButton");

  if (classSelect) {
    classSelect.onchange = function () {
      renderAttendance();
    };
  }

  if (dateInput) {
    dateInput.onchange = function () {
      renderAttendance();
    };
  }

  if (saveButton) {
    saveButton.onclick = function (event) {
      event.preventDefault();
      saveAttendance();
    };
  }

  renderAttendance();
}

window.addEventListener("load", initialiseAttendanceV2);