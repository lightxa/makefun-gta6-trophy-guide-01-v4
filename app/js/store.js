// Platinum Shift store: progress saved in the browser (localStorage), grind
// counters beside it, export and import as JSON. No network at any point.
// A ?demo=1 query stamps a fixed sample of 13 trophies so screenshots can
// show the tracker with progress; real visits without it start empty.
const KEY = "platinum-shift-v1";
const DEMO_EARNED = [2, 3, 4, 5, 8, 9, 10, 15, 21, 22, 28, 35, 44];
const DEMO_GRIND = { 15: 87, 31: 34, 35: 41, 42: 19 };

function defaultState() {
  return { earned: {}, grind: {}, spoiler: false, savedAt: null };
}

function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return defaultState();
    return {
      earned: parsed.earned && typeof parsed.earned === "object" ? parsed.earned : {},
      grind: parsed.grind && typeof parsed.grind === "object" ? parsed.grind : {},
      spoiler: Boolean(parsed.spoiler),
      savedAt: parsed.savedAt || null,
    };
  } catch {
    return defaultState();
  }
}

function saveState(state) {
  state.savedAt = new Date().toISOString();
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Private mode or a full store: the page keeps working in memory.
  }
}

// Seed the demo sample only when the URL asks for it, and only once per
// browser: a real player's ticks are never overwritten by the demo.
function seedDemoIfRequested() {
  const params = new URLSearchParams(location.search);
  if (params.get("demo") !== "1") return false;
  try {
    if (localStorage.getItem(KEY)) return false;
  } catch {
    return false;
  }
  const state = defaultState();
  for (const id of DEMO_EARNED) state.earned[id] = true;
  state.grind = { ...DEMO_GRIND };
  saveState(state);
  return true;
}

function exportState(state) {
  return JSON.stringify(
    { app: "platinum-shift", version: 1, exportedAt: new Date().toISOString(), earned: state.earned, grind: state.grind, spoiler: state.spoiler },
    null,
    2,
  );
}

function importState(text) {
  const parsed = JSON.parse(text);
  if (!parsed || typeof parsed !== "object") throw new Error("not an object");
  const earned = parsed.earned && typeof parsed.earned === "object" ? parsed.earned : {};
  const grind = parsed.grind && typeof parsed.grind === "object" ? parsed.grind : {};
  const cleanEarned = {};
  for (const [key, value] of Object.entries(earned)) {
    const id = Number(key);
    if (Number.isInteger(id) && id >= 1 && id <= 55 && value) cleanEarned[id] = true;
  }
  const cleanGrind = {};
  for (const [key, value] of Object.entries(grind)) {
    const id = Number(key);
    const amount = Number(value);
    if (Number.isInteger(id) && id >= 1 && id <= 55 && Number.isFinite(amount) && amount >= 0) {
      cleanGrind[id] = Math.floor(amount);
    }
  }
  return { earned: cleanEarned, grind: cleanGrind, spoiler: Boolean(parsed.spoiler), savedAt: null };
}

export const ShiftStore = {
  KEY,
  DEMO_EARNED,
  loadState,
  saveState,
  seedDemoIfRequested,
  exportState,
  importState,
};
