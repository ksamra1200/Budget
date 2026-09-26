import { CategoryList } from "../components/CategoryList";
import type { Category } from "../types";

export function Categories({
  categories,
  onUpdateBudget,
  onRemove,
}: {
  categories: Category[];
  onUpdateBudget: (id: string, budget: number) => void;
  onRemove: (id: string) => void;
}) {
  return <CategoryList categories={categories} onUpdateBudget={onUpdateBudget} onRemove={onRemove} />;
}
