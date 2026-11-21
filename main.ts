// Platinum Shift — GTA 6 trophy guide entry for make.fun (Node 22, standard
// library only). The guide itself is plain static files in app/: index.html,
// style.css, js/app.js and js/store.js, and app/data/trophies.json, with no
// build step and no network at run time. The guide is organised as six
// work shifts from the opening mission to the platinum, with a checklist
// saved in the browser, a grind board with counters, a missables alarm list,
// export and import, and a spoiler setting. Every trophy's guide is written
// for this entry in our own words from the official description and names
// its sources; the official names, descriptions and grades are shown as
// PlayStation publishes them.
// This program hands the guide in: it copies app/ and screenshots/ from
// beside this file into the output directory and writes dossier.json there,
// using the vendored make.fun library. vendor/makefun-frontend.ts must stay
// exactly as the kit shipped it: the scorer rebuilds the dossier with its
// own copy and compares the bytes.
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

const here = fileURLToPath(new URL(".", import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

mkdirSync(out, { recursive: true });
cpSync(join(here, "app"), join(out, "app"), { recursive: true });
mkdirSync(join(out, "screenshots"), { recursive: true });
if (existsSync(join(here, "screenshots"))) {
  cpSync(join(here, "screenshots"), join(out, "screenshots"), { recursive: true });
}

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the
// bytes; the others refuse an entry the scorer would refuse (more than 4
// screenshots or one over 256 KiB; more than 993 files and directories in
// app/ or 48 MiB of app files: app/ counts beside /output's own 1000-entry
// cap, its screenshots/ and dossier.json).
writeFileSync(
  join(out, "dossier.json"),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);
