import type { ScheduleRow } from "./types.js";

export function formatLocalIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Lecture days between from and to, excluding Sundays. */
export function expandLectureDates(fromDate: string, toDate: string): string[] {
  const from = new Date(`${fromDate}T00:00:00`);
  const to = new Date(`${toDate}T00:00:00`);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) {
    return [];
  }

  const dates: string[] = [];
  const cursor = new Date(from);
  while (cursor <= to) {
    if (cursor.getDay() !== 0) {
      dates.push(formatLocalIsoDate(cursor));
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

export function buildScheduleFromRange(fromDate: string, toDate: string): ScheduleRow[] {
  return expandLectureDates(fromDate, toDate).map((date) => ({
    date,
    startTime: "",
    endTime: "",
    room: "",
  }));
}
