import type { Category } from '../types/recipe';

export const categories: Category[] = [
  { id: 'breakfast', name: 'Завтраки', subtitle: 'Хорошее начало дня', description: 'Блины, яйца и тёплые тосты. Простые завтраки для неспешного выходного и утра, когда нужно успеть всё.', imageRecipe: 'banana-pancakes' },
  { id: 'lunch', name: 'Обеды', subtitle: 'Перерыв со вкусом', description: 'Свежие салаты, супы и сытные блюда. Готовим обед из обычных продуктов и оставляем время на настоящий перерыв.', imageRecipe: 'greek-salad' },
  { id: 'dinner', name: 'Ужины', subtitle: 'Вечер для себя', description: 'Паста, курица и овощи на одной сковороде. Ужины, после которых остаётся время на всё, что вы любите.', imageRecipe: 'tomato-pasta' },
];
