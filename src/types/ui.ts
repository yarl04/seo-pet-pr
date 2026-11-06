import type { Recipe } from './recipe';

export interface Breadcrumb { name: string; href?: string }
export interface BreadcrumbsProps { items: Breadcrumb[] }
export interface IngredientComboboxProps { ingredients: string[] }
export interface RecipeCardProps { recipe: Recipe; heading?: 'h2' | 'h3'; eager?: boolean }
export interface RecipeGridProps { recipes: Recipe[]; heading?: 'h2' | 'h3' }
export interface LayoutProps {
  title: string;
  description: string;
  image?: string;
  imageAlt?: string;
  schema?: Record<string, unknown>[];
  noindex?: boolean;
}
export interface FilterState {
  query: string;
  category: string;
  ingredient: string;
  time: number;
  vegetarian: boolean;
}
export interface ComboboxController { sync: () => void }
export interface FilterRecipe {
  slug: string;
  name: string;
  ingredients: string[];
  category: string;
  mainIngredient: string;
  vegetarian: boolean;
  minutes: number;
}
