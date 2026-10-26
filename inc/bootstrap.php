<?php
declare(strict_types=1);

// Inti website: membaca/menyimpan isi, sesi admin, dan penyimpanan data pribadi.
// Tidak butuh database. Semua data ada di folder data/ dan uploads/.

define('ROOT', dirname(__DIR__));
define('DATA_DIR', ROOT . '/data');
define('UPLOAD_DIR', ROOT . '/uploads');
define('RFQ_FILE_DIR', DATA_DIR . '/rfq-files');

// Baris pertama setiap file data pribadi. Jika file dibuka lewat browser,
// PHP langsung berhenti sehingga isinya tidak pernah terkirim.
const PRIVATE_GUARD = "<?php http_response_code(404); exit; ?>\n";

mb_internal_encoding('UTF-8');
date_default_timezone_set('Asia/Jakarta');

function e($s): string
{
    return htmlspecialchars((string) $s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function is_list_array($a): bool
{
    return is_array($a) && ($a === [] || array_keys($a) === range(0, count($a) - 1));
}

// Lengkapi isi tersimpan dengan kunci baru dari defaults, tanpa menimpa isi yang sudah diubah.
function merge_defaults($def, $cur)
{
    if (!is_array($def) || is_list_array($def)) {
        return $cur ?? $def;
    }
    if (!is_array($cur) || is_list_array($cur)) {
        return $def;
    }
    $out = $def;
    foreach ($cur as $k => $v) {
        $out[$k] = array_key_exists($k, $def) ? merge_defaults($def[$k], $v) : $v;
    }
    return $out;
}

function default_content(): array
{
    return require __DIR__ . '/defaults.php';
}

function load_content(): array
{
    $saved = null;
    $f = DATA_DIR . '/content.json';
    if (is_file($f)) {
        $saved = json_decode((string) file_get_contents($f), true);
    }
    return merge_defaults(default_content(), is_array($saved) ? $saved : []);
}

function write_atomic(string $path, string $data): void
{
    $dir = dirname($path);
    if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
        throw new RuntimeException("Folder $dir tidak bisa dibuat.");
    }
    $tmp = $path . '.' . bin2hex(random_bytes(4)) . '.tmp';
    if (file_put_contents($tmp, $data, LOCK_EX) === false || !rename($tmp, $path)) {
        @unlink($tmp);
        throw new RuntimeException("File $path tidak bisa ditulis. Periksa izin folder data/.");
    }
}

function save_content(array $content): void
{
    write_atomic(DATA_DIR . '/content.json', json_encode($content, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
}

function read_private(string $name, $default = null)
{
    $f = DATA_DIR . '/' . $name . '.php';
    if (!is_file($f)) {
        return $default;
    }
    $raw = (string) file_get_contents($f);
    if (strncmp($raw, PRIVATE_GUARD, strlen(PRIVATE_GUARD)) === 0) {
        $raw = substr($raw, strlen(PRIVATE_GUARD));
    }
    $v = json_decode($raw, true);
    return $v ?? $default;
}

function write_private(string $name, $data): void
{
    write_atomic(DATA_DIR . '/' . $name . '.php', PRIVATE_GUARD . json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
}

// 087769725965 -> 6287769725965 (format wa.me)
function wa_number(string $phone): string
{
    $d = preg_replace('/\D+/', '', $phone);
    if (str_starts_with($d, '0')) {
        $d = '62' . substr($d, 1);
    } elseif (str_starts_with($d, '8')) {
        $d = '62' . $d;
    }
    return $d;
}

// 087769725965 -> 0877-6972-5965
function phone_display(string $phone): string
{
    $d = preg_replace('/\D+/', '', $phone);
    if (str_starts_with($d, '62')) {
        $d = '0' . substr($d, 2);
    }
    if (strlen($d) < 9) {
        return $phone;
    }
    return substr($d, 0, 4) . '-' . substr($d, 4, 4) . '-' . substr($d, 8);
}

function wa_link(string $phone, string $message = ''): string
{
    $url = 'https://wa.me/' . wa_number($phone);
    return $message !== '' ? $url . '?text=' . rawurlencode($message) : $url;
}

function slug(string $s): string
{
    $s = strtolower(trim(preg_replace('/[^A-Za-z0-9]+/', '-', $s), '-'));
    return $s !== '' ? $s : 'lain';
}

// Hanya izinkan path gambar di uploads/ atau URL http(s), supaya isi admin tidak bisa menyisipkan javascript:.
function safe_media(string $path): string
{
    $path = trim($path);
    if ($path === '') {
        return '';
    }
    if (preg_match('#^uploads/[A-Za-z0-9._-]+$#', $path) || preg_match('#^https?://#i', $path)) {
        return $path;
    }
    return '';
}

function is_https(): bool
{
    return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
}

function client_ip(): string
{
    return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
}

/* ---------- Sesi admin ---------- */

function start_admin_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    session_name('trireka_admin');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => is_https(),
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
    session_start();
}

function csrf_token(): string
{
    start_admin_session();
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf'];
}

function check_csrf(?string $token): bool
{
    start_admin_session();
    return is_string($token) && !empty($_SESSION['csrf']) && hash_equals($_SESSION['csrf'], $token);
}

function admin_account(): ?array
{
    $a = read_private('admin');
    return is_array($a) && !empty($a['hash']) ? $a : null;
}

function is_logged_in(): bool
{
    start_admin_session();
    $acc = admin_account();
    // Sesi ikut kedaluwarsa jika kata sandi diganti (stamp berubah)
    return $acc && !empty($_SESSION['admin']) && ($_SESSION['stamp'] ?? '') === ($acc['stamp'] ?? '');
}

const LOGIN_MAX_FAILS = 5;
const LOGIN_LOCK_SECONDS = 900;

function login_locked(): int
{
    $all = read_private('login-attempts', []);
    $rec = $all[client_ip()] ?? null;
    if (!$rec || $rec['fails'] < LOGIN_MAX_FAILS) {
        return 0;
    }
    $left = $rec['last'] + LOGIN_LOCK_SECONDS - time();
    return max(0, $left);
}

function record_login(bool $ok): void
{
    $all = read_private('login-attempts', []);
    $now = time();
    foreach ($all as $ip => $rec) {
        if ($rec['last'] + LOGIN_LOCK_SECONDS < $now) {
            unset($all[$ip]);
        }
    }
    $ip = client_ip();
    if ($ok) {
        unset($all[$ip]);
    } else {
        $all[$ip] = ['fails' => ($all[$ip]['fails'] ?? 0) + 1, 'last' => $now];
    }
    write_private('login-attempts', $all);
}

function set_admin_password(string $user, string $password): void
{
    write_private('admin', [
        'user' => $user,
        'hash' => password_hash($password, PASSWORD_DEFAULT),
        'stamp' => bin2hex(random_bytes(8)),
        'updated' => date('c'),
    ]);
}

function login_session(array $acc): void
{
    start_admin_session();
    session_regenerate_id(true);
    $_SESSION['admin'] = $acc['user'];
    $_SESSION['stamp'] = $acc['stamp'];
}

// Jalankan baca-ubah-tulis data pribadi secara bergiliran agar dua kiriman bersamaan tidak saling menimpa.
function with_lock(string $name, callable $fn)
{
    if (!is_dir(DATA_DIR)) {
        mkdir(DATA_DIR, 0755, true);
    }
    $h = fopen(DATA_DIR . '/' . $name . '.lock', 'c');
    if (!$h) {
        return $fn();
    }
    flock($h, LOCK_EX);
    try {
        return $fn();
    } finally {
        flock($h, LOCK_UN);
        fclose($h);
    }
}
