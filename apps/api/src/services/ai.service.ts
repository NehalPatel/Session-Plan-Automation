import OpenAI from "openai";
import { parsedSyllabusSchema, type ParsedSyllabus } from "@session-plan/shared";
import { config } from "../config/env.js";

const openai = config.openAiApiKey
  ? new OpenAI({ apiKey: config.openAiApiKey })
  : null;

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) return text.slice(start, end + 1);
  return text.trim();
}

function fallbackParseSyllabus(rawText: string): ParsedSyllabus {
  const units: ParsedSyllabus["units"] = [];
  const unitRegex = /Unit[-\s]*(\d+)\s*[:.]?\s*(.+)/gi;
  let match: RegExpExecArray | null;
  const unitStarts: { number: number; title: string; index: number }[] = [];

  while ((match = unitRegex.exec(rawText)) !== null) {
    unitStarts.push({
      number: Number(match[1]),
      title: match[2].trim(),
      index: match.index,
    });
  }

  for (let i = 0; i < unitStarts.length; i += 1) {
    const start = unitStarts[i];
    const endIndex = i + 1 < unitStarts.length ? unitStarts[i + 1].index : rawText.length;
    const section = rawText.slice(start.index, endIndex);
    const topics: ParsedSyllabus["units"][number]["topics"] = [];
    const topicRegex = /(\d+(?:\.\d+)+)\s+(.+?)(?=\n\d+(?:\.\d+)+|\nUnit-|\n*$)/gs;
    let topicMatch: RegExpExecArray | null;
    while ((topicMatch = topicRegex.exec(section)) !== null) {
      topics.push({ code: topicMatch[1], title: topicMatch[2].replace(/\s+/g, " ").trim() });
    }
    if (topics.length === 0) {
      topics.push({ code: `${start.number}.0`, title: start.title });
    }
    units.push({ number: start.number, title: start.title, topics });
  }

  const titleMatch = rawText.match(/Course Title[:\s]+(.+)/i);
  const codeMatch = rawText.match(/Course Code[:\s]+([\w-]+)/i);

  return parsedSyllabusSchema.parse({
    courseTitle: titleMatch?.[1]?.trim() ?? "Subject",
    courseCode: codeMatch?.[1]?.trim() ?? "",
    units,
    referenceBooks: [],
  });
}

export async function parseSyllabusWithAi(rawText: string): Promise<ParsedSyllabus> {
  if (!openai) {
    return fallbackParseSyllabus(rawText);
  }

  const prompt = `Extract syllabus structure from the text below. Return ONLY valid JSON with this shape:
{
  "courseTitle": "string",
  "courseCode": "string",
  "units": [
    {
      "number": 1,
      "title": "Unit title",
      "topics": [{ "code": "1.1", "title": "topic title" }]
    }
  ],
  "referenceBooks": ["book 1", "book 2"]
}

Include all numbered subtopics. Preserve unit order.

SYLLABUS TEXT:
${rawText}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.1,
      messages: [
        { role: "system", content: "You extract structured syllabus data. Respond with JSON only." },
        { role: "user", content: prompt },
      ],
    });

    const content = response.choices[0]?.message?.content ?? "";
    const parsed = JSON.parse(extractJson(content));
    return parsedSyllabusSchema.parse(parsed);
  } catch {
    return fallbackParseSyllabus(rawText);
  }
}

interface BundleInput {
  topics: { code: string; title: string; unitNumber: number; unitTitle: string }[];
  sessionCount: number;
}

interface BundleResult {
  unitNumber: number;
  unitTitle: string;
  topicCodes: string[];
  combinedTitle: string;
}

function deterministicBundle(input: BundleInput): BundleResult[] {
  const { topics, sessionCount } = input;
  if (sessionCount === 0) return [];

  if (topics.length === 0) {
    return Array.from({ length: sessionCount }, (_, index) => ({
      unitNumber: 1,
      unitTitle: "General",
      topicCodes: [],
      combinedTitle: `Session ${index + 1} introduction and discussion`,
    }));
  }

  if (topics.length <= sessionCount) {
    return Array.from({ length: sessionCount }, (_, index) => {
      const topic = topics[Math.min(index, topics.length - 1)];
      return {
        unitNumber: topic.unitNumber,
        unitTitle: topic.unitTitle,
        topicCodes: [topic.code],
        combinedTitle:
          index < topics.length ? topic.title : `${topic.title} (revision and practice)`,
      };
    });
  }

  const groups: BundleResult[] = [];
  let cursor = 0;
  let remainder = topics.length % sessionCount;
  const baseSize = Math.floor(topics.length / sessionCount);

  for (let i = 0; i < sessionCount; i += 1) {
    const size = baseSize + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder -= 1;
    const chunk = topics.slice(cursor, cursor + size);
    cursor += size;
    const dominant = chunk[0] ?? topics[topics.length - 1];
    groups.push({
      unitNumber: dominant.unitNumber,
      unitTitle: dominant.unitTitle,
      topicCodes: chunk.map((t) => t.code),
      combinedTitle: chunk.map((t) => t.title).join("; "),
    });
  }

  return groups;
}

function padBundles(bundles: BundleResult[], sessionCount: number): BundleResult[] {
  if (bundles.length >= sessionCount) return bundles.slice(0, sessionCount);
  const last = bundles[bundles.length - 1] ?? {
    unitNumber: 1,
    unitTitle: "General",
    topicCodes: [],
    combinedTitle: "Revision and practice",
  };
  return [
    ...bundles,
    ...Array.from({ length: sessionCount - bundles.length }, (_, index) => ({
      ...last,
      combinedTitle: `${last.combinedTitle} (continued ${index + 1})`,
    })),
  ];
}

export async function bundleTopicsForSessions(
  topics: BundleInput["topics"],
  sessionCount: number,
): Promise<BundleResult[]> {
  if (!openai || topics.length <= sessionCount) {
    return deterministicBundle({ topics, sessionCount });
  }

  const topicList = topics
    .map((t) => `${t.code} [Unit ${t.unitNumber}] ${t.title}`)
    .join("\n");

  const prompt = `Group the following syllabus topics into exactly ${sessionCount} lecture sessions.
Keep adjacent topics together when possible. Do not split a topic across sessions.
Return ONLY JSON array:
[{"topicCodes":["1.1","1.1.1"],"combinedTitle":"short combined title"}]

TOPICS:
${topicList}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: "You group syllabus topics into lecture sessions. JSON only." },
        { role: "user", content: prompt },
      ],
    });
    const content = response.choices[0]?.message?.content ?? "[]";
    const bundles = JSON.parse(extractJson(content)) as { topicCodes: string[]; combinedTitle: string }[];

    const grouped = bundles.map((bundle) => {
      const matched = topics.filter((t) => bundle.topicCodes.includes(t.code));
      const first = matched[0] ?? topics[0];
      return {
        unitNumber: first.unitNumber,
        unitTitle: first.unitTitle,
        topicCodes: bundle.topicCodes,
        combinedTitle: bundle.combinedTitle || matched.map((m) => m.title).join("; "),
      };
    });
    return padBundles(grouped, sessionCount);
  } catch {
    return deterministicBundle({ topics, sessionCount });
  }
}

export async function expandSessionTopics(
  bundles: BundleResult[],
): Promise<{ topic: string; deliveryMethod: "Theory" | "Demo" | "PPT" }[]> {
  if (!openai) {
    return bundles.map((b, i) => ({
      topic: b.combinedTitle,
      deliveryMethod: i % 2 === 0 ? "Demo" : "Theory",
    }));
  }

  const list = bundles
    .map((b, i) => `${i + 1}. Unit ${b.unitNumber}: ${b.combinedTitle}`)
    .join("\n");

  const prompt = `Rewrite each lecture topic into a descriptive classroom topic (1-2 sentences).
Also assign deliveryMethod as Theory, Demo, or PPT.
Return ONLY JSON array:
[{"topic":"descriptive topic","deliveryMethod":"Theory"}]

SESSIONS:
${list}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content:
            "You write descriptive lecture topics for college session plans. Example: 'PHP Variable declaration and Constants' -> 'PHP variable declaration using demo examples and difference between variables and constants'. JSON only.",
        },
        { role: "user", content: prompt },
      ],
    });
    const content = response.choices[0]?.message?.content ?? "[]";
    const expanded = JSON.parse(extractJson(content)) as { topic: string; deliveryMethod: string }[];
    return expanded.map((row, i) => ({
      topic: row.topic || bundles[i]?.combinedTitle || "Topic",
      deliveryMethod: (["Theory", "Demo", "PPT"].includes(row.deliveryMethod)
        ? row.deliveryMethod
        : i % 2 === 0
          ? "Demo"
          : "Theory") as "Theory" | "Demo" | "PPT",
    }));
  } catch {
    return bundles.map((b, i) => ({
      topic: b.combinedTitle,
      deliveryMethod: i % 2 === 0 ? "Demo" : "Theory",
    }));
  }
}

export type { BundleResult };
