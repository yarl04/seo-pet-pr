import type { Recipe } from '../types/recipe';
import type { Breadcrumb } from '../types/ui';
import { categoryName, recipeUrl, totalMinutes } from './recipes';
import { withBase } from './urls';

export const absoluteUrl = (path: string, site: URL) => new URL(withBase(path), site).href;
export const serializeSchema = (schema: unknown) => JSON.stringify(schema).replace(/</g, '\\u003c');

export function recipeSchema(recipe: Recipe, site: URL) {
  return {
    '@context': 'https://schema.org', '@type': 'Recipe',
    name: recipe.name, description: recipe.description,
    image: [absoluteUrl(recipe.image, site)], url: absoluteUrl(recipeUrl(recipe), site),
    author: { '@type': 'Organization', name: 'Что приготовить за 30 минут' },
    prepTime: `PT${recipe.prepMinutes}M`, cookTime: `PT${recipe.cookMinutes}M`, totalTime: `PT${totalMinutes(recipe)}M`,
    recipeYield: String(recipe.servings), recipeCategory: categoryName(recipe.category),
    recipeIngredient: recipe.ingredients,
    recipeInstructions: recipe.steps.map((step, index) => ({
      '@type': 'HowToStep', name: step.title, text: step.text,
      url: absoluteUrl(`${recipeUrl(recipe)}#step-${index + 1}`, site),
    })),
    ...(recipe.vegetarian ? { suitableForDiet: 'https://schema.org/VegetarianDiet' } : {}),
  };
}

export function breadcrumbSchema(items: Breadcrumb[], currentPath: string, site: URL) {
  return {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem', position: index + 1, name: item.name,
      item: absoluteUrl(item.href ?? currentPath, site),
    })),
  };
}

export function listSchema(recipes: Recipe[], site: URL) {
  return {
    '@context': 'https://schema.org', '@type': 'ItemList',
    itemListElement: recipes.map((recipe, index) => ({
      '@type': 'ListItem', position: index + 1, url: absoluteUrl(recipeUrl(recipe), site), name: recipe.name,
    })),
  };
}
