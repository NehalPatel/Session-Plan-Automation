#!/usr/bin/env node
/**
 * Download validation test for Session Plan API.
 * Usage: node scripts/test-download.mjs [baseUrl]
 */
import { writeFileSync } from "fs";

const base = process.argv[2] ?? "http://localhost:4000";

async function request(path, options = {}) {
  const { headers: extraHeaders, ...rest } = options;
  const res = await fetch(`${base}${path}`, {
    ...rest,
    headers: { "Content-Type": "application/json", ...(extraHeaders ?? {}) },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${path} failed (${res.status}): ${body}`);
  }
  const type = res.headers.get("content-type") ?? "";
  if (type.includes("application/json")) return res.json();
  return res;
}

function isZip(buffer) {
  return buffer[0] === 0x50 && buffer[1] === 0x4b;
}

function isDocx(buffer) {
  return isZip(buffer);
}

const email = `download-${Date.now()}@test.com`;
const password = "secret123";

console.log("Register...");
const auth = await request("/auth/register", {
  method: "POST",
  body: JSON.stringify({ name: "Nehal Patel", email, password }),
});
const headers = { Authorization: `Bearer ${auth.token}` };

const syllabus = `Course Title: Advance Web Designing
Course Code: 503-01
Unit-1: Concepts of NoSQL: MongoDB
1.1 concepts of NoSQL. Advantages and features.
1.2 create and Drop collections
1.3 CRUD operations (Insert, update, delete, find)`;

const parsed = await request("/syllabi/parse", {
  method: "POST",
  headers,
  body: JSON.stringify({ rawText: syllabus }),
});

const schedule = [];
for (let day = 1; day <= 15; day += 1) {
  const date = `2026-07-${String(day).padStart(2, "0")}`;
  const d = new Date(`${date}T00:00:00`);
  if (d.getDay() !== 0) schedule.push({ date, startTime: "", endTime: "", room: "" });
}

const singlePlan = await request("/session-plans/generate", {
  method: "POST",
  headers,
  body: JSON.stringify({
    parsed: parsed.parsed,
    metadata: {
      academicYear: "2026-27",
      class: "TYBCA",
      semester: 5,
      divisions: ["G"],
      subjectName: "Advance Web Designing",
    },
    dateRange: { fromDate: "2026-07-01", toDate: "2026-07-15" },
    schedule: schedule.slice(0, 3),
    unitSelection: { mode: "all" },
  }),
});

const multiPlan = await request("/session-plans/generate", {
  method: "POST",
  headers,
  body: JSON.stringify({
    parsed: parsed.parsed,
    metadata: {
      academicYear: "2026-27",
      class: "TYBCA",
      semester: 5,
      divisions: ["A", "G"],
      subjectName: "Advance Web Designing",
    },
    dateRange: { fromDate: "2026-07-01", toDate: "2026-07-15" },
    schedule: schedule.slice(0, 3),
    unitSelection: { mode: "all" },
  }),
});

async function downloadPlan(planId, outfile) {
  const res = await fetch(`${base}/session-plans/${planId}/docx`, {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!res.ok) throw new Error(`download failed ${res.status}`);
  const disposition = res.headers.get("content-disposition") ?? "";
  const contentType = res.headers.get("content-type") ?? "";
  const buffer = Buffer.from(await res.arrayBuffer());
  writeFileSync(outfile, buffer);
  return { disposition, contentType, buffer, outfile };
}

console.log("Download single DOCX...");
const single = await downloadPlan(singlePlan.id, "docs/test-single.docx");
const expectedDocx =
  "SDJIC__SessionPlan__AY_2026-27__TYBCA__SEM-5__G__AdvanceWebDesigning__NehalPatel__01JUL_15JUL.docx";
console.log("  content-type:", single.contentType);
console.log("  disposition:", single.disposition);
console.log("  is zip/docx:", isDocx(single.buffer));
console.log("  filename ok:", single.disposition.includes(expectedDocx));

console.log("Download multi ZIP...");
const multi = await downloadPlan(multiPlan.id, "docs/test-multi.zip");
const expectedZip =
  "SDJIC__SessionPlan__AY_2026-27__TYBCA__SEM-5__A__AdvanceWebDesigning__NehalPatel__01JUL_15JUL.zip";
console.log("  content-type:", multi.contentType);
console.log("  disposition:", multi.disposition);
console.log("  is zip:", isZip(multi.buffer));
console.log("  filename ok:", multi.disposition.includes(expectedZip));

console.log("Validate DOCX opens...");
const { execSync } = await import("child_process");
execSync('python -c "from docx import Document; d=Document(r\'docs/test-single.docx\'); print(\'rows\', len(d.tables[0].rows))"', {
  stdio: "inherit",
});

console.log("Delete single plan...");
await fetch(`${base}/session-plans/${singlePlan.id}`, {
  method: "DELETE",
  headers: { Authorization: `Bearer ${auth.token}` },
}).then((r) => {
  if (r.status !== 204) throw new Error(`delete failed ${r.status}`);
});

console.log("All download tests passed.");
