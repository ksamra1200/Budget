import { useState } from "react";
import type { User } from "firebase/auth";
import type { SharingInfo } from "../cloudStorage";
import { createInvite, formatCode, joinBudget, leaveBudget, removeMember } from "../sharing";

export function SharingCard({
  user,
  ownerUid,
  sharing,
}: {
  user: User;
  ownerUid: string;
  sharing: SharingInfo;
}) {
  const isOwn = ownerUid === user.uid;
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [joinInput, setJoinInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const others = sharing.members.filter((m) => m !== user.uid);
  const nameOf = (uid: string) => sharing.memberNames[uid] || "Partner";

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function copyCode() {
    if (!code) return;
    const text = `Join my budget: sign in, open Settings → Shared budget, and enter ${formatCode(code)}`;
    try {
      if (navigator.share) await navigator.share({ text });
      else {
        await navigator.clipboard.writeText(formatCode(code));
        setCopied(true);
      }
    } catch {
      // Share sheet dismissed; nothing to do.
    }
  }

  if (!isOwn) {
    return (
      <section className="card">
        <h2>Shared budget</h2>
        <p className="card-help">
          You're using <strong>{sharing.ownerName || "your partner"}</strong>'s budget. Changes either of you
          make show up for both.
        </p>
        {error && <p className="auth-error">{error}</p>}
        <button
          type="button"
          className="secondary full-width"
          disabled={busy}
          onClick={() => run(() => leaveBudget(user.uid, ownerUid))}
        >
          {busy ? "Leaving…" : "Leave and go back to my own budget"}
        </button>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>Shared budget</h2>
      <p className="card-help">
        Invite a partner to see and edit this budget with you from their own account.
      </p>

      {others.length > 0 && (
        <ul className="tx-list member-list">
          {others.map((uid) => (
            <li className="tx-row" key={uid}>
              <span className="tx-main">
                <span className="tx-note">{nameOf(uid)}</span>
                <span className="tx-meta">Can view and edit</span>
              </span>
              <button
                type="button"
                className="secondary"
                disabled={busy}
                onClick={() => {
                  if (window.confirm(`Remove ${nameOf(uid)} from your budget?`)) run(() => removeMember(user.uid, uid));
                }}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {code ? (
        <div className="invite-code-box">
          <span className="invite-code-label">Invite code</span>
          <span className="invite-code">{formatCode(code)}</span>
          <span className="card-help">
            Works once, for 48 hours. Your partner signs in, opens Settings → Shared budget, and enters it.
          </span>
          <button type="button" className="secondary" onClick={copyCode}>
            {copied ? "Copied" : "Share code"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="primary full-width"
          disabled={busy}
          onClick={() =>
            run(async () => {
              setCopied(false);
              setCode(await createInvite(user));
            })
          }
        >
          {busy ? "Creating…" : "Invite a partner"}
        </button>
      )}

      <form
        className="join-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!joinInput.trim()) return;
          run(() => joinBudget(joinInput, user));
        }}
      >
        <label htmlFor="join-code">Have a code from your partner?</label>
        <div className="join-row">
          <input
            id="join-code"
            type="text"
            autoCapitalize="characters"
            autoComplete="off"
            placeholder="ABCD-2345"
            value={joinInput}
            onChange={(e) => setJoinInput(e.target.value)}
          />
          <button type="submit" className="secondary" disabled={busy}>
            Join
          </button>
        </div>
        <span className="card-help">Joining switches you to their budget. Yours stays saved for when you leave.</span>
      </form>

      {error && <p className="auth-error">{error}</p>}
    </section>
  );
}
