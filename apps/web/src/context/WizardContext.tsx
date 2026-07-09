import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import {
  buildScheduleFromRange,
  expandLectureDates,
  type DateRange,
  type GenerateSessionPlanInput,
  type ParsedSyllabus,
  type PlanMetadata,
  type ScheduleRow,
  type UnitSelection,
} from "@session-plan/shared";

interface WizardState {
  rawText: string;
  parsed: ParsedSyllabus | null;
  syllabusId?: string;
  metadata: PlanMetadata;
  dateRange: DateRange;
  includedDates: string[];
  unitSelection: UnitSelection;
}

const defaultMetadata: PlanMetadata = {
  academicYear: "2026-27",
  class: "TYBCA",
  semester: 5,
  divisions: ["G"],
  subjectName: "",
};

const defaultState: WizardState = {
  rawText: "",
  parsed: null,
  metadata: defaultMetadata,
  dateRange: { fromDate: "", toDate: "" },
  includedDates: [],
  unitSelection: { mode: "all" },
};

interface WizardContextValue extends WizardState {
  lectureDayCount: number;
  candidateDateCount: number;
  schedulePreview: ScheduleRow[];
  candidateDates: string[];
  setRawText: (value: string) => void;
  setParsed: (value: ParsedSyllabus | null) => void;
  setSyllabusId: (id?: string) => void;
  setMetadata: (value: Partial<PlanMetadata>) => void;
  setDateRange: (value: Partial<DateRange>) => void;
  setIncludedDates: (dates: string[]) => void;
  setUnitSelection: (value: UnitSelection) => void;
  toGenerateInput: () => GenerateSessionPlanInput;
  reset: () => void;
}

const WizardContext = createContext<WizardContextValue | undefined>(undefined);

export function WizardProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WizardState>(defaultState);

  const candidateDates = useMemo(
    () => expandLectureDates(state.dateRange.fromDate, state.dateRange.toDate),
    [state.dateRange.fromDate, state.dateRange.toDate],
  );

  const schedulePreview = useMemo(
    () => buildScheduleFromRange(state.dateRange.fromDate, state.dateRange.toDate, state.includedDates),
    [state.dateRange.fromDate, state.dateRange.toDate, state.includedDates],
  );

  const value = useMemo<WizardContextValue>(
    () => ({
      ...state,
      lectureDayCount: schedulePreview.length,
      candidateDateCount: candidateDates.length,
      schedulePreview,
      candidateDates,
      setRawText: (rawText) => setState((s) => ({ ...s, rawText })),
      setParsed: (parsed) =>
        setState((s) => ({
          ...s,
          parsed,
          metadata: parsed
            ? { ...s.metadata, subjectName: parsed.courseTitle || s.metadata.subjectName }
            : s.metadata,
        })),
      setSyllabusId: (syllabusId) => setState((s) => ({ ...s, syllabusId })),
      setMetadata: (metadata) => setState((s) => ({ ...s, metadata: { ...s.metadata, ...metadata } })),
      setDateRange: (dateRange) =>
        setState((s) => {
          const nextDateRange = { ...s.dateRange, ...dateRange };
          const candidates = expandLectureDates(nextDateRange.fromDate, nextDateRange.toDate);
          return { ...s, dateRange: nextDateRange, includedDates: candidates };
        }),
      setIncludedDates: (includedDates) => setState((s) => ({ ...s, includedDates })),
      setUnitSelection: (unitSelection) => setState((s) => ({ ...s, unitSelection })),
      toGenerateInput: () => ({
        syllabusId: state.syllabusId,
        rawText: state.rawText,
        parsed: state.parsed ?? undefined,
        metadata: state.metadata,
        dateRange: state.dateRange,
        schedule: schedulePreview,
        unitSelection: state.unitSelection,
      }),
      reset: () => setState(defaultState),
    }),
    [state, schedulePreview, candidateDates],
  );

  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>;
}

export function useWizard() {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error("useWizard must be used within WizardProvider");
  return ctx;
}
