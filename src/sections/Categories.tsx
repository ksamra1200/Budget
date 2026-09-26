import { CategoryList } from "../components/CategoryList";
import { AddCategoryForm } from "../components/AddCategoryForm";
import type { Category, CategoryMode } from "../types";

export function Categories({
  categories,
  onUpdateBudget,
  onRemove,
  onAddCategory,
}: {
  categories: Category[];
  onUpdateBudget: (id: string, budget: number) => void;
  onRemove: (id: string) => void;
  onAddCategory: (name: string, budget: number, mode: CategoryMode) => void;
}) {
  return (
    <>
      <CategoryList categories={categories} onUpdateBudget={onUpdateBudget} onRemove={onRemove} />
      <AddCategoryForm onAdd={onAddCategory} />
    </>
  );
}
