import "./style.css";
import { useEffect, useMemo, useState } from "react";
import { addMeasurement } from "../../lib/indexedDb";
import { copyMeasurementToClipboard } from "../../lib/measurementClipboard";

export default function Set({ category }) {
  const draftKey = `rg-form-draft-${category || "rg"}`;
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
  const [glassType, setGlassType] = useState(() => draft?.glassType ?? "");
  const [glassThickness, setGlassThickness] = useState(() => draft?.glassThickness ?? 4);
  const [glassCategory, setGlassCategory] = useState(
    () => draft?.glassCategory ?? (category?.trim().toLowerCase() === "cp" ? "cp" : "rg")
  );
  const [width, setWidth] = useState(() => draft?.width ?? 0);
  const [height, setHeight] = useState(() => draft?.height ?? 0);
  const [saveStatus, setSaveStatus] = useState({ type: "idle", message: "" });

  const diagonal = useMemo(() => {
    const w = Number(width);
    const h = Number(height);
    if (!Number.isFinite(w) || !Number.isFinite(h)) return "";
    if (w <= 0 || h <= 0) return "";
    const d = Math.hypot(w, h);
    return Number.isFinite(d) ? d.toFixed(2) : "";
  }, [width, height]);

  useEffect(() => {
    const draftData = {
      sfo,
      customer,
      glassType,
      glassThickness,
      glassCategory,
      width,
      height,
    };

    localStorage.setItem(draftKey, JSON.stringify(draftData));
  }, [draftKey, sfo, customer, glassType, glassThickness, glassCategory, width, height]);

  const onSave = async () => {
    setSaveStatus({ type: "idle", message: "" });

    const w = Number(width);
    const h = Number(height);
    const t = Number(glassThickness);
    if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
      setSaveStatus({
        type: "error",
        message: "Enter valid width and height (> 0).",
      });
      return;
    }

    if (!Number.isFinite(t) || t <= 0) {
      setSaveStatus({
        type: "error",
        message: "Enter valid glass thickness (> 0).",
      });
      return;
    }

    const d = Math.hypot(w, h);
    const selectedCategory = glassCategory || category || "rg";
    const measurement = {
      time: new Date().toISOString(),
      sfo: sfo.trim(),
      customer: customer.trim(),
      glassType: glassType.trim(),
      glassThickness: Number.isFinite(t) ? t : null,
      glassCategory: selectedCategory,
      width: w,
      height: h,
      diagonal: Number.isFinite(d) ? Math.round(d) : null,
    };

    try {
      await addMeasurement(measurement, selectedCategory);
      const copied = await copyMeasurementToClipboard(measurement, selectedCategory);
      setSaveStatus({
        type: "success",
        message: copied ? "Saved to IndexedDB and copied to clipboard." : "Saved to IndexedDB. Copy failed.",
      });
      localStorage.setItem(draftKey, JSON.stringify(measurement));
    } catch (err) {
      setSaveStatus({
        type: "error",
        message: err instanceof Error ? err.message : "Save failed.",
      });
    }
  };

  const onClear = () => {
    setSfo("");
    setCustomer("");
    setGlassType("");
    setGlassThickness(4);
    setGlassCategory(category?.trim().toLowerCase() === "cp" ? "cp" : "rg");
    setWidth(0);
    setHeight(0);
    setSaveStatus({ type: "idle", message: "" });
    localStorage.removeItem(draftKey);
  };

  return (
    <>
      <div className="set-page-root m3-form">
        <div className="m3-actions m3-actions--top">
          <button
            type="button"
            className="m3-button m3-button--filled m3-button--full"
            onClick={onClear}
          >
            Clear
          </button>
        </div>
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
            onChange={(e) => setCustomer(e.target.value)}
            autoComplete="off"
          />
          <label
            htmlFor="field-customer"
            className="m3-outlined-text-field__label"
          >
            Customer
          </label>
        </div>
        <div className="m3-outlined-text-field">
          <select
            id="field-panel-category"
            className="m3-outlined-text-field__input"
            value={glassCategory}
            onChange={(e) => setGlassCategory(e.target.value)}
          >
            <option value="rg">RG</option>
            <option value="cp">CP</option>
          </select>
          <label
            htmlFor="field-panel-category"
            className="m3-outlined-text-field__label"
          >
            RG / CP
          </label>
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
          <label
            htmlFor="field-glass-type"
            className="m3-outlined-text-field__label"
          >
            Glass type
          </label>
        </div>
        <div className="m3-outlined-text-field">
          <select
            id="field-glass-thickness"
            className="m3-outlined-text-field__input"
            value={glassThickness}
            onChange={(e) => setGlassThickness(Number(e.target.value))}
          >
            {[4, 5, 6, 8, 10, 12, 15, 19].map((value) => (
              <option key={value} value={value}>
                {value} mm
              </option>
            ))}
          </select>
          <label
            htmlFor="field-glass-thickness"
            className="m3-outlined-text-field__label"
          >
            Glass thickness
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
          <label
            htmlFor="field-width"
            className="m3-outlined-text-field__label"
          >
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
          <label
            htmlFor="field-height"
            className="m3-outlined-text-field__label"
          >
            Height
          </label>
        </div>
        <div className="m3-outlined-text-field">
          <input
            id="field-diagonal"
            className="m3-outlined-text-field__input m3-outlined-text-field__input--readonly"
            type="number"
            placeholder=" "
            value={Math.round(diagonal) || ""}
            readOnly
            aria-readonly="true"
            autoComplete="off"
          />
          <label
            htmlFor="field-diagonal"
            className="m3-outlined-text-field__label"
          >
            Diagonal
          </label>
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
