import { useState } from "react";
import type { ParsedSyllabus, SyllabusUnit } from "@session-plan/shared";
import { api } from "../../lib/api";
import { useWizard } from "../../context/WizardContext";

function updateUnit(units: SyllabusUnit[], index: number, unit: SyllabusUnit): SyllabusUnit[] {
  return units.map((u, i) => (i === index ? unit : u));
}

export function StepSyllabus() {
  const { rawText, parsed, setRawText, setParsed } = useWizard();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function parseSyllabus() {
    setError("");
    setLoading(true);
    try {
      const res = await api.post<{ parsed: ParsedSyllabus }>("/syllabi/parse", { rawText });
      setParsed(res.parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to prepare lectures");
    } finally {
      setLoading(false);
    }
  }

  function onFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setRawText(String(reader.result ?? ""));
    reader.readAsText(file);
  }

  function updateParsedUnit(index: number, unit: SyllabusUnit) {
    if (!parsed) return;
    setParsed({ ...parsed, units: updateUnit(parsed.units, index, unit) });
  }

  return (
    <div className="stack">
      <div className="field">
        <label className="label">Paste syllabus text</label>
        <textarea
          className="textarea"
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder={"First line: Unit name\nEach following line: one topic"}
        />
      </div>
      <div className="field">
        <label className="label">Or upload .txt file</label>
        <input type="file" accept=".txt,text/plain" onChange={onFileUpload} />
      </div>
      <div className="row-actions">
        <button className="btn btn-primary" onClick={parseSyllabus} disabled={loading || rawText.length < 20}>
          {loading ? "Preparing..." : "Prepare lectures"}
        </button>
      </div>
      {error && <p className="error">{error}</p>}

      {parsed && (
        <div>
          <h3>Review prepared lectures</h3>
          <div className="grid-2">
            <div className="field">
              <label className="label">Course title (Subject in DOCX)</label>
              <input
                className="input"
                value={parsed.courseTitle}
                onChange={(e) => setParsed({ ...parsed, courseTitle: e.target.value })}
              />
              <p className="muted">This becomes the Subject name in the downloaded session plan.</p>
            </div>
            <div className="field">
              <label className="label">Course code</label>
              <input
                className="input"
                value={parsed.courseCode}
                onChange={(e) => setParsed({ ...parsed, courseCode: e.target.value })}
              />
            </div>
          </div>
          {parsed.units.map((unit, unitIndex) => (
            <div key={unit.number} className="unit-block">
              <div className="field">
                <label className="label">Unit {unit.number} title</label>
                <input
                  className="input"
                  value={unit.title}
                  onChange={(e) => updateParsedUnit(unitIndex, { ...unit, title: e.target.value })}
                />
              </div>
              {unit.topics.map((topic, topicIndex) => (
                <div key={`${topic.code}-${topicIndex}`} className="topic-row">
                  <input
                    className="input"
                    value={topic.code}
                    onChange={(e) => {
                      const topics = unit.topics.map((t, i) =>
                        i === topicIndex ? { ...t, code: e.target.value } : t,
                      );
                      updateParsedUnit(unitIndex, { ...unit, topics });
                    }}
                  />
                  <input
                    className="input"
                    value={topic.title}
                    onChange={(e) => {
                      const topics = unit.topics.map((t, i) =>
                        i === topicIndex ? { ...t, title: e.target.value } : t,
                      );
                      updateParsedUnit(unitIndex, { ...unit, topics });
                    }}
                  />
                  <button
                    className="btn btn-danger"
                    type="button"
                    onClick={() => {
                      const topics = unit.topics.filter((_, i) => i !== topicIndex);
                      updateParsedUnit(unitIndex, { ...unit, topics });
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                className="btn btn-secondary"
                type="button"
                onClick={() =>
                  updateParsedUnit(unitIndex, {
                    ...unit,
                    topics: [...unit.topics, { code: `${unit.number}.x`, title: "New topic" }],
                  })
                }
              >
                Add topic
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
