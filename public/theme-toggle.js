function getStoredTheme() {
  try { return localStorage.getItem('vsec-theme') || 'system'; } catch (e) { return 'system'; }
}

function applyTheme(theme) {
  var html = document.documentElement;
  var resolved = theme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme;
  html.setAttribute('data-theme', resolved);

  document.querySelectorAll('[data-theme-btn]').forEach(function (btn) {
    var active = btn.dataset.themeBtn === theme;
    btn.classList.toggle('text-accent', active);
    btn.classList.toggle('bg-accent/10', active);
    btn.classList.toggle('text-text-muted', !active);
    btn.setAttribute('aria-pressed', String(active));
  });
}

// Apply stored theme to sync button states
applyTheme(getStoredTheme());

// Click handlers
document.querySelectorAll('[data-theme-btn]').forEach(function (btn) {
  btn.addEventListener('click', function () {
    var theme = btn.dataset.themeBtn;
    try { localStorage.setItem('vsec-theme', theme); } catch (e) {}
    applyTheme(theme);
  });
});

// Listen for system preference changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
  if (getStoredTheme() === 'system') applyTheme('system');
});
