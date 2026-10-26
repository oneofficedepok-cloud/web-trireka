// Panel admin Trireka: editor isi website berbasis skema, pesan masuk RFQ, galeri, dan akun.
(function () {
  'use strict';

  var CSRF = window.ADMIN.csrf;
  var C = null;          // isi website yang sedang diedit
  var DEF = null;        // isi bawaan (untuk reset)
  var dirty = false;
  var view = document.getElementById('view');
  var nav = document.getElementById('nav');
  var saveBtn = document.getElementById('saveBtn');
  var saveMsg = document.getElementById('saveMsg');
  var pageTitle = document.getElementById('pageTitle');

  var ICONS = [
    ['bracket', 'Bracket / pelat'], ['beam', 'Balok / rangka'], ['mold', 'Mold / cetakan'],
    ['impeller', 'Impeller / part bulat'], ['jig', 'Jig / fixture'], ['motion', 'Mekanisme / motion']
  ];

  var simTab = function (k, name) {
    return [
      { heading: name },
      { path: 'sim.' + k + '.tab', label: 'Nama tab' },
      { path: 'sim.' + k + '.id', label: 'Kode di pojok kanan atas' },
      { path: 'sim.' + k + '.l1', label: 'Label angka 1' },
      { path: 'sim.' + k + '.l2', label: 'Label angka 2' },
      { path: 'sim.' + k + '.l3', label: 'Label angka 3' },
      { path: 'sim.' + k + '.cap', label: 'Keterangan di bawah grafik', type: 'textarea' }
    ];
  };

  var SECTIONS = [
    { key: 'umum', title: 'Umum & Kontak', intro: 'Nama website, kontak, dan teks menu. Nomor HP dipakai untuk tombol WhatsApp di seluruh website.', fields: [
      { path: 'site.name', label: 'Nama website' },
      { path: 'site.description', label: 'Deskripsi singkat (muncul di Google & saat link dibagikan)', type: 'textarea' },
      { path: 'site.logo', label: 'Logo pengganti (opsional)', type: 'image', help: 'Kosongkan untuk memakai logo Trireka Presisi bawaan (otomatis menyesuaikan mode gelap).' },
      { heading: 'Kontak' },
      { path: 'contact.phone', label: 'No. HP / WhatsApp', help: 'Tulis seperti biasa, misalnya 087769725965. Link WhatsApp dibuat otomatis.' },
      { path: 'contact.wa_message', label: 'Pesan awal saat pengunjung klik WhatsApp', type: 'textarea' },
      { path: 'contact.wa_button', label: 'Teks tombol WhatsApp melayang' },
      { path: 'contact.email', label: 'Email' },
      { path: 'contact.location', label: 'Lokasi' },
      { path: 'contact.notify_email', label: 'Kirim notifikasi RFQ ke email (opsional)', help: 'Isi email Anda jika ingin dapat email setiap ada permintaan penawaran baru. Bergantung pada fitur email hosting.' },
      { heading: 'Menu atas' },
      { path: 'site.nav_services', label: 'Menu Layanan' },
      { path: 'site.nav_portfolio', label: 'Menu Portofolio' },
      { path: 'site.nav_process', label: 'Menu Alur Kerja' },
      { path: 'site.nav_clients', label: 'Menu Klien' },
      { path: 'site.nav_cta', label: 'Tombol kanan atas' },
      { heading: 'Kaki halaman' },
      { path: 'footer.text', label: 'Teks hak cipta', help: '{tahun} otomatis diganti tahun berjalan.' }
    ] },
    { key: 'hero', title: 'Bagian Utama', intro: 'Bagian paling atas website, di samping gambar kerja flens.', fields: [
      { path: 'hero.label', label: 'Label kecil di atas judul' },
      { path: 'hero.title_before', label: 'Judul: bagian awal' },
      { path: 'hero.title_em', label: 'Judul: bagian berwarna hijau' },
      { path: 'hero.title_after', label: 'Judul: bagian akhir' },
      { path: 'hero.lead', label: 'Paragraf pembuka', type: 'textarea' },
      { path: 'hero.cta_primary', label: 'Tombol utama' },
      { path: 'hero.cta_secondary', label: 'Tombol kedua' },
      { path: 'hero.meta', label: 'Poin singkat di bawah tombol', type: 'repeater', itemLabel: 'bold', fields: [
        { key: 'bold', label: 'Kata tebal' }, { key: 'text', label: 'Lanjutan' }
      ] },
      { heading: 'Kotak keterangan gambar' },
      { path: 'hero.tb_part', label: 'Nama part' },
      { path: 'hero.tb_material', label: 'Material' },
      { path: 'hero.tb_scale', label: 'Skala' }
    ] },
    { key: 'tools', title: 'Software & Format', intro: 'Strip di bawah bagian utama.', fields: [
      { path: 'tools.label', label: 'Label' },
      { path: 'tools.software', label: 'Software', type: 'list' },
      { path: 'tools.formats', label: 'Format file yang diserahkan', type: 'list' }
    ] },
    { key: 'services', title: 'Layanan', fields: [
      { path: 'services.visible', label: 'Tampilkan bagian ini', type: 'bool' },
      { path: 'services.title', label: 'Judul' },
      { path: 'services.text', label: 'Paragraf', type: 'textarea' },
      { path: 'services.items', label: 'Daftar layanan', type: 'repeater', itemLabel: 'title', fields: [
        { key: 'code', label: 'Kode (mis. LYN-01)' },
        { key: 'title', label: 'Nama layanan' },
        { key: 'text', label: 'Deskripsi', type: 'textarea' },
        { key: 'specs', label: 'Spesifikasi', type: 'repeater', itemLabel: 'k', fields: [
          { key: 'k', label: 'Label (mis. Output)' }, { key: 'v', label: 'Isi (mis. IPT, STEP)' }
        ] }
      ] }
    ] },
    { key: 'portfolio', title: 'Portofolio', intro: 'Tambahkan proyek nyata Anda di sini. Foto/render bisa diunggah langsung.', fields: [
      { path: 'portfolio.visible', label: 'Tampilkan bagian ini', type: 'bool' },
      { path: 'portfolio.title', label: 'Judul' },
      { path: 'portfolio.text', label: 'Paragraf', type: 'textarea' },
      { path: 'portfolio.categories', label: 'Kategori filter', type: 'list', help: 'Setiap proyek dipilihkan salah satu kategori ini.' },
      { path: 'portfolio.all_label', label: 'Teks filter "semua"' },
      { path: 'portfolio.items', label: 'Proyek', type: 'repeater', itemLabel: 'title', fields: [
        { key: 'title', label: 'Judul proyek' },
        { key: 'text', label: 'Deskripsi singkat', type: 'textarea' },
        { key: 'category', label: 'Kategori', type: 'select', optionsFrom: 'portfolio.categories' },
        { key: 'tag', label: 'Label di pojok gambar' },
        { key: 'client', label: 'Jenis klien' },
        { key: 'software', label: 'Software' },
        { key: 'image', label: 'Foto / render', type: 'image', help: 'Rasio 4:3 paling pas. Jika kosong, dipakai ikon garis di bawah.' },
        { key: 'icon', label: 'Ikon garis (jika tanpa foto)', type: 'select', options: ICONS }
      ] },
      { path: 'portfolio.note', label: 'Catatan kecil di bawah portofolio', help: 'Kosongkan untuk menyembunyikan.' }
    ] },
    { key: 'process', title: 'Alur Kerja', fields: [
      { path: 'process.visible', label: 'Tampilkan bagian ini', type: 'bool' },
      { path: 'process.title', label: 'Judul' },
      { path: 'process.text', label: 'Paragraf', type: 'textarea' },
      { path: 'process.steps', label: 'Langkah (nomor dibuat otomatis)', type: 'repeater', itemLabel: 'title', fields: [
        { key: 'title', label: 'Judul langkah' }, { key: 'text', label: 'Penjelasan', type: 'textarea' }
      ] }
    ] },
    { key: 'clients', title: 'Klien', fields: [
      { path: 'clients.visible', label: 'Tampilkan bagian ini', type: 'bool' },
      { path: 'clients.title', label: 'Judul' },
      { path: 'clients.items', label: 'Jenis klien', type: 'repeater', itemLabel: 'title', fields: [
        { key: 'title', label: 'Jenis klien' }, { key: 'text', label: 'Penjelasan', type: 'textarea' }
      ] }
    ] },
    { key: 'sim', title: 'Animasi Simulasi', intro: 'Blok animasi bertab (FEM, Motion, Assembly) di samping daftar klien. Gerak animasinya tetap; teksnya bisa diubah.', fields: [
      { path: 'sim.visible', label: 'Tampilkan blok animasi', type: 'bool' },
      { path: 'sim.pause', label: 'Teks tombol jeda' },
      { path: 'sim.play', label: 'Teks tombol putar' }
    ].concat(simTab('fem', 'Tab 1: FEM'), simTab('motion', 'Tab 2: Motion'), simTab('asm', 'Tab 3: Assembly')) },
    { key: 'rfq', title: 'Formulir Penawaran', fields: [
      { path: 'rfq.visible', label: 'Tampilkan formulir', type: 'bool' },
      { path: 'rfq.label', label: 'Label kecil' },
      { path: 'rfq.title', label: 'Judul' },
      { path: 'rfq.text', label: 'Paragraf', type: 'textarea' },
      { path: 'rfq.services', label: 'Pilihan layanan di formulir', type: 'list' },
      { path: 'rfq.upload_hint', label: 'Keterangan jenis lampiran' },
      { path: 'rfq.max_mb', label: 'Batas total lampiran (MB)', help: 'Juga dibatasi oleh pengaturan hosting (upload_max_filesize & post_max_size).' },
      { path: 'rfq.submit', label: 'Teks tombol kirim' },
      { path: 'rfq.success', label: 'Pesan setelah terkirim', type: 'textarea' }
    ] },
    { key: 'inbox', title: 'Pesan Masuk', custom: renderInbox },
    { key: 'media', title: 'Galeri Gambar', custom: renderMedia },
    { key: 'akun', title: 'Akun & Cadangan', custom: renderAccount }
  ];

  /* ---------- util ---------- */

  function h(tag, attrs, kids) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    });
    [].concat(kids || []).forEach(function (c) {
      if (c == null || c === false) return;
      el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return el;
  }
  function get(path) { return path.split('.').reduce(function (o, k) { return o == null ? o : o[k]; }, C); }
  function set(path, val) {
    var ks = path.split('.'), o = C;
    for (var i = 0; i < ks.length - 1; i++) o = o[ks[i]];
    o[ks[ks.length - 1]] = val;
    markDirty();
  }
  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function api(action, opts) {
    opts = opts || {};
    var init = { method: opts.body !== undefined || opts.form ? 'POST' : 'GET', headers: { 'X-CSRF': CSRF }, credentials: 'same-origin' };
    if (opts.form) init.body = opts.form;
    else if (opts.body !== undefined) { init.body = JSON.stringify(opts.body); init.headers['Content-Type'] = 'application/json'; }
    return fetch('api.php?action=' + action, init).then(function (r) {
      return r.json().catch(function () { return { ok: false, error: 'Respons server tidak valid (' + r.status + ').' }; }).then(function (j) {
        if (r.status === 401) { alert(j.error || 'Sesi berakhir.'); location.reload(); }
        if (!j.ok) throw new Error(j.error || 'Gagal.');
        return j;
      });
    });
  }
  function markDirty() {
    dirty = true; saveBtn.disabled = false; saveMsg.textContent = 'Ada perubahan yang belum disimpan';
  }
  function fmtSize(b) { return b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB'; }
  function fmtDate(s) {
    try { return new Date(s).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }); } catch (e) { return s; }
  }
  function waLink(num) {
    var d = String(num || '').replace(/\D+/g, '');
    if (d[0] === '0') d = '62' + d.slice(1); else if (d[0] === '8') d = '62' + d;
    return 'https://wa.me/' + d;
  }

  /* ---------- editor field ---------- */

  function emptyLike(fields) {
    var o = {};
    fields.forEach(function (f) {
      if (f.type === 'repeater') o[f.key] = [];
      else if (f.type === 'bool') o[f.key] = false;
      else if (f.type === 'select' && f.options) o[f.key] = f.options[0][0];
      else if (f.type === 'select' && f.optionsFrom) o[f.key] = (get(f.optionsFrom) || [])[0] || '';
      else o[f.key] = '';
    });
    return o;
  }

  function field(def, value, onChange) {
    var id = 'f' + Math.random().toString(36).slice(2, 9);
    var help = def.help ? h('small', { class: 'help', text: def.help }) : null;
    var type = def.type || 'text';

    if (type === 'bool') {
      var cb = h('input', { type: 'checkbox', id: id, onchange: function () { onChange(cb.checked); } });
      cb.checked = !!value;
      return h('div', { class: 'field bool' }, [h('label', { for: id }, [cb, ' ' + def.label]), help]);
    }

    if (type === 'textarea' || type === 'text') {
      var inp = type === 'textarea'
        ? h('textarea', { id: id, rows: 3 })
        : h('input', { type: 'text', id: id });
      inp.value = value == null ? '' : value;
      inp.addEventListener('input', function () { onChange(inp.value); });
      return h('div', { class: 'field' }, [h('label', { for: id, text: def.label }), inp, help]);
    }

    if (type === 'select') {
      var opts = def.options || (get(def.optionsFrom) || []).map(function (s) { return [s, s]; });
      var sel = h('select', { id: id, onchange: function () { onChange(sel.value); } },
        opts.map(function (o) { return h('option', { value: o[0], text: o[1] }); }));
      if (value && !opts.some(function (o) { return o[0] === value; })) sel.appendChild(h('option', { value: value, text: value + ' (tidak ada di daftar)' }));
      if (!value) sel.insertBefore(h('option', { value: '', text: '(pilih)' }), sel.firstChild);
      sel.value = value || '';
      return h('div', { class: 'field' }, [h('label', { for: id, text: def.label }), sel, help]);
    }

    if (type === 'image') {
      var wrap = h('div', { class: 'field image' });
      var draw = function (v) {
        wrap.innerHTML = '';
        var path = h('input', { type: 'text', id: id, placeholder: 'uploads/nama-file.jpg' });
        path.value = v || '';
        path.addEventListener('change', function () { onChange(path.value.trim()); draw(path.value.trim()); });
        var file = h('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp,image/gif', hidden: true });
        var status = h('small', { class: 'help' });
        file.addEventListener('change', function () {
          if (!file.files[0]) return;
          var fd = new FormData(); fd.append('file', file.files[0]);
          status.textContent = 'Mengunggah…';
          api('upload', { form: fd }).then(function (j) { onChange(j.path); draw(j.path); })
            .catch(function (e) { status.textContent = e.message; });
        });
        wrap.appendChild(h('label', { for: id, text: def.label }));
        wrap.appendChild(h('div', { class: 'img-row' }, [
          h('div', { class: 'img-prev' }, v ? h('img', { src: /^https?:/i.test(v) ? v : '../' + v, alt: '' }) : h('span', { class: 'muted small', text: 'Belum ada gambar' })),
          h('div', { class: 'img-ctl' }, [
            h('div', { class: 'row' }, [
              h('button', { type: 'button', class: 'btn', text: 'Unggah gambar', onclick: function () { file.click(); } }),
              h('button', { type: 'button', class: 'btn ghost', text: 'Pilih dari galeri', onclick: function () { pickMedia(function (p) { onChange(p); draw(p); }); } }),
              v ? h('button', { type: 'button', class: 'btn ghost danger', text: 'Kosongkan', onclick: function () { onChange(''); draw(''); } }) : null
            ]),
            path, file, status
          ])
        ]));
        if (def.help) wrap.appendChild(h('small', { class: 'help', text: def.help }));
      };
      draw(value);
      return wrap;
    }

    if (type === 'list') {
      var box = h('div', { class: 'field list' });
      var arr = value || [];
      var drawList = function () {
        box.innerHTML = '';
        box.appendChild(h('label', { text: def.label }));
        var ul = h('div', { class: 'list-items' });
        arr.forEach(function (s, i) {
          var inp = h('input', { type: 'text', 'aria-label': def.label + ' ' + (i + 1) });
          inp.value = s;
          inp.addEventListener('input', function () { arr[i] = inp.value; onChange(arr); });
          ul.appendChild(h('div', { class: 'list-row' }, [inp].concat(moveButtons(arr, i, function () { onChange(arr); drawList(); }))));
        });
        box.appendChild(ul);
        box.appendChild(h('button', { type: 'button', class: 'btn ghost add', text: '+ Tambah', onclick: function () { arr.push(''); onChange(arr); drawList(); var l = box.querySelectorAll('input'); l[l.length - 1].focus(); } }));
        if (help) box.appendChild(help);
      };
      drawList();
      return box;
    }

    if (type === 'repeater') {
      var rbox = h('div', { class: 'field repeater' });
      var items = value || [];
      var open = {};
      var drawRep = function () {
        rbox.innerHTML = '';
        rbox.appendChild(h('div', { class: 'rep-head' }, [h('label', { text: def.label }), h('span', { class: 'muted small', text: items.length + ' item' })]));
        items.forEach(function (it, i) {
          var title = (it[def.itemLabel] || '').trim() || '(tanpa judul)';
          var body = h('div', { class: 'rep-body', hidden: !open[i] });
          def.fields.forEach(function (sub) {
            body.appendChild(field(sub, it[sub.key], function (val) {
              it[sub.key] = val; onChange(items);
              if (sub.key === def.itemLabel) head.querySelector('.rep-title').textContent = (val || '').trim() || '(tanpa judul)';
            }));
          });
          var head = h('div', { class: 'rep-item-head' }, [
            h('button', { type: 'button', class: 'rep-toggle', 'aria-expanded': open[i] ? 'true' : 'false', onclick: function () {
              open[i] = !open[i]; body.hidden = !open[i]; this.setAttribute('aria-expanded', String(!!open[i]));
            } }, [h('span', { class: 'rep-num', text: String(i + 1) }), h('span', { class: 'rep-title', text: title })])
          ].concat(moveButtons(items, i, function (to) {
            if (to < 0) open = {}; else { var o = open[i]; open[i] = open[to]; open[to] = o; }
            onChange(items); drawRep();
          })));
          rbox.appendChild(h('div', { class: 'rep-item' }, [head, body]));
        });
        rbox.appendChild(h('button', { type: 'button', class: 'btn ghost add', text: '+ Tambah item', onclick: function () {
          items.push(emptyLike(def.fields)); open[items.length - 1] = true; onChange(items); drawRep();
        } }));
        if (help) rbox.appendChild(help);
      };
      drawRep();
      return rbox;
    }
    return h('div');
  }

  function moveButtons(arr, i, after) {
    return [
      h('button', { type: 'button', class: 'icon', title: 'Naik', 'aria-label': 'Naikkan', disabled: i === 0, onclick: function () { var t = arr[i - 1]; arr[i - 1] = arr[i]; arr[i] = t; after(i - 1); } }, '↑'),
      h('button', { type: 'button', class: 'icon', title: 'Turun', 'aria-label': 'Turunkan', disabled: i === arr.length - 1, onclick: function () { var t = arr[i + 1]; arr[i + 1] = arr[i]; arr[i] = t; after(i + 1); } }, '↓'),
      h('button', { type: 'button', class: 'icon danger', title: 'Hapus', 'aria-label': 'Hapus', onclick: function () { if (confirm('Hapus item ini?')) { arr.splice(i, 1); after(-1); } } }, '✕')
    ];
  }

  /* ---------- halaman ---------- */

  function renderSection(sec) {
    var card = h('div', { class: 'card' });
    if (sec.intro) card.appendChild(h('p', { class: 'intro', text: sec.intro }));
    sec.fields.forEach(function (f) {
      if (f.heading) { card.appendChild(h('h2', { class: 'sub', text: f.heading })); return; }
      card.appendChild(field(f, get(f.path), function (v) { set(f.path, v); }));
    });
    view.appendChild(card);
  }

  function renderInbox() {
    var card = h('div', { class: 'card' }, h('p', { class: 'muted', text: 'Memuat pesan…' }));
    view.appendChild(card);
    api('rfq').then(function (j) {
      card.innerHTML = '';
      updateBadge(j.items);
      if (!j.items.length) { card.appendChild(h('p', { class: 'muted', text: 'Belum ada permintaan penawaran yang masuk.' })); return; }
      j.items.forEach(function (r) {
        var st = h('select', { 'aria-label': 'Status', onchange: function () {
          api('rfq_update', { body: { id: r.id, status: st.value } }).then(function () { r.status = st.value; item.dataset.status = st.value; updateBadge(j.items); }).catch(function (e) { alert(e.message); });
        } }, [['baru', 'Baru'], ['diproses', 'Diproses'], ['selesai', 'Selesai']].map(function (o) { return h('option', { value: o[0], text: o[1] }); }));
        st.value = r.status || 'baru';
        var item = h('article', { class: 'rfq-item', 'data-status': r.status || 'baru' }, [
          h('div', { class: 'rfq-top' }, [
            h('div', null, [h('b', { text: r.nama }), r.perusahaan ? h('span', { class: 'muted', text: ' · ' + r.perusahaan }) : null, h('div', { class: 'muted small', text: fmtDate(r.date) + (r.tenggat ? ' · Tenggat ' + r.tenggat : '') })]),
            st
          ]),
          r.layanan && r.layanan.length ? h('div', { class: 'tags' }, r.layanan.map(function (s) { return h('span', { class: 'tag', text: s }); })) : null,
          h('p', { class: 'desc', text: r.deskripsi }),
          r.files && r.files.length ? h('div', { class: 'files' }, r.files.map(function (f, n) {
            return h('a', { href: 'api.php?action=rfq_file&id=' + encodeURIComponent(r.id) + '&n=' + n, text: '📎 ' + f.name + ' (' + fmtSize(f.size) + ')' });
          })) : null,
          h('div', { class: 'row' }, [
            h('a', { class: 'btn primary', href: waLink(r.wa) + '?text=' + encodeURIComponent('Halo ' + r.nama + ', terima kasih sudah menghubungi Trireka Presisi. '), target: '_blank', rel: 'noopener', text: 'Balas via WhatsApp (' + r.wa + ')' }),
            r.email ? h('a', { class: 'btn', href: 'mailto:' + r.email + '?subject=' + encodeURIComponent('Penawaran Trireka Presisi'), text: 'Email ' + r.email }) : null,
            h('button', { type: 'button', class: 'btn ghost danger', text: 'Hapus', onclick: function () {
              if (!confirm('Hapus pesan dari ' + r.nama + ' beserta lampirannya?')) return;
              api('rfq_update', { body: { id: r.id, delete: true } }).then(function () { j.items.splice(j.items.indexOf(r), 1); item.remove(); updateBadge(j.items); }).catch(function (e) { alert(e.message); });
            } })
          ])
        ]);
        card.appendChild(item);
      });
    }).catch(function (e) { card.innerHTML = ''; card.appendChild(h('p', { class: 'alert err', text: e.message })); });
  }

  function updateBadge(items) {
    var n = items.filter(function (r) { return (r.status || 'baru') === 'baru'; }).length;
    var b = nav.querySelector('[data-key=inbox] .badge');
    if (b) { b.textContent = n; b.hidden = !n; }
  }

  function mediaGrid(onPick) {
    var grid = h('div', { class: 'media-grid' }, h('p', { class: 'muted', text: 'Memuat…' }));
    api('media').then(function (j) {
      grid.innerHTML = '';
      if (!j.files.length) grid.appendChild(h('p', { class: 'muted', text: 'Belum ada gambar. Unggah lewat kolom gambar di bagian Portofolio atau Umum.' }));
      j.files.forEach(function (f) {
        grid.appendChild(h('figure', null, [
          h('img', { src: '../' + f.path, alt: '', loading: 'lazy' }),
          h('figcaption', { class: 'small muted', text: f.path.replace('uploads/', '') + ' · ' + fmtSize(f.size) }),
          onPick
            ? h('button', { type: 'button', class: 'btn primary', text: 'Pakai', onclick: function () { onPick(f.path); } })
            : h('button', { type: 'button', class: 'btn ghost danger', text: 'Hapus', onclick: function () {
              if (!confirm('Hapus gambar ini? Bagian yang memakainya akan kosong.')) return;
              api('media_delete', { body: { path: f.path } }).then(function () { grid.replaceWith(mediaGrid()); }).catch(function (e) { alert(e.message); });
            } })
        ]));
      });
    }).catch(function (e) { grid.innerHTML = ''; grid.appendChild(h('p', { class: 'alert err', text: e.message })); });
    return grid;
  }

  function pickMedia(cb) {
    var dlg = h('dialog', { class: 'picker' });
    var close = function () { dlg.close(); dlg.remove(); };
    dlg.appendChild(h('div', { class: 'rep-head' }, [h('h2', { class: 'sub', text: 'Pilih gambar' }), h('button', { type: 'button', class: 'btn ghost', text: 'Tutup', onclick: close })]));
    dlg.appendChild(mediaGrid(function (p) { cb(p); close(); }));
    document.body.appendChild(dlg);
    dlg.showModal();
  }

  function renderMedia() {
    var card = h('div', { class: 'card' }, [h('p', { class: 'intro', text: 'Semua gambar yang pernah diunggah. Gambar dipakai di logo dan kartu portofolio.' })]);
    card.appendChild(mediaGrid());
    view.appendChild(card);
  }

  function renderAccount() {
    var msg = h('p', { class: 'small', role: 'status' });
    var user = h('input', { type: 'text', autocomplete: 'username' });
    var old = h('input', { type: 'password', autocomplete: 'current-password' });
    var nw = h('input', { type: 'password', autocomplete: 'new-password', minlength: 8 });
    var nw2 = h('input', { type: 'password', autocomplete: 'new-password', minlength: 8 });
    var form = h('form', { class: 'card', onsubmit: function (e) {
      e.preventDefault();
      if (nw.value !== nw2.value) { msg.className = 'alert err'; msg.textContent = 'Kedua kata sandi baru tidak sama.'; return; }
      api('password', { body: { user: user.value.trim() || undefined, old: old.value, new: nw.value } })
        .then(function () { msg.className = 'alert ok'; msg.textContent = 'Akun diperbarui.'; form.reset(); })
        .catch(function (e) { msg.className = 'alert err'; msg.textContent = e.message; });
    } }, [
      h('h2', { class: 'sub', text: 'Ganti nama pengguna / kata sandi' }),
      h('div', { class: 'field' }, [h('label', { text: 'Nama pengguna baru (kosongkan jika tetap)' }), user]),
      h('div', { class: 'field' }, [h('label', { text: 'Kata sandi lama' }), old]),
      h('div', { class: 'field' }, [h('label', { text: 'Kata sandi baru (min. 8 karakter)' }), nw]),
      h('div', { class: 'field' }, [h('label', { text: 'Ulangi kata sandi baru' }), nw2]),
      h('button', { type: 'submit', class: 'btn primary', text: 'Simpan akun' }), msg
    ]);
    view.appendChild(form);

    var imp = h('input', { type: 'file', accept: 'application/json,.json', hidden: true, onchange: function () {
      var f = imp.files[0]; if (!f) return;
      f.text().then(function (t) {
        var data = JSON.parse(t);
        if (!data || !data.site || !data.contact) throw new Error('Bukan file cadangan Trireka.');
        C = deepMerge(clone(DEF), data); markDirty();
        alert('Cadangan dimuat. Periksa isinya, lalu klik "Simpan perubahan" untuk menerapkan.');
      }).catch(function (e) { alert('Gagal membaca file: ' + e.message); });
    } });
    view.appendChild(h('div', { class: 'card' }, [
      h('h2', { class: 'sub', text: 'Cadangan isi website' }),
      h('p', { class: 'intro', text: 'Unduh cadangan secara berkala. File cadangan berisi semua teks dan daftar gambar (bukan file gambarnya).' }),
      h('div', { class: 'row' }, [
        h('a', { class: 'btn', href: 'api.php?action=export', text: 'Unduh cadangan (.json)' }),
        h('button', { type: 'button', class: 'btn ghost', text: 'Pulihkan dari cadangan…', onclick: function () { imp.click(); } }),
        h('button', { type: 'button', class: 'btn ghost danger', text: 'Kembalikan ke isi awal', onclick: function () {
          if (!confirm('Kembalikan semua teks ke isi awal? Perubahan baru berlaku setelah Anda klik Simpan.')) return;
          C = clone(DEF); markDirty(); route();
        } }),
        imp
      ])
    ]));
  }

  function deepMerge(base, over) {
    if (Array.isArray(base) || typeof base !== 'object' || base === null) return over === undefined ? base : over;
    Object.keys(over || {}).forEach(function (k) { base[k] = k in base ? deepMerge(base[k], over[k]) : over[k]; });
    return base;
  }

  /* ---------- navigasi ---------- */

  function buildNav() {
    nav.innerHTML = '';
    SECTIONS.forEach(function (s, i) {
      if (s.key === 'inbox') nav.appendChild(h('hr'));
      nav.appendChild(h('a', { href: '#' + s.key, 'data-key': s.key }, [s.title, s.key === 'inbox' ? h('span', { class: 'badge', hidden: true }) : null]));
    });
  }

  function route() {
    var key = (location.hash || '#umum').slice(1);
    var sec = SECTIONS.filter(function (s) { return s.key === key; })[0] || SECTIONS[0];
    [].forEach.call(nav.querySelectorAll('a'), function (a) { a.setAttribute('aria-current', a.dataset.key === sec.key ? 'page' : 'false'); });
    pageTitle.textContent = sec.title;
    view.innerHTML = '';
    if (sec.custom) sec.custom(); else renderSection(sec);
    document.body.classList.remove('nav-open');
    document.getElementById('menuBtn').setAttribute('aria-expanded', 'false');
    window.scrollTo(0, 0);
  }

  function save() {
    saveBtn.disabled = true; saveMsg.textContent = 'Menyimpan…';
    api('save', { body: { content: C } }).then(function (j) {
      C = j.content; dirty = false; saveMsg.textContent = 'Tersimpan ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + '. Website sudah diperbarui.';
    }).catch(function (e) { saveBtn.disabled = false; saveMsg.textContent = 'Gagal menyimpan: ' + e.message; });
  }

  saveBtn.addEventListener('click', save);
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); if (dirty) save(); }
  });
  window.addEventListener('beforeunload', function (e) { if (dirty) { e.preventDefault(); e.returnValue = ''; } });
  window.addEventListener('hashchange', route);
  document.getElementById('menuBtn').addEventListener('click', function () {
    var on = document.body.classList.toggle('nav-open');
    this.setAttribute('aria-expanded', String(on));
  });

  buildNav();
  api('content').then(function (j) {
    C = j.content; DEF = j.defaults;
    route();
    api('rfq').then(function (r) { updateBadge(r.items); }).catch(function () {});
  }).catch(function (e) { view.innerHTML = ''; view.appendChild(h('p', { class: 'alert err', text: e.message })); });
})();
