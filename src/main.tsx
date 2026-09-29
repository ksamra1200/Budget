import React from "react";
import ReactDOM from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import AppRoot from "./AppRoot";
import "./styles.css";

// Switch to a new version as soon as it's published: when the service worker
// finds an update it installs it and the page reloads onto it (registerType
// "autoUpdate"). A home-screen app is usually resumed rather than relaunched,
// which doesn't check for updates, so also check whenever it comes back into view.
registerSW({
  immediate: true,
  onRegisteredSW(_url, registration) {
    if (!registration) return;
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") registration.update().catch(() => {});
    });
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppRoot />
  </React.StrictMode>,
);
