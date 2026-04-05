import "./style.css";
import { useEffect, useState } from "react";
import { addMeasurement } from "../../lib/indexedDb";

export default function Temp({ category }) {
  const draftKey = `temp-form-draft-${category || "temp"}`;
  const loadDraft = () => {
    if (typeof window === "undefined") return null;

    try {
      const storedValue = localStorage.getItem(draftKey);
      return storedValue ? JSON.parse(storedValue) : null;
    } catch {
      return null;
    }
  };

  const draft = loadDraft();

  const [sfo, setSfo] = useState(() => draft?.sfo ?? "");
  const [customer, setCustomer] = useState(() => draft?.customer ?? "");
  const [project, setProject] = useState(() => draft?.project ?? "");
  const [width, setWidth] = useState(() => draft?.width ?? 0);
  const [height, setHeight] = useState(() => draft?.height ?? 0);
  const [specThickness, setSpecThickness] = useState(() => draft?.specThickness ?? "5mm");
  const [glassType, setGlassType] = useState(() => draft?.glassType ?? "");
  const [glassTemp, setGlassTemp] = useState(() => draft?.glassTemp ?? "HS");
  const [glassProcessing, setGlassProcessing] = useState(() => draft?.glassProcessing ?? "RG");
  const [zebra, setZebra] = useState(() => draft?.zebra ?? "OK");
  const [rollerwave, setRollerwave] = useState(() => draft?.rollerwave ?? "");
  const [edgeLift, setEdgeLift] = useState(() => draft?.edgeLift ?? "");
  const [overallBow, setOverallBow] = useState(() => draft?.overallBow ?? "");
  const [fragmentation, setFragmentation] = useState(() => draft?.fragmentation ?? "");
  const [stress, setStress] = useState(() => draft?.stress ?? "");
  const [handoverTo, setHandoverTo] = useState(() => draft?.handoverTo ?? "Lami");
  const [operator, setOperator] = useState(() => draft?.operator ?? "Maiku Lal");
  const [saveStatus, setSaveStatus] = useState({ type: "idle", message: "" });

  useEffect(() => {
    const draft = {
      sfo,
      customer,
      project,
      width,
      height,
      specThickness,
      glassType,
      glassTemp,
      glassProcessing,
      zebra,
      rollerwave,
      edgeLift,
      overallBow,
      fragmentation,
      stress,
      handoverTo,
      operator,
    };

    localStorage.setItem(draftKey, JSON.stringify(draft));
  }, [draftKey, sfo, customer, project, width, height, specThickness, glassType, glassTemp, glassProcessing, zebra, rollerwave, edgeLift, overallBow, fragmentation, stress, handoverTo, operator]);

  const onSave = async () => {
    setSaveStatus({ type: "idle", message: "" });

    // Validate required fields (project, stress, and fragmentation are optional)
    const requiredFields = {
      sfo: sfo.trim(),
      customer: customer.trim(),
      width: width,
      height: height,
      glassType: glassType.trim(),
      rollerwave: rollerwave.trim(),
      edgeLift: edgeLift.trim(),
      overallBow: overallBow.trim(),
    };

    const emptyFields = Object.entries(requiredFields)
      .filter(([, value]) => value === "" || value === 0)
      .map(([key]) => key);

    if (emptyFields.length > 0) {
      setSaveStatus({
        type: "error",
        message: `Please fill in all required fields: ${emptyFields.join(", ")}`,
      });
      return;
    }

    // Format glass spec: "05mm clear hs rg" or "08mm st 167 tg cp"
    const thicknessNum = specThickness.replace("mm", "").padStart(2, "0");
    const spec = `${thicknessNum}mm ${glassType.toUpperCase()} ${glassTemp.toUpperCase()} ${glassProcessing.toUpperCase()}`;

    // Convert rollerwave and edgeLift: 5 becomes 0.05, 10 becomes 0.10, etc.
    const convertValue = (val) => {
      const num = Number(val) || 0;
      return num === 0 ? "0" : (num / 100).toFixed(2);
    };

    const measurement = {
      time: new Date().toISOString(),
      sfo: sfo.trim(),
      customer: customer.trim(),
      project: project.trim() ? project.trim() : "—",
      width: `${Number(width)} mm`,
      height: `${Number(height)} mm`,
      spec,
      zebra,
      rollerwave: `${convertValue(rollerwave)} mm`,
      edgeLift: `${convertValue(edgeLift)} mm`,
      overallBow: `${overallBow.trim()} mm`,
      fragmentation: fragmentation.trim() ? `${fragmentation.trim()} no's` : "—",
      stress: stress.trim() ? `${stress.trim()} MPa` : "—",
      handoverTo,
      operator,
    };

    try {
      await addMeasurement(measurement, category);
      setSaveStatus({ type: "success", message: "Saved to IndexedDB." });
      // Reset form
      setSfo("");
      setCustomer("");
      setProject("");
      setWidth(0);
      setHeight(0);
      setSpecThickness("5mm");
      setGlassType("");
      setGlassTemp("HS");
      setGlassProcessing("RG");
      setZebra("OK");
      setRollerwave("");
      setEdgeLift("");
      setOverallBow("");
      setFragmentation("");
      setStress("");
      setHandoverTo("Lami");
      setOperator("Maiku Lal");
      localStorage.removeItem(draftKey);
    } catch (err) {
      setSaveStatus({
        type: "error",
        message: err instanceof Error ? err.message : "Save failed.",
      });
    }
  };

  return (
    <>
      <div className="set-page-root m3-form">
        <div className="m3-outlined-text-field">
          <input
            id="field-sfo"
            className="m3-outlined-text-field__input"
            type="number"
            placeholder=" "
            value={sfo}
            onChange={(e) => setSfo(e.target.value)}
            autoComplete="off"
          />
          <label htmlFor="field-sfo" className="m3-outlined-text-field__label">
            SFO
          </label>
        </div>

        <div className="m3-outlined-text-field">
          <input
            id="field-customer"
            className="m3-outlined-text-field__input"
            type="text"
            placeholder=" "
            value={customer}
            onChange={(e) => setCustomer(e.target.value.toUpperCase())}
            autoComplete="off"
          />
          <label htmlFor="field-customer" className="m3-outlined-text-field__label">
            Customer
          </label>
        </div>

        <div className="m3-outlined-text-field">
          <input
            id="field-project"
            className="m3-outlined-text-field__input"
            type="text"
            placeholder=" "
            value={project}
            onChange={(e) => setProject(e.target.value)}
            autoComplete="off"
          />
          <label htmlFor="field-project" className="m3-outlined-text-field__label">
            Project
          </label>
        </div>

        <div className="m3-outlined-text-field">
          <input
            id="field-width"
            className="m3-outlined-text-field__input"
            type="number"
            placeholder=" "
            inputMode="decimal"
            value={width === 0 ? "" : width}
            onChange={(e) => setWidth(Number(e.target.value) || 0)}
          />
          <label htmlFor="field-width" className="m3-outlined-text-field__label">
            Width
          </label>
        </div>

        <div className="m3-outlined-text-field">
          <input
            id="field-height"
            className="m3-outlined-text-field__input"
            type="number"
            placeholder=" "
            inputMode="decimal"
            value={height === 0 ? "" : height}
            onChange={(e) => setHeight(Number(e.target.value) || 0)}
          />
          <label htmlFor="field-height" className="m3-outlined-text-field__label">
            Height
          </label>
        </div>

        <div className="m3-select-group">
          <label className="m3-select-label">Spec Thickness</label>
          <select
            value={specThickness}
            onChange={(e) => setSpecThickness(e.target.value)}
            className="m3-select-field"
          >
            <option value="5mm">5mm</option>
            <option value="6mm">6mm</option>
            <option value="8mm">8mm</option>
            <option value="10mm">10mm</option>
            <option value="12mm">12mm</option>
            <option value="15mm">15mm</option>
          </select>
        </div>

        <div className="m3-outlined-text-field">
          <input
            id="field-glass-type"
            className="m3-outlined-text-field__input"
            type="text"
            placeholder=" "
            value={glassType}
            onChange={(e) => setGlassType(e.target.value)}
            autoComplete="off"
          />
          <label htmlFor="field-glass-type" className="m3-outlined-text-field__label">
            Glass Type
          </label>
        </div>

        <div className="m3-select-group">
          <label className="m3-select-label">Glass Process</label>
          <select
            value={glassTemp}
            onChange={(e) => setGlassTemp(e.target.value)}
            className="m3-select-field"
          >
            <option value="HS">HS</option>
            <option value="TG">TG</option>
          </select>
        </div>

        <div className="m3-select-group">
          <label className="m3-select-label">Glass Processing</label>
          <select
            value={glassProcessing}
            onChange={(e) => setGlassProcessing(e.target.value)}
            className="m3-select-field"
          >
            <option value="RG">RG</option>
            <option value="CP">CP</option>
          </select>
        </div>

        <div className="m3-select-group">
          <label className="m3-select-label">Zebra</label>
          <select
            value={zebra}
            onChange={(e) => setZebra(e.target.value)}
            className="m3-select-field"
          >
            <option value="OK">OK</option>
            <option value="Not OK">Not OK</option>
          </select>
        </div>

        <div className="m3-outlined-text-field">
          <input
            id="field-rollerwave"
            className="m3-outlined-text-field__input"
            type="text"
            placeholder=" "
            value={rollerwave}
            onChange={(e) => setRollerwave(e.target.value)}
            autoComplete="off"
          />
          <label htmlFor="field-rollerwave" className="m3-outlined-text-field__label">
            Rollerwave
          </label>
        </div>

        <div className="m3-outlined-text-field">
          <input
            id="field-edge-lift"
            className="m3-outlined-text-field__input"
            type="text"
            placeholder=" "
            value={edgeLift}
            onChange={(e) => setEdgeLift(e.target.value)}
            autoComplete="off"
          />
          <label htmlFor="field-edge-lift" className="m3-outlined-text-field__label">
            Edge Lift
          </label>
        </div>

        <div className="m3-outlined-text-field">
          <input
            id="field-overall-bow"
            className="m3-outlined-text-field__input"
            type="text"
            placeholder=" "
            value={overallBow}
            onChange={(e) => setOverallBow(e.target.value)}
            autoComplete="off"
          />
          <label htmlFor="field-overall-bow" className="m3-outlined-text-field__label">
            Overall Bow
          </label>
        </div>

        <div className="m3-outlined-text-field">
          <input
            id="field-fragmentation"
            className="m3-outlined-text-field__input"
            type="text"
            placeholder=" "
            value={fragmentation}
            onChange={(e) => setFragmentation(e.target.value)}
            autoComplete="off"
          />
          <label htmlFor="field-fragmentation" className="m3-outlined-text-field__label">
            Fragmentation
          </label>
        </div>

        <div className="m3-outlined-text-field">
          <input
            id="field-stress"
            className="m3-outlined-text-field__input"
            type="text"
            placeholder=" "
            value={stress}
            onChange={(e) => setStress(e.target.value)}
            autoComplete="off"
          />
          <label htmlFor="field-stress" className="m3-outlined-text-field__label">
            Stress
          </label>
        </div>

        <div className="m3-select-group">
          <label className="m3-select-label">Handover To</label>
          <select
            value={handoverTo}
            onChange={(e) => setHandoverTo(e.target.value)}
            className="m3-select-field"
          >
            <option value="Lami">Lami</option>
            <option value="DGU">DGU</option>
            <option value="Dispatch">Dispatch</option>
          </select>
        </div>

        <div className="m3-select-group">
          <label className="m3-select-label">Operator</label>
          <select
            value={operator}
            onChange={(e) => setOperator(e.target.value)}
            className="m3-select-field"
          >
            <option value="Maiku Lal">Maiku Lal</option>
            <option value="Dhanunjay">Dhanunjay</option>
            <option value="Santosh">Santosh</option>
          </select>
        </div>

        <div className="m3-actions">
          <button
            type="button"
            className="m3-button m3-button--filled m3-button--full"
            onClick={onSave}
          >
            Save
          </button>
          {saveStatus.message ? (
            <div
              className={`m3-status m3-status--${saveStatus.type}`}
              role={saveStatus.type === "error" ? "alert" : "status"}
            >
              {saveStatus.message}
            </div>
          ) : null}
        </div>
      </div>
      
    </>
  );
}