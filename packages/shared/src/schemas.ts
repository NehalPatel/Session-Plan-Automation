import { z } from "zod";
import {
  BCA_CLASSES,
  DELIVERY_METHODS,
  DIVISIONS,
  PLAN_STATUSES,
  UNIT_SELECTION_MODES,
} from "./enums.js";
import { isDateInRange, isSunday } from "./schedule.js";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const syllabusTopicSchema = z.object({
  code: z.string(),
  title: z.string(),
});

export const syllabusUnitSchema = z.object({
  number: z.number().int().positive(),
  title: z.string(),
  topics: z.array(syllabusTopicSchema),
});

export const parsedSyllabusSchema = z.object({
  courseTitle: z.string(),
  courseCode: z.string().optional().default(""),
  units: z.array(syllabusUnitSchema),
  referenceBooks: z.array(z.string()).default([]),
});

export const parseSyllabusRequestSchema = z.object({
  rawText: z.string().min(20),
});

export const saveSyllabusSchema = z.object({
  rawText: z.string().min(20),
  parsed: parsedSyllabusSchema,
});

export const scheduleRowSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().optional().default(""),
  endTime: z.string().optional().default(""),
  room: z.string().optional().default(""),
});

export const dateRangeSchema = z.object({
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const planMetadataSchema = z.object({
  academicYear: z.string().regex(/^\d{4}-\d{2}$/),
  class: z.enum(BCA_CLASSES),
  semester: z.number().int().min(1).max(6),
  divisions: z.array(z.enum(DIVISIONS)).min(1),
  subjectName: z.string().min(1),
});

export const scheduleConfigSchema = z.object({
  dateRange: dateRangeSchema,
});

export const unitSelectionSchema = z.object({
  mode: z.enum(UNIT_SELECTION_MODES),
  value: z.union([z.number().int().positive(), z.array(z.number().int().positive())]).optional(),
});

export const sessionPlanRowSchema = z.object({
  sessionNo: z.number().int().positive(),
  unitNoAndName: z.string(),
  topic: z.string(),
  reference: z.string().optional().default(""),
  deliveryMethod: z.enum(DELIVERY_METHODS),
  completedOn: z.string(),
  roomNo: z.string().optional().default(""),
  time: z.string(),
  studentsPresent: z.string().optional().default(""),
});

export const generateSessionPlanSchema = z
  .object({
    syllabusId: z.string().optional(),
    rawText: z.string().optional(),
    parsed: parsedSyllabusSchema.optional(),
    metadata: planMetadataSchema,
    schedule: z.array(scheduleRowSchema).min(1),
    dateRange: dateRangeSchema,
    unitSelection: unitSelectionSchema,
  })
  .superRefine((data, ctx) => {
    for (const [index, row] of data.schedule.entries()) {
      if (!isDateInRange(row.date, data.dateRange.fromDate, data.dateRange.toDate)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Schedule date ${row.date} is outside the selected date range`,
          path: ["schedule", index, "date"],
        });
      }
      if (isSunday(row.date)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Schedule date ${row.date} cannot be a Sunday`,
          path: ["schedule", index, "date"],
        });
      }
    }
  });

export const updateSessionPlanSchema = z.object({
  rows: z.array(sessionPlanRowSchema).optional(),
  status: z.enum(PLAN_STATUSES).optional(),
  metadata: planMetadataSchema.partial().optional(),
  schedule: z.array(scheduleRowSchema).optional(),
  dateRange: dateRangeSchema.optional(),
});
