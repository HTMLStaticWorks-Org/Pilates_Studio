const moonIcon = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
const sunIcon = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41"/></svg>';
const themeMeta = document.querySelector('meta[name="theme-color"]');
const isAuthPage = document.body.classList.contains('auth-page');
const isDashboardPage = document.body.classList.contains('dashboard-page');
const isPublicSite = !isAuthPage && !isDashboardPage;

const PREF_PREFIX = 'FORME_PREFS:';

function readWindowPrefs() {
  try {
    if (window.name && window.name.indexOf(PREF_PREFIX) === 0) {
      return JSON.parse(window.name.slice(PREF_PREFIX.length)) || {};
    }
  } catch {}
  return {};
}

function readStorage(key, fallback) {
  try {
    const val = localStorage.getItem(key);
    if (val) return val;
  } catch {}
  try {
    const val = sessionStorage.getItem(key);
    if (val) return val;
  } catch {}
  const prefs = readWindowPrefs();
  return prefs[key] || fallback;
}

function writeStorage(key, value) {
  try { localStorage.setItem(key, value); } catch {}
  try { sessionStorage.setItem(key, value); } catch {}
  try {
    const prefs = readWindowPrefs();
    prefs[key] = value;
    window.name = PREF_PREFIX + JSON.stringify(prefs);
  } catch {}
}

function syncAcrossViews(storageKey, onSync) {
  window.addEventListener('storage', e => {
    if (!e.key || e.key === storageKey) onSync();
  });
  window.addEventListener('pageshow', onSync);
  window.addEventListener('focus', onSync);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) onSync();
  });
}

function bindRtlToggle(button, storageKey) {
  if (!button) return;
  const labelEl = button.querySelector('[data-rtl-label]');
  const apply = dir => {
    const nextDir = dir === 'rtl' ? 'rtl' : 'ltr';
    const isRtl = nextDir === 'rtl';
    document.documentElement.setAttribute('dir', nextDir);
    if (labelEl) labelEl.textContent = isRtl ? 'LTR' : 'RTL';
    else button.textContent = isRtl ? 'LTR' : 'RTL';
    button.setAttribute('aria-pressed', String(isRtl));
    button.setAttribute('aria-label', isRtl ? 'Switch layout to left-to-right' : 'Switch layout to right-to-left');
  };
  const sync = () => apply(readStorage(storageKey, 'ltr'));
  sync();
  syncAcrossViews(storageKey, sync);
  button.addEventListener('click', () => {
    const nextDir = document.documentElement.getAttribute('dir') === 'rtl' ? 'ltr' : 'rtl';
    apply(nextDir);
    writeStorage(storageKey, nextDir);
  });
}

function bindThemeToggle(button, storageKey, targetEl, attrName, colors) {
  if (!button) return;
  const apply = theme => {
    const isDark = theme === 'dark';
    if (isDark) targetEl.setAttribute(attrName, 'dark');
    else targetEl.removeAttribute(attrName);
    if (themeMeta) themeMeta.setAttribute('content', isDark ? colors.dark : colors.light);
    button.innerHTML = isDark ? sunIcon : moonIcon;
    button.setAttribute('aria-pressed', String(isDark));
    button.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
  };
  const sync = () => apply(readStorage(storageKey, 'light'));
  sync();
  syncAcrossViews(storageKey, sync);
  button.addEventListener('click', () => {
    const nextTheme = targetEl.getAttribute(attrName) === 'dark' ? 'light' : 'dark';
    apply(nextTheme);
    writeStorage(storageKey, nextTheme);
  });
}

if (isPublicSite) {
  const menuButton = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.primary-nav');
  const rawPage = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const activePage = rawPage.includes('.') ? rawPage : `${rawPage}.html`;

  document.querySelectorAll('.primary-nav a, .footer-links a, .footer-bottom-links a').forEach(link => {
    const href = (link.getAttribute('href') || '').toLowerCase();
    if (href === activePage) {
      link.setAttribute('aria-current', 'page');
      link.classList.add('active');
    }
  });

  const closeMenu = () => {
    if (!menuButton || !nav) return;
    nav.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open navigation menu');
  };

  if (menuButton && nav) {
    menuButton.addEventListener('click', () => {
      const open = menuButton.getAttribute('aria-expanded') === 'true';
      menuButton.setAttribute('aria-expanded', String(!open));
      menuButton.setAttribute('aria-label', open ? 'Open navigation menu' : 'Close navigation menu');
      nav.classList.toggle('open', !open);
    });
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
    window.addEventListener('resize', () => { if (window.innerWidth > 1100) closeMenu(); });
  }

  bindRtlToggle(document.querySelector('.rtl-toggle'), 'forme-dir');
  bindThemeToggle(
    document.querySelector('.theme-toggle'),
    'forme-theme',
    document.documentElement,
    'data-theme',
    { light: '#582f40', dark: '#151113' }
  );

  const schedBtns = Array.from(document.querySelectorAll('[data-schedule-filter]'));
  const schedRows = Array.from(document.querySelectorAll('[data-schedule-slot]'));
  if (schedBtns.length && schedRows.length) {
    schedBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.scheduleFilter;
        schedBtns.forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
        schedRows.forEach(row => {
          row.hidden = row.dataset.scheduleSlot !== target;
        });
      });
    });
  }

  const focusBtns = Array.from(document.querySelectorAll('[data-focus-filter]'));
  const focusCards = Array.from(document.querySelectorAll('[data-focus-tag]'));
  if (focusBtns.length && focusCards.length) {
    focusBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.focusFilter;
        focusBtns.forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
        focusCards.forEach(card => {
          card.hidden = target !== 'all' && card.dataset.focusTag !== target;
        });
      });
    });
  }

  const cadenceBtns = Array.from(document.querySelectorAll('[data-cadence-option]'));
  const cadenceTitle = document.getElementById('cadence-title');
  const cadenceDesc = document.getElementById('cadence-desc');
  const cadenceMeta = document.getElementById('cadence-meta');
  if (cadenceBtns.length && cadenceTitle && cadenceDesc && cadenceMeta) {
    cadenceBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        cadenceBtns.forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
        cadenceTitle.textContent = btn.dataset.cadencePack || '';
        cadenceDesc.textContent = btn.dataset.cadenceSummary || '';
        cadenceMeta.textContent = btn.dataset.cadenceMeta || '';
      });
    });
  }
}

if (isDashboardPage) {
  bindRtlToggle(document.querySelector('.dash-rtl-toggle'), 'forme-dash-dir');
  bindThemeToggle(
    document.querySelector('.dash-theme-toggle'),
    'forme-dash-theme',
    document.body,
    'data-dash-theme',
    { light: '#1f4e4b', dark: '#0f1418' }
  );

  const dashSidebar = document.querySelector('.dash-sidebar');
  const dashMenuBtn = document.querySelector('.dash-menu-toggle');
  const dashDrawer = document.getElementById('dash-drawer');
  const closeDashMenu = () => {
    if (!dashMenuBtn || !dashDrawer || !dashSidebar) return;
    dashDrawer.classList.remove('open');
    dashSidebar.classList.remove('is-open');
    dashMenuBtn.setAttribute('aria-expanded', 'false');
    dashMenuBtn.setAttribute('aria-label', 'Open dashboard menu');
  };
  if (dashMenuBtn && dashDrawer && dashSidebar) {
    dashMenuBtn.addEventListener('click', () => {
      const open = dashMenuBtn.getAttribute('aria-expanded') === 'true';
      dashMenuBtn.setAttribute('aria-expanded', String(!open));
      dashMenuBtn.setAttribute('aria-label', open ? 'Open dashboard menu' : 'Close dashboard menu');
      dashDrawer.classList.toggle('open', !open);
      dashSidebar.classList.toggle('is-open', !open);
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDashMenu(); });
    window.addEventListener('resize', () => { if (window.innerWidth > 760) closeDashMenu(); });
  }

  const tabButtons = Array.from(document.querySelectorAll('[data-dash-tab]'));
  const views = Array.from(document.querySelectorAll('[data-dash-view]'));

  const activateTab = targetId => {
    if (!views.some(v => v.dataset.dashView === targetId)) return;
    tabButtons.forEach(btn => {
      const isMatch = btn.dataset.dashTab === targetId;
      btn.classList.toggle('active', isMatch);
      btn.setAttribute('aria-selected', String(isMatch));
    });
    views.forEach(view => {
      view.hidden = view.dataset.dashView !== targetId;
    });
    closeDashMenu();
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
  };

  tabButtons.forEach(btn => btn.addEventListener('click', () => activateTab(btn.dataset.dashTab)));
  document.querySelectorAll('[data-dash-goto]').forEach(btn => {
    btn.addEventListener('click', () => activateTab(btn.dataset.dashGoto));
  });

  document.querySelectorAll('[data-dash-booking]').forEach(btn => {
    btn.addEventListener('click', () => {
      const row = btn.closest('.schedule-row');
      const status = row && row.querySelector('.status');
      const isCancelled = btn.getAttribute('aria-pressed') === 'true';
      btn.setAttribute('aria-pressed', String(!isCancelled));
      btn.textContent = isCancelled ? 'Cancel' : 'Restore';
      if (status) {
        status.textContent = isCancelled ? 'BOOKED' : 'CANCELLED';
        status.classList.toggle('is-muted', !isCancelled);
      }
    });
  });

  document.querySelectorAll('[data-dash-reserve]').forEach(btn => {
    btn.addEventListener('click', () => {
      const row = btn.closest('.schedule-row');
      const status = row && row.querySelector('.status');
      const isReserved = btn.getAttribute('aria-pressed') === 'true';
      btn.setAttribute('aria-pressed', String(!isReserved));
      btn.textContent = isReserved ? 'Reserve' : 'Reserved';
      if (status) {
        status.textContent = isReserved ? 'OPEN' : 'BOOKED';
        status.classList.toggle('is-muted', isReserved);
      }
    });
  });

  const packButtons = Array.from(document.querySelectorAll('[data-dash-pack]'));
  const packFeedback = document.getElementById('pack-feedback');
  packButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      packButtons.forEach(other => {
        const option = other.closest('.dash-pack-option');
        const active = other === btn;
        other.setAttribute('aria-pressed', String(active));
        other.textContent = active ? 'Selected' : 'Select';
        if (option) option.classList.toggle('is-current', active);
      });
      if (packFeedback) {
        packFeedback.textContent = `Demo selection updated to ${btn.dataset.dashPack}. Connect billing before launch.`;
      }
    });
  });

  const profileForm = document.getElementById('dash-profile-form');
  const profNameInput = document.getElementById('prof-name');
  const profEmailInput = document.getElementById('prof-email');
  if (profileForm && profNameInput && profEmailInput) {
    profileForm.addEventListener('submit', () => {
      if (!profileForm.checkValidity()) return;
      const nextName = profNameInput.value.trim();
      const nextEmail = profEmailInput.value.trim();
      if (nextName) {
        document.querySelectorAll('[data-profile-name]').forEach(el => { el.textContent = nextName; });
      }
      if (nextEmail) {
        document.querySelectorAll('[data-profile-email]').forEach(el => { el.textContent = nextEmail; });
      }
    });
  }
}

if (isAuthPage) {
  bindRtlToggle(document.querySelector('.auth-rtl-toggle'), 'forme-dash-dir');
  bindThemeToggle(
    document.querySelector('.auth-theme-toggle'),
    'forme-dash-theme',
    document.body,
    'data-auth-theme',
    { light: '#1f4e4b', dark: '#0f1418' }
  );
}

const eyeIcon = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
const eyeOffIcon = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';

document.querySelectorAll('[data-password-toggle]').forEach(btn => {
  const input = document.getElementById(btn.dataset.passwordToggle);
  if (!input) return;
  const sync = visible => {
    input.type = visible ? 'text' : 'password';
    btn.innerHTML = visible ? eyeOffIcon : eyeIcon;
    btn.setAttribute('aria-pressed', String(visible));
    btn.setAttribute('aria-label', visible ? 'Hide password' : 'Show password');
  };
  sync(false);
  btn.addEventListener('click', () => sync(input.type === 'password'));
  const form = btn.closest('form');
  if (form) form.addEventListener('reset', () => sync(false));
});

document.querySelectorAll('[data-inline-note]').forEach(btn => {
  btn.addEventListener('click', () => {
    const form = btn.closest('form');
    const feedback = form && form.querySelector('.form-feedback');
    if (feedback) feedback.textContent = btn.dataset.inlineNote;
  });
});

document.querySelectorAll('form[data-demo-form]').forEach(form => {
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const feedback = form.querySelector('.form-feedback');
    if (feedback) {
      feedback.textContent = form.dataset.feedback || 'Thank you. This demo form is ready to connect to your booking or account system.';
    }
    if (!form.hasAttribute('data-preserve-fields')) form.reset();
  });
});
