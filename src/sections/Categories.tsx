import { CategoryList } from "../components/CategoryList";
import { AddCategoryForm } from "../components/AddCategoryForm";
import type { Category, CategoryMode } from "../types";

export function Categories({
  categories,
  onUpdate,
  onRemove,
  onAddCategory,
}: {
  categories: Category[];
  onUpdate: (id: string, patch: Partial<Omit<Category, "id">>) => void;
  onRemove: (id: string) => void;
  onAddCategory: (name: string, budget: number, mode: CategoryMode) => void;
}) {
  return (
    <>
      <CategoryList categories={categories} onUpdate={onUpdate} onRemove={onRemove} />
      <AddCategoryForm onAdd={onAddCategory} />
    </>
  );
}
