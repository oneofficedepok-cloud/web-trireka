<?php
require __DIR__ . '/inc/bootstrap.php';

$c = load_content();
$site = $c['site'];
$ct = $c['contact'];
$wa = wa_link($ct['phone'], $ct['wa_message']);
$logo = safe_media($site['logo']);
$logoSvg = file_get_contents(__DIR__ . '/inc/logo.svg');
$waIcon = file_get_contents(__DIR__ . '/inc/wa-icon.svg');
$v = static fn(string $f): string => $f . '?v=' . @filemtime(__DIR__ . '/' . $f);

// Ikon garis untuk kartu portofolio tanpa foto
$icons = [
    'bracket' => '<line class="c" x1="10" y1="70" x2="190" y2="70"/><rect x="30" y="30" width="140" height="80"/><circle cx="60" cy="70" r="14"/><circle cx="140" cy="70" r="14"/><line class="a" x1="30" y1="125" x2="170" y2="125"/>',
    'beam' => '<path d="M20 40 H180 V60 H110 V120 H90 V60 H20 Z"/><path class="a" d="M100 10 V36 M94 28 L100 36 L106 28"/><line class="c" x1="100" y1="40" x2="100" y2="130"/>',
    'mold' => '<rect x="30" y="20" width="140" height="48"/><rect x="30" y="72" width="140" height="48"/><path class="a" d="M70 68 Q100 40 130 68 Q100 96 70 72"/><line class="c" x1="100" y1="10" x2="100" y2="130"/>',
    'impeller' => '<circle cx="100" cy="70" r="46"/><circle cx="100" cy="70" r="16"/><path class="a" d="M100 24 V14 M146 70 H156 M100 116 V126 M54 70 H44"/><line class="c" x1="30" y1="70" x2="170" y2="70"/>',
    'jig' => '<rect x="20" y="96" width="160" height="16"/><rect x="40" y="56" width="12" height="40"/><rect x="148" y="56" width="12" height="40"/><path class="a" d="M52 70 H148"/><rect x="88" y="40" width="24" height="16"/>',
    'motion' => '<circle cx="50" cy="90" r="22"/><line x1="50" y1="90" x2="130" y2="50"/><rect x="120" y="36" width="56" height="28"/><path class="a" d="M50 58 A32 32 0 0 1 82 90"/><line class="c" x1="10" y1="90" x2="190" y2="90"/>',
];

function brand_logo(string $logo, string $svg, string $name): string
{
    return $logo !== '' ? '<img class="logo-img" src="' . e($logo) . '" alt="' . e($name) . '">' : $svg;
}

$base = (is_https() ? 'https://' : 'http://') . ($_SERVER['HTTP_HOST'] ?? 'localhost') . rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '/')), '/');
$show = static fn(string $k): bool => !empty($c[$k]['visible']);
$footer = str_replace('{tahun}', date('Y'), $c['footer']['text']);
?><!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title><?= e($site['name']) ?></title>
<meta name="description" content="<?= e($site['description']) ?>">
<meta property="og:title" content="<?= e($site['name']) ?>">
<meta property="og:description" content="<?= e($site['description']) ?>">
<meta property="og:type" content="website">
<meta property="og:image" content="<?= e($base . '/assets/logo-trireka.png') ?>">
<meta name="theme-color" content="#F2F7F4">
<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Red+Hat+Display:wght@500;700;900&family=Red+Hat+Text:wght@400;500;600&family=Red+Hat+Mono:wght@400;500&display=swap">
<link rel="stylesheet" href="<?= e($v('assets/site.css')) ?>">
</head>
<body>

<header class="nav">
  <div class="wrap">
    <a class="brand" href="#top" aria-label="<?= e($site['name']) ?>"><?= brand_logo($logo, $logoSvg, $site['name']) ?></a>
    <ul>
      <?php if ($show('services')): ?><li><a href="#layanan"><?= e($site['nav_services']) ?></a></li><?php endif ?>
      <?php if ($show('portfolio')): ?><li><a href="#portofolio"><?= e($site['nav_portfolio']) ?></a></li><?php endif ?>
      <?php if ($show('process')): ?><li><a href="#alur"><?= e($site['nav_process']) ?></a></li><?php endif ?>
      <?php if ($show('clients')): ?><li><a href="#tim"><?= e($site['nav_clients']) ?></a></li><?php endif ?>
    </ul>
    <a class="btn btn-primary" href="<?= $show('rfq') ? '#rfq' : e($wa) ?>"><?= e($site['nav_cta']) ?></a>
  </div>
</header>

<main id="top">
  <section class="hero">
    <div class="wrap">
      <div class="sheet">
        <div class="sheet-inner">
          <div class="hero-copy">
            <span class="label"><?= e($c['hero']['label']) ?></span>
            <h1><?= e($c['hero']['title_before']) ?> <?php if ($c['hero']['title_em'] !== ''): ?><em><?= e($c['hero']['title_em']) ?></em><?php endif ?><?= e($c['hero']['title_after']) ?></h1>
            <p class="lead"><?= e($c['hero']['lead']) ?></p>
            <div class="ctas">
              <a class="btn btn-primary" href="<?= $show('rfq') ? '#rfq' : e($wa) ?>"><?= e($c['hero']['cta_primary']) ?></a>
              <?php if ($show('portfolio') && $c['hero']['cta_secondary'] !== ''): ?><a class="btn" href="#portofolio"><?= e($c['hero']['cta_secondary']) ?></a><?php endif ?>
            </div>
            <?php if ($c['hero']['meta']): ?>
            <div class="hero-meta">
              <?php foreach ($c['hero']['meta'] as $m): ?><span><b><?= e($m['bold'] ?? '') ?></b> <?= e($m['text'] ?? '') ?></span><?php endforeach ?>
            </div>
            <?php endif ?>
          </div>

          <div class="drawing">
<?= file_get_contents(__DIR__ . '/inc/hero-drawing.svg') ?>
            <div class="titleblock">
              <div><span>Part</span><b><?= e($c['hero']['tb_part']) ?></b></div>
              <div><span>Material</span><b><?= e($c['hero']['tb_material']) ?></b></div>
              <div><span>Skala</span><b><?= e($c['hero']['tb_scale']) ?></b></div>
              <div><span>Kursor (mm)</span><b id="coord">X — · Y —</b></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <div class="tools">
    <div class="wrap">
      <span class="label"><?= e($c['tools']['label']) ?></span>
      <div class="sw"><?php foreach ($c['tools']['software'] as $s): ?><span><?= e($s) ?></span><?php endforeach ?></div>
      <div class="fmt" aria-label="Format file yang diserahkan">
        <?php foreach ($c['tools']['formats'] as $f): ?><code><?= e($f) ?></code><?php endforeach ?>
      </div>
    </div>
  </div>

  <?php if ($show('services')): ?>
  <section class="block" id="layanan">
    <div class="wrap">
      <div class="sec-head">
        <h2><?= e($c['services']['title']) ?></h2>
        <p><?= e($c['services']['text']) ?></p>
      </div>
      <div class="services">
        <?php foreach ($c['services']['items'] as $s): ?>
        <article class="svc">
          <span class="code"><?= e($s['code'] ?? '') ?></span>
          <h3><?= e($s['title'] ?? '') ?></h3>
          <p><?= e($s['text'] ?? '') ?></p>
          <?php if (!empty($s['specs'])): ?>
          <dl><?php foreach ($s['specs'] as $sp): ?><dt><?= e($sp['k'] ?? '') ?></dt><dd><?= e($sp['v'] ?? '') ?></dd><?php endforeach ?></dl>
          <?php endif ?>
        </article>
        <?php endforeach ?>
      </div>
    </div>
  </section>
  <?php endif ?>

  <?php if ($show('portfolio')): $pf = $c['portfolio']; ?>
  <section class="block" id="portofolio"<?= $show('services') ? ' style="padding-top:0"' : '' ?>>
    <div class="wrap">
      <div class="sec-head">
        <h2><?= e($pf['title']) ?></h2>
        <p><?= e($pf['text']) ?></p>
      </div>
      <?php if (count($pf['categories']) > 1): ?>
      <div class="filters" role="group" aria-label="Saring portofolio">
        <button class="chip" type="button" data-f="semua" aria-pressed="true"><?= e($pf['all_label']) ?></button>
        <?php foreach ($pf['categories'] as $cat): ?>
        <button class="chip" type="button" data-f="<?= e(slug($cat)) ?>" aria-pressed="false"><?= e($cat) ?></button>
        <?php endforeach ?>
      </div>
      <?php endif ?>
      <div class="works" id="works">
        <?php foreach ($pf['items'] as $w): $img = safe_media($w['image'] ?? ''); ?>
        <article class="work" data-cat="<?= e(slug($w['category'] ?? '')) ?>">
          <div class="thumb"><?php if (($w['tag'] ?? '') !== ''): ?><span class="tag"><?= e($w['tag']) ?></span><?php endif ?>
            <?php if ($img !== ''): ?><img src="<?= e($img) ?>" alt="<?= e($w['title'] ?? '') ?>" loading="lazy">
            <?php else: ?><svg viewBox="0 0 200 140" aria-hidden="true"><?= $icons[$w['icon'] ?? ''] ?? $icons['bracket'] ?></svg><?php endif ?></div>
          <div class="body"><h3><?= e($w['title'] ?? '') ?></h3><p><?= e($w['text'] ?? '') ?></p>
            <div class="meta"><?php if (($w['client'] ?? '') !== ''): ?><span><?= e($w['client']) ?></span><?php endif ?><?php if (($w['software'] ?? '') !== ''): ?><span><?= e($w['software']) ?></span><?php endif ?></div></div>
        </article>
        <?php endforeach ?>
      </div>
      <?php if ($pf['note'] !== ''): ?><p class="note"><?= e($pf['note']) ?></p><?php endif ?>
    </div>
  </section>
  <?php endif ?>

  <?php if ($show('process')): ?>
  <section class="block process" id="alur">
    <div class="wrap">
      <div class="sec-head">
        <h2><?= e($c['process']['title']) ?></h2>
        <p><?= e($c['process']['text']) ?></p>
      </div>
      <div class="steps">
        <?php foreach ($c['process']['steps'] as $i => $st): ?>
        <div class="step"><span class="n"><?= sprintf('%02d', $i + 1) ?></span><h3><?= e($st['title'] ?? '') ?></h3><p><?= e($st['text'] ?? '') ?></p></div>
        <?php endforeach ?>
      </div>
    </div>
  </section>
  <?php endif ?>

  <?php if ($show('clients') || $show('sim')): ?>
  <section class="block" id="tim">
    <div class="wrap<?= $show('clients') && $show('sim') ? ' split' : '' ?>">
      <?php if ($show('clients')): ?>
      <div>
        <div class="sec-head" style="grid-template-columns:1fr;margin-bottom:28px">
          <h2><?= e($c['clients']['title']) ?></h2>
        </div>
        <ul class="clients">
          <?php foreach ($c['clients']['items'] as $cl): ?>
          <li><b><?= e($cl['title'] ?? '') ?></b><span><?= e($cl['text'] ?? '') ?></span></li>
          <?php endforeach ?>
        </ul>
      </div>
      <?php endif ?>
      <?php if ($show('sim')): $sim = $c['sim']; ?>
      <aside class="sim" aria-label="Animasi simulasi">
        <div class="sim-head">
          <div class="sim-tabs" role="tablist" aria-label="Pilih animasi">
            <?php foreach (['fem', 'motion', 'asm'] as $i => $k): $t = $sim[$k]; ?>
            <button type="button" role="tab" data-sim="<?= $k ?>" aria-selected="<?= $i ? 'false' : 'true' ?>"<?= $i ? ' tabindex="-1"' : '' ?>
              data-id="<?= e($t['id']) ?>" data-l1="<?= e($t['l1']) ?>" data-l2="<?= e($t['l2']) ?>" data-l3="<?= e($t['l3']) ?>" data-cap="<?= e($t['cap']) ?>"><?= e($t['tab']) ?></button>
            <?php endforeach ?>
          </div>
          <span class="sim-id" id="simId"><?= e($sim['fem']['id']) ?></span>
        </div>
        <canvas id="cyl3d" class="sim-view" aria-hidden="true"></canvas>
        <div class="sim-read">
          <div><span id="l1"><?= e($sim['fem']['l1']) ?></span><b id="rStroke">–</b></div>
          <div><span id="l2"><?= e($sim['fem']['l2']) ?></span><b id="rVel">–</b></div>
          <div><span id="l3"><?= e($sim['fem']['l3']) ?></span><b id="rTime">–</b></div>
          <button class="copy" type="button" id="simToggle" aria-pressed="false" data-pause="<?= e($sim['pause']) ?>" data-play="<?= e($sim['play']) ?>"><?= e($sim['pause']) ?></button>
        </div>
        <canvas id="cylPlot" class="sim-plot" aria-hidden="true"></canvas>
        <p class="sim-cap" id="simCap"><?= e($sim['fem']['cap']) ?></p>
      </aside>
      <?php endif ?>
    </div>
  </section>
  <?php endif ?>

  <?php if ($show('rfq')): $r = $c['rfq']; ?>
  <section class="block" id="rfq" style="padding-top:0">
    <div class="wrap rfq">
      <div class="rfq-side">
        <span class="label"><?= e($r['label']) ?></span>
        <h2 style="font-size:clamp(30px,3.8vw,46px);font-weight:720;font-stretch:90%"><?= e($r['title']) ?></h2>
        <p><?= e($r['text']) ?></p>
        <div class="contact">
          <?php if ($ct['phone'] !== ''): ?>
          <div><span>WhatsApp / HP</span><a href="<?= e($wa) ?>" target="_blank" rel="noopener"><b id="waNum"><?= e(phone_display($ct['phone'])) ?></b></a><button class="copy" type="button" data-copy="waNum">Salin</button></div>
          <?php endif ?>
          <?php if ($ct['email'] !== ''): ?>
          <div><span>Email</span><a href="mailto:<?= e($ct['email']) ?>"><b id="mail"><?= e($ct['email']) ?></b></a><button class="copy" type="button" data-copy="mail">Salin</button></div>
          <?php endif ?>
          <?php if ($ct['location'] !== ''): ?>
          <div><span>Lokasi</span><b><?= e($ct['location']) ?></b></div>
          <?php endif ?>
        </div>
      </div>
      <form class="card" id="rfqForm" action="rfq.php" method="post" enctype="multipart/form-data" data-max-mb="<?= (int) $r['max_mb'] ?>">
        <div class="field"><label for="nama">Nama *</label><input type="text" id="nama" name="nama" required maxlength="120" autocomplete="name"></div>
        <div class="field"><label for="perusahaan">Perusahaan</label><input type="text" id="perusahaan" name="perusahaan" maxlength="160" autocomplete="organization"></div>
        <div class="field"><label for="wa">No. WhatsApp *</label><input type="tel" id="wa" name="wa" required maxlength="30" placeholder="08xx-xxxx-xxxx" autocomplete="tel"></div>
        <div class="field"><label for="email">Email</label><input type="email" id="email" name="email" maxlength="160" autocomplete="email"></div>
        <div class="field"><label for="tenggat">Tenggat</label><input type="date" id="tenggat" name="tenggat"></div>
        <div class="hp" aria-hidden="true"><label for="website">Website</label><input type="text" id="website" name="website" tabindex="-1" autocomplete="off"></div>
        <?php if ($r['services']): ?>
        <fieldset class="field full">
          <legend>Layanan yang dibutuhkan</legend>
          <div class="checks">
            <?php foreach ($r['services'] as $s): ?><label><input type="checkbox" name="layanan[]" value="<?= e($s) ?>"> <?= e($s) ?></label><?php endforeach ?>
          </div>
        </fieldset>
        <?php endif ?>
        <div class="field full"><label for="deskripsi">Deskripsi pekerjaan *</label>
          <textarea id="deskripsi" name="deskripsi" required maxlength="5000" placeholder="Contoh: butuh gambar kerja untuk 3 part bracket dari sampel fisik. Material plat 5 mm, untuk dipotong laser dan ditekuk."></textarea></div>
        <div class="field full">
          <label for="file">Lampiran</label>
          <div class="drop" id="drop" tabindex="0">Tarik file ke sini atau klik untuk memilih
            <small><?= e($r['upload_hint']) ?> · maks. <?= (int) $r['max_mb'] ?> MB</small></div>
          <input type="file" id="file" name="lampiran[]" multiple hidden>
          <div id="fileList"></div>
        </div>
        <div class="form-foot">
          <span id="formMsg" role="status"></span>
          <div class="form-actions">
            <a class="btn" id="rfqWa" href="#" target="_blank" rel="noopener" hidden>Lanjut di WhatsApp</a>
            <button class="btn btn-primary" type="submit"><?= e($r['submit']) ?></button>
          </div>
        </div>
      </form>
    </div>
  </section>
  <?php endif ?>
</main>

<footer>
  <div class="wrap">
    <span class="foot-brand"><?= brand_logo($logo, $logoSvg, $site['name']) ?><span><?= e($footer) ?></span></span>
    <span class="foot-contact">
      <?php if ($ct['phone'] !== ''): ?><a href="<?= e($wa) ?>" target="_blank" rel="noopener">WA/HP <?= e(phone_display($ct['phone'])) ?></a><?php endif ?>
      <?php if ($ct['email'] !== ''): ?><a href="mailto:<?= e($ct['email']) ?>"><?= e($ct['email']) ?></a><?php endif ?>
      <span><?= e(implode(' · ', array_map(static fn($s) => preg_replace('/^Autodesk\s+/i', '', $s), $c['tools']['software']))) ?></span>
    </span>
  </div>
</footer>

<?php if ($ct['phone'] !== ''): ?>
<a class="wa" href="<?= e($wa) ?>" target="_blank" rel="noopener">
  <?= $waIcon ?>
  <?= e($ct['wa_button']) ?>
</a>
<?php endif ?>

<script src="<?= e($v('assets/site.js')) ?>"></script>
</body>
</html>
