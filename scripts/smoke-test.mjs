#!/usr/bin/env node
/**
 * Local smoke test for Session Plan API.
 * Usage: node scripts/smoke-test.mjs [baseUrl]
 */
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
  return res.arrayBuffer();
}

const email = `smoke-${Date.now()}@test.com`;
const password = "secret123";

console.log("Health check...");
const health = await request("/health");
console.log("  ", health);

console.log("Register...");
const auth = await request("/auth/register", {
  method: "POST",
  body: JSON.stringify({ name: "Smoke Test", email, password }),
});
const headers = { Authorization: `Bearer ${auth.token}` };

const syllabus = `Course Title: Advance Web Designing
Course Code: 503-01
Unit-1: Concepts of NoSQL: MongoDB
1.1 concepts of NoSQL. Advantages and features.
1.2 create and Drop collections
1.3 CRUD operations (Insert, update, delete, find)`;

console.log("Parse syllabus...");
const parsed = await request("/syllabi/parse", {
  method: "POST",
  headers,
  body: JSON.stringify({ rawText: syllabus }),
});
console.log("  units:", parsed.parsed.units.length);

console.log("Generate plan...");
const plan = await request("/session-plans/generate", {
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
    schedule: [
      { date: "2026-07-01", startTime: "", endTime: "", room: "" },
      { date: "2026-07-02", startTime: "", endTime: "", room: "" },
      { date: "2026-07-03", startTime: "", endTime: "", room: "" },
    ],
    unitSelection: { mode: "all" },
  }),
});
console.log("  sessions:", plan.rows.length);

console.log("Download DOCX...");
const docx = await request(`/session-plans/${plan.id}/docx`, { headers });
console.log("  bytes:", docx.byteLength);

console.log("Smoke test passed.");
