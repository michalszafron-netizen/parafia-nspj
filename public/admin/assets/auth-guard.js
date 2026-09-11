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

  function applyRoleVisibility(user) {
    var perms = user.pomocnik_permissions || {};
    if (user.role === 'pomocnik') {
      // Ukryj zakładki bez uprawnień w menu
      var MODULE_MAP = {
        'parafianie': '[data-module="parafianie"]',
        'sakramenty': '[data-module="sakramenty"]',
        'galeria':    '[data-module="galeria"]',
        'dokumenty':  '[data-module="dokumenty"]',
        'ustawienia': '[data-module="ustawienia"]'
      };
      Object.keys(MODULE_MAP).forEach(function(mod) {
        var sel = MODULE_MAP[mod];
        var el = document.querySelector(sel);
        if (el && !perms[mod]) el.style.display = 'none';
      });
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
    // Wywołaj callback jeśli strona go zarejestrowała
    if (typeof window._onAuthReady === 'function') window._onAuthReady(user);
  }).catch(function() {
    window.location.href = '/admin/login.html';
  });
})();
