import { useEffect, useState } from "react";
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
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="fab"
        aria-label="Add a transaction"
        onClick={() => setOpen(true)}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div
            className="modal-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Add a transaction"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-handle" />
            <div className="modal-header">
              <h2 style={{ margin: 0 }}>Add a transaction</h2>
              <button type="button" className="icon-button" aria-label="Close" onClick={() => setOpen(false)}>
                ✕
              </button>
            </div>
            <TransactionForm
              categories={categories}
              onAdd={(tx) => {
                onAdd(tx);
                setOpen(false);
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
