import { useCallback, useEffect, useState } from "react";
import type { BudgetData } from "./types";

const STORAGE_KEY = "budget-app-data";

const DEFAULT_DATA: BudgetData = {
  categories: [
    { id: crypto.randomUUID(), name: "Housing", budget: 1500 },
    { id: crypto.randomUUID(), name: "Groceries", budget: 500 },
    { id: crypto.randomUUID(), name: "Transportation", budget: 200 },
    { id: crypto.randomUUID(), name: "Entertainment", budget: 150 },
  ],
  transactions: [],
  goals: [],
};

function load(): BudgetData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_DATA;
    const parsed = JSON.parse(raw) as BudgetData;
    if (!Array.isArray(parsed.categories) || !Array.isArray(parsed.transactions)) {
      return DEFAULT_DATA;
    }
    return { ...parsed, goals: Array.isArray(parsed.goals) ? parsed.goals : [] };
  } catch {
    return DEFAULT_DATA;
  }
}

export function useBudgetData() {
  const [data, setData] = useState<BudgetData>(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // storage unavailable (private browsing, quota) - fail silently
    }
  }, [data]);

  const update = useCallback((updater: (prev: BudgetData) => BudgetData) => {
    setData(updater);
  }, []);

  return { data, update };
}
