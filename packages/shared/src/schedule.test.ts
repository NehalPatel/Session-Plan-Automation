import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildScheduleFromRange,
  expandLectureDates,
  formatWeekdayLabel,
  isDateInRange,
  isSunday,
} from "./schedule.js";

describe("expandLectureDates", () => {
  it("skips Sundays between from and to", () => {
    const dates = expandLectureDates("2026-07-01", "2026-07-07");
    assert.deepEqual(dates, [
      "2026-07-01",
      "2026-07-02",
      "2026-07-03",
      "2026-07-04",
      "2026-07-06",
      "2026-07-07",
    ]);
    assert.ok(!dates.includes("2026-07-05"));
  });

  it("returns empty array for invalid range", () => {
    assert.deepEqual(expandLectureDates("2026-07-10", "2026-07-01"), []);
    assert.deepEqual(expandLectureDates("invalid", "2026-07-01"), []);
  });
});

describe("buildScheduleFromRange", () => {
  it("includes all candidate dates when includedDates is omitted", () => {
    const schedule = buildScheduleFromRange("2026-07-01", "2026-07-07");
    assert.equal(schedule.length, 6);
    assert.equal(schedule[0]?.date, "2026-07-01");
    assert.equal(schedule[0]?.startTime, "");
  });

  it("filters to included dates only and preserves order", () => {
    const schedule = buildScheduleFromRange("2026-07-01", "2026-07-07", [
      "2026-07-07",
      "2026-07-01",
      "2026-07-03",
    ]);
    assert.deepEqual(
      schedule.map((row) => row.date),
      ["2026-07-01", "2026-07-03", "2026-07-07"],
    );
  });

  it("returns empty schedule when no dates are included", () => {
    const schedule = buildScheduleFromRange("2026-07-01", "2026-07-07", []);
    assert.deepEqual(schedule, []);
  });
});

describe("formatWeekdayLabel", () => {
  it("formats a readable weekday label", () => {
    assert.equal(formatWeekdayLabel("2026-07-01"), "Wed, 01 Jul 2026");
  });
});

describe("date helpers", () => {
  it("detects Sundays", () => {
    assert.equal(isSunday("2026-07-05"), true);
    assert.equal(isSunday("2026-07-06"), false);
  });

  it("checks date range membership", () => {
    assert.equal(isDateInRange("2026-07-03", "2026-07-01", "2026-07-07"), true);
    assert.equal(isDateInRange("2026-06-30", "2026-07-01", "2026-07-07"), false);
  });
});
