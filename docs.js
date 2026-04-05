/* ── Mobile menu ── */
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.menu-toggle');
  const sidebar = document.querySelector('.sidebar');
  const backdrop = document.querySelector('.backdrop');
  if (!toggle || !sidebar) return;
  const close = () => { sidebar.classList.remove('open'); backdrop?.classList.remove('show'); };
  toggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    backdrop?.classList.toggle('show');
  });
  backdrop?.addEventListener('click', close);
  sidebar.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
});

/* ── Active sidebar link ── */
document.addEventListener('DOMContentLoaded', () => {
  const current = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.sidebar a[href]').forEach(a => {
    if (a.getAttribute('href') === current) a.classList.add('active');
  });
});

/* ── Sidebar search / filter ── */
document.addEventListener('DOMContentLoaded', () => {
  const input = document.querySelector('.sidebar-search input');
  if (!input) return;
  const links = [...document.querySelectorAll('.sidebar a[href]')];
  const groups = [...document.querySelectorAll('.sidebar .group-title')];

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    links.forEach(a => {
      const match = !q || a.textContent.toLowerCase().includes(q);
      a.classList.toggle('hidden', !match);
    });
    groups.forEach(g => {
      let next = g.nextElementSibling;
      let hasVisible = false;
      while (next && !next.classList.contains('group-title')) {
        if (next.tagName === 'A' && !next.classList.contains('hidden')) hasVisible = true;
        next = next.nextElementSibling;
      }
      g.style.display = hasVisible ? '' : 'none';
    });
  });
});
