import type { FilterRecipe, FilterState } from '../types/ui';

export const normalizeText = (value: string) => value.toLocaleLowerCase('ru').replace(/ё/g, 'е').trim();

export function matchesFilters(recipe: FilterRecipe, filters: FilterState) {
  const text = normalizeText([recipe.name, ...recipe.ingredients].join(' '));
  const words = normalizeText(filters.query).split(/\s+/).filter(Boolean);
  return words.every((word) => text.includes(word))
    && (!filters.category || recipe.category === filters.category)
    && (!filters.ingredient || recipe.mainIngredient === filters.ingredient)
    && recipe.minutes <= filters.time
    && (!filters.vegetarian || recipe.vegetarian);
}

export function filterParams(filters: FilterState) {
  const params = new URLSearchParams();
  if (filters.query.trim()) params.set('q', filters.query.trim());
  if (filters.category) params.set('category', filters.category);
  if (filters.ingredient) params.set('ingredient', filters.ingredient);
  if (filters.time !== 30) params.set('time', String(filters.time));
  if (filters.vegetarian) params.set('vegetarian', '1');
  return params;
}
