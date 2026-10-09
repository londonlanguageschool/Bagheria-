/**
 * LLS deck sync – copies the lesson decks Claude builds into the school Google Drive.
 * Install once (owner, about 2 minutes):
 *  1. Signed in as londonlanguageschoolbagheria@gmail.com, go to script.google.com → New project.
 *  2. Delete what is there, paste ALL of this file, then Save (call the project "LLS deck sync").
 *  3. At the top choose the function `syncNow` → ▶ Run → allow the permissions (Drive + external requests).
 *  4. Then choose `startHourly` → ▶ Run. From now on it checks every hour by itself.
 * What it does: reads the list of finished decks (manifest.json on the school website), downloads any new or
 * changed deck, and puts it in the right Drive folder. It keeps the same Drive file (same link) when a deck is
 * updated, and moves replaced old decks to "9 · Old versions – do not use". It writes a links file
 * ("LLS deck links.json") that Claude reads to point the portal at Drive. It never deletes anything.
 */
const MANIFEST_URL = "https://londonlanguageschool.github.io/Bagheria-/materials/manifest.json";
const LINKS_FILE = "LLS deck links.json";

function syncNow() {
  const res = UrlFetchApp.fetch(MANIFEST_URL + "?t=" + Date.now(), { muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) throw new Error("Can't read the manifest: " + res.getResponseCode());
  const manifest = JSON.parse(res.getContentText());
  const props = PropertiesService.getScriptProperties();
  const done = JSON.parse(props.getProperty("DONE") || "{}"); // path -> {id, v}
  const start = Date.now();
  let changed = 0;
  for (const item of manifest.files) {
    if (Date.now() - start > 4.5 * 60 * 1000) break; // stay under the 6-minute limit; the next run carries on
    const prev = done[item.path];
    if (prev && prev.v === item.v) continue;
    const blob = UrlFetchApp.fetch(manifest.base + item.path + "?v=" + item.v).getBlob().setName(item.name);
    const folder = DriveApp.getFolderById(item.folderId);
    let file = prev && prev.id ? tryGet_(prev.id) : null;
    if (!file) { const it = folder.getFilesByName(item.name); file = it.hasNext() ? it.next() : null; }
    if (file) {
      // same file, new content → the Drive link stays the same
      UrlFetchApp.fetch("https://www.googleapis.com/upload/drive/v3/files/" + file.getId() + "?uploadType=media", {
        method: "patch", contentType: blob.getContentType() || "application/octet-stream", payload: blob.getBytes(),
        headers: { Authorization: "Bearer " + ScriptApp.getOAuthToken() } });
    } else {
      file = folder.createFile(blob);
    }
    file.setDescription("LLS deck " + item.path + " · version " + item.v + " · synced " + new Date().toISOString());
    (item.replaces || []).forEach((oldId) => { const old = tryGet_(oldId); if (old && old.getId() !== file.getId()) old.moveTo(DriveApp.getFolderById(manifest.oldFolderId)); });
    done[item.path] = { id: file.getId(), v: item.v };
    props.setProperty("DONE", JSON.stringify(done));
    changed++;
  }
  writeLinks_(done);
  Logger.log(changed + " deck(s) updated. " + Object.keys(done).length + " of " + manifest.files.length + " in Drive.");
}
function tryGet_(id) { try { const f = DriveApp.getFileById(id); return f.isTrashed() ? null : f; } catch (e) { return null; } }
function writeLinks_(done) {
  const json = JSON.stringify(Object.fromEntries(Object.entries(done).map(([p, d]) => [p, "https://drive.google.com/file/d/" + d.id + "/view"])), null, 1);
  const root = DriveApp.getFolderById("1_AyE9xHLZX-tR057npuZEDeoPWiVDOgB");
  const it = root.getFilesByName(LINKS_FILE);
  if (it.hasNext()) it.next().setContent(json); else root.createFile(LINKS_FILE, json, "application/json");
}
function startHourly() { stopHourly(); ScriptApp.newTrigger("syncNow").timeBased().everyHours(1).create(); syncNow(); }
function stopHourly() { ScriptApp.getProjectTriggers().forEach((t) => { if (t.getHandlerFunction() === "syncNow") ScriptApp.deleteTrigger(t); }); }

