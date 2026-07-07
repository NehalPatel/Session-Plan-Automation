import JSZip from "jszip";
import type { DateRange, Division, PlanMetadata, SessionPlanRow } from "@session-plan/shared";
import { buildSessionPlanFilename } from "@session-plan/shared";
import { buildSessionPlanDocx } from "./docx.service.js";

export { buildSessionPlanFilename };

export async function buildDivisionExports(
  rows: SessionPlanRow[],
  metadata: PlanMetadata,
  facultyName: string,
  dateRange: DateRange,
): Promise<{ filename: string; buffer: Buffer }[]> {
  const divisions = metadata.divisions?.length ? metadata.divisions : (["A"] as Division[]);
  const exports: { filename: string; buffer: Buffer }[] = [];

  for (const division of divisions) {
    const buffer = await buildSessionPlanDocx(rows);
    const filename = buildSessionPlanFilename(metadata, facultyName, dateRange, division);
    exports.push({ filename, buffer });
  }

  return exports;
}

export async function buildDownloadArchive(files: { filename: string; buffer: Buffer }[]): Promise<Buffer> {
  if (files.length === 1) return files[0].buffer;

  const zip = new JSZip();
  for (const file of files) {
    zip.file(file.filename, file.buffer);
  }
  return zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
}
