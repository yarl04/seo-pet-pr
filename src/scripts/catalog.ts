/**
 * Добавляет поиск и фильтрацию к статическому каталогу без перезагрузки страницы.
 * Сохраняет фильтры в URL и восстанавливает их при загрузке и навигации браузера.
 * Показывает форму после инициализации, чтобы при недоступном JavaScript
 * пользователь видел все рецепты и пояснение вместо неработающих фильтров.
 */
import { enhanceCombobox } from './combobox';
import { filterParams, matchesFilters } from '../lib/filters';
import type { FilterRecipe, FilterState } from '../types/ui';
import { recipeCount } from '../lib/recipes';

const form = document.querySelector<HTMLFormElement>('#recipe-filters')!;
const search = form.querySelector<HTMLInputElement>('[name="q"]')!;
const category = form.querySelector<HTMLSelectElement>('[name="category"]')!;
const ingredient = form.querySelector<HTMLSelectElement>('[name="ingredient"]')!;
const time = form.querySelector<HTMLSelectElement>('[name="time"]')!;
const vegetarian = form.querySelector<HTMLInputElement>('[name="vegetarian"]')!;
const count = document.querySelector<HTMLElement>('#result-count')!;
const title = document.querySelector<HTMLElement>('#results-title')!;
const empty = document.querySelector<HTMLElement>('#empty-results')!;
const data: FilterRecipe[] = JSON.parse(document.querySelector('#recipe-filter-data')!.textContent!);
const items = Array.from(document.querySelectorAll<HTMLElement>('[data-recipe]'));
const combo = enhanceCombobox(form.querySelector('[data-combobox]')!);
let searchTimer: ReturnType<typeof setTimeout>;

function getFilters(): FilterState {
  return { query: search.value, category: category.value, ingredient: ingredient.value, time: Number(time.value), vegetarian: vegetarian.checked };
}

function update(writeUrl = true) {
  const filters = getFilters();
  const shown = new Set(data.filter((recipe) => matchesFilters(recipe, filters)).map((recipe) => recipe.slug));
  items.forEach((item) => { item.hidden = !shown.has(item.dataset.recipe!); });
  count.textContent = recipeCount(shown.size);
  title.textContent = filterParams(filters).size ? 'Подходящие рецепты' : 'Все рецепты';
  empty.hidden = shown.size !== 0;
  if (writeUrl) {
    const params = filterParams(filters).toString();
    const next = `${location.pathname}${params ? `?${params}` : ''}${location.hash}`;
    history.replaceState(null, '', next);
  }
}

function restore() {
  clearTimeout(searchTimer);
  const params = new URLSearchParams(location.search);
  search.value = params.get('q') ?? '';
  for (const select of [category, ingredient, time]) {
    const value = params.get(select.name) ?? (select === time ? '30' : '');
    select.value = Array.from(select.options).some((option) => option.value === value) ? value : (select === time ? '30' : '');
  }
  vegetarian.checked = params.get('vegetarian') === '1';
  combo.sync();
  update(false);
}

form.addEventListener('submit', (event) => { event.preventDefault(); clearTimeout(searchTimer); update(); });
search.addEventListener('input', () => { clearTimeout(searchTimer); searchTimer = setTimeout(update, 180); });
form.addEventListener('change', () => { clearTimeout(searchTimer); update(); });
form.addEventListener('reset', () => {
  clearTimeout(searchTimer);
  // Браузер сбрасывает значения полей после события reset, поэтому обновление откладываем.
  queueMicrotask(() => { combo.sync(); update(); });
});
document.querySelector('#clear-empty-filters')!.addEventListener('click', () => { form.reset(); search.focus(); });
window.addEventListener('popstate', restore);
window.addEventListener('pageshow', restore);
restore();
form.hidden = false;
document.querySelector<HTMLElement>('#filter-fallback')!.hidden = true;
