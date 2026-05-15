const EMPTY_DISPLAY_VALUES = new Set(["--", "—", "â€”", "Ã¢â‚¬â€", "ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â"]);

function hasClipboardValue(value) {
  if (value == null) return false;
  const text = String(value).trim();
  return text !== "" && !EMPTY_DISPLAY_VALUES.has(text);
}

function cleanClipboardText(text) {
  return text
    .split(/\n\s*\n/)
    .filter((entry) => {
      const separatorIndex = entry.indexOf(":");
      if (separatorIndex === -1) return true;
      return hasClipboardValue(entry.slice(separatorIndex + 1));
    })
    .join("\n\n");
}

function getDisplayValue(value) {
  return hasClipboardValue(value) ? String(value).trim() : "—";
}

function stripDisplayUnit(value, unitPattern) {
  return getDisplayValue(value).replace(unitPattern, "").trim();
}

export function formatMeasurementForClipboard(m, category) {
  if (category === "temp") {
    const width = getDisplayValue(m.width);
    const height = getDisplayValue(m.height);
    const rollerwave = stripDisplayUnit(m.rollerwave || m.rollerwaveInput, /\s*mm$/i);
    const edgeLift = stripDisplayUnit(m.edgeLift || m.edgeLiftInput, /\s*mm$/i);
    const overallBow = stripDisplayUnit(m.overallBow || m.overallBowInput, /\s*mm$/i);
    const glassTemp = String(m.glassTemp || "").toUpperCase();
    const isTg = glassTemp === "TG";
    const rollerwaveLimit = isTg ? "0.20mm" : "0.15mm";
    const widthLine = isTg || width === "—" ? width : `${width}mm / ±2mm`;
    const heightLine = isTg || height === "—" ? height : `${height}mm / ±2mm`;

    return `Standard: ${getDisplayValue(m.standerd)}

SFO: ${m.sfo || "—"}

Customer: ${m.customer || "—"}

Project: ${m.project || "—"}

Width: ${widthLine}

Height: ${heightLine}

Spec: ${m.spec || "—"}

Zebra: ${m.zebra || "—"}

Rollerwave: ${rollerwave === "—" ? rollerwave : `${rollerwave} mm / ${rollerwaveLimit}`}

Edge Lift: ${edgeLift === "—" ? edgeLift : `${edgeLift} mm / 0.25mm`}

Overall Bow: ${overallBow === "—" ? overallBow : `${overallBow} mm / 1.5mm/mtr`}

Handover To: ${m.handoverTo || "—"}

Operator: ${m.operator || "—"}`;
  }

  if (category === "dgu") {
    const width = getDisplayValue(m.width);
    const height = getDisplayValue(m.height);
    const edgeDeletion = stripDisplayUnit(m.edgeDeletionInput || m.edgeDeletion, /\s*mm$/i);
    const parallelism = stripDisplayUnit(m.parallelismInput || m.parallelism, /\s*mm$/i);
    const measuredSiliconeBite = stripDisplayUnit(
      m.measuredSiliconeBiteInput || m.measuredSiliconeBite,
      /\s*mm$/i,
    );
    const totalBite = stripDisplayUnit(m.totalBiteInput || m.totalBite, /\s*mm$/i);
    const deltaT = stripDisplayUnit(m.deltaTInput || m.deltaT, /\s*(°C|Â°C)$/i);

    return `Standard: ${getDisplayValue(m.standerd)}

SFO: ${m.sfo || "—"}

Customer: ${m.customer || "—"}

Project: ${m.project || "—"}

Glass Type: ${m.glassType || "—"}

Spec: ${m.spec || "—"}

Width: ${width === "—" ? width : `${width}mm / ±2mm`}

Height: ${height === "—" ? height : `${height}mm / ±2mm`}

Edge Deletion: ${edgeDeletion === "—" ? edgeDeletion : `${edgeDeletion} mm`}

Parallelism: ${parallelism === "—" ? parallelism : `${parallelism} mm / ±1.5mm`}

Measured Silicone Bite: ${measuredSiliconeBite === "—" ? measuredSiliconeBite : `${measuredSiliconeBite} mm`}

Total Bite: ${totalBite === "—" ? totalBite : `${totalBite}mm`}

Make: ${m.make || "—"}

Delta T: ${deltaT === "—" ? deltaT : `${deltaT}°C / >32°C`}

Base (batch no): ${m.base || "—"}

Catalist (batch no): ${m.catlist || "—"}`;
  }

  return `SFO: ${m.sfo || "—"}

Customer: ${m.customer || "—"}

Standerd: ${m.standerd || "—"}

Glass Type: ${m.glassType || "—"}

Glass thickness: ${m.glassThickness != null ? `${m.glassThickness} mm` : "—"}

Width: ${m.width} mm

Height: ${m.height} mm

Diagonal: ${m.diagonal != null ? `${Math.round(m.diagonal * 100) / 100} mm` : "—"}`;
}

export async function copyTextToClipboard(text) {
  const clipboardText = cleanClipboardText(text);

  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(clipboardText);
      return true;
    } catch (err) {
      console.error("Failed to copy with Clipboard API: ", err);
    }
  }

  const textArea = document.createElement("textarea");
  textArea.value = clipboardText;
  textArea.style.position = "fixed";
  textArea.style.left = "-999999px";
  textArea.style.top = "-999999px";
  textArea.style.opacity = "0";

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    return document.execCommand("copy");
  } catch (err) {
    console.error("Fallback copy error: ", err);
    return false;
  } finally {
    document.body.removeChild(textArea);
  }
}

export function copyMeasurementToClipboard(measurement, category) {
  return copyTextToClipboard(formatMeasurementForClipboard(measurement, category));
}
