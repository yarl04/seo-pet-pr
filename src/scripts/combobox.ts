/**
 * Добавляет к выбору ингредиента поиск по вариантам и управление с клавиатуры.
 * Синхронизирует поле и список с исходным select, сохраняя единое значение для фильтров.
 * Управляет фокусом и ARIA-состояниями для работы со скринридером.
 */
import { normalizeText } from '../lib/filters';
import type { ComboboxController } from '../types/ui';

export function enhanceCombobox(root: HTMLElement): ComboboxController {
  const select = root.querySelector<HTMLSelectElement>('select')!;
  const input = root.querySelector<HTMLInputElement>('input')!;
  const label = root.querySelector<HTMLLabelElement>('label')!;
  const widget = root.querySelector<HTMLElement>('.combobox-widget')!;
  const list = root.querySelector<HTMLUListElement>('[role="listbox"]')!;
  const toggle = root.querySelector<HTMLButtonElement>('button')!;
  const empty = root.querySelector<HTMLElement>('.combobox-empty')!;
  const status = root.querySelector<HTMLElement>('[data-combobox-status]')!;
  const options = Array.from(select.options, (option, index) => ({ value: option.value, label: option.text, id: `${list.id}-${index}` }));
  let visible = options;
  let active = -1;
  let opened = false;

  function setActive(index: number) {
    active = index;
    Array.from(list.children).forEach((element, optionIndex) => element.setAttribute('aria-selected', String(optionIndex === index)));
    if (index < 0) input.removeAttribute('aria-activedescendant');
    else {
      input.setAttribute('aria-activedescendant', visible[index].id);
      document.getElementById(visible[index].id)?.scrollIntoView({ block: 'nearest' });
    }
  }

  function close(restore = true) {
    opened = false;
    list.hidden = true;
    empty.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Показать варианты ингредиентов');
    setActive(-1);
    if (restore) input.value = select.value;
  }

  function open(filter = '') {
    visible = options.filter((option) => !filter || normalizeText(option.label).includes(normalizeText(filter)));
    list.replaceChildren(...visible.map((option) => {
      const item = document.createElement('li');
      item.id = option.id;
      item.textContent = option.label;
      item.setAttribute('role', 'option');
      item.setAttribute('aria-selected', 'false');
      item.dataset.value = option.value;
      return item;
    }));
    opened = true;
    list.hidden = visible.length === 0;
    empty.hidden = visible.length !== 0;
    input.setAttribute('aria-expanded', String(visible.length > 0));
    toggle.setAttribute('aria-label', 'Закрыть варианты ингредиентов');
    setActive(-1);
    status.textContent = visible.length ? `Вариантов: ${visible.length}` : 'Ингредиент не найден';
  }

  function choose(value: string) {
    select.value = value;
    input.value = value;
    close();
    select.dispatchEvent(new Event('change', { bubbles: true }));
  }

  input.addEventListener('input', () => {
    if (!input.value) {
      select.value = '';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
    open(input.value);
  });
  input.addEventListener('click', () => { if (!opened) open(); });
  input.addEventListener('blur', () => close());
  input.addEventListener('keydown', (event) => {
    if (event.isComposing) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!opened) open();
      if (visible.length) {
        const next = active < 0 ? (event.key === 'ArrowDown' ? 0 : visible.length - 1) : (active + (event.key === 'ArrowDown' ? 1 : -1) + visible.length) % visible.length;
        setActive(next);
      }
    } else if (event.key === 'Enter' && opened) {
      event.preventDefault();
      if (active >= 0) choose(visible[active].value);
    } else if (event.key === 'Escape' && opened) {
      event.preventDefault();
      close();
    } else if (event.key === 'Tab') close();
  });
  list.addEventListener('pointerdown', (event) => {
    if ((event.target as Element).closest('[role="option"]')) event.preventDefault();
  });
  list.addEventListener('click', (event) => {
    const item = (event.target as Element).closest<HTMLElement>('[role="option"]');
    if (item) { choose(item.dataset.value!); input.focus(); }
  });
  toggle.addEventListener('pointerdown', (event) => event.preventDefault());
  toggle.addEventListener('click', () => { input.focus(); if (opened) close(); else open(); });
  const sync = () => { input.value = select.value; close(); };
  select.addEventListener('change', sync);

  // Сохраняем select как источник значения формы, заменяя только его интерфейс.
  label.htmlFor = input.id;
  select.hidden = true;
  widget.hidden = false;
  sync();
  return { sync };
}
