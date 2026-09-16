// Auth guard — dołączany do każdej strony panelu admina
// Sprawdza sesję, uzupełnia sidebar, obsługuje wylogowanie
(function() {
  var ROLE_LABEL = { admin: 'Administrator', proboszcz: 'Proboszcz', pomocnik: 'Pomocnik' };

  function initUser(user) {
    // Sidebar: avatar (inicjały) + imię + rola + wyloguj
    var el = document.getElementById('sidebar-user');
    if (!el) return;
    var initials = user.display_name.split(' ').filter(function(w){ return /^[A-ZŁŚŻŹĆŃ]/.test(w); }).map(function(w){ return w[0]; }).join('').slice(0,2) || user.login.slice(0,2).toUpperCase();
    el.innerHTML =
      '<div class="user-avatar">' + initials + '</div>' +
      '<div class="user-name">' + escH(user.display_name) +
        '<small>' + (ROLE_LABEL[user.role] || user.role) + ' · <a href="#" id="btn-logout">Wyloguj</a></small>' +
      '</div>';
    document.getElementById('btn-logout').addEventListener('click', function(e) {
      e.preventDefault();
      fetch('/api/auth/logout', { method: 'POST' }).finally(function() {
        window.location.href = '/admin/login.html';
      });
    });

    // Pokaż/ukryj elementy zależne od roli
    applyRoleVisibility(user);
  }

  // Mapowanie: id modułu → selektor linku w sidebarze
  var MODULE_MAP = {
    'ogloszenia':      'a[href="ogloszenia.html"]',
    'aktualnosci':     'a[href="aktualnosci.html"]',
    'galeria':         'a[href="galeria.html"]',
    'strony-statyczne':'a[href="strony-statyczne.html"]',
    'intencje':        'a[href="intencje.html"]',
    'sakramenty':      'a[href="sakramenty.html"]',
    'pogrzeby':        'a[href="pogrzeby.html"]',
    'parafianie':      'a[href="parafianie.html"]',
    'wspolnoty':       'a[href="wspolnoty.html"]',
    'dokumenty':       'a[href="dokumenty.html"]',
    'ustawienia':      'a[href="ustawienia.html"]'
  };

  // Mapowanie: nazwa pliku strony → id modułu (dla blokady dostępu)
  var PAGE_MODULE = {
    'aktualnosci.html':      'aktualnosci',
    'aktualnosci-edit.html': 'aktualnosci',
    'ogloszenia.html':       'ogloszenia',
    'galeria.html':          'galeria',
    'strony-statyczne.html': 'strony-statyczne',
    'intencje.html':         'intencje',
    'sakramenty.html':       'sakramenty',
    'pogrzeby.html':         'pogrzeby',
    'parafianie.html':       'parafianie',
    'wspolnoty.html':        'wspolnoty',
    'dokumenty.html':        'dokumenty',
    'ustawienia.html':       'ustawienia',
    'index.html':            'pulpit'
  };

  function blockPage(modLabel) {
    document.body.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:center;height:100vh;' +
      'font-family:system-ui,sans-serif;flex-direction:column;gap:12px;background:#faf6ee">' +
      '<div style="font-size:2.4rem">🔒</div>' +
      '<h2 style="margin:0;color:#7a1f2b;font-size:1.4rem">Brak dostępu</h2>' +
      '<p style="color:#5a5048;margin:0;font-size:.95rem">Nie masz uprawnień do modułu <b>' + escH(modLabel) + '</b>.</p>' +
      '<p style="color:#5a5048;margin:0;font-size:.85rem">Skontaktuj się z administratorem lub proboszczem.</p>' +
      '<a href="/admin/login.html" onclick="fetch(\'/api/auth/logout\',{method:\'POST\'}).finally(function(){window.location.href=\'/admin/login.html\'});return false;" ' +
      'style="margin-top:10px;color:#7a1f2b;font-weight:600;font-size:.9rem;text-decoration:none;' +
      'padding:8px 16px;border:1px solid #7a1f2b;border-radius:6px">Wyloguj się</a>' +
      '</div>';
  }

  function applyRoleVisibility(user) {
    var perms = user.pomocnik_permissions || {};

    if (user.role === 'pomocnik') {
      // Ukryj linki do modułów bez uprawnień
      Object.keys(MODULE_MAP).forEach(function(mod) {
        var el = document.querySelector(MODULE_MAP[mod]);
        if (el && !perms[mod]) el.style.display = 'none';
      });

      // Blokada strony: jeśli pomocnik wszedł bezpośrednio na stronę bez uprawnień
      // Pulpit (index.html) jest zawsze dostępny — to tylko widok statystyk
      var page = window.location.pathname.split('/').pop() || 'index.html';
      var pageModule = PAGE_MODULE[page];
      if (pageModule && pageModule !== 'pulpit' && !perms[pageModule]) {
        var LABELS = {
          pulpit:'Pulpit', aktualnosci:'Aktualności', ogloszenia:'Ogłoszenia',
          galeria:'Galeria', 'strony-statyczne':'Strony statyczne',
          intencje:'Intencje mszalne', sakramenty:'Sakramenty',
          pogrzeby:'Pogrzeby', parafianie:'Parafianie', wspolnoty:'Wspólnoty',
          dokumenty:'Dokumenty', ustawienia:'Ustawienia parafii'
        };
        blockPage(LABELS[pageModule] || pageModule);
        return;
      }
    }

    // Admin/proboszcz: link Użytkownicy i role widoczny
    var usersTab = document.getElementById('users-tab-link');
    if (usersTab && user.role === 'pomocnik') usersTab.style.display = 'none';
  }

  function escH(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // Sprawdź sesję przy załadowaniu
  fetch('/api/auth/me').then(function(r) {
    if (r.status === 401 || r.status === 403) {
      window.location.href = '/admin/login.html';
      return null;
    }
    return r.json();
  }).then(function(user) {
    if (!user) return;
    window._authUser = user;
    initUser(user);
    // Dodaj klasę auth-ok — CSS przestaje ukrywać nav, widoczne tylko uprawnione linki
    document.body.classList.add('auth-ok');
    // Wywołaj callback jeśli strona go zarejestrowała
    if (typeof window._onAuthReady === 'function') window._onAuthReady(user);
  }).catch(function() {
    window.location.href = '/admin/login.html';
  });
})();
