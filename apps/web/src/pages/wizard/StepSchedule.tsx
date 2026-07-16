import { BCA_CLASSES, DIVISIONS, formatWeekdayLabel } from "@session-plan/shared";
import type { Division } from "@session-plan/shared";
import { useWizard } from "../../context/WizardContext";

export function StepSchedule() {
  const {
    metadata,
    dateRange,
    lectureDayCount,
    candidateDateCount,
    candidateDates,
    includedDates,
    setMetadata,
    setDateRange,
    setIncludedDates,
  } = useWizard();

  const includedSet = new Set(includedDates);

  function toggleDivision(division: Division) {
    const selected = metadata.divisions;
    const next = selected.includes(division)
      ? selected.filter((d) => d !== division)
      : [...selected, division].sort();
    setMetadata({ divisions: next.length > 0 ? next : [division] });
  }

  function toggleLectureDate(date: string) {
    if (includedSet.has(date)) {
      setIncludedDates(includedDates.filter((d) => d !== date));
      return;
    }
    setIncludedDates([...includedDates, date].sort());
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
          <label className="label">Subject (from syllabus)</label>
          <input className="input" value={metadata.subjectName} readOnly />
          <p className="muted">Taken from Course title on the Syllabus step. Edit it there if needed.</p>
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

      {candidateDateCount > 0 && (
        <div className="field">
          <div className="lecture-days-header">
            <label className="label">Lecture days</label>
            <div className="lecture-days-actions">
              <button type="button" className="link-btn" onClick={() => setIncludedDates(candidateDates)}>
                Select all
              </button>
              <span className="muted">|</span>
              <button type="button" className="link-btn" onClick={() => setIncludedDates([])}>
                Clear all
              </button>
            </div>
          </div>
          <p className="muted">
            Uncheck holidays and days with no lecture. Topics will be distributed across the selected days
            only.
          </p>
          <div className="lecture-days-list">
            {candidateDates.map((date) => (
              <label key={date} className="lecture-day-chip">
                <input
                  type="checkbox"
                  checked={includedSet.has(date)}
                  onChange={() => toggleLectureDate(date)}
                />
                {formatWeekdayLabel(date)}
              </label>
            ))}
          </div>
        </div>
      )}

      {candidateDateCount > 0 && (
        <p className="muted">
          {lectureDayCount} of {candidateDateCount} lecture day(s) selected (Sundays excluded; uncheck
          holidays / no-lecture days). Topics will be distributed across these sessions.
        </p>
      )}
    </div>
  );
}
