document.documentElement.classList.add('js');
const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.main-nav');
toggle?.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') !== 'true';
  toggle.setAttribute('aria-expanded', String(open));
  nav.classList.toggle('open', open);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    if (nav?.classList.contains('open')) {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.focus();
    }
    document.querySelectorAll('details[open]').forEach(el => { el.open = false; });
  }
});
document.querySelectorAll('[data-language-link]').forEach(link => {
  link.addEventListener('click', () => {
    if (location.hash) link.href = link.href.split('#')[0] + location.hash;
  });
});
const search = document.getElementById('publication-search');
const count = document.getElementById('search-count');
const empty = document.getElementById('search-empty');
if (search) {
  const entries = [...document.querySelectorAll('.publication-entry')];
  const update = () => {
    const query = search.value.trim().toLocaleLowerCase();
    let visible = 0;
    entries.forEach(entry => {
      const show = entry.textContent.toLocaleLowerCase().includes(query);
      entry.hidden = !show;
      visible += Number(show);
    });
    count.textContent = document.documentElement.lang === 'ko' ? `${visible}편` : `${visible} ${visible===1?'paper':'papers'}`;
    empty.hidden = visible !== 0;
    document.querySelectorAll('[data-publication-group]').forEach(group => {
      group.hidden = ![...group.querySelectorAll('.publication-entry')].some(entry => !entry.hidden);
    });
  };
  search.addEventListener('input', update);
  update();
}
