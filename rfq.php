<?php
// Menerima formulir "Minta Penawaran": menyimpan ke Pesan Masuk di panel admin,
// menyimpan lampiran, dan (opsional) mengirim email notifikasi.
require __DIR__ . '/inc/bootstrap.php';

$wantsJson = str_contains($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json');

function respond(bool $ok, string $msg, string $wa = ''): void
{
    global $wantsJson;
    if ($wantsJson) {
        header('Content-Type: application/json; charset=utf-8');
        if (!$ok) {
            http_response_code(400);
        }
        echo json_encode(['ok' => $ok, $ok ? 'message' : 'error' => $msg, 'wa' => $wa], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    } else {
        // Cadangan bila JavaScript mati: tampilkan halaman sederhana
        echo '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Permintaan penawaran</title>'
            . '<body style="font-family:system-ui;max-width:560px;margin:60px auto;padding:0 16px;background:#F2F7F4;color:#121619">'
            . '<p>' . e($msg) . '</p>'
            . ($wa ? '<p><a href="' . e($wa) . '">Lanjut di WhatsApp</a></p>' : '')
            . '<p><a href="./#rfq">← Kembali ke website</a></p></body>';
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ./#rfq');
    exit;
}

$c = load_content();
$maxBytes = max(1, (int) $c['rfq']['max_mb']) * 1048576;

// Jika total upload melebihi post_max_size hosting, PHP mengosongkan $_POST
if (empty($_POST) && (int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 0) {
    respond(false, 'Lampiran terlalu besar untuk server. Kirim file lewat WhatsApp atau perkecil ukurannya.');
}

// Honeypot: bot biasanya mengisi semua kolom
if (trim((string) ($_POST['website'] ?? '')) !== '') {
    respond(true, $c['rfq']['success']);
}

$field = static fn(string $k, int $max): string => mb_substr(trim((string) ($_POST[$k] ?? '')), 0, $max);
$entry = [
    'id' => bin2hex(random_bytes(8)),
    'date' => date('c'),
    'status' => 'baru',
    'nama' => $field('nama', 120),
    'perusahaan' => $field('perusahaan', 160),
    'wa' => $field('wa', 30),
    'email' => $field('email', 160),
    'tenggat' => $field('tenggat', 20),
    'layanan' => array_values(array_slice(array_filter(array_map(
        static fn($s) => mb_substr(trim((string) $s), 0, 80),
        (array) ($_POST['layanan'] ?? [])
    )), 0, 20)),
    'deskripsi' => $field('deskripsi', 5000),
    'files' => [],
    'ip' => client_ip(),
];

if ($entry['nama'] === '' || $entry['wa'] === '' || $entry['deskripsi'] === '') {
    respond(false, 'Nama, No. WhatsApp, dan deskripsi wajib diisi.');
}
if ($entry['email'] !== '' && !filter_var($entry['email'], FILTER_VALIDATE_EMAIL)) {
    respond(false, 'Format email tidak valid.');
}

// Batas sederhana: maksimal 5 kiriman per IP per jam
$rate = read_private('rfq-rate', []);
$now = time();
$hits = array_values(array_filter($rate[$entry['ip']] ?? [], static fn($t) => $t > $now - 3600));
if (count($hits) >= 5) {
    respond(false, 'Terlalu banyak kiriman dari jaringan Anda. Silakan hubungi kami lewat WhatsApp.');
}

// Lampiran
$blocked = ['php', 'phtml', 'phar', 'php3', 'php4', 'php5', 'php7', 'pht', 'cgi', 'pl', 'py', 'sh', 'exe', 'bat', 'cmd', 'js', 'html', 'htm', 'svg', 'htaccess'];
$total = 0;
if (!empty($_FILES['lampiran']['name']) && is_array($_FILES['lampiran']['name'])) {
    $n = count($_FILES['lampiran']['name']);
    if ($n > 10) {
        respond(false, 'Maksimal 10 file per permintaan.');
    }
    if (!is_dir(RFQ_FILE_DIR)) {
        mkdir(RFQ_FILE_DIR, 0755, true);
    }
    for ($i = 0; $i < $n; $i++) {
        $err = $_FILES['lampiran']['error'][$i];
        if ($err === UPLOAD_ERR_NO_FILE) {
            continue;
        }
        if ($err === UPLOAD_ERR_INI_SIZE || $err === UPLOAD_ERR_FORM_SIZE) {
            respond(false, 'Salah satu file melebihi batas ukuran server.');
        }
        if ($err !== UPLOAD_ERR_OK) {
            respond(false, 'Lampiran gagal diunggah. Coba lagi.');
        }
        $name = basename((string) $_FILES['lampiran']['name'][$i]);
        $name = mb_substr(preg_replace('/[^\p{L}\p{N} ._()-]+/u', '_', $name), 0, 120);
        $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
        if (in_array($ext, $blocked, true)) {
            respond(false, "Jenis file .$ext tidak diterima.");
        }
        $size = (int) $_FILES['lampiran']['size'][$i];
        $total += $size;
        if ($total > $maxBytes) {
            respond(false, 'Total lampiran melebihi ' . (int) $c['rfq']['max_mb'] . ' MB.');
        }
        $stored = bin2hex(random_bytes(16)) . '.bin';
        if (!move_uploaded_file($_FILES['lampiran']['tmp_name'][$i], RFQ_FILE_DIR . '/' . $stored)) {
            respond(false, 'Lampiran gagal disimpan di server.');
        }
        $entry['files'][] = ['name' => $name, 'stored' => $stored, 'size' => $size];
    }
}

try {
    with_lock('rfq', static function () use ($entry) {
        $list = read_private('rfq', []);
        array_unshift($list, $entry);
        write_private('rfq', $list);
    });
    $hits[] = $now;
    $rate[$entry['ip']] = $hits;
    foreach ($rate as $ip => $ts) {
        if (max($ts) < $now - 3600) {
            unset($rate[$ip]);
        }
    }
    write_private('rfq-rate', $rate);
} catch (Throwable $ex) {
    respond(false, 'Permintaan gagal disimpan. Silakan hubungi kami lewat WhatsApp.', wa_link($c['contact']['phone'], $c['contact']['wa_message']));
}

// Ringkasan untuk WhatsApp dan email
$summary = "Halo {$c['site']['name']}, saya baru mengirim permintaan penawaran lewat website.\n"
    . "Nama: {$entry['nama']}\n"
    . ($entry['perusahaan'] !== '' ? "Perusahaan: {$entry['perusahaan']}\n" : '')
    . ($entry['layanan'] ? 'Layanan: ' . implode(', ', $entry['layanan']) . "\n" : '')
    . ($entry['tenggat'] !== '' ? "Tenggat: {$entry['tenggat']}\n" : '')
    . 'Deskripsi: ' . mb_substr($entry['deskripsi'], 0, 600);

$notify = trim($c['contact']['notify_email']);
if ($notify !== '' && filter_var($notify, FILTER_VALIDATE_EMAIL) && function_exists('mail')) {
    $host = preg_replace('/[^A-Za-z0-9.-]/', '', $_SERVER['HTTP_HOST'] ?? 'localhost');
    $body = $summary . "\nNo. WA: {$entry['wa']}\nEmail: {$entry['email']}\nLampiran: " . count($entry['files']) . " file\n\nBuka panel admin untuk detail: /admin/";
    $headers = "From: website@{$host}\r\nContent-Type: text/plain; charset=UTF-8";
    if ($entry['email'] !== '') {
        $headers .= "\r\nReply-To: " . str_replace(["\r", "\n"], '', $entry['email']);
    }
    @mail($notify, '=?UTF-8?B?' . base64_encode('Permintaan penawaran baru: ' . $entry['nama']) . '?=', $body, $headers);
}

respond(true, $c['rfq']['success'], wa_link($c['contact']['phone'], $summary));
