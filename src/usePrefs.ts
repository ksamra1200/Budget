import { useEffect, useState } from "react";

export interface Prefs {
  billReminders: boolean;
  budgetAlerts: boolean;
}

const STORAGE_KEY = "budget-prefs";
const DEFAULTS: Prefs = { billReminders: true, budgetAlerts: true };

function readPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

/** Per-device preferences (alerts on/off), kept in this browser. */
export function usePrefs() {
  const [prefs, setPrefs] = useState<Prefs>(readPrefs);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // ignore
    }
  }, [prefs]);

  function setPref<K extends keyof Prefs>(key: K, value: Prefs[K]) {
    setPrefs((p) => ({ ...p, [key]: value }));
  }

  return { prefs, setPref };
}
