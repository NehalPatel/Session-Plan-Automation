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

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

export function formatWeekdayLabel(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  const weekday = WEEKDAY_LABELS[date.getDay()];
  const day = String(date.getDate()).padStart(2, "0");
  const month = MONTH_LABELS[date.getMonth()];
  const year = date.getFullYear();
  return `${weekday}, ${day} ${month} ${year}`;
}

export function isSunday(isoDate: string): boolean {
  const date = new Date(`${isoDate}T00:00:00`);
  return !Number.isNaN(date.getTime()) && date.getDay() === 0;
}

export function isDateInRange(isoDate: string, fromDate: string, toDate: string): boolean {
  return isoDate >= fromDate && isoDate <= toDate;
}

export function buildScheduleFromRange(
  fromDate: string,
  toDate: string,
  includedDates?: string[],
): ScheduleRow[] {
  const candidates = expandLectureDates(fromDate, toDate);
  const includedSet = includedDates ? new Set(includedDates) : null;
  const dates = includedSet ? candidates.filter((date) => includedSet.has(date)) : candidates;

  return dates.map((date) => ({
    date,
    startTime: "",
    endTime: "",
    room: "",
  }));
}
