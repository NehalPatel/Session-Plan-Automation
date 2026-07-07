import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import {
  buildScheduleFromRange,
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
  unitSelection: { mode: "all" },
};

interface WizardContextValue extends WizardState {
  lectureDayCount: number;
  schedulePreview: ScheduleRow[];
  setRawText: (value: string) => void;
  setParsed: (value: ParsedSyllabus | null) => void;
  setSyllabusId: (id?: string) => void;
  setMetadata: (value: Partial<PlanMetadata>) => void;
  setDateRange: (value: Partial<DateRange>) => void;
  setUnitSelection: (value: UnitSelection) => void;
  toGenerateInput: () => GenerateSessionPlanInput;
  reset: () => void;
}

const WizardContext = createContext<WizardContextValue | undefined>(undefined);

export function WizardProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WizardState>(defaultState);

  const schedulePreview = useMemo(
    () => buildScheduleFromRange(state.dateRange.fromDate, state.dateRange.toDate),
    [state.dateRange.fromDate, state.dateRange.toDate],
  );

  const value = useMemo<WizardContextValue>(
    () => ({
      ...state,
      lectureDayCount: schedulePreview.length,
      schedulePreview,
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
      setDateRange: (dateRange) => setState((s) => ({ ...s, dateRange: { ...s.dateRange, ...dateRange } })),
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
    [state, schedulePreview],
  );

  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>;
}

export function useWizard() {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error("useWizard must be used within WizardProvider");
  return ctx;
}
