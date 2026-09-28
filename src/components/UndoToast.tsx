export function UndoToast({
  message,
  onUndo,
}: {
  message: string;
  /** Omit for a plain notice with no Undo button. */
  onUndo?: () => void;
}) {
  return (
    <div className="undo-toast" role="status">
      <span>{message}</span>
      {onUndo && (
        <button type="button" onClick={onUndo}>
          Undo
        </button>
      )}
    </div>
  );
}
