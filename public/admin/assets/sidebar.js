(function () {
  var aside = document.querySelector('aside.sidebar');
  if (!aside) return;
  var active = aside.getAttribute('data-active') || '';

  var IC = {
    home:     '<svg fill="currentColor" viewBox="0 0 16 16"><path d="M6.5 14.5v-3.505c0-.245.25-.495.5-.495h2c.25 0 .5.25.5.5v3.5a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5v-7a.5.5 0 0 0-.146-.354L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.354 1.146a.5.5 0 0 0-.708 0l-6 6A.5.5 0 0 0 1.5 7.5v7a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5"/></svg>',
    news:     '<svg fill="currentColor" viewBox="0 0 16 16"><path d="M5 10.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5m0-2a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5m0-2a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5m0-2a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5"/><path d="M3 0h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2zm10 1H3a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1"/></svg>',
    ogl:      '<svg fill="currentColor" viewBox="0 0 16 16"><path d="M11.5 2v4.793l3.347 7.36a.75.75 0 0 1-.682 1.06H1.835a.75.75 0 0 1-.682-1.06l3.347-7.36V2H4a.5.5 0 0 1 0-1h8a.5.5 0 0 1 0 1zM5.5 2v4.901a.5.5 0 0 1-.045.207L2.434 13.5h11.132l-3.021-6.392a.5.5 0 0 1-.045-.207V2z"/></svg>',
    gallery:  '<svg fill="currentColor" viewBox="0 0 16 16"><path d="M14.002 5.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1 12.45V3a1 1 0 0 1 1-1z"/></svg>',
    pages:    '<svg fill="currentColor" viewBox="0 0 16 16"><path d="M2.5 3A1.5 1.5 0 0 0 1 4.5v.793c.026.009.051.02.076.032L7.674 8.51c.206.1.446.1.652 0l6.598-3.185A.5.5 0 0 1 15 5.293V4.5A1.5 1.5 0 0 0 13.5 3zM15 6.954 8.978 9.86a2.25 2.25 0 0 1-1.956 0L1 6.954V11.5A1.5 1.5 0 0 0 2.5 13h11a1.5 1.5 0 0 0 1.5-1.5z"/></svg>',
    intencje: '<svg fill="currentColor" viewBox="0 0 16 16"><path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5M1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4z"/></svg>',
    sakr:     '<svg fill="currentColor" viewBox="0 0 16 16"><path d="M6 1h6v7l-2-1-2 1V1z"/><path d="M4 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H4zm0 1h8a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1z"/></svg>',
    pogrzeby: '<svg fill="currentColor" viewBox="0 0 16 16"><path d="M7 1h2v4h4v2h-4v8H7V7H3V5h4z"/></svg>',
    cmentarz: '<svg fill="currentColor" viewBox="0 0 16 16"><path d="M7.5 1v1h1V1h-1zm-5 4a.5.5 0 0 0 0 1H4v7H2.5a.5.5 0 0 0 0 1h11a.5.5 0 0 0 0-1H12V6h1.5a.5.5 0 0 0 0-1h-11zm2 1h7v7h-7V6zM8 7.5v1H7v1h1v1h1v-1h1v-1H9v-1H8z"/></svg>',
    person:   '<svg fill="currentColor" viewBox="0 0 16 16"><path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4"/></svg>',
    docs:     '<svg fill="currentColor" viewBox="0 0 16 16"><path d="M2.5 8a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1z"/><path fill-rule="evenodd" d="M5 1a2 2 0 0 0-2 2v2H2a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h1v1a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-1h1a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1V3a2 2 0 0 0-2-2H5zM4 3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2H4V3zm1 5a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1H5zm7-2H4a1 1 0 0 0-1 1v3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1V8a1 1 0 0 0-1-1z"/></svg>',
    settings: '<svg fill="currentColor" viewBox="0 0 16 16"><path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492M5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0"/><path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52z"/></svg>',
  };

  function a(href, icon, label, key) {
    var cls = key === active ? ' class="active"' : '';
    return '<a href="' + href + '"' + cls + '>' + icon + label + '</a>';
  }

  aside.innerHTML =
    '<div class="brand">' +
      '<img src="../public/img/logo1.png" alt="NSPJ" style="width:38px;height:38px;border-radius:50%;object-fit:contain;flex-shrink:0">' +
      '<div class="brand-name">Parafia NSPJ<small>Czerwionka-Leszczyny</small></div>' +
    '</div>' +
    '<nav>' +
      a('index.html',          IC.home,     'Pulpit',                  'index') +
      '<div class="nav-section">Strona WWW</div>' +
      a('aktualnosci.html',    IC.news,     'Aktualności',             'aktualnosci') +
      a('ogloszenia.html',     IC.ogl,      'Ogłoszenia parafialne',   'ogloszenia') +
      a('galeria.html',        IC.gallery,  'Galeria',                 'galeria') +
      a('strony-statyczne.html', IC.pages,  'Strony statyczne',        'strony-statyczne') +
      '<div class="nav-section">Wspólnota</div>' +
      a('intencje.html',       IC.intencje, 'Intencje mszalne',        'intencje') +
      a('sakramenty.html',     IC.sakr,     'Sakramenty',              'sakramenty') +
      a('pogrzeby.html',       IC.pogrzeby,  'Pogrzeby',               'pogrzeby') +
      a('parafianie.html',     IC.person,    'Parafianie',             'parafianie') +
      a('dokumenty.html',      IC.docs,     'Dokumenty',               'dokumenty') +
      '<div class="nav-section">System</div>' +
      '<a href="#" style="display:none">' +
        '<svg fill="currentColor" viewBox="0 0 16 16"><path d="M4 11H2v3h2v-3zm5-4H7v7h2V7zm5-5v12h-2V2h2zm-2-1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1h-2zM6 7a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1H6zM1 11a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1H1z"/></svg>' +
        'Raporty' +
      '</a>' +
      a('ustawienia.html',     IC.settings, 'Ustawienia parafii',      'ustawienia') +
    '</nav>' +
    '<div class="user" id="sidebar-user"></div>';
})();
