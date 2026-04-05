import "./style.css";
import { useEffect, useState } from "react";
import { clearAllMeasurements, listMeasurements } from "../../lib/indexedDb";

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

function sortOldestFirst(items) {
  return [...items].sort((a, b) => {
    const ta = new Date(a.time).getTime();
    const tb = new Date(b.time).getTime();
    const na = Number.isNaN(ta) ? 0 : ta;
    const nb = Number.isNaN(tb) ? 0 : tb;
    return na - nb;
  });
}

function formatCardData(m, category) {
  if (category === "temp") {
    return `SFO: ${m.sfo || "—"}

Customer: ${m.customer || "—"}

Project: ${m.project || "—"}

Width: ${m.width || "—"}

Height: ${m.height || "—"}

Spec: ${m.spec || "—"}

Zebra: ${m.zebra || "—"}

Rollerwave: ${m.rollerwave || "—"}

Edge Lift: ${m.edgeLift || "—"}

Overall Bow: ${m.overallBow || "—"}

Fragmentation: ${m.fragmentation || "—"}

Stress: ${m.stress || "—"}

Handover To: ${m.handoverTo || "—"}

Operator: ${m.operator || "—"}`;
  }
  // Default RG format
  return `SFO: ${m.sfo || "—"}

Customer: ${m.customer || "—"}

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
  }
  // Default RG format
  return (
    <>
      <span className="m3-card__label">SFO</span>
      <span className="m3-card__value">{m.sfo || "—"}</span>
      <span className="m3-card__label">Customer</span>
      <span className="m3-card__value">{m.customer || "—"}</span>
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

export default function Save({ category }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  function copyToClipboard(text) {
    // Try modern Clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      }).catch(err => {
        console.error('Failed to copy with Clipboard API: ', err);
        // Fallback to older method
        fallbackCopyTextToClipboard(text);
      });
    } else {
      // Fallback for browsers that don't support Clipboard API
      fallbackCopyTextToClipboard(text);
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

  const onDeleteAll = async () => {
    if (items.length === 0) return;
    const ok = window.confirm(
      `Delete all saved measurements for ${category?.toUpperCase() || "matrix-qc-rg"}? This cannot be undone.`,
    );
    if (!ok) return;

    setDeleting(true);
    setError("");
    try {
      await clearAllMeasurements(category);
      setItems([]);
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
        <button
          type="button"
          className="m3-save-delete-all"
          onClick={onDeleteAll}
          disabled={loading || items.length === 0 || deleting}
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
      ) : (
        <ul className="m3-card-list" aria-label="Saved measurements">
          {items.map((m) => (
            <li key={m.id} className="m3-card">
              <div className="m3-card__header">
                <p className="m3-card__time">{formatTime12hr(m.time)}</p>
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
