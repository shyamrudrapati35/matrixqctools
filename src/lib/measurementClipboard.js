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

export function formatMeasurementForClipboard(m, category) {
  if (category === "temp") {
    let tempData = `SFO: ${m.sfo || "—"}

Customer: ${m.customer || "—"}

Project: ${m.project || "—"}

Width: ${m.width || "—"}

Height: ${m.height || "—"}

Spec: ${m.spec || "—"}

Zebra: ${m.zebra || "—"}

Rollerwave: ${m.rollerwave || "—"}

Edge Lift: ${m.edgeLift || "—"}

Overall Bow: ${m.overallBow || "—"}`;

    if (hasClipboardValue(m.fragmentation)) {
      tempData += `

Fragmentation: ${m.fragmentation}`;
    }

    if (hasClipboardValue(m.stress)) {
      tempData += `

Stress: ${m.stress}`;
    }

    tempData += `

Handover To: ${m.handoverTo || "—"}

Operator: ${m.operator || "—"}`;

    return tempData;
  }

  if (category === "dgu") {
    return `SFO: ${m.sfo || "—"}

Customer: ${m.customer || "—"}

Project: ${m.project || "—"}

Glass Type: ${m.glassType || "—"}

Spec: ${m.spec || "—"}

Width: ${m.width || "—"}

Height: ${m.height || "—"}

Edge Deletion: ${m.edgeDeletion || "—"}

Parallelism: ${m.parallelism || "—"}

Measured Silicone Bite: ${m.measuredSiliconeBite || "—"}

Total Bite: ${m.totalBite || "—"}

Make: ${m.make || "—"}

Delta T: ${m.deltaT || "—"}

Base (batch no): ${m.base || "—"}

Catalist (batch no): ${m.catlist || "—"}`;
  }

  return `SFO: ${m.sfo || "—"}

Customer: ${m.customer || "—"}

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
