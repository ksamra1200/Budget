import { useEffect, useRef, useState } from "react";
import { SECTION_LABELS, type Section } from "../types";

const SECTIONS: Section[] = ["dashboard", "thisMonth", "categories", "settings"];

export function SectionMenu({
  section,
  onChange,
}: {
  section: Section;
  onChange: (next: Section) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

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
        className="hamburger-button"
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
      {open && (
        <div className="section-menu-panel" role="menu">
          {SECTIONS.map((key) => (
            <button
              key={key}
              type="button"
              role="menuitemradio"
              aria-checked={section === key}
              className={`section-menu-item${section === key ? " active" : ""}`}
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
