/**
 * What still has to be cleared before the film is posted: the song's licence, consent from every
 * real person on screen, a recorded source for every generated face, and 3D shots still at a
 * preview or stand-in quality. Prints a table. With --release it exits 1 while anything is pending
 * (npm run final -- --release runs it first).
 * Usage: npm run clearance [-- --release]
 */
import { existsSync, readFileSync } from "node:fs";

import music from "../src/music.json";
import { PEOPLE } from "../src/content";

type Row = { item: string; status: "ok" | "note" | "PENDING"; why: string };
const rows: Row[] = [];

// Licensed for ads on social: library and AI services on a tier that allows it, commissioned work,
// or audio made here. A major-label song needs sync AND master licences, often five figures.
const licence = String(music.licence ?? "");
const cleared = /^(generated|commissioned|library:.+|ai:.+|licensed:.+)$/.test(licence);
rows.push({ item: `song: ${music.track}`, status: cleared ? (licence === "generated" ? "note" : "ok") : "PENDING", why: cleared ? (licence === "generated" ? "generated stand-in: fine to post, but pick a real song by ear first" : licence) : `licence "${licence}": settle it, or swap to a licensable song on the same grid` });

for (const p of PEOPLE) {
  if (p.kind === "real") rows.push({ item: `person: ${p.display}${p.handle ? ` @${p.handle}` : ""}`, status: p.consent === "yes" ? "ok" : "PENDING", why: p.consent === "yes" ? `consent recorded${p.source ? `, ${p.source}` : ""}` : "a real person: needs their consent, and they only do what they agreed to" });
  if (p.kind === "fictional" && p.face) rows.push({ item: `face: ${p.display}`, status: p.source ? "ok" : "PENDING", why: p.source ?? "generated face with no recorded source: record the model and its commercial terms" });
}

const manifest = existsSync("public/3d/manifest.json") ? (JSON.parse(readFileSync("public/3d/manifest.json", "utf8")) as Record<string, { quality: string; source: string }>) : {};
for (const [shot, info] of Object.entries(manifest)) {
  const status = info.quality === "preview" || info.quality === "standin" ? "PENDING" : info.quality === "cpu-final" ? "note" : "ok";
  rows.push({ item: `3d: ${shot}`, status, why: status === "PENDING" ? `${info.quality}: render the final (npm run shot -- ${shot} --tier gpu, or cpu-final)` : `${info.quality}, ${info.source}` });
}

const w = Math.max(...rows.map((r) => r.item.length));
for (const r of rows) console.log(`${r.status.padEnd(8)} ${r.item.padEnd(w)}  ${r.why}`);
const pending = rows.filter((r) => r.status === "PENDING").length;
console.log(pending ? `${pending} pending before release.` : "Clear to release.");
if (pending && process.argv.includes("--release")) process.exit(1);
