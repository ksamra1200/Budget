import { AuthScreen, signOutUser, useAuth } from "./components/Auth";
import { BudgetApp } from "./App";

export default function AppRoot() {
  const user = useAuth();

  if (user === undefined) {
    return (
      <p className="empty-state" style={{ textAlign: "center", padding: 40 }}>
        Loading…
      </p>
    );
  }

  if (user === null) {
    return <AuthScreen />;
  }

  return <BudgetApp uid={user.uid} onSignOut={signOutUser} />;
}
