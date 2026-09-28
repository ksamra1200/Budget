import { CategoryList } from "../components/CategoryList";
import { AddCategoryForm } from "../components/AddCategoryForm";
import { RulesCard } from "../components/RulesCard";
import type { Category, CategoryMode, CategoryRule } from "../types";

export function Categories({
  categories,
  rules,
  onUpdate,
  onRemove,
  onAddCategory,
  onAddRule,
  onRemoveRule,
}: {
  categories: Category[];
  rules: CategoryRule[];
  onUpdate: (id: string, patch: Partial<Omit<Category, "id">>) => void;
  onRemove: (id: string) => void;
  onAddCategory: (name: string, budget: number, mode: CategoryMode) => void;
  onAddRule: (match: string, categoryId: string) => void;
  onRemoveRule: (id: string) => void;
}) {
  return (
    <>
      <CategoryList categories={categories} onUpdate={onUpdate} onRemove={onRemove} />
      <AddCategoryForm onAdd={onAddCategory} />
      <RulesCard rules={rules} categories={categories} onAdd={onAddRule} onRemove={onRemoveRule} />
    </>
  );
}
