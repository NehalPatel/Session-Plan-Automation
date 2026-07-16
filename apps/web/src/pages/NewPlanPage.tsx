import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { SessionPlanDocument } from "@session-plan/shared";
import { api } from "../lib/api";
import { useWizard } from "../context/WizardContext";
import { StepSchedule } from "./wizard/StepSchedule";
import { StepSyllabus } from "./wizard/StepSyllabus";
import { StepUnits } from "./wizard/StepUnits";

const steps = ["Syllabus", "Schedule", "Units", "Generate"];

export function NewPlanPage() {
  const navigate = useNavigate();
  const wizard = useWizard();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function canNext(): boolean {
    if (step === 0) {
      return Boolean(
        wizard.parsed &&
          wizard.rawText.length >= 20 &&
          wizard.parsed.courseTitle.trim().length > 0,
      );
    }
    if (step === 1) {
      const { fromDate, toDate } = wizard.dateRange;
      return (
        wizard.metadata.subjectName.trim().length > 0 &&
        wizard.metadata.divisions.length > 0 &&
        Boolean(fromDate) &&
        Boolean(toDate) &&
        fromDate <= toDate &&
        wizard.lectureDayCount > 0
      );
    }
    if (step === 2) {
      if (wizard.unitSelection.mode === "manual") {
        return Array.isArray(wizard.unitSelection.value) && wizard.unitSelection.value.length > 0;
      }
      return true;
    }
    return true;
  }

  async function generatePlan() {
    setError("");
    setLoading(true);
    try {
      const plan = await api.post<SessionPlanDocument>("/session-plans/generate", wizard.toGenerateInput());
      navigate(`/plans/${plan.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <h1>New Session Plan</h1>
      <div className="wizard-steps">
        {steps.map((label, index) => (
          <div key={label} className={`wizard-step ${index === step ? "active" : index < step ? "done" : ""}`}>
            {index + 1}. {label}
          </div>
        ))}
      </div>

      <div className="card">
        {step === 0 && <StepSyllabus />}
        {step === 1 && <StepSchedule />}
        {step === 2 && <StepUnits />}
        {step === 3 && (
          <div className="stack">
            <h3>Ready to generate</h3>
            <p className="muted">
              Subject: {wizard.metadata.subjectName} | Class: {wizard.metadata.class} | Divisions:{" "}
              {wizard.metadata.divisions.join(", ")} | Sessions: {wizard.lectureDayCount}
            </p>
            <button className="btn btn-primary" onClick={generatePlan} disabled={loading}>
              {loading ? "Generating session plan..." : "Generate Session Plan"}
            </button>
          </div>
        )}
        {error && <p className="error">{error}</p>}
      </div>

      <div className="row-actions" style={{ marginTop: 16 }}>
        <button className="btn btn-secondary" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
          Back
        </button>
        {step < 3 && (
          <button className="btn btn-primary" disabled={!canNext()} onClick={() => setStep((s) => s + 1)}>
            Next
          </button>
        )}
      </div>
    </div>
  );
}
