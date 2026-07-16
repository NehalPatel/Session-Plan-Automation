import { z } from "zod";
import type {
  BcaClass,
  DeliveryMethod,
  Division,
  PlanStatus,
  UnitSelectionMode,
  UserRole,
} from "./enums.js";
import {
  dateRangeSchema,
  generateSessionPlanSchema,
  loginSchema,
  parsedSyllabusSchema,
  planMetadataSchema,
  registerSchema,
  scheduleConfigSchema,
  scheduleRowSchema,
  sessionPlanRowSchema,
  syllabusTopicSchema,
  syllabusUnitSchema,
  unitSelectionSchema,
  updateSessionPlanSchema,
} from "./schemas.js";

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type SyllabusTopic = z.infer<typeof syllabusTopicSchema>;
export type SyllabusUnit = z.infer<typeof syllabusUnitSchema>;
export type ParsedSyllabus = z.infer<typeof parsedSyllabusSchema>;
export type ScheduleRow = z.infer<typeof scheduleRowSchema>;
export type DateRange = z.infer<typeof dateRangeSchema>;
export type ScheduleConfig = z.infer<typeof scheduleConfigSchema>;
export type PlanMetadata = z.infer<typeof planMetadataSchema>;
export type UnitSelection = z.infer<typeof unitSelectionSchema>;
export type SessionPlanRow = z.infer<typeof sessionPlanRowSchema>;
export type GenerateSessionPlanInput = z.infer<typeof generateSessionPlanSchema>;
export type UpdateSessionPlanInput = z.infer<typeof updateSessionPlanSchema>;

export interface UserPublic {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface AdminUserPlanSummary {
  id: string;
  subjectName: string;
  class: string;
  semester: number;
  divisions: string[];
  status: PlanStatus;
  sessionCount: number;
  updatedAt: string;
}

export interface AdminUserSummary {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  planCount: number;
  plans: AdminUserPlanSummary[];
}

export interface AuthResponse {
  token: string;
  user: UserPublic;
}

export interface SyllabusDocument {
  id: string;
  userId: string;
  rawText: string;
  parsed: ParsedSyllabus;
  createdAt: string;
}

export interface SessionPlanDocument {
  id: string;
  userId: string;
  syllabusId?: string;
  metadata: PlanMetadata;
  dateRange: DateRange;
  schedule: ScheduleRow[];
  unitSelection: UnitSelection;
  rows: SessionPlanRow[];
  status: PlanStatus;
  createdAt: string;
  updatedAt: string;
}

export type { BcaClass, DeliveryMethod, Division, PlanStatus, UnitSelectionMode, UserRole };
