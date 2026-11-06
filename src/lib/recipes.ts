import { categories } from '../data/categories';
import type { Recipe } from '../types/recipe';
import { withBase } from './urls';

export const totalMinutes = (recipe: Recipe) => recipe.prepMinutes + recipe.cookMinutes;
export const recipeUrl = (recipe: Recipe) => withBase(`/recipes/${recipe.slug}/`);
export const categoryName = (id: string) => categories.find((category) => category.id === id)?.name ?? '';
export const recipeCount = (count: number) => {
  const mod100 = count % 100;
  const mod10 = count % 10;
  const word = mod100 >= 11 && mod100 <= 14 ? 'рецептов' : mod10 === 1 ? 'рецепт' : mod10 >= 2 && mod10 <= 4 ? 'рецепта' : 'рецептов';
  return `${count} ${word}`;
};
