import { useState } from "react";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  updateProfile,
  type User,
} from "firebase/auth";
import { ThemeToggle } from "./ThemeToggle";

function friendlyError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  switch (code) {
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Your current password is incorrect.";
    case "auth/weak-password":
      return "New password must be at least 6 characters.";
    case "auth/requires-recent-login":
      return "Please sign out and back in, then try again.";
    default:
      return "Something went wrong. Please try again.";
  }
}

export function Settings({
  user,
  theme,
  onToggleTheme,
  onSignOut,
  onDisplayNameChange,
}: {
  user: User;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onSignOut: () => void;
  onDisplayNameChange: (name: string) => void;
}) {
  const [name, setName] = useState(user.displayName ?? "");
  const [nameStatus, setNameStatus] = useState<string | null>(null);
  const [nameBusy, setNameBusy] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setNameBusy(true);
    setNameStatus(null);
    try {
      await updateProfile(user, { displayName: trimmed });
      onDisplayNameChange(trimmed);
      setNameStatus("Saved.");
    } catch {
      setNameStatus("Couldn't save your name. Please try again.");
    } finally {
      setNameBusy(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords don't match.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }
    setPasswordBusy(true);
    try {
      if (!user.email) throw new Error("no-email");
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordError(friendlyError(err));
    } finally {
      setPasswordBusy(false);
    }
  }

  return (
    <>
      <section className="card">
        <h2>Appearance</h2>
        <div className="settings-row">
          <span>Dark mode</span>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
      </section>

      <section className="card">
        <h2>Profile</h2>
        <form className="inline-form" onSubmit={handleSaveName}>
          <div className="field" style={{ flex: "2 1 160px" }}>
            <label htmlFor="settings-name">Name</label>
            <input
              id="settings-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setNameStatus(null);
              }}
            />
          </div>
          <button type="submit" className="primary" disabled={nameBusy}>
            {nameBusy ? "Saving…" : "Save"}
          </button>
        </form>
        {nameStatus && <p className="empty-state" style={{ padding: "8px 0 0" }}>{nameStatus}</p>}
      </section>

      <section className="card">
        <h2>Change password</h2>
        <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div className="field">
            <label htmlFor="current-password">Current password</label>
            <input
              id="current-password"
              type="password"
              required
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="new-password">New password</label>
            <input
              id="new-password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="confirm-password">Confirm new password</label>
            <input
              id="confirm-password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          {passwordError && <p className="auth-error">{passwordError}</p>}
          {passwordSuccess && (
            <p className="empty-state" style={{ padding: 0, color: "var(--success-text)" }}>
              Password updated.
            </p>
          )}
          <button type="submit" className="primary" disabled={passwordBusy}>
            {passwordBusy ? "Updating…" : "Update password"}
          </button>
        </form>
      </section>

      <section className="card">
        <button type="button" className="secondary" style={{ width: "100%" }} onClick={onSignOut}>
          Sign out
        </button>
      </section>
    </>
  );
}
