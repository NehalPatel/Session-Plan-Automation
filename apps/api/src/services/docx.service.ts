import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import JSZip from "jszip";
import type { SessionPlanRow } from "@session-plan/shared";

const TEMPLATE_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../assets/session-plan-template.docx",
);

function escapeXml(text: string): string {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
    .replace(/\u2013|\u2014/g, "-");
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

export async function buildSessionPlanDocx(rows: SessionPlanRow[]): Promise<Buffer> {
  const templateBuffer = readFileSync(TEMPLATE_PATH);
  const zip = await JSZip.loadAsync(templateBuffer);
  const documentFile = zip.file("word/document.xml");
  if (!documentFile) {
    throw new Error("Template is missing word/document.xml");
  }

  let xml = await documentFile.async("string");
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

  xml = xml.replace(table, newTable);
  zip.file("word/document.xml", xml);

  return zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
}
