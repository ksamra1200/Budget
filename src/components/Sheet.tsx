import { useEffect, useRef, useState, type ReactNode } from "react";

export function Sheet({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const [visible, setVisible] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setVisible(true);
      // Mount off-screen first, then flip the class on the next paint so the
      // browser actually animates the transition instead of skipping to it.
      let inner = 0;
      const outer = requestAnimationFrame(() => {
        inner = requestAnimationFrame(() => setAnimateIn(true));
      });
      return () => {
        cancelAnimationFrame(outer);
        cancelAnimationFrame(inner);
      };
    }
    setAnimateIn(false);
    // Fallback unmount in case no transitionend fires (e.g. closed mid-open),
    // so an invisible backdrop never lingers over the page.
    const timer = setTimeout(() => setVisible(false), 400);
    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  function handleTransitionEnd(e: React.TransitionEvent<HTMLDivElement>) {
    if (e.target !== sheetRef.current) return;
    if (!animateIn) setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className={`modal-backdrop${animateIn ? " open" : ""}`} onClick={onClose}>
      <div
        ref={sheetRef}
        className={`modal-sheet${animateIn ? " open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        onTransitionEnd={handleTransitionEnd}
      >
        <div className="modal-handle" />
        <div className="modal-header">
          <h2 style={{ margin: 0 }}>{title}</h2>
          <button type="button" className="icon-button" aria-label="Close" onClick={onClose}>
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
