import { useEffect, useRef, useState } from "react";
import { SECTION_LABELS, type Section } from "../types";

const SECTIONS: Section[] = ["dashboard", "thisMonth", "reports", "goals", "categories", "settings"];

// Matches the .section-menu-panel.closing animation in styles.css.
const CLOSE_MS = 150;

export function SectionMenu({
  section,
  onChange,
}: {
  section: Section;
  onChange: (next: Section) => void;
}) {
  const [open, setOpen] = useState(false);
  // The panel stays mounted briefly after closing so it can animate out.
  const [mounted, setMounted] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }
    const timer = setTimeout(() => setMounted(false), CLOSE_MS);
    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="section-menu" ref={rootRef}>
      <button
        type="button"
        className={`hamburger-button${open ? " open" : ""}`}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {/* Three lines that fold into an X while the menu is open. */}
        <span className="hamburger-lines" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </button>
      {(open || mounted) && (
        <div className={`section-menu-panel${open ? "" : " closing"}`} role="menu">
          {SECTIONS.map((key, i) => (
            <button
              key={key}
              type="button"
              role="menuitemradio"
              aria-checked={section === key}
              className={`section-menu-item${section === key ? " active" : ""}`}
              style={{ "--i": i } as React.CSSProperties}
              onClick={() => {
                onChange(key);
                setOpen(false);
              }}
            >
              {SECTION_LABELS[key]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
