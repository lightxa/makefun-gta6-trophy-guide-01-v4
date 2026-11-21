// Platinum Shift app: renders the six shifts, the checklist, the grind board,
// the missables alarm list and the save page from app/data/trophies.json.
// Everything runs from local files; the only fetch is the app's own data.
import { ShiftStore } from "./store.js";

const SHIFTS = [
  { n: 1, name: "First shift: the opening", hours: "about 6 hours", job: "Chapters 1 and 2, the first story missions, and the cheapest stamp in the game before you leave the opening stretch." },
  { n: 2, name: "Second shift: Vice City rising", hours: "about 6 hours", job: "Chapter 3 and the first heists, plus two alarms that only ring once: a five-man Combat Focus and an unscheduled airport exit." },
  { n: 3, name: "Third shift: the big jobs", hours: "about 8 hours", job: "Chapter 4 and the crew jobs: takedowns, vaults in waiting, and three alarms to clear before the shift ends." },
  { n: 4, name: "Fourth shift: strangers & side streets", hours: "about 10 hours", job: "The stranger strands and the partner jobs: Andy, Kenton, Billy, Randy and Tyrone, eight strands in all, and most of the alarm list." },
  { n: 5, name: "Fifth shift: the long grind", hours: "about 20 hours", job: "Activities and collectibles: the counters, the ranges, the races and the money. The longest shift; take it in pieces." },
  { n: 6, name: "Sixth shift: the finale", hours: "about 10 hours", job: "The final mission, 100% completion, and the platinum punch-out. Nothing new starts here; everything gets finished." },
];

const VIEWS = ["shifts", "checklist", "grind", "missables", "save"];
const KIND_LABELS = { story: "Story", missable: "Missable", collectibles: "Collectibles", activities: "Activities", online: "Online", platinum: "Platinum" };

let trophies = [];
let state = ShiftStore.loadState();
let kindFilter = "all";
let gradeFilter = "all";

const $ = (id) => document.getElementById(id);
const el = (tag, cls, text) => {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
};
function fmtMinutes(min) {
  if (min >= 60) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m ? h + " h " + m + " min" : h + " h";
  }
  return min + " min";
}
function fmtTarget(t, id) {
  if (id === 52 || id === 53) return "$" + t.toLocaleString("en-US");
  return String(t);
}
function verdictLabel(v) {
  return v === "now" ? "Do now" : v === "later" ? "Save for later" : "Anytime";
}
function effortDots(n) {
  return "●".repeat(n) + "○".repeat(5 - n);
}
function isEarned(t) {
  return Boolean(state.earned[t.id]);
}
function persist() {
  ShiftStore.saveState(state);
  renderTimecard();
}

function renderTimecard() {
  const earned = trophies.filter(isEarned);
  $("earnedCount").textContent = String(earned.length);
  $("barFill").style.width = (earned.length / 55) * 100 + "%";
  const counts = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const t of earned) counts[t.grade] = (counts[t.grade] || 0) + 1;
  $("gradeCounts").textContent =
    counts.platinum + " platinum · " + counts.gold + " gold · " + counts.silver + " silver · " + counts.bronze + " bronze";
  const next = SHIFTS.find((s) => trophies.some((t) => t.shift === s.n && !isEarned(t)));
  $("nextUp").textContent = next
    ? "Next shift: Shift " + next.n + ", " + next.name.replace(/^.*?: /, "") + "."
    : "All six shifts done: punch out, legend.";
  const parts = SHIFTS.map((s) => {
    const inShift = trophies.filter((t) => t.shift === s.n);
    const done = inShift.filter(isEarned).length;
    return "S" + s.n + " " + done + "/" + inShift.length;
  });
  $("shiftProgress").textContent = "Per shift: " + parts.join(" · ");
}

function spoilerHidden(t) {
  return state.spoiler && t.kind === "story" && !isEarned(t);
}

function openDetail(t) {
  const box = $("detail");
  box.hidden = false;
  box.innerHTML = "";
  const close = el("button", "close", "Close");
  close.type = "button";
  close.addEventListener("click", () => {
    box.hidden = true;
    box.innerHTML = "";
  });
  box.append(close);
  box.append(el("h2", null, spoilerHidden(t) ? "Hidden trophy" : t.name));
  const grade = el("p", "grade " + t.grade, t.grade + " trophy" + (t.hidden ? " · hidden on PlayStation" : ""));
  box.append(grade);
  box.append(el("p", "official", spoilerHidden(t) ? "Spoilers are off: earn this story trophy to reveal its official description." : "Official description: “" + t.description + "”"));
  const facts = el("p", "facts",
    "Shift " + t.shift + " · Effort " + effortDots(t.effort) + " · about " + fmtMinutes(t.minutes) +
    " · Verdict: " + verdictLabel(t.verdict) + (t.target ? " · PSN target: " + fmtTarget(t.target, t.id) : ""));
  box.append(facts);
  if (t.missable) {
    box.append(el("p", "alarm-box", "⚠ ALARM — missable: a one-time moment or a strict condition. Replay the mission or reload a save from before it if it does not pop."));
  }
  box.append(el("p", null, spoilerHidden(t) ? "Guide hidden until earned." : t.guide));
  const src = el("p", "sources", "Sources: " + t.sources + " Official list: exophase.com (GTA 6 trophies) and psnprofiles.com (trophies/43531).");
  box.append(src);
  const earn = el("button", "earn-btn", isEarned(t) ? "✓ Stamped — tap to unstamp" : "Stamp as earned");
  earn.type = "button";
  earn.addEventListener("click", () => {
    if (isEarned(t)) delete state.earned[t.id];
    else state.earned[t.id] = true;
    persist();
    renderAll();
    openDetail(t);
  });
  box.append(earn);
}

function trophyNameButton(t) {
  const b = el("button", "tname", spoilerHidden(t) ? "Hidden trophy — earn to reveal" : t.name);
  b.type = "button";
  b.addEventListener("click", () => openDetail(t));
  return b;
}

function renderShifts() {
  const list = $("shiftList");
  list.innerHTML = "";
  for (const s of SHIFTS) {
    const card = el("article", "shift-card");
    card.append(el("h2", null, "Shift " + s.n + " — " + s.name));
    card.append(el("p", "shift-meta", s.hours + " · " + trophies.filter((t) => t.shift === s.n).length + " trophies · " + trophies.filter((t) => t.shift === s.n && isEarned(t)).length + " stamped"));
    card.append(el("p", "job", s.job));
    const ul = el("ul", "shift-trophies");
    for (const t of trophies.filter((x) => x.shift === s.n)) {
      const li = el("li");
      li.append(el("span", "grade " + t.grade, t.grade.slice(0, 4) + "."));
      const name = trophyNameButton(t);
      if (isEarned(t)) name.prepend(el("span", "done-mark", "✓ "));
      li.append(name);
      if (t.missable) li.append(el("span", "verdict now", "Alarm"));
      li.append(el("span", "verdict " + t.verdict, verdictLabel(t.verdict)));
      li.append(el("span", "effort", effortDots(t.effort)));
      ul.append(li);
    }
    card.append(ul);
    list.append(card);
  }
}

function renderChecklist() {
  const q = ($("search").value || "").toLowerCase();
  const hideEarned = $("hideEarned").checked;
  const rows = trophies.filter((t) => {
    if (kindFilter === "missable" && !t.missable) return false;
    if (kindFilter === "online") return false;
    if (kindFilter !== "all" && kindFilter !== "missable" && t.kind !== kindFilter) return false;
    if (gradeFilter !== "all" && t.grade !== gradeFilter) return false;
    if (hideEarned && isEarned(t)) return false;
    if (q && !(t.name + " " + t.description + " " + t.guide).toLowerCase().includes(q)) return false;
    return true;
  });
  $("listNote").textContent = kindFilter === "online"
    ? "Online: the official list has no online trophies, so this filter is empty by design. Everything here is earned solo."
    : "Showing " + rows.length + " of 55 trophies" + (state.spoiler ? " · spoilers off: unrevealed story trophies hide their names" : "") + ".";
  const list = $("trophyList");
  list.innerHTML = "";
  for (const t of rows) {
    const li = el("li");
    if (isEarned(t)) li.classList.add("earned");
    const box = document.createElement("input");
    box.type = "checkbox";
    box.checked = isEarned(t);
    box.setAttribute("aria-label", "Earned: " + t.name);
    box.addEventListener("change", () => {
      if (box.checked) state.earned[t.id] = true;
      else delete state.earned[t.id];
      persist();
      renderAll();
    });
    li.append(box);
    const mid = el("div");
    mid.append(trophyNameButton(t));
    mid.append(el("p", "tdesc", spoilerHidden(t) ? "Hidden until earned." : t.description));
    const meta = el("p", "tmeta");
    meta.textContent = "Shift " + t.shift + " · " + fmtMinutes(t.minutes) + " · " + verdictLabel(t.verdict) + (t.target ? " · target " + fmtTarget(t.target, t.id) : "");
    if (t.missable) {
      const miss = el("span", "miss", " · ⚠ MISSABLE");
      meta.append(miss);
    }
    mid.append(meta);
    li.append(mid);
    li.append(el("span", "grade " + t.grade, t.grade));
    list.append(li);
  }
}

function renderGrind() {
  const board = $("grindBoard");
  board.innerHTML = "";
  const counted = trophies.filter((t) => t.target);
  for (const t of counted) {
    const card = el("article", "grind-card");
    card.append(el("h3", null, t.name));
    card.append(el("p", "gdesc", t.description + " — Shift " + t.shift + "."));
    const value = state.grind[t.id] || 0;
    const step = t.target >= 10000 ? 5000 : t.target >= 100 ? 5 : 1;
    const row = el("div", "counter");
    const minus = el("button", null, "−");
    minus.type = "button";
    minus.setAttribute("aria-label", "Decrease " + t.name);
    const plus = el("button", null, "+");
    plus.type = "button";
    plus.setAttribute("aria-label", "Increase " + t.name);
    const count = el("span", "count", fmtTarget(value, t.id) + " / " + fmtTarget(t.target, t.id));
    const input = document.createElement("input");
    input.type = "number";
    input.min = "0";
    input.max = String(t.target);
    input.value = String(value);
    input.setAttribute("aria-label", "Exact count for " + t.name);
    const setValue = (v) => {
      const clamped = Math.max(0, Math.min(t.target, Math.floor(Number(v) || 0)));
      state.grind[t.id] = clamped;
      persist();
      renderGrind();
    };
    minus.addEventListener("click", () => setValue(value - step));
    plus.addEventListener("click", () => setValue(value + step));
    input.addEventListener("change", () => setValue(input.value));
    row.append(minus, count, plus, input);
    card.append(row);
    const bar = el("div", "mini-bar");
    const fill = el("div");
    fill.style.width = Math.min(100, (value / t.target) * 100) + "%";
    bar.append(fill);
    card.append(bar);
    board.append(card);
  }
}

function renderMissables() {
  const list = $("missableList");
  list.innerHTML = "";
  const missed = trophies.filter((t) => t.missable).sort((a, b) => a.shift - b.shift || a.id - b.id);
  for (const t of missed) {
    const li = el("li");
    li.append(el("p", "alarm", "⚠ Alarm · Shift " + t.shift + " · " + fmtMinutes(t.minutes)));
    li.append(trophyNameButton(t));
    li.append(el("p", null, t.description));
    li.append(el("p", null, t.guide));
    list.append(li);
  }
}

function showView(name) {
  for (const v of VIEWS) {
    $("view-" + v).classList.toggle("active", v === name);
  }
  for (const tab of document.querySelectorAll(".tab")) {
    tab.classList.toggle("active", tab.dataset.view === name);
  }
}

function renderAll() {
  renderTimecard();
  renderShifts();
  renderChecklist();
  renderGrind();
  renderMissables();
}

function route() {
  const hash = location.hash || "#/shifts";
  const view = hash.replace("#/", "").split("?")[0];
  showView(VIEWS.includes(view) ? view : "shifts");
  const params = new URLSearchParams(location.search);
  const detailId = Number(params.get("detail"));
  if (detailId) {
    const t = trophies.find((x) => x.id === detailId);
    if (t) openDetail(t);
  }
}

async function boot() {
  ShiftStore.seedDemoIfRequested();
  state = ShiftStore.loadState();
  const res = await fetch("data/trophies.json");
  const data = await res.json();
  trophies = data.trophies || data;
  $("spoilerToggle").checked = state.spoiler;
  $("spoilerToggle").addEventListener("change", (e) => {
    state.spoiler = e.target.checked;
    persist();
    renderAll();
  });
  $("search").addEventListener("input", renderChecklist);
  $("hideEarned").addEventListener("change", renderChecklist);
  $("gradeFilter").addEventListener("change", (e) => {
    gradeFilter = e.target.value;
    renderChecklist();
  });
  $("kindFilters").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-kind]");
    if (!btn) return;
    kindFilter = btn.dataset.kind;
    for (const b of $("kindFilters").querySelectorAll("button")) {
      b.classList.toggle("active", b === btn);
    }
    renderChecklist();
  });
  $("exportBtn").addEventListener("click", () => {
    const blob = new Blob([ShiftStore.exportState(state)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "platinum-shift-progress.json";
    a.click();
    URL.revokeObjectURL(url);
    $("saveStatus").textContent = "Exported: platinum-shift-progress.json";
  });
  $("importFile").addEventListener("change", async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      state = ShiftStore.importState(await file.text());
      persist();
      renderAll();
      $("saveStatus").textContent = "Imported " + Object.keys(state.earned).length + " earned trophies.";
    } catch {
      $("saveStatus").textContent = "That file is not a Platinum Shift export.";
    }
    e.target.value = "";
  });
  $("resetBtn").addEventListener("click", () => {
    if (!confirm("Reset all progress and grind counters?")) return;
    state = { earned: {}, grind: {}, spoiler: state.spoiler, savedAt: null };
    persist();
    renderAll();
    $("saveStatus").textContent = "Progress reset.";
  });
  window.addEventListener("hashchange", route);
  renderAll();
  route();
}

boot();
