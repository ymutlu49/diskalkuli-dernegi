/**
 * Tiny filter-chip renderer shared by multiple screens.
 * Paints a row of inactive/active chips inside a container element.
 *
 * Chips are purely decorative at the moment — clicking toggles the
 * "on" class locally. Screens that need filtering logic install their
 * own click handlers AFTER calling renderChips.
 */
export function renderChips(containerId, labels) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = labels
    .map((label, i) => `<div class="chip${i === 0 ? ' on' : ''}">${label}</div>`)
    .join('');
  el.querySelectorAll('.chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      el.querySelectorAll('.chip').forEach((c) => c.classList.remove('on'));
      chip.classList.add('on');
    });
  });
}
