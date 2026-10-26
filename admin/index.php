<?php
require dirname(__DIR__) . '/inc/bootstrap.php';

start_admin_session();
header('X-Frame-Options: DENY');
header('Referrer-Policy: same-origin');
header('Cache-Control: no-store');

$acc = admin_account();
$error = '';
$action = $_POST['action'] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!check_csrf($_POST['csrf'] ?? null)) {
        $error = 'Sesi formulir kedaluwarsa. Muat ulang halaman lalu coba lagi.';
    } elseif ($action === 'setup' && !$acc) {
        $user = trim((string) ($_POST['user'] ?? ''));
        $pass = (string) ($_POST['pass'] ?? '');
        if (!preg_match('/^[A-Za-z0-9._-]{3,40}$/', $user)) {
            $error = 'Nama pengguna 3–40 karakter: huruf, angka, titik, minus, atau garis bawah.';
        } elseif (strlen($pass) < 8) {
            $error = 'Kata sandi minimal 8 karakter.';
        } elseif ($pass !== ($_POST['pass2'] ?? '')) {
            $error = 'Kedua kata sandi tidak sama.';
        } else {
            try {
                set_admin_password($user, $pass);
                login_session(admin_account());
                header('Location: ./');
                exit;
            } catch (Throwable $ex) {
                $error = $ex->getMessage();
            }
        }
    } elseif ($action === 'login' && $acc) {
        if (($left = login_locked()) > 0) {
            $error = 'Terlalu banyak percobaan gagal. Coba lagi dalam ' . ceil($left / 60) . ' menit.';
        } elseif (hash_equals($acc['user'], (string) ($_POST['user'] ?? '')) && password_verify((string) ($_POST['pass'] ?? ''), $acc['hash'])) {
            record_login(true);
            login_session($acc);
            header('Location: ./');
            exit;
        } else {
            record_login(false);
            $error = 'Nama pengguna atau kata sandi salah.';
        }
    } elseif ($action === 'logout') {
        $_SESSION = [];
        session_destroy();
        header('Location: ./');
        exit;
    }
}

$mode = !$acc ? 'setup' : (is_logged_in() ? 'app' : 'login');
$csrf = csrf_token();
$v = static fn(string $f): string => $f . '?v=' . @filemtime(__DIR__ . '/' . $f);
?><!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Panel Admin · Trireka Presisi</title>
<link rel="icon" href="../assets/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Red+Hat+Display:wght@700;900&family=Red+Hat+Text:wght@400;500;600&family=Red+Hat+Mono:wght@400;500&display=swap">
<link rel="stylesheet" href="<?= e($v('admin.css')) ?>">
</head>
<body class="mode-<?= $mode ?>">

<?php if ($mode !== 'app'): ?>
<main class="auth">
  <form class="auth-card" method="post" autocomplete="on">
    <img src="../assets/logo-trireka.png" alt="Trireka Presisi" class="auth-logo">
    <?php if ($mode === 'setup'): ?>
      <h1>Buat akun admin</h1>
      <p class="muted">Ini langkah pertama setelah website diunggah. Akun ini dipakai untuk mengubah semua isi website. Simpan kata sandinya baik-baik.</p>
    <?php else: ?>
      <h1>Masuk panel admin</h1>
    <?php endif ?>
    <?php if ($error): ?><p class="alert err"><?= e($error) ?></p><?php endif ?>
    <input type="hidden" name="csrf" value="<?= e($csrf) ?>">
    <input type="hidden" name="action" value="<?= $mode ?>">
    <label>Nama pengguna<input type="text" name="user" required autocomplete="username" value="<?= e($_POST['user'] ?? ($mode === 'setup' ? 'admin' : '')) ?>"></label>
    <label>Kata sandi<input type="password" name="pass" required autocomplete="<?= $mode === 'setup' ? 'new-password' : 'current-password' ?>" <?= $mode === 'setup' ? 'minlength="8"' : '' ?>></label>
    <?php if ($mode === 'setup'): ?>
    <label>Ulangi kata sandi<input type="password" name="pass2" required autocomplete="new-password" minlength="8"></label>
    <?php endif ?>
    <button class="btn primary" type="submit"><?= $mode === 'setup' ? 'Buat akun & masuk' : 'Masuk' ?></button>
    <a class="muted small" href="../">← Kembali ke website</a>
  </form>
</main>
<?php else: ?>
<div class="app">
  <aside class="side">
    <div class="side-head">
      <img src="../assets/logo-trireka.png" alt="Trireka Presisi" class="side-logo">
      <span class="muted small">Panel Admin</span>
    </div>
    <nav id="nav" aria-label="Bagian"></nav>
    <div class="side-foot">
      <a class="btn ghost" href="../" target="_blank" rel="noopener">Lihat website ↗</a>
      <form method="post">
        <input type="hidden" name="csrf" value="<?= e($csrf) ?>">
        <input type="hidden" name="action" value="logout">
        <button class="btn ghost" type="submit">Keluar (<?= e($_SESSION['admin']) ?>)</button>
      </form>
    </div>
  </aside>
  <main class="main">
    <div class="topbar">
      <button class="btn ghost menu" type="button" id="menuBtn" aria-controls="nav" aria-expanded="false">☰ Menu</button>
      <h1 id="pageTitle">Memuat…</h1>
      <div class="save-area">
        <span id="saveMsg" class="muted small" role="status"></span>
        <button class="btn primary" type="button" id="saveBtn" disabled>Simpan perubahan</button>
      </div>
    </div>
    <div id="view" class="view"></div>
  </main>
</div>
<script>window.ADMIN={csrf:<?= json_encode($csrf) ?>};</script>
<script src="<?= e($v('admin.js')) ?>"></script>
<?php endif ?>
</body>
</html>
