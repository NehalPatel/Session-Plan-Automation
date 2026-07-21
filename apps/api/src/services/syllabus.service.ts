import { parsedSyllabusSchema, type ParsedSyllabus } from "@session-plan/shared";

const UNIT_HEADER_RE = /^Unit\s*[-:.]?\s*(\d+)\s*[-:.]?\s*(.*)$/i;

function extractUnitHeader(line: string): { number: number; title: string } | null {
  const match = line.match(UNIT_HEADER_RE);
  if (!match) return null;
  const number = Number(match[1]);
  const title = match[2]!.trim();
  return { number, title: title || `Unit ${number}` };
}

function parseTopicLine(
  line: string,
  unitNumber: number,
  topicIndex: number,
): { code: string; title: string } {
  const numbered = line.match(/^(\d+(?:\.\d+)*)\s+(.*)$/);
  if (numbered) {
    const code = numbered[1]!;
    const title = numbered[2]!.trim() || code;
    return { code, title };
  }
  return { code: `${unitNumber}.${topicIndex}`, title: line };
}

/**
 * Deterministic syllabus parse (no AI).
 * Format: first line = unit; each following line = one topic.
 * Additional "Unit N: ..." lines start a new unit.
 */
export function parseSyllabus(rawText: string): ParsedSyllabus {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const units: ParsedSyllabus["units"] = [];

  if (lines.length === 0) {
    return parsedSyllabusSchema.parse({
      courseTitle: "Subject",
      courseCode: "",
      units: [],
      referenceBooks: [],
    });
  }

  let currentNumber = 1;
  let currentTitle = "";
  let currentTopics: ParsedSyllabus["units"][number]["topics"] = [];

  const flush = () => {
    if (!currentTitle && currentTopics.length === 0) return;
    const title = currentTitle || `Unit ${currentNumber}`;
    const topics =
      currentTopics.length > 0
        ? currentTopics
        : [{ code: `${currentNumber}.0`, title }];
    units.push({ number: currentNumber, title, topics });
  };

  const firstHeader = extractUnitHeader(lines[0]!);
  if (firstHeader) {
    currentNumber = firstHeader.number;
    currentTitle = firstHeader.title;
  } else {
    currentNumber = 1;
    currentTitle = lines[0]!;
  }

  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i]!;
    const header = extractUnitHeader(line);
    if (header) {
      flush();
      currentNumber = header.number;
      currentTitle = header.title;
      currentTopics = [];
      continue;
    }
    currentTopics.push(parseTopicLine(line, currentNumber, currentTopics.length + 1));
  }
  flush();

  const titleMatch = rawText.match(/Course Title[:\s]+(.+)/i);
  const codeMatch = rawText.match(/Course Code[:\s]+([\w-]+)/i);

  return parsedSyllabusSchema.parse({
    courseTitle: titleMatch?.[1]?.trim() || units[0]?.title || "Subject",
    courseCode: codeMatch?.[1]?.trim() ?? "",
    units,
    referenceBooks: [],
  });
}

interface BundleInput {
  topics: { code: string; title: string; unitNumber: number; unitTitle: string }[];
  sessionCount: number;
}

export interface BundleResult {
  unitNumber: number;
  unitTitle: string;
  topicCodes: string[];
  combinedTitle: string;
}

/**
 * Map topics onto lecture dates:
 * - fewer topics than dates → spread each topic across consecutive days
 * - more topics than dates → pack multiple topics into a day
 * - equal counts → one topic per day
 */
export function bundleTopicsForSessions(
  topics: BundleInput["topics"],
  sessionCount: number,
): BundleResult[] {
  if (sessionCount === 0) return [];

  if (topics.length === 0) {
    return Array.from({ length: sessionCount }, (_, index) => ({
      unitNumber: 1,
      unitTitle: "General",
      topicCodes: [],
      combinedTitle: `Session ${index + 1} introduction and discussion`,
    }));
  }

  if (topics.length === sessionCount) {
    return topics.map((topic) => ({
      unitNumber: topic.unitNumber,
      unitTitle: topic.unitTitle,
      topicCodes: [topic.code],
      combinedTitle: topic.title,
    }));
  }

  // Fewer topics than dates: distribute topics across consecutive days
  if (topics.length < sessionCount) {
    const base = Math.floor(sessionCount / topics.length);
    let remainder = sessionCount % topics.length;
    const result: BundleResult[] = [];

    for (const topic of topics) {
      const span = base + (remainder > 0 ? 1 : 0);
      if (remainder > 0) remainder -= 1;
      for (let s = 0; s < span; s += 1) {
        result.push({
          unitNumber: topic.unitNumber,
          unitTitle: topic.unitTitle,
          topicCodes: [topic.code],
          combinedTitle: topic.title,
        });
      }
    }
    return result;
  }

  // More topics than dates: multiple topics per day
  const groups: BundleResult[] = [];
  let cursor = 0;
  let remainder = topics.length % sessionCount;
  const baseSize = Math.floor(topics.length / sessionCount);

  for (let i = 0; i < sessionCount; i += 1) {
    const size = baseSize + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder -= 1;
    const chunk = topics.slice(cursor, cursor + size);
    cursor += size;
    const dominant = chunk[0] ?? topics[topics.length - 1]!;
    groups.push({
      unitNumber: dominant.unitNumber,
      unitTitle: dominant.unitTitle,
      topicCodes: chunk.map((t) => t.code),
      combinedTitle: chunk.map((t) => t.title).join("; "),
    });
  }

  return groups;
}

export function expandSessionTopics(
  bundles: BundleResult[],
): { topic: string; deliveryMethod: "Theory" | "Demo" | "PPT" }[] {
  return bundles.map((b, i) => ({
    topic: b.combinedTitle,
    deliveryMethod: i % 2 === 0 ? "Demo" : "Theory",
  }));
}
