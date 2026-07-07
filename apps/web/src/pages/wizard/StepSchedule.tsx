import { BCA_CLASSES, DIVISIONS } from "@session-plan/shared";
import type { Division } from "@session-plan/shared";
import { useWizard } from "../../context/WizardContext";

export function StepSchedule() {
  const { metadata, dateRange, lectureDayCount, setMetadata, setDateRange } = useWizard();

  function toggleDivision(division: Division) {
    const selected = metadata.divisions;
    const next = selected.includes(division)
      ? selected.filter((d) => d !== division)
      : [...selected, division].sort();
    setMetadata({ divisions: next.length > 0 ? next : [division] });
  }

  return (
    <div className="stack">
      <div className="grid-2">
        <div className="field">
          <label className="label">Academic year</label>
          <input
            className="input"
            value={metadata.academicYear}
            onChange={(e) => setMetadata({ academicYear: e.target.value })}
            placeholder="2026-27"
          />
        </div>
        <div className="field">
          <label className="label">Semester</label>
          <input
            className="input"
            type="number"
            min={1}
            max={6}
            value={metadata.semester}
            onChange={(e) => setMetadata({ semester: Number(e.target.value) })}
          />
        </div>
        <div className="field">
          <label className="label">Class</label>
          <select
            className="select"
            value={metadata.class}
            onChange={(e) => setMetadata({ class: e.target.value as typeof metadata.class })}
          >
            {BCA_CLASSES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="label">Subject name</label>
          <input
            className="input"
            value={metadata.subjectName}
            onChange={(e) => setMetadata({ subjectName: e.target.value })}
          />
        </div>
      </div>

      <div className="field">
        <label className="label">Divisions (select all merged divisions)</label>
        <p className="muted">
          Select every division that shares these lectures. Each division gets its own session plan file on
          download, with individual session numbering.
        </p>
        <div className="division-grid">
          {DIVISIONS.map((division) => (
            <label key={division} className="division-chip">
              <input
                type="checkbox"
                checked={metadata.divisions.includes(division)}
                onChange={() => toggleDivision(division)}
              />
              {division}
            </label>
          ))}
        </div>
      </div>

      <h3>Lecture period</h3>
      <p className="muted">
        Pick the from and to dates only. Time, room, and attendance can be filled manually in Word after
        download.
      </p>
      <div className="grid-2">
        <div className="field">
          <label className="label">From date</label>
          <input
            className="input"
            type="date"
            value={dateRange.fromDate}
            onChange={(e) => setDateRange({ fromDate: e.target.value })}
          />
        </div>
        <div className="field">
          <label className="label">To date</label>
          <input
            className="input"
            type="date"
            value={dateRange.toDate}
            onChange={(e) => setDateRange({ toDate: e.target.value })}
          />
        </div>
      </div>
      {lectureDayCount > 0 && (
        <p className="muted">
          {lectureDayCount} lecture day(s) will be scheduled (Mon-Sat, excluding Sundays). Topics will be
          distributed across these sessions.
        </p>
      )}
    </div>
  );
}
