<?php
// API panel admin. Semua aksi butuh login, dan aksi yang mengubah data butuh token CSRF.
require dirname(__DIR__) . '/inc/bootstrap.php';

start_admin_session();
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function out($data, int $code = 200): void
{
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function fail(string $msg, int $code = 400): void
{
    out(['ok' => false, 'error' => $msg], $code);
}

if (!is_logged_in()) {
    fail('Sesi berakhir. Silakan masuk lagi.', 401);
}

$action = $_GET['action'] ?? '';
$isPost = $_SERVER['REQUEST_METHOD'] === 'POST';
if ($isPost && !check_csrf($_SERVER['HTTP_X_CSRF'] ?? ($_POST['csrf'] ?? null))) {
    fail('Token keamanan tidak cocok. Muat ulang halaman.', 403);
}

function json_body(): array
{
    $b = json_decode((string) file_get_contents('php://input'), true);
    return is_array($b) ? $b : [];
}

// Bersihkan isi kiriman admin: hanya kunci yang dikenal di defaults, tipe dipertahankan.
function sanitize_like($def, $val)
{
    if (is_bool($def)) {
        return (bool) $val;
    }
    if (is_string($def)) {
        return is_scalar($val) ? mb_substr((string) $val, 0, 20000) : $def;
    }
    if (is_list_array($def)) {
        if (!is_array($val)) {
            return $def;
        }
        $tpl = $def[0] ?? '';
        $outList = [];
        foreach (array_values($val) as $item) {
            $outList[] = sanitize_like($tpl, $item);
        }
        return array_slice($outList, 0, 200);
    }
    if (is_array($def)) {
        $o = [];
        foreach ($def as $k => $d) {
            $o[$k] = array_key_exists($k, (array) $val) ? sanitize_like($d, $val[$k]) : $d;
        }
        return $o;
    }
    return $def;
}

switch ($action) {
    case 'content':
        out(['ok' => true, 'content' => load_content(), 'defaults' => default_content()]);

    case 'save':
        if (!$isPost) {
            fail('Metode salah.', 405);
        }
        $body = json_body();
        $clean = sanitize_like(default_content(), $body['content'] ?? []);
        try {
            save_content($clean);
        } catch (Throwable $ex) {
            fail($ex->getMessage(), 500);
        }
        out(['ok' => true, 'content' => $clean]);

    case 'upload':
        if (!$isPost || empty($_FILES['file'])) {
            fail('Tidak ada file.');
        }
        $f = $_FILES['file'];
        if ($f['error'] !== UPLOAD_ERR_OK) {
            fail($f['error'] === UPLOAD_ERR_INI_SIZE ? 'File melebihi batas upload hosting.' : 'Upload gagal.');
        }
        if ($f['size'] > 8 * 1048576) {
            fail('Gambar maksimal 8 MB.');
        }
        $info = @getimagesize($f['tmp_name']);
        $types = [IMAGETYPE_JPEG => 'jpg', IMAGETYPE_PNG => 'png', IMAGETYPE_WEBP => 'webp', IMAGETYPE_GIF => 'gif'];
        if (!$info || !isset($types[$info[2]])) {
            fail('Hanya gambar JPG, PNG, WEBP, atau GIF.');
        }
        if (!is_dir(UPLOAD_DIR)) {
            mkdir(UPLOAD_DIR, 0755, true);
        }
        $base = slug(pathinfo((string) $f['name'], PATHINFO_FILENAME));
        $name = substr($base, 0, 40) . '-' . bin2hex(random_bytes(4)) . '.' . $types[$info[2]];
        if (!move_uploaded_file($f['tmp_name'], UPLOAD_DIR . '/' . $name)) {
            fail('Gambar gagal disimpan. Periksa izin folder uploads/.', 500);
        }
        out(['ok' => true, 'path' => 'uploads/' . $name]);

    case 'media':
        $files = [];
        foreach (glob(UPLOAD_DIR . '/*.{jpg,jpeg,png,webp,gif}', GLOB_BRACE) ?: [] as $p) {
            $files[] = ['path' => 'uploads/' . basename($p), 'size' => filesize($p), 'time' => filemtime($p)];
        }
        usort($files, static fn($a, $b) => $b['time'] <=> $a['time']);
        out(['ok' => true, 'files' => $files]);

    case 'media_delete':
        $p = (string) (json_body()['path'] ?? '');
        if (!preg_match('#^uploads/([A-Za-z0-9._-]+)$#', $p, $m) || !is_file(UPLOAD_DIR . '/' . $m[1])) {
            fail('File tidak ditemukan.');
        }
        unlink(UPLOAD_DIR . '/' . $m[1]);
        out(['ok' => true]);

    case 'rfq':
        $list = read_private('rfq', []);
        foreach ($list as &$r) {
            unset($r['ip']);
        }
        out(['ok' => true, 'items' => $list]);

    case 'rfq_update':
        $b = json_body();
        $id = (string) ($b['id'] ?? '');
        $status = in_array($b['status'] ?? '', ['baru', 'diproses', 'selesai'], true) ? $b['status'] : null;
        $ok = with_lock('rfq', static function () use ($id, $status, $b) {
            $list = read_private('rfq', []);
            foreach ($list as $i => $r) {
                if ($r['id'] !== $id) {
                    continue;
                }
                if (!empty($b['delete'])) {
                    foreach ($r['files'] as $f) {
                        @unlink(RFQ_FILE_DIR . '/' . basename($f['stored']));
                    }
                    array_splice($list, $i, 1);
                } elseif ($status) {
                    $list[$i]['status'] = $status;
                }
                write_private('rfq', $list);
                return true;
            }
            return false;
        });
        $ok ? out(['ok' => true]) : fail('Pesan tidak ditemukan.', 404);

    case 'rfq_file':
        $id = (string) ($_GET['id'] ?? '');
        $n = (int) ($_GET['n'] ?? -1);
        foreach (read_private('rfq', []) as $r) {
            if ($r['id'] === $id && isset($r['files'][$n])) {
                $f = $r['files'][$n];
                $path = RFQ_FILE_DIR . '/' . basename($f['stored']);
                if (!is_file($path)) {
                    break;
                }
                header('Content-Type: application/octet-stream');
                header('Content-Length: ' . filesize($path));
                header("Content-Disposition: attachment; filename*=UTF-8''" . rawurlencode($f['name']));
                readfile($path);
                exit;
            }
        }
        fail('File tidak ditemukan.', 404);

    case 'password':
        $b = json_body();
        $acc = admin_account();
        if (!password_verify((string) ($b['old'] ?? ''), $acc['hash'])) {
            fail('Kata sandi lama salah.');
        }
        $new = (string) ($b['new'] ?? '');
        $user = trim((string) ($b['user'] ?? $acc['user']));
        if (strlen($new) < 8) {
            fail('Kata sandi baru minimal 8 karakter.');
        }
        if (!preg_match('/^[A-Za-z0-9._-]{3,40}$/', $user)) {
            fail('Nama pengguna 3–40 karakter: huruf, angka, titik, minus, atau garis bawah.');
        }
        set_admin_password($user, $new);
        login_session(admin_account());
        out(['ok' => true]);

    case 'export':
        header('Content-Type: application/json; charset=utf-8');
        header('Content-Disposition: attachment; filename="trireka-isi-' . date('Ymd-His') . '.json"');
        echo json_encode(load_content(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;

    default:
        fail('Aksi tidak dikenal.', 404);
}
