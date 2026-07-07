import { useWizard } from "../../context/WizardContext";

export function StepUnits() {
  const { parsed, unitSelection, setUnitSelection } = useWizard();
  const units = parsed?.units ?? [];

  return (
    <div className="stack">
      <h3>Select units to include</h3>
      <div className="field">
        <label className="label">
          <input
            type="radio"
            checked={unitSelection.mode === "all"}
            onChange={() => setUnitSelection({ mode: "all" })}
          />{" "}
          All units
        </label>
      </div>
      <div className="field">
        <label className="label">
          <input
            type="radio"
            checked={unitSelection.mode === "firstN"}
            onChange={() => setUnitSelection({ mode: "firstN", value: 2 })}
          />{" "}
          First N units
        </label>
        {unitSelection.mode === "firstN" && (
          <input
            className="input"
            type="number"
            min={1}
            max={units.length || 1}
            value={typeof unitSelection.value === "number" ? unitSelection.value : 2}
            onChange={(e) => setUnitSelection({ mode: "firstN", value: Number(e.target.value) })}
          />
        )}
      </div>
      <div className="field">
        <label className="label">
          <input
            type="radio"
            checked={unitSelection.mode === "manual"}
            onChange={() => setUnitSelection({ mode: "manual", value: units.map((u) => u.number) })}
          />{" "}
          Pick units manually
        </label>
        {unitSelection.mode === "manual" && (
          <div className="stack">
            {units.map((unit) => {
              const selected = Array.isArray(unitSelection.value) ? unitSelection.value : [];
              const checked = selected.includes(unit.number);
              return (
                <label key={unit.number}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? [...selected, unit.number]
                        : selected.filter((n) => n !== unit.number);
                      setUnitSelection({ mode: "manual", value: next });
                    }}
                  />{" "}
                  Unit {unit.number}: {unit.title}
                </label>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
