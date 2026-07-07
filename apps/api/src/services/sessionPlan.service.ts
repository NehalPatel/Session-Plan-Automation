import type {
  GenerateSessionPlanInput,
  ParsedSyllabus,
  ScheduleRow,
  SessionPlanRow,
  SyllabusUnit,
  UnitSelection,
} from "@session-plan/shared";
import { bundleTopicsForSessions, expandSessionTopics } from "./ai.service.js";

function selectUnits(units: SyllabusUnit[], selection: UnitSelection): SyllabusUnit[] {
  const sorted = [...units].sort((a, b) => a.number - b.number);
  if (selection.mode === "all") return sorted;
  if (selection.mode === "firstN") {
    const n = typeof selection.value === "number" ? selection.value : 1;
    return sorted.slice(0, n);
  }
  const picked = Array.isArray(selection.value) ? selection.value : [];
  return sorted.filter((u) => picked.includes(u.number));
}

function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

function formatTime(row: ScheduleRow): string {
  if (!row.startTime?.trim() || !row.endTime?.trim()) return "";
  return `${row.startTime} - ${row.endTime}`;
}

function formatUnitNoAndName(unitNumber: number, unitTitle: string): string {
  const title = unitTitle.trim();
  return title ? `Unit - ${unitNumber}: ${title}` : `Unit - ${unitNumber}`;
}

export async function generateSessionRows(
  parsed: ParsedSyllabus,
  schedule: ScheduleRow[],
  unitSelection: UnitSelection,
): Promise<SessionPlanRow[]> {
  const units = selectUnits(parsed.units, unitSelection);
  const flatTopics = units.flatMap((unit) =>
    unit.topics.map((topic) => ({
      code: topic.code,
      title: topic.title,
      unitNumber: unit.number,
      unitTitle: unit.title,
    })),
  );

  const sessionCount = schedule.length;
  const bundles = await bundleTopicsForSessions(flatTopics, sessionCount);
  const expanded = await expandSessionTopics(bundles);

  return Array.from({ length: sessionCount }, (_, index) => {
    const bundle = bundles[index];
    const sched = schedule[index];
    const expansion = expanded[index];
    const topic =
      expansion?.topic?.trim() ||
      bundle?.combinedTitle?.trim() ||
      `Unit ${bundle?.unitNumber ?? 1} lecture ${index + 1}`;
    return {
      sessionNo: index + 1,
      unitNoAndName: formatUnitNoAndName(bundle?.unitNumber ?? 1, bundle?.unitTitle ?? ""),
      topic,
      reference: parsed.referenceBooks[0] ?? "",
      deliveryMethod: expansion?.deliveryMethod ?? (index % 2 === 0 ? "Demo" : "Theory"),
      completedOn: formatDate(sched.date),
      roomNo: sched.room ?? "",
      time: formatTime(sched),
      studentsPresent: "",
    };
  });
}

export async function buildSessionPlanFromInput(input: GenerateSessionPlanInput): Promise<{
  parsed: ParsedSyllabus;
  rows: SessionPlanRow[];
}> {
  if (!input.parsed) {
    throw new Error("Parsed syllabus is required");
  }
  const rows = await generateSessionRows(input.parsed, input.schedule, input.unitSelection);
  return { parsed: input.parsed, rows };
}
