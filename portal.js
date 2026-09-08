/* ============================================================
   CLASS 1 NEW — LIVE GOOGLE SHEET CONNECTION
   Paste this entire block at the VERY END of portal.js
   ============================================================ */

(() => {
  "use strict";

  const CLASS1_API =
    "https://script.google.com/macros/s/AKfycbyHbfFoaiMOT1rpY2DcbXAkuNwMoOHVdLlG2aQLgPgCe5gqPuyk8VYm7i4eGQRm8iqi/exec";

  function safe(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function createPanel() {
    const classGrid = document.getElementById("classGrid");

    if (!classGrid) {
      console.error("LLS: classGrid was not found.");
      return null;
    }

    let panel = document.getElementById("class1LivePanel");

    if (!panel) {
      panel = document.createElement("div");
      panel.id = "class1LivePanel";

      panel.style.cssText = `
        background: white;
        border: 1px solid #dfe3e8;
        border-radius: 14px;
        padding: 20px;
        margin-bottom: 20px;
        box-shadow: 0 2px 8px rgba(0,0,0,.06);
      `;

      classGrid.parentNode.insertBefore(panel, classGrid);
    }

    return panel;
  }

  function showLoading() {
    const panel = createPanel();
    if (!panel) return;

    panel.innerHTML = `
      <div style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        gap:15px;
      ">
        <div>
          <div style="
            font-size:12px;
            font-weight:700;
            text-transform:uppercase;
            color:#6b7280;
            margin-bottom:4px;
          ">
            Live Google Sheet
          </div>

          <h2 style="margin:0;">
            Class 1 NEW
          </h2>
        </div>

        <strong style="color:#d97706;">
          CONNECTING...
        </strong>
      </div>

      <p style="color:#6b7280;margin-top:12px;">
        Loading Class 1 NEW from Google Sheets.
      </p>
    `;
  }

  function showError(message) {
    const panel = createPanel();
    if (!panel) return;

    panel.innerHTML = `
      <div style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        gap:15px;
      ">
        <div>
          <div style="
            font-size:12px;
            font-weight:700;
            text-transform:uppercase;
            color:#6b7280;
            margin-bottom:4px;
          ">
            Live Google Sheet
          </div>

          <h2 style="margin:0;">
            Class 1 NEW
          </h2>
        </div>

        <strong style="color:#b91c1c;">
          CONNECTION ERROR
        </strong>
      </div>

      <div style="
        margin-top:15px;
        padding:12px;
        background:#fee2e2;
        border:1px solid #fecaca;
        border-radius:8px;
        color:#991b1b;
      ">
        ${safe(message)}
      </div>

      <button
        id="class1RetryButton"
        type="button"
        style="
          margin-top:12px;
          padding:9px 14px;
          border:0;
          border-radius:8px;
          background:#1f2937;
          color:white;
          cursor:pointer;
        "
      >
        Retry connection
      </button>
    `;

    document
      .getElementById("class1RetryButton")
      ?.addEventListener("click", loadClass1);
  }

  function showClass(data) {
    const panel = createPanel();
    if (!panel) return;

    const lessons = Array.isArray(data.lessons)
      ? data.lessons
      : [];

    const rows = lessons
      .filter((lesson) => {
        return [
          lesson["Lesson"],
          lesson["Date"],
          lesson["Teacher"],
          lesson["Record of work / pages covered"],
          lesson["Homework set"],
          lesson["Lesson complete?"]
        ].some((value) => String(value || "").trim());
      })
      .map((lesson) => {
        return `
          <tr>
            <td>${safe(lesson["Month"] || "")}</td>
            <td>${safe(lesson["Lesson"] || "")}</td>
            <td>${safe(lesson["Date"] || "")}</td>
            <td>${safe(lesson["Teacher"] || "")}</td>
            <td>${safe(
              lesson["Record of work / pages covered"] || ""
            )}</td>
            <td>${safe(
              lesson["Homework set"] || ""
            )}</td>
            <td>${safe(
              lesson["Due date"] || ""
            )}</td>
            <td>${safe(
              lesson["Lesson complete?"] || ""
            )}</td>
          </tr>
        `;
      })
      .join("");

    panel.innerHTML = `
      <div style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        gap:15px;
        margin-bottom:15px;
      ">
        <div>
          <div style="
            font-size:12px;
            font-weight:700;
            text-transform:uppercase;
            color:#6b7280;
            margin-bottom:4px;
          ">
            Live Google Sheet
          </div>

          <h2 style="margin:0;">
            Class 1 NEW
          </h2>
        </div>

        <div style="
          display:flex;
          align-items:center;
          gap:12px;
        ">
          <strong style="color:#15803d;">
            ● CONNECTED
          </strong>

          <button
            id="class1RefreshButton"
            type="button"
            style="
              padding:8px 13px;
              border:1px solid #d1d5db;
              border-radius:8px;
              background:white;
              cursor:pointer;
            "
          >
            Refresh
          </button>
        </div>
      </div>

      <div style="
        display:flex;
        gap:20px;
        flex-wrap:wrap;
        margin-bottom:15px;
      ">
        <div>
          <strong>${lessons.length}</strong>
          <span style="color:#6b7280;">
            register rows returned
          </span>
        </div>

        <div>
          <strong>${safe(data.sheet)}</strong>
          <span style="color:#6b7280;">
            source sheet
          </span>
        </div>
      </div>

      <div style="overflow:auto;">
        <table style="
          width:100%;
          border-collapse:collapse;
          min-width:900px;
        ">
          <thead>
            <tr style="text-align:left;background:#f8fafc;">
              <th style="padding:10px;border-bottom:1px solid #ddd;">Month</th>
              <th style="padding:10px;border-bottom:1px solid #ddd;">Lesson</th>
              <th style="padding:10px;border-bottom:1px solid #ddd;">Date</th>
              <th style="padding:10px;border-bottom:1px solid #ddd;">Teacher</th>
              <th style="padding:10px;border-bottom:1px solid #ddd;">Record of work</th>
              <th style="padding:10px;border-bottom:1px solid #ddd;">Homework</th>
              <th style="padding:10px;border-bottom:1px solid #ddd;">Due date</th>
              <th style="padding:10px;border-bottom:1px solid #ddd;">Complete?</th>
            </tr>
          </thead>

          <tbody>
            ${
              rows ||
              `
                <tr>
                  <td
                    colspan="8"
                    style="
                      padding:20px;
                      text-align:center;
                      color:#6b7280;
                    "
                  >
                    Connected successfully, but there are no populated lesson rows yet.
                  </td>
                </tr>
              `
            }
          </tbody>
        </table>
      </div>
    `;

    document
      .getElementById("class1RefreshButton")
      ?.addEventListener("click", loadClass1);
  }

  async function loadClass1() {
    showLoading();

    try {
      const url =
        CLASS1_API +
        "?action=getClass1&t=" +
        Date.now();

      console.log("LLS: requesting Class 1 NEW", url);

      const response = await fetch(url, {
        method: "GET",
        cache: "no-store",
        redirect: "follow"
      });

      if (!response.ok) {
        throw new Error(
          "HTTP error " + response.status
        );
      }

      const data = await response.json();

      console.log("LLS: Class 1 response", data);

      if (!data) {
        throw new Error(
          "No data was returned from Apps Script."
        );
      }

      if (data.success !== true) {
        throw new Error(
          data.error ||
          "Apps Script returned success:false"
        );
      }

      if (data.sheet !== "Class 1 NEW") {
        throw new Error(
          'Expected "Class 1 NEW" but received "' +
          data.sheet +
          '".'
        );
      }

      if (!Array.isArray(data.lessons)) {
        throw new Error(
          "The Apps Script response does not contain a lessons array."
        );
      }

      showClass(data);

    } catch (error) {
      console.error(
        "LLS Class 1 connection failed:",
        error
      );

      showError(
        error.message ||
        String(error)
      );
    }
  }

  function start() {
    if (!document.getElementById("classGrid")) {
      console.error(
        "LLS: Classes page element #classGrid does not exist."
      );
      return;
    }

    loadClass1();
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      start
    );
  } else {
    start();
  }
})();