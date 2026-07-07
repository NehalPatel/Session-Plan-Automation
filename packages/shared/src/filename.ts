import type { DateRange, Division, PlanMetadata } from "./types.js";

function toPascalSlug(value: string): string {
  return value
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join("");
}

function formatFilenameDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  const day = String(date.getDate()).padStart(2, "0");
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  return `${day}${months[date.getMonth()]}`;
}

export function buildSessionPlanFilename(
  metadata: PlanMetadata,
  facultyName: string,
  dateRange: DateRange,
  division: Division,
): string {
  const subjectSlug = toPascalSlug(metadata.subjectName);
  const facultySlug = toPascalSlug(facultyName);

  return `SDJIC__SessionPlan__AY_${metadata.academicYear}__${metadata.class}__SEM-${metadata.semester}__${division}__${subjectSlug}__${facultySlug}__${formatFilenameDate(dateRange.fromDate)}_${formatFilenameDate(dateRange.toDate)}.docx`;
}

export function buildSessionPlanZipFilename(
  metadata: PlanMetadata,
  facultyName: string,
  dateRange: DateRange,
): string {
  return buildSessionPlanFilename(metadata, facultyName, dateRange, metadata.divisions[0]).replace(/\.docx$/, ".zip");
}
