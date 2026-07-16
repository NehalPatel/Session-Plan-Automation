import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import JSZip from "jszip";
import type { DateRange, Division, PlanMetadata, SessionPlanRow } from "@session-plan/shared";

const TEMPLATE_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../assets/session-plan-template.docx",
);

export interface DocxHeaderContext {
  metadata: PlanMetadata;
  dateRange: DateRange;
  division: Division;
  facultyName: string;
}

function escapeXml(text: string): string {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
    .replace(/\u2013|\u2014/g, "-");
}

function formatDisplayDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  if (!year || !month || !day) return isoDate;
  return `${day}/${month}/${year}`;
}

function formatToday(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  return `${day}/${month}/${year}`;
}

function setRowTexts(rowXml: string, values: string[]): string {
  let index = 0;
  return rowXml.replace(/<w:t(?:\s[^>]*)?>[\s\S]*?<\/w:t>/g, (match) => {
    const open = match.match(/<w:t(?:\s[^>]*)?>/)?.[0] ?? "<w:t>";
    const value = escapeXml(values[index] ?? "");
    index += 1;
    return `${open}${value}</w:t>`;
  });
}

function rowValues(row: SessionPlanRow): string[] {
  return [
    String(row.sessionNo),
    row.unitNoAndName,
    row.topic,
    row.reference ?? "",
    row.deliveryMethod,
    row.completedOn,
    row.roomNo ?? "",
    row.time ?? "",
    row.studentsPresent ?? "",
  ];
}

function buildPlaceholderMap(context: DocxHeaderContext): Record<string, string> {
  return {
    "{academic-year}": context.metadata.academicYear,
    "{from-date}": formatDisplayDate(context.dateRange.fromDate),
    "{to-date}": formatDisplayDate(context.dateRange.toDate),
    "{class-name}": context.metadata.class,
    "{division}": context.division,
    "{subject-name}": context.metadata.subjectName,
    "{user-name}": context.facultyName,
    "{today}": formatToday(),
  };
}

function replacePlaceholders(xml: string, values: Record<string, string>): string {
  let next = xml;
  for (const [placeholder, value] of Object.entries(values)) {
    next = next.split(placeholder).join(escapeXml(value));
  }
  return next;
}

function fillSessionTable(xml: string, rows: SessionPlanRow[]): string {
  const tableMatch = xml.match(/<w:tbl>[\s\S]*?<\/w:tbl>/);
  if (!tableMatch) {
    throw new Error("Template is missing table");
  }

  const table = tableMatch[0];
  const tableRows = table.match(/<w:tr[\s>][\s\S]*?<\/w:tr>/g) ?? [];
  if (tableRows.length < 2) {
    throw new Error("Template table must include header and data rows");
  }

  const headerRow = tableRows[0]!;
  const dataRowTemplate = tableRows[1]!;
  const generatedRows = rows.map((row) => setRowTexts(dataRowTemplate, rowValues(row)));
  const headerEnd = table.indexOf(headerRow) + headerRow.length;
  const tableClose = table.lastIndexOf("</w:tbl>");
  const newTable = `${table.slice(0, headerEnd)}${generatedRows.join("")}${table.slice(tableClose)}`;

  return xml.replace(table, newTable);
}

export async function buildSessionPlanDocx(
  rows: SessionPlanRow[],
  context: DocxHeaderContext,
): Promise<Buffer> {
  const templateBuffer = readFileSync(TEMPLATE_PATH);
  const zip = await JSZip.loadAsync(templateBuffer);
  const placeholders = buildPlaceholderMap(context);

  for (const filePath of ["word/document.xml", "word/header1.xml", "word/footer1.xml"]) {
    const file = zip.file(filePath);
    if (!file) continue;

    let xml = await file.async("string");
    if (filePath === "word/document.xml") {
      xml = fillSessionTable(xml, rows);
    }
    xml = replacePlaceholders(xml, placeholders);
    zip.file(filePath, xml);
  }

  return zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
}
