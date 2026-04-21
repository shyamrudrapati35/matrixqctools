import "./style.css";
import { useEffect, useState } from "react";
import { addMeasurement } from "../../lib/indexedDb";

const EMPTY_OPTIONAL_VALUE = "--";
const EMPTY_DISPLAY_VALUES = new Set([EMPTY_OPTIONAL_VALUE, "—", "â€”", "Ã¢â‚¬â€"]);

function getOptionalInputValue(inputValue, displayValue) {
  const value = inputValue || displayValue || "";
  return EMPTY_DISPLAY_VALUES.has(value.trim()) ? "" : value;
}

export default function Dgu({ category }) {
  const draftKey = `dgu-form-draft-${category || "dgu"}`;
  const normalizeGlassType = (value) => (value || "").toUpperCase();
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
  const [project, setProject] = useState(() => getOptionalInputValue("", draft?.project));
  const [glassType, setGlassType] = useState(() => draft?.glassType ?? "DGU");
  const [firstGlass, setFirstGlass] = useState(() => draft?.firstGlass ?? "");
  const [spacerThickness, setSpacerThickness] = useState(() => draft?.spacerThickness ?? "");
  const [bite, setBite] = useState(() => draft?.bite ?? "");
  const [secondGlass, setSecondGlass] = useState(() => draft?.secondGlass ?? "");
  const [interlayerType, setInterlayerType] = useState(() => draft?.interlayerType ?? "");
  const [interlayerThickness, setInterlayerThickness] = useState(() => draft?.interlayerThickness ?? "");
  const [thirdGlass, setThirdGlass] = useState(() => draft?.thirdGlass ?? "");
  const [width, setWidth] = useState(() => draft?.width ?? 0);
  const [height, setHeight] = useState(() => draft?.height ?? 0);
  const [edgeDeletion, setEdgeDeletion] = useState(() => draft?.edgeDeletionInput ?? draft?.edgeDeletion ?? "");
  const [parallelism, setParallelism] = useState(() => draft?.parallelismInput ?? draft?.parallelism ?? "");
  const [measuredSiliconeBite, setMeasuredSiliconeBite] = useState(() => draft?.measuredSiliconeBiteInput ?? draft?.measuredSiliconeBite ?? "");
  const [totalBite, setTotalBite] = useState(() => draft?.totalBiteInput ?? draft?.totalBite ?? "");
  const [make, setMake] = useState(() => draft?.make ?? "Silinde MF 882");
  const [deltaT, setDeltaT] = useState(() => draft?.deltaTInput ?? draft?.deltaT ?? "");
  const [base, setBase] = useState(() => draft?.base ?? "");
  const [catlist, setCatlist] = useState(() => draft?.catlist ?? "");
  const [saveStatus, setSaveStatus] = useState({ type: "idle", message: "" });
  const isLamiDgu = normalizeGlassType(glassType) === "LAMI+DGU";

  // Load measurement data from save page
  useEffect(() => {
    const loadDataKey = `${category}-load-data`;
    const loadedData = localStorage.getItem(loadDataKey);
    
    if (loadedData) {
      try {
        const data = JSON.parse(loadedData);
        
        setSfo(data.sfo || "");
        setCustomer(data.customer || "");
        setProject(getOptionalInputValue("", data.project));
        setGlassType(data.glassType || "DGU");
        setFirstGlass(data.firstGlass || "");
        setSpacerThickness(data.spacerThickness || "");
        setBite(data.bite || "");
        setSecondGlass(data.secondGlass || "");
        setInterlayerType(data.interlayerType || "");
        setInterlayerThickness(data.interlayerThickness || "");
        setThirdGlass(data.thirdGlass || "");
        setWidth(Number(data.width) || 0);
        setHeight(Number(data.height) || 0);
        setEdgeDeletion(data.edgeDeletionInput || data.edgeDeletion || "");
        setParallelism(data.parallelismInput || data.parallelism || "");
        setMeasuredSiliconeBite(data.measuredSiliconeBiteInput || data.measuredSiliconeBite || "");
        setTotalBite(data.totalBiteInput || data.totalBite || "");
        setMake(data.make || "Silinde MF 882");
        setDeltaT(data.deltaTInput || data.deltaT || "");
        setBase(data.base || "");
        setCatlist(data.catlist || "");
        
      } catch (err) {
        console.error("Failed to load measurement data:", err);
      } finally {
        localStorage.removeItem(loadDataKey);
      }
    }
  }, [category]);

  useEffect(() => {
    const draft = {
      sfo,
      customer,
      project,
      glassType,
      firstGlass,
      spacerThickness,
      bite,
      secondGlass,
      interlayerType,
      interlayerThickness,
      thirdGlass,
      width,
      height,
      edgeDeletion,
      parallelism,
      measuredSiliconeBite,
      totalBite,
      make,
      deltaT,
      base,
      catlist,
    };

    localStorage.setItem(draftKey, JSON.stringify(draft));
  }, [draftKey, sfo, customer, project, glassType, firstGlass, spacerThickness, bite, secondGlass, interlayerType, interlayerThickness, thirdGlass, width, height, edgeDeletion, parallelism, measuredSiliconeBite, totalBite, make, deltaT, base, catlist]);

  const onSave = async () => {
    setSaveStatus({ type: "idle", message: "" });

    // Validate required fields
    const requiredFields = {
      sfo: sfo.trim(),
      customer: customer.trim(),
      firstGlass: firstGlass.trim(),
      spacerThickness: spacerThickness.trim(),
      bite: bite.trim(),
      secondGlass: secondGlass.trim(),
      width: width,
      height: height,
      parallelism: parallelism.trim(),
      measuredSiliconeBite: measuredSiliconeBite.trim(),
      totalBite: totalBite.trim(),
      deltaT: deltaT.trim(),
    };

    if (isLamiDgu) {
      requiredFields.interlayerType = interlayerType.trim();
      requiredFields.interlayerThickness = interlayerThickness.trim();
      requiredFields.thirdGlass = thirdGlass.trim();
    }

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

    // Format glass spec
    let spec = "";
    if (normalizeGlassType(glassType) === "DGU") {
      spec = `${firstGlass} +${spacerThickness}mm Airgap With ${bite}mm Bite + ${secondGlass}`;
    } else if (isLamiDgu) {
      spec = `${firstGlass} + ${spacerThickness}mm Airgap With ${bite}mm Bite + ${secondGlass} + ${interlayerThickness} ${interlayerType} + ${thirdGlass}`;
    }

    const measurement = {
      time: new Date().toISOString(),
      sfo: sfo.trim(),
      customer: customer.trim(),
      project: project.trim() ? project.trim() : "—",
      glassType,
      firstGlass: firstGlass.trim(),
      spacerThickness: spacerThickness.trim(),
      bite: bite.trim(),
      secondGlass: secondGlass.trim(),
      interlayerType: interlayerType.trim(),
      interlayerThickness: interlayerThickness.trim(),
      thirdGlass: thirdGlass.trim(),
      spec,
      width: Number(width) || 0,
      height: Number(height) || 0,
      edgeDeletionInput: edgeDeletion.trim(),
      parallelismInput: parallelism.trim(),
      measuredSiliconeBiteInput: measuredSiliconeBite.trim(),
      totalBiteInput: totalBite.trim(),
      edgeDeletion: edgeDeletion.trim() ? `${edgeDeletion.trim()} mm` : "—",
      parallelism: `${parallelism.trim()} mm`,
      measuredSiliconeBite: `${measuredSiliconeBite.trim()} mm`,
      totalBite: `${totalBite.trim()} mm`,
      make,
      deltaT: `${deltaT.trim()} °C`,
      deltaTInput: deltaT.trim(),
      base: base.trim(),
      catlist: catlist.trim(),
    };

    measurement.project = project.trim() ? project.trim() : EMPTY_OPTIONAL_VALUE;

    try {
      await addMeasurement(measurement, category);
      setSaveStatus({ type: "success", message: "Saved to IndexedDB." });
      // Reset form
      setSfo("");
      setCustomer("");
      setProject("");
      setGlassType("DGU");
      setFirstGlass("");
      setSpacerThickness("");
      setBite("");
      setSecondGlass("");
      setInterlayerType("");
      setInterlayerThickness("");
      setThirdGlass("");
      setWidth(0);
      setHeight(0);
      setEdgeDeletion("");
      setParallelism("");
      setMeasuredSiliconeBite("");
      setTotalBite("");
      setMake("Silinde MF 882");
      localStorage.removeItem(draftKey);
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
    setProject("");
    setGlassType("DGU");
    setFirstGlass("");
    setSpacerThickness("");
    setBite("");
    setSecondGlass("");
    setInterlayerType("");
    setInterlayerThickness("");
    setThirdGlass("");
    setWidth(0);
    setHeight(0);
    setEdgeDeletion("");
    setParallelism("");
    setMeasuredSiliconeBite("");
    setTotalBite("");
    setMake("Silinde MF 882");
    setDeltaT("");
    setBase("");
    setCatlist("");
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
            onChange={(e) => setProject(e.target.value.toUpperCase())}
            autoComplete="off"
          />
          <label htmlFor="field-project" className="m3-outlined-text-field__label">
            Project
          </label>
        </div>

        <div className="m3-select-group">
          <label className="m3-select-label">Glass Type</label>
          <select
            value={glassType}
            onChange={(e) => setGlassType(e.target.value)}
            className="m3-select-field"
          >
            <option value="DGU">DGU</option>
            <option value="Lami+DGU">Lami+DGU</option>
          </select>
        </div>

        <div className="m3-outlined-text-field">
          <input
            id="field-first-glass"
            className="m3-outlined-text-field__input"
            type="text"
            placeholder=" "
            value={firstGlass}
            onChange={(e) => setFirstGlass(e.target.value.toUpperCase())}
            autoComplete="off"
          />
          <label htmlFor="field-first-glass" className="m3-outlined-text-field__label">
            1st Glass
          </label>
        </div>

        <div className="m3-outlined-text-field">
          <input
            id="field-spacer-thickness"
            className="m3-outlined-text-field__input"
            type="number"
            placeholder=" "
            value={spacerThickness}
            onChange={(e) => setSpacerThickness(e.target.value)}
            autoComplete="off"
          />
          <label htmlFor="field-spacer-thickness" className="m3-outlined-text-field__label">
            Spacer Thickness (mm)
          </label>
        </div>

        <div className="m3-outlined-text-field">
          <input
            id="field-bite"
            className="m3-outlined-text-field__input"
            type="number"
            placeholder=" "
            value={bite}
            onChange={(e) => setBite(e.target.value)}
            autoComplete="off"
          />
          <label htmlFor="field-bite" className="m3-outlined-text-field__label">
            Bite (mm)
          </label>
        </div>

        <div className="m3-outlined-text-field">
          <input
            id="field-second-glass"
            className="m3-outlined-text-field__input"
            type="text"
            placeholder=" "
            value={secondGlass}
            onChange={(e) => setSecondGlass(e.target.value.toUpperCase())}
            autoComplete="off"
          />
          <label htmlFor="field-second-glass" className="m3-outlined-text-field__label">
            2nd Glass
          </label>
        </div>

        {isLamiDgu && (
          <>
            <div className="m3-outlined-text-field">
              <input
                id="field-interlayer-type"
                className="m3-outlined-text-field__input"
                type="text"
                placeholder=" "
                value={interlayerType}
                onChange={(e) => setInterlayerType(e.target.value.toUpperCase())}
                autoComplete="off"
              />
              <label htmlFor="field-interlayer-type" className="m3-outlined-text-field__label">
                Interlayer Type
              </label>
            </div>

            <div className="m3-outlined-text-field">
              <input
                id="field-interlayer-thickness"
                className="m3-outlined-text-field__input"
                type="number"
                placeholder=" "
                value={interlayerThickness}
                onChange={(e) => setInterlayerThickness(e.target.value)}
                autoComplete="off"
              />
              <label htmlFor="field-interlayer-thickness" className="m3-outlined-text-field__label">
                Interlayer Thickness (mm)
              </label>
            </div>

            <div className="m3-outlined-text-field">
              <input
                id="field-third-glass"
                className="m3-outlined-text-field__input"
                type="text"
                placeholder=" "
                value={thirdGlass}
                onChange={(e) => setThirdGlass(e.target.value.toUpperCase())}
                autoComplete="off"
              />
              <label htmlFor="field-third-glass" className="m3-outlined-text-field__label">
                3rd Glass
              </label>
            </div>
          </>
        )}

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

        <div className="m3-outlined-text-field">
          <input
            id="field-edge-deletion"
            className="m3-outlined-text-field__input"
            type="number"
            placeholder=" "
            value={edgeDeletion}
            onChange={(e) => setEdgeDeletion(e.target.value)}
            autoComplete="off"
          />
          <label htmlFor="field-edge-deletion" className="m3-outlined-text-field__label">
            Edge Deletion (mm)
          </label>
        </div>

        <div className="m3-outlined-text-field">
          <input
            id="field-parallelism"
            className="m3-outlined-text-field__input"
            type="number"
            placeholder=" "
            value={parallelism}
            onChange={(e) => setParallelism(e.target.value)}
            autoComplete="off"
          />
          <label htmlFor="field-parallelism" className="m3-outlined-text-field__label">
            Parallelism (mm)
          </label>
        </div>

        <div className="m3-outlined-text-field">
          <input
            id="field-measured-silicone-bite"
            className="m3-outlined-text-field__input"
            type="number"
            placeholder=" "
            value={measuredSiliconeBite}
            onChange={(e) => setMeasuredSiliconeBite(e.target.value)}
            autoComplete="off"
          />
          <label htmlFor="field-measured-silicone-bite" className="m3-outlined-text-field__label">
            Measured Silicone Bite (mm)
          </label>
        </div>

        <div className="m3-outlined-text-field">
          <input
            id="field-total-bite"
            className="m3-outlined-text-field__input"
            type="number"
            placeholder=" "
            value={totalBite}
            onChange={(e) => setTotalBite(e.target.value)}
            autoComplete="off"
          />
          <label htmlFor="field-total-bite" className="m3-outlined-text-field__label">
            Total Bite (mm)
          </label>
        </div>

        <div className="m3-select-group">
          <label className="m3-select-label">Make</label>
          <select
            value={make}
            onChange={(e) => setMake(e.target.value)}
            className="m3-select-field"
          >
            <option value="Silinde MF 882">Silinde MF 882</option>
            <option value="Dowsil 982">Dowsil 982</option>
          </select>
        </div>

        <div className="m3-outlined-text-field">
          <input
            id="field-delta-t"
            className="m3-outlined-text-field__input"
            type="number"
            placeholder=" "
            value={deltaT}
            onChange={(e) => setDeltaT(e.target.value)}
            autoComplete="off"
          />
          <label htmlFor="field-delta-t" className="m3-outlined-text-field__label">
            Delta T (°C)
          </label>
        </div>

        <div className="m3-outlined-text-field">
          <input
            id="field-base"
            className="m3-outlined-text-field__input"
            type="text"
            placeholder=" "
            value={base}
            onChange={(e) => setBase(e.target.value)}
            autoComplete="off"
          />
          <label htmlFor="field-base" className="m3-outlined-text-field__label">
            Base (batch no)
          </label>
        </div>

        <div className="m3-outlined-text-field">
          <input
            id="field-catlist"
            className="m3-outlined-text-field__input"
            type="text"
            placeholder=" "
            value={catlist}
            onChange={(e) => setCatlist(e.target.value)}
            autoComplete="off"
          />
          <label htmlFor="field-catlist" className="m3-outlined-text-field__label">
            Catlist (batch no)
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
