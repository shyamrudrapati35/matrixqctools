import "./style.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteMeasurementsByIds, listMeasurements } from "../../lib/indexedDb";

function formatTime12hr(isoString) {
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(d);
}

function formatDateInputValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isSameLocalDate(isoString, dateValue) {
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return false;
  return formatDateInputValue(d) === dateValue;
}

function formatSelectedDate(dateValue) {
  const [year, month, day] = dateValue.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  if (Number.isNaN(d.getTime())) return dateValue;
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}

function sortOldestFirst(items) {
  return [...items].sort((a, b) => {
    const ta = new Date(a.time).getTime();
    const tb = new Date(b.time).getTime();
    const na = Number.isNaN(ta) ? 0 : ta;
    const nb = Number.isNaN(tb) ? 0 : tb;
    return na - nb;
  });
}

const EMPTY_DISPLAY_VALUES = new Set(["--", "—", "â€”", "Ã¢â‚¬â€"]);

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

function formatCardData(m, category) {
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
  } else if (category === "dgu") {
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
  // Default RG / CP format
  return `SFO: ${m.sfo || "—"}

Customer: ${m.customer || "—"}

Glass Type: ${m.glassType || "—"}

Glass thickness: ${m.glassThickness != null ? m.glassThickness + " mm" : "—"}

Width: ${m.width} mm

Height: ${m.height} mm

Diagonal: ${m.diagonal != null ? Math.round(m.diagonal * 100) / 100 + " mm" : "—"}`;
}

function renderCardRows(m, category) {
  if (category === "temp") {
    return (
      <>
        <span className="m3-card__label">SFO</span>
        <span className="m3-card__value">{m.sfo || "—"}</span>
        <span className="m3-card__label">Customer</span>
        <span className="m3-card__value">{m.customer || "—"}</span>
        <span className="m3-card__label">Project</span>
        <span className="m3-card__value">{m.project || "—"}</span>
        <span className="m3-card__label">Width</span>
        <span className="m3-card__value">{m.width || "—"}</span>
        <span className="m3-card__label">Height</span>
        <span className="m3-card__value">{m.height || "—"}</span>
        <span className="m3-card__label">Spec</span>
        <span className="m3-card__value">{m.spec || "—"}</span>
        <span className="m3-card__label">Zebra</span>
        <span className="m3-card__value">{m.zebra || "—"}</span>
        <span className="m3-card__label">Rollerwave</span>
        <span className="m3-card__value">{m.rollerwave || "—"}</span>
        <span className="m3-card__label">Edge Lift</span>
        <span className="m3-card__value">{m.edgeLift || "—"}</span>
        <span className="m3-card__label">Overall Bow</span>
        <span className="m3-card__value">{m.overallBow || "—"}</span>
        <span className="m3-card__label">Fragmentation</span>
        <span className="m3-card__value">{m.fragmentation || "—"}</span>
        <span className="m3-card__label">Stress</span>
        <span className="m3-card__value">{m.stress || "—"}</span>
        <span className="m3-card__label">Handover To</span>
        <span className="m3-card__value">{m.handoverTo || "—"}</span>
        <span className="m3-card__label">Operator</span>
        <span className="m3-card__value">{m.operator || "—"}</span>
      </>
    );
  } else if (category === "dgu") {
    return (
      <>
        <span className="m3-card__label">SFO</span>
        <span className="m3-card__value">{m.sfo || "—"}</span>
        <span className="m3-card__label">Customer</span>
        <span className="m3-card__value">{m.customer || "—"}</span>
        <span className="m3-card__label">Project</span>
        <span className="m3-card__value">{m.project || "—"}</span>
        <span className="m3-card__label">Glass Type</span>
        <span className="m3-card__value">{m.glassType || "—"}</span>
        <span className="m3-card__label">Spec</span>
        <span className="m3-card__value">{m.spec || "—"}</span>
        <span className="m3-card__label">Width</span>
        <span className="m3-card__value">{m.width || "—"}</span>
        <span className="m3-card__label">Height</span>
        <span className="m3-card__value">{m.height || "—"}</span>
        <span className="m3-card__label">Edge Deletion</span>
        <span className="m3-card__value">{m.edgeDeletion || "—"}</span>
        <span className="m3-card__label">Parallelism</span>
        <span className="m3-card__value">{m.parallelism || "—"}</span>
        <span className="m3-card__label">Measured Silicone Bite</span>
        <span className="m3-card__value">{m.measuredSiliconeBite || "—"}</span>
        <span className="m3-card__label">Total Bite</span>
        <span className="m3-card__value">{m.totalBite || "—"}</span>
        <span className="m3-card__label">Make</span>
        <span className="m3-card__value">{m.make || "—"}</span>
        <span className="m3-card__label">Delta T</span>
        <span className="m3-card__value">{m.deltaT || "—"}</span>
        <span className="m3-card__label">Base (batch no)</span>
        <span className="m3-card__value">{m.base || "—"}</span>
        <span className="m3-card__label">Catlist (batch no)</span>
        <span className="m3-card__value">{m.catlist || "—"}</span>
      </>
    );
  }
  // Default RG format
  return (
    <>
      <span className="m3-card__label">SFO</span>
      <span className="m3-card__value">{m.sfo || "—"}</span>
      <span className="m3-card__label">Customer</span>
      <span className="m3-card__value">{m.customer || "—"}</span>
      <span className="m3-card__label">Glass Type</span>
      <span className="m3-card__value">{m.glassType || "—"}</span>
      <span className="m3-card__label">Glass thickness</span>
      <span className="m3-card__value">{m.glassThickness != null ? `${m.glassThickness} mm` : "—"}</span>
      <span className="m3-card__label">Width</span>
      <span className="m3-card__value">{m.width}</span>
      <span className="m3-card__label">Height</span>
      <span className="m3-card__value">{m.height}</span>
      <span className="m3-card__label">Diagonal</span>
      <span className="m3-card__value">
        {m.diagonal != null ? m.diagonal : "—"}
      </span>
    </>
  );
}

function getDraftStorageKey(category) {
  const normalizedCategory = (category || "").trim().toLowerCase();
  switch (normalizedCategory) {
    case "temp":
      return `temp-form-draft-${normalizedCategory || "temp"}`;
    case "dgu":
      return `dgu-form-draft-${normalizedCategory || "dgu"}`;
    case "rg":
    case "cp":
      return `rg-form-draft-${normalizedCategory || "rg"}`;
    default:
      return `${normalizedCategory || "form"}-form-draft-${normalizedCategory || "default"}`;
  }
}

export default function Save({ category }) {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => formatDateInputValue());

  function onLoadMeasurement(measurement) {
    const draftKey = getDraftStorageKey(category);
    localStorage.setItem(draftKey, JSON.stringify(measurement));
    localStorage.setItem(`${category}-load-data`, JSON.stringify(measurement));
    navigate(`/${category}/set`);
  }

  function copyToClipboard(text) {
    const clipboardText = cleanClipboardText(text);

    // Try modern Clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(clipboardText).then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      }).catch(err => {
        console.error('Failed to copy with Clipboard API: ', err);
        // Fallback to older method
        fallbackCopyTextToClipboard(clipboardText);
      });
    } else {
      // Fallback for browsers that don't support Clipboard API
      fallbackCopyTextToClipboard(clipboardText);
    }
  }

  function fallbackCopyTextToClipboard(text) {
    // Create a temporary textarea element
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    // Make it invisible but selectable
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    textArea.style.opacity = '0';
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } else {
        console.error('Fallback copy failed');
        // Last resort - show alert with text
        alert('Copy failed. Here\'s the text to copy manually:\n\n' + text);
      }
    } catch (err) {
      console.error('Fallback copy error: ', err);
      // Last resort - show alert with text
      alert('Copy failed. Here\'s the text to copy manually:\n\n' + text);
    }
    
    document.body.removeChild(textArea);
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const rows = await listMeasurements(category);
        if (!cancelled) setItems(sortOldestFirst(rows));
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load records.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [category]);

  const filteredItems = items.filter((m) => isSameLocalDate(m.time, selectedDate));

  const onDeleteAll = async () => {
    if (filteredItems.length === 0) return;

    const selectedDateLabel = formatSelectedDate(selectedDate);
    const ok = window.confirm(
      `Delete all saved measurements for ${selectedDateLabel}? This cannot be undone.`,
    );
    if (!ok) return;

    setDeleting(true);
    setError("");
    try {
      const idsToDelete = filteredItems.map((item) => item.id);
      await deleteMeasurementsByIds(idsToDelete, category);
      setItems((currentItems) => currentItems.filter((item) => !idsToDelete.includes(item.id)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete records.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="save-page-root">
      <h2 className="m3-save-list__title">Saved measurements</h2>
      <p className="m3-save-list__hint">Oldest first · time shown in 12-hour format</p>
      
      {copySuccess && (
        <div className="m3-copy-success">
          ✓ Copied to clipboard!
        </div>
      )}

      <div className="m3-save-toolbar">
        <label className="m3-save-date-field">
          {/* <span className="m3-save-date-field__label">Date</span> */}
          <input
            type="date"
            className="m3-save-date-field__input"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value || formatDateInputValue())}
          />
        </label>
        <button
          type="button"
          className="m3-save-delete-all"
          onClick={onDeleteAll}
          disabled={loading || filteredItems.length === 0 || deleting}
        >
          {deleting ? "Deleting…" : "Delete all"}
        </button>
      </div>

      {loading ? (
        <p className="m3-save-list__state">Loading…</p>
      ) : error ? (
        <p className="m3-save-list__state m3-save-list__state--error" role="alert">
          {error}
        </p>
      ) : items.length === 0 ? (
        <p className="m3-save-list__state">No records saved yet.</p>
      ) : filteredItems.length === 0 ? (
        <p className="m3-save-list__state">No records saved for this date.</p>
      ) : (
        <ul className="m3-card-list" aria-label="Saved measurements">
          {filteredItems.map((m) => (
            <li key={m.id} className="m3-card">
              <div className="m3-card__header">
                <p className="m3-card__time">{formatTime12hr(m.time)}</p>
                <div className="m3-card__actions">
                  <button
                    type="button"
                    className="m3-card__load-btn"
                    onClick={() => onLoadMeasurement(m)}
                    title="Load this measurement into the form"
                    aria-label="Load measurement data"
                  >
                    Load
                  </button>
                  <button
                    type="button"
                    className="m3-card__copy-btn"
                    onClick={() => copyToClipboard(formatCardData(m, category))}
                    title="Copy to clipboard"
                    aria-label="Copy measurement data to clipboard"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M16 1H4C2.9 1 2 1.9 2 3V17H4V3H16V1ZM19 5H8C6.9 5 6 5.9 6 7V21C6 22.1 6.9 23 8 23H19C20.1 23 21 22.1 21 21V7C21 5.9 20.1 5 19 5ZM19 21H8V7H19V21Z" fill="currentColor"/>
                    </svg>
                  </button>
                </div>
              </div>
              <div className="m3-card__rows">
                {renderCardRows(m, category)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
