export type CategoryId = 'breakfast' | 'lunch' | 'dinner';

export interface Category {
  id: CategoryId;
  name: string;
  subtitle: string;
  description: string;
  imageRecipe: string;
}

export interface Recipe {
  slug: string;
  name: string;
  description: string;
  category: CategoryId;
  mainIngredient: string;
  vegetarian: boolean;
  prepMinutes: number;
  cookMinutes: number;
  servings: number;
  image: string;
  imageAlt: string;
  ingredients: string[];
  steps: { title: string; text: string }[];
  tip: string;
}
