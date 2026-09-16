// Wspólne skrypty panelu admina.
// Mobilny przełącznik sidebara (off-canvas przy szerokości <=980px).
(function () {
  function init() {
    var sidebar = document.querySelector('.sidebar');
    var topbar  = document.querySelector('.topbar');
    if (!sidebar || !topbar) return;
    if (topbar.querySelector('.sidebar-toggle')) return; // już dodane

    // Hamburger (widoczny tylko <=980px wg CSS)
    var btn = document.createElement('button');
    btn.className = 'sidebar-toggle';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Menu panelu');
    btn.innerHTML = '<svg width="22" height="22" fill="currentColor" viewBox="0 0 16 16"><path d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z"/></svg>';
    topbar.insertBefore(btn, topbar.firstChild);

    // Tło przyciemniające pod otwartym panelem
    var backdrop = document.createElement('div');
    backdrop.className = 'sidebar-backdrop';
    document.body.appendChild(backdrop);

    function open()   { sidebar.classList.add('open');    backdrop.classList.add('show'); }
    function close()  { sidebar.classList.remove('open'); backdrop.classList.remove('show'); }
    function toggle() { sidebar.classList.contains('open') ? close() : open(); }

    btn.addEventListener('click', toggle);
    backdrop.addEventListener('click', close);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    sidebar.querySelectorAll('nav a').forEach(function (a) { a.addEventListener('click', close); });
    window.addEventListener('resize', function () { if (window.innerWidth > 980) close(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

// ─── Wspólny generator brandowanego raportu PDF (do druku) ───
// Użycie: printBrandedReport({ title, meta, headers:[...], rows:[[...],...], landscape:true })
// Otwiera okno z gotowym, ostylowanym dokumentem w kolorach parafii i wywołuje druk (zapis do PDF).
window.printBrandedReport = function (opts) {
  opts = opts || {};
  var headers = opts.headers || [];
  var rows = opts.rows || [];
  var title = opts.title || 'Raport';
  var meta = opts.meta || '';
  var landscape = opts.landscape !== false; // domyślnie poziomo (szerokie tabele)
  var logo = new URL('../public/img/logo1.png', location.href).href;

  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  var thead = '<tr>' + headers.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr>';
  var tbody = rows.length
    ? rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + esc(c) + '</td>'; }).join('') + '</tr>'; }).join('')
    : '<tr><td colspan="' + (headers.length || 1) + '" style="text-align:center;padding:18px;color:#777">Brak danych</td></tr>';

  var html = '<!doctype html><html lang="pl"><head><meta charset="utf-8"><title>' + esc(title) + '</title><style>'
    + '@page{size:A4 ' + (landscape ? 'landscape' : 'portrait') + ';margin:13mm}'
    + 'body{font-family:Georgia,\'Times New Roman\',serif;color:#2b2520;margin:0;padding:22px}'
    + '.rep-head{display:flex;align-items:center;gap:14px;border-bottom:3px solid #7a1f2b;padding-bottom:12px}'
    + '.rep-head img{height:54px}'
    + '.rep-head .pn{font-size:18px;font-weight:bold;color:#7a1f2b;line-height:1.2}'
    + '.rep-head .pn small{display:block;font-size:11px;letter-spacing:1.5px;color:#b87a4a;text-transform:uppercase;font-weight:normal;margin-top:2px}'
    + 'h2{font-size:16px;margin:14px 0 2px;color:#2b2520}'
    + '.meta{font-size:11px;color:#5a5048;margin-bottom:12px}'
    + 'table{width:100%;border-collapse:collapse;font-size:10.5px}'
    + 'th{background:#7a1f2b;color:#fff;text-align:left;padding:6px 8px;font-weight:bold;border:1px solid #5e1620}'
    + 'td{padding:5px 8px;border:1px solid #d8cdb6;vertical-align:top}'
    + 'tbody tr:nth-child(even){background:#f4ede0}'
    + '.foot{margin-top:16px;border-top:1px solid #d8cdb6;padding-top:8px;font-size:10px;color:#5a5048;display:flex;justify-content:space-between;gap:12px}'
    + '</style></head><body>'
    + '<div class="rep-head"><img src="' + logo + '" alt=""><div class="pn">Parafia Najświętszego Serca Pana Jezusa<small>Czerwionka-Leszczyny</small></div></div>'
    + '<h2>' + esc(title) + '</h2>'
    + (meta ? '<div class="meta">' + esc(meta) + '</div>' : '')
    + '<table><thead>' + thead + '</thead><tbody>' + tbody + '</tbody></table>'
    + '<div class="foot"><span>ul. 3 Maja 36, 44-230 Czerwionka-Leszczyny &middot; tel. 32 43 12 992</span><span>Wygenerowano: ' + new Date().toLocaleDateString('pl-PL') + '</span></div>'
    + '<scr' + 'ipt>window.onload=function(){setTimeout(function(){window.print();},300);window.addEventListener("afterprint",function(){window.close();});};</scr' + 'ipt>'
    + '</body></html>';

  var w = window.open('', '_blank');
  if (!w) { alert('Zezwól na otwieranie okien (pop-up), aby wygenerować PDF.'); return; }
  w.document.write(html);
  w.document.close();
};

// ─── Druk: Zgłoszenie Pogrzebu (jeden rekord) ───
// Przeniesione z admin/pogrzeby.html, żeby moduł Dokumenty mógł wywołać to samo bez duplikacji szablonu.
window.printZgloszeniePogrzebuDoc = function (d) {
  if (!d) return;
  var logoSrc = new URL('../public/img/logo1.png', location.href).href;

  function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function fmtDate(str){
    if(!str) return '';
    var p=str.split('-');
    if(p.length!==3) return str;
    return p[2]+'.'+p[1]+'.'+p[0];
  }
  function v(s){ return esc(s||''); }

  var imieNazwisko = [d.imie,d.nazwisko].filter(Boolean).join(' ');
  var dataUrStr = fmtDate(d.data_urodzenia);
  var dataMiejsce = [dataUrStr, d.miejsce_urodzenia].filter(Boolean).join(', ');
  var today = new Date();
  var todayStr = today.getDate()+'.'+(today.getMonth()+1)+'.'+today.getFullYear();

  var logoHtml = logoSrc
    ? '<img src="'+logoSrc+'" alt="Herb parafii" style="width:58px;height:58px;object-fit:contain;flex-shrink:0">'
    : '<div style="width:58px;height:58px;border:1pt solid #aaa;border-radius:50%;flex-shrink:0"></div>';

  var css =
    '@page{margin:15mm 20mm}'+
    'body{font-family:"Times New Roman",Times,serif;font-size:11.5pt;color:#000;background:#fff;margin:0}'+
    '.wrap{max-width:168mm;margin:0 auto}'+
    '.hdr{display:flex;align-items:center;gap:6mm;border-bottom:1.5pt solid #000;padding-bottom:5mm;margin-bottom:7mm}'+
    '.hdr-logo{flex-shrink:0}'+
    '.hdr-text{flex:1;text-align:center}'+
    '.hdr-text .rz{font-size:8pt;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 2mm}'+
    '.hdr-text .name{font-size:14pt;font-weight:bold;margin:0 0 1.5mm}'+
    '.hdr-text .city{font-size:8.5pt;text-transform:uppercase;letter-spacing:2px;color:#333;margin:0}'+
    '.hdr-spacer{width:58px;flex-shrink:0}'+
    '.doc-title{text-align:center;font-size:15pt;font-weight:bold;text-transform:uppercase;letter-spacing:.5px;margin:6mm 0 8mm;border-bottom:1pt solid #aaa;padding-bottom:4mm}'+
    '.field{display:flex;align-items:flex-end;margin-bottom:6mm}'+
    '.fl{font-size:10pt;min-width:60mm;flex-shrink:0;padding-right:3mm;line-height:1.3}'+
    '.fv{flex:1;border-bottom:1pt solid #555;padding:0 2mm 1mm;font-size:11pt;background:transparent;border-top:none;border-left:none;border-right:none;font-family:"Times New Roman",Times,serif;color:#000;outline:none;box-sizing:border-box}'+
    '.field-pogrzeb{display:flex;align-items:flex-end;margin-bottom:6mm}'+
    '.field-pogrzeb .fl{min-width:60mm}'+
    '.field-pogrzeb .fv-date{border-bottom:1pt solid #555;padding:0 2mm 1mm;font-size:11pt;width:50mm;flex-shrink:0;background:transparent;border-top:none;border-left:none;border-right:none;font-family:"Times New Roman",Times,serif;color:#000;outline:none;box-sizing:border-box}'+
    '.field-pogrzeb .sep{padding:0 4mm 1.5mm;font-size:10pt;flex-shrink:0}'+
    '.field-pogrzeb .fv-godz{border-bottom:1pt solid #555;padding:0 2mm 1mm;font-size:11pt;width:22mm;flex-shrink:0;background:transparent;border-top:none;border-left:none;border-right:none;font-family:"Times New Roman",Times,serif;color:#000;outline:none;box-sizing:border-box}'+
    '.cmt-head{display:flex;align-items:flex-end;margin-bottom:3mm}'+
    '.cmt-grid{display:flex;gap:6mm;margin-bottom:6mm}'+
    '.ci{flex:1}'+
    '.ci .cl{font-size:8.5pt;margin-bottom:1.5mm;color:#333}'+
    '.ci .cv{border-bottom:1pt solid #555;padding:0 2mm 1mm;font-size:11pt;background:transparent;border-top:none;border-left:none;border-right:none;font-family:"Times New Roman",Times,serif;color:#000;outline:none;box-sizing:border-box;width:100%}'+
    '.sig{display:flex;justify-content:space-between;align-items:flex-end;margin-top:15mm}'+
    '.sig-note{font-size:8.5pt;color:#666}'+
    '.sig-r{text-align:center}'+
    '.sig-r .sl{border-top:1pt solid #000;width:68mm;margin-bottom:2mm}'+
    '.sig-r .slb{font-size:8.5pt}'+
    '.print-btn{position:fixed;top:14px;right:14px;background:#7a1f2b;color:#fff;border:none;padding:9px 18px;border-radius:6px;font-size:13px;cursor:pointer;font-family:Arial,sans-serif;box-shadow:0 2px 10px rgba(0,0,0,.3);z-index:999}'+
    '.print-btn:hover{background:#9a2f3b}'+
    '@media print{.print-btn{display:none!important}}';

  var html =
    '<!DOCTYPE html><html lang="pl"><head><meta charset="utf-8">'+
    '<title>Zgłoszenie Pogrzebu - '+v(imieNazwisko)+'</title>'+
    '<style>'+css+'</style></head><body>'+
    '<button class="print-btn" onclick="window.print()">🖨️ Drukuj / PDF</button>'+
    '<div class="wrap">'+
    '<div class="hdr">'+
      '<div class="hdr-logo">'+logoHtml+'</div>'+
      '<div class="hdr-text">'+
        '<p class="rz">Parafia Rzymskokatolicka</p>'+
        '<p class="name">Najświętszego Serca Pana Jezusa</p>'+
        '<p class="city">Czerwionka-Leszczyny</p>'+
      '</div>'+
      '<div class="hdr-spacer"></div>'+
    '</div>'+
    '<div class="doc-title">Zgłoszenie Pogrzebu</div>'+
    '<div class="field"><div class="fl">Nazwisko i Imię</div><input type="text" class="fv" value="'+v(imieNazwisko)+'"></div>'+
    '<div class="field"><div class="fl">Data Zgonu</div><input type="text" class="fv" value="'+v(fmtDate(d.data_zgonu))+'"></div>'+
    '<div class="field-pogrzeb">'+
      '<div class="fl">Data Pogrzebu</div>'+
      '<input type="text" class="fv-date" value="'+v(fmtDate(d.data_pogrzebu))+'">'+
      '<div class="sep">godz.</div>'+
      '<input type="text" class="fv-godz" value="'+v(d.godz_pogrzebu)+'">'+
    '</div>'+
    '<div class="field"><div class="fl">Miejsce Ceremonii</div><input type="text" class="fv" value="'+v(d.miejsce_ceremonii)+'"></div>'+
    '<div class="field"><div class="fl">Miejsce zamieszkania</div><input type="text" class="fv" value="'+v(d.miejsce_zam)+'"></div>'+
    '<div class="field"><div class="fl">Data i miejsce urodzenia</div><input type="text" class="fv" value="'+v(dataMiejsce)+'"></div>'+
    '<div class="field"><div class="fl">Rodzice zmarłego/ej</div><input type="text" class="fv" value="'+v(d.rodzice)+'"></div>'+
    '<div class="cmt-head"><div class="fl">Cmentarz</div><input type="text" class="fv" style="flex:1" value="'+v(d.cmentarz)+'"></div>'+
    '<div class="cmt-grid">'+
      '<div class="ci"><div class="cl">Sektor</div><input type="text" class="cv" value="'+v(d.sektor)+'"></div>'+
      '<div class="ci"><div class="cl">Rząd</div><input type="text" class="cv" value="'+v(d.rzad)+'"></div>'+
      '<div class="ci"><div class="cl">Miejsce grobu</div><input type="text" class="cv" value="'+v(d.miejsce_grobu)+'"></div>'+
    '</div>'+
    '<div class="field"><div class="fl">Kto odprawił</div><input type="text" class="fv" value="'+v(d.ksiadz)+'"></div>'+
    '<div class="sig">'+
      '<div class="sig-note">Wygenerowano: '+todayStr+'</div>'+
      '<div class="sig-r"><div class="sl"></div><div class="slb">Proboszcz</div></div>'+
    '</div>'+
    '</div>'+
    '</body></html>';

  var w = window.open('','_blank','width=820,height=900,scrollbars=yes');
  if(w){w.document.open();w.document.write(html);w.document.close();}
  else{alert('Zablokowano otwieranie okna. Zezwól na pop-upy dla tej strony.');}
};

// ─── Druk: Świadectwo Chrztu (jeden rekord) ───
// Przeniesione z admin/sakramenty.html, żeby moduł Dokumenty mógł wywołać to samo bez duplikacji szablonu.
window.printSwiadectwoChrztuDoc = function (d) {
  if (!d) return;
  var logoSrc = new URL('../public/img/logo1.png', location.href).href;

  function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
  function fmtD(str){if(!str)return'';var p=str.split('-');if(p.length!==3)return str;return p[2]+'.'+p[1]+'.'+p[0];}
  function v(s){return esc(s||'');}
  function dotLine(val,width){
    return '<input type="text" style="border-bottom:1.2pt dotted #555;border-top:none;border-left:none;border-right:none;display:inline-block;min-width:'+width+';padding:0 2mm 1mm;font-size:11pt;background:transparent;font-family:\'Times New Roman\',Times,serif;color:#000;outline:none;box-sizing:border-box" value="'+esc(val)+'">';
  }

  var ksiegaRef='';
  if(d.ksiega_rok||d.ksiega_nr){
    ksiegaRef=[d.ksiega_rok?'rok '+d.ksiega_rok:'',d.ksiega_str?'str. '+d.ksiega_str:'',d.ksiega_nr?'nr '+d.ksiega_nr:''].filter(Boolean).join(', ');
  }

  var today=new Date();
  var todayStr=today.getDate()+'.'+(today.getMonth()+1)+'.'+today.getFullYear();
  var miejsceData='Czerwionka-Leszczyny, '+todayStr;

  var css=
    '@page{size:A4 landscape;margin:7mm 10mm}'+
    'body{font-family:"Times New Roman",Times,serif;font-size:9pt;color:#000;background:#fff;margin:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}'+
    '.cert{width:100%;box-sizing:border-box;border:2.5pt double #7a1f2b;padding:0}'+
    '.cert-inner{border:1pt solid #b87a4a;margin:2.5pt;padding:4mm 6mm 3.5mm}'+
    '.cert-head{display:flex;align-items:flex-start;gap:5mm;margin-bottom:3mm;padding-bottom:2.5mm;border-bottom:1pt solid #7a1f2b}'+
    '.seal-box{flex-shrink:0;width:30mm;min-height:26mm;border:1pt solid #aaa;border-radius:3pt;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2mm;padding:2mm;text-align:center}'+
    '.seal-box img{width:28px;height:28px;object-fit:contain}'+
    '.seal-box small{font-size:6.5pt;color:#888;letter-spacing:.3px}'+
    '.title-block{flex:1}'+
    '.title-block .main-title{font-family:Georgia,"Times New Roman",serif;font-size:16pt;font-weight:bold;letter-spacing:.8px;color:#7a1f2b;line-height:1;margin-bottom:1mm}'+
    '.title-block .subtitle{font-size:7pt;color:#555;font-style:italic;margin-bottom:2.5mm;line-height:1.3}'+
    '.title-block .ksiega-row{font-size:8.5pt;display:flex;align-items:baseline;gap:2mm}'+
    '.title-block .ksiega-row span{font-weight:bold}'+
    '.fields{margin-top:0}'+
    '.frow{display:flex;align-items:baseline;margin-bottom:2.5mm;gap:2mm}'+
    '.fnum{font-size:9pt;font-weight:bold;min-width:5.5mm;flex-shrink:0}'+
    '.fcontent{flex:1}'+
    '.flabel{font-size:9pt;font-weight:bold;display:inline}'+
    '.fsub{font-size:6pt;color:#666;font-style:italic;display:block;margin-top:.3mm;line-height:1.2}'+
    '.fval{display:block;margin-top:1mm}'+
    '.wyznanie-block{flex-shrink:0;min-width:33mm}'+
    '.wyznanie-block .flabel{font-size:8.5pt}'+
    '.cert-footer{margin-top:3mm;padding-top:2.5mm;border-top:1pt solid #7a1f2b;display:flex;align-items:flex-end;gap:5mm}'+
    '.footer-confirm{flex:1;font-size:7pt;font-style:italic;color:#333;line-height:1.3}'+
    '.footer-confirm strong{font-size:8.5pt;font-style:normal;font-weight:bold;color:#000}'+
    '.footer-miejsce{flex:1}'+
    '.footer-miejsce .lbl{font-size:8pt;font-weight:bold}'+
    '.footer-ls{flex-shrink:0;width:22mm;height:22mm;border:1pt solid #aaa;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:8pt;color:#aaa;font-style:italic}'+
    '.footer-sig{flex:1;text-align:center}'+
    '.footer-sig .sig-line{border-top:1pt solid #000;margin:0 auto 1.5mm;width:50mm}'+
    '.footer-sig .sig-lbl{font-size:7.5pt}'+
    '.print-btn{position:fixed;top:14px;right:14px;background:#7a1f2b;color:#fff;border:none;padding:9px 18px;border-radius:6px;font-size:13px;cursor:pointer;font-family:Arial,sans-serif;box-shadow:0 2px 10px rgba(0,0,0,.3);z-index:999}'+
    '@media print{.print-btn{display:none!important}}';

  var html=
    '<!DOCTYPE html><html lang="pl"><head><meta charset="utf-8">'+
    '<title>Świadectwo Chrztu - '+v(d.imie)+' '+v(d.nazwisko)+'</title>'+
    '<style>'+css+'</style></head><body>'+
    '<button class="print-btn" onclick="window.print()">🖨️ Drukuj / PDF</button>'+
    '<div class="cert"><div class="cert-inner">'+
    '<div class="cert-head">'+
      '<div class="seal-box">'+
        '<img src="'+esc(logoSrc)+'" alt="herb">'+
        '<small>Pieczęć parafii</small>'+
      '</div>'+
      '<div class="title-block">'+
        '<div class="main-title">ŚWIADECTWO CHRZTU</div>'+
        '<div class="subtitle">Testimonium baptismi&nbsp;/&nbsp;Certificate of Baptism&nbsp;/&nbsp;Taufzeugnis</div>'+
        '<div class="ksiega-row">'+
          '<span>Rok i numer w księdze chrztów</span>'+
          dotLine(ksiegaRef,'90mm')+
        '</div>'+
      '</div>'+
    '</div>'+
    '<div class="fields">'+
    '<div class="frow">'+
      '<div class="fnum">1.</div>'+
      '<div class="fcontent" style="flex:1">'+
        '<span class="flabel">Imię i nazwisko</span>'+
        '<span class="fsub">Nomen, cognomen&nbsp;/&nbsp;First and last name&nbsp;/&nbsp;Vorname(n), Name</span>'+
        '<div class="fval">'+dotLine(d.imie&&d.nazwisko?d.imie+' '+d.nazwisko:'','200mm')+'</div>'+
      '</div>'+
    '</div>'+
    '<div class="frow" style="align-items:flex-start;gap:2mm">'+
      '<div class="fnum">2.</div>'+
      '<div class="fcontent" style="flex:2">'+
        '<span class="flabel">Imię ojca</span>'+
        '<span class="fsub">Nomen patris&nbsp;/&nbsp;Father\'s name&nbsp;/&nbsp;Name des Vaters</span>'+
        '<div class="fval">'+dotLine([d.imie_ojca,d.nazwisko_ojca].filter(Boolean).join(' '),'100mm')+'</div>'+
      '</div>'+
      '<div class="wyznanie-block">'+
        '<span class="flabel" style="font-size:8.5pt">wyznanie</span>'+
        '<span class="fsub">religio&nbsp;/&nbsp;religion&nbsp;/&nbsp;Konfession</span>'+
        '<div class="fval">'+dotLine('','33mm')+'</div>'+
      '</div>'+
    '</div>'+
    '<div class="frow" style="align-items:flex-start;gap:2mm">'+
      '<div class="fnum">3.</div>'+
      '<div class="fcontent" style="flex:1.4">'+
        '<span class="flabel">Imię matki</span>'+
        '<span class="fsub">Nomen matris&nbsp;/&nbsp;Mother\'s name&nbsp;/&nbsp;Name der Mutter</span>'+
        '<div class="fval">'+dotLine(v(d.imie_matki),'65mm')+'</div>'+
      '</div>'+
      '<div style="flex-shrink:0">'+
        '<span class="flabel" style="font-size:8.5pt">z domu</span>'+
        '<span class="fsub">nata&nbsp;/&nbsp;née&nbsp;/&nbsp;Geburtsname</span>'+
        '<div class="fval">'+dotLine(v(d.nazwisko_matki),'45mm')+'</div>'+
      '</div>'+
      '<div class="wyznanie-block">'+
        '<span class="flabel" style="font-size:8.5pt">wyznanie</span>'+
        '<span class="fsub">religio&nbsp;/&nbsp;religion&nbsp;/&nbsp;Konfession</span>'+
        '<div class="fval">'+dotLine('','33mm')+'</div>'+
      '</div>'+
    '</div>'+
    '<div class="frow">'+
      '<div class="fnum">4.</div>'+
      '<div class="fcontent">'+
        '<span class="flabel">Data i miejsce urodzenia</span>'+
        '<span class="fsub">Dies et locus nativitatis&nbsp;/&nbsp;Date and place of birth&nbsp;/&nbsp;Geburts Datum und Geburts Ort</span>'+
        '<div class="fval">'+dotLine(fmtD(d.dataurodzenia),'200mm')+'</div>'+
      '</div>'+
    '</div>'+
    '<div class="frow">'+
      '<div class="fnum">5.</div>'+
      '<div class="fcontent">'+
        '<span class="flabel">Data i miejsce chrztu</span>'+
        '<span class="fsub">Dies et locus baptismi&nbsp;/&nbsp;Date and place of Baptism&nbsp;/&nbsp;Tauf Datum und Tauf Ort</span>'+
        '<div class="fval">'+dotLine(fmtD(d.datachrztu)+(d.datachrztu?' · Parafia Najświętszego Serca Pana Jezusa, Czerwionka-Leszczyny':''),'200mm')+'</div>'+
      '</div>'+
    '</div>'+
    '<div class="frow">'+
      '<div class="fnum">6.</div>'+
      '<div class="fcontent">'+
        '<span class="flabel">Data i parafia bierzmowania</span>'+
        '<span class="fsub">Dies et parochia confirmationis&nbsp;/&nbsp;Date and parish of Confirmation&nbsp;/&nbsp;Firmung (Datum und Pfarrei)</span>'+
        '<div class="fval">'+dotLine('','200mm')+'</div>'+
      '</div>'+
    '</div>'+
    '<div class="frow" style="margin-bottom:0">'+
      '<div class="fnum">7.</div>'+
      '<div class="fcontent">'+
        '<span class="flabel">Uwagi w księdze chrztów</span>'+
        '<span class="fsub">Adnotationes in libro bapt.&nbsp;/&nbsp;Notes in the Register of Baptisms&nbsp;/&nbsp;Bemerkungen</span>'+
        '<div class="fval">'+dotLine(v(d.uwagi),'200mm')+'</div>'+
      '</div>'+
    '</div>'+
    '</div>'+
    '<div class="cert-footer">'+
      '<div class="footer-miejsce">'+
        '<div class="lbl">Miejsce i data</div>'+
        '<div style="font-size:7.5pt;color:#666;font-style:italic;margin-bottom:1mm">Locus et dies&nbsp;/&nbsp;The place and date&nbsp;/&nbsp;Ort, Datum</div>'+
        dotLine(miejsceData,'70mm')+
      '</div>'+
      '<div class="footer-confirm">'+
        '<strong>Potwierdzam zgodność z księgą chrztów</strong><br>'+
        '<em>Concordat cum libro baptisatorum&nbsp;/&nbsp;I confirm that the information is in accordance with the Register of Baptisms&nbsp;/&nbsp;Ich bestätige die Übereinstimmung mit dem Taufbuch</em>'+
      '</div>'+
      '<div class="footer-ls">( L.S. )</div>'+
      '<div class="footer-sig">'+
        '<div class="sig-line"></div>'+
        '<div class="sig-lbl">Proboszcz&nbsp;/&nbsp;Parochus&nbsp;/&nbsp;Parish priest&nbsp;/&nbsp;Pfarrer</div>'+
      '</div>'+
    '</div>'+
    '</div></div>'+
    '</body></html>';

  var w=window.open('','_blank','width=1000,height=750,scrollbars=yes');
  if(w){w.document.open();w.document.write(html);w.document.close();}
  else{alert('Zablokowano otwieranie okna. Zezwól na pop-upy dla tej strony.');}
};

// ─── Flatpickr — przyjazny wybór dat w całym panelu admina ───
(function () {
  var FP_OPTS = {
    dateFormat: 'Y-m-d',
    altInput: true,
    altFormat: 'd.m.Y',
    allowInput: true,
    locale: 'pl'
  };

  function initEl(el) {
    if (!el || el._flatpickr || el.classList.contains('flatpickr-input')) return;
    flatpickr(el, FP_OPTS);
  }

  window.fpSync = function () {
    if (typeof flatpickr === 'undefined') return;
    // Inicjalizuj nowe pola (jeszcze type="date", bez klasy flatpickr-input)
    document.querySelectorAll('input[type="date"]:not(.flatpickr-input)').forEach(initEl);
    // Po inicjalizacji flatpickr zmienia type na "hidden" — szukamy po klasie
    document.querySelectorAll('.flatpickr-input').forEach(function (el) {
      if (!el._flatpickr) return; // altInput nie ma _flatpickr, pomijamy
      var v = el.value;
      if (v) el._flatpickr.setDate(v, false);
      else el._flatpickr.clear(false);
    });
  };

  function initAll() {
    document.querySelectorAll('input[type="date"]').forEach(initEl);
  }

  var css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = 'https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css';
  document.head.appendChild(css);

  var js = document.createElement('script');
  js.src = 'https://cdn.jsdelivr.net/npm/flatpickr';
  js.onload = function () {
    var loc = document.createElement('script');
    loc.src = 'https://cdn.jsdelivr.net/npm/flatpickr/dist/l10n/pl.js';
    loc.onload = function () {
      flatpickr.localize(flatpickr.l10ns.pl);
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAll);
      } else {
        initAll();
      }
    };
    document.head.appendChild(loc);
  };
  document.head.appendChild(js);
})();
