import { useEffect, useRef, useState } from "react";
import { TransactionForm } from "./TransactionForm";
import type { Category, TransactionType } from "../types";

export function AddTransactionFab({
  categories,
  onAdd,
}: {
  categories: Category[];
  onAdd: (tx: {
    date: string;
    type: TransactionType;
    amount: number;
    categoryId: string | null;
    note: string;
  }) => void;
}) {
  const [visible, setVisible] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  function openModal() {
    setVisible(true);
    // Mount off-screen first, then flip the class on the next paint so the
    // browser actually animates the transition instead of skipping to it.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setAnimateIn(true));
    });
  }

  function closeModal() {
    setAnimateIn(false);
  }

  function handleSheetTransitionEnd(e: React.TransitionEvent<HTMLDivElement>) {
    if (e.target !== sheetRef.current) return;
    if (!animateIn) setVisible(false);
  }

  useEffect(() => {
    if (!visible) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeModal();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [visible]);

  return (
    <>
      <button type="button" className="fab" aria-label="Add a transaction" onClick={openModal}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {visible && (
        <div
          className={`modal-backdrop${animateIn ? " open" : ""}`}
          onClick={closeModal}
        >
          <div
            ref={sheetRef}
            className={`modal-sheet${animateIn ? " open" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-label="Add a transaction"
            onClick={(e) => e.stopPropagation()}
            onTransitionEnd={handleSheetTransitionEnd}
          >
            <div className="modal-handle" />
            <div className="modal-header">
              <h2 style={{ margin: 0 }}>Add a transaction</h2>
              <button type="button" className="icon-button" aria-label="Close" onClick={closeModal}>
                ✕
              </button>
            </div>
            <TransactionForm
              categories={categories}
              onAdd={(tx) => {
                onAdd(tx);
                closeModal();
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
