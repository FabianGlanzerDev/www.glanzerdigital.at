<?php
declare(strict_types=1);
require __DIR__ . '/includes/bootstrap.php';

if (!gd_is_configured()) {
    header('Location: /admin/setup.php');
    exit;
}

if (gd_admin_logged_in()) {
    header('Location: /admin/');
    exit;
}

$error = '';
$notice = isset($_GET['setup']) ? 'Adminzugang wurde eingerichtet. Du kannst dich jetzt anmelden.' : '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = (string) ($_POST['email'] ?? '');
    $password = (string) ($_POST['password'] ?? '');
    $error = handle_login($email, $password);
}

function handle_login(string $email, string $password): string
{
    if (!gd_csrf_valid($_POST['csrf'] ?? null)) return 'Sicherheitsprüfung fehlgeschlagen.';
    if (gd_login_is_blocked()) return 'Zu viele Fehlversuche. Bitte später erneut versuchen.';
    if (gd_attempt_login($email, $password)) {
        header('Location: /admin/');
        exit;
    }
    gd_register_login_failure();
    return 'E-Mail-Adresse oder Passwort ist falsch.';
}
?>
<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>Admin Login | Glanzer Digital</title>
  <link rel="stylesheet" href="styles/admin.css">
</head>
<body class="admin-auth-body">
  <main class="admin-auth-shell">
    <section class="admin-auth-card" aria-labelledby="login-title">
      <div class="admin-brand"><span class="admin-brand-mark">GD</span><span>Glanzer Digital Admin</span></div>
      <span class="admin-kicker">Geschützter Bereich</span>
      <h1 id="login-title">Admin Login</h1>
      <p>Analytics, Website-Status und Wartungsmodus zentral verwalten.</p>
      <?php if ($notice !== ''): ?><div class="admin-alert admin-alert--success" role="status"><?= htmlspecialchars($notice) ?></div><?php endif; ?>
      <?php if ($error !== ''): ?><div class="admin-alert admin-alert--error" role="alert"><?= htmlspecialchars($error) ?></div><?php endif; ?>
      <form method="post" class="admin-form">
        <input type="hidden" name="csrf" value="<?= htmlspecialchars(gd_csrf_token()) ?>">
        <label>E-Mail<input type="email" name="email" autocomplete="username" required></label>
        <label>Passwort<input type="password" name="password" autocomplete="current-password" required></label>
        <button class="admin-button admin-button--primary" type="submit">Anmelden</button>
      </form>
      <a class="admin-auth-back" href="/">Zur Website</a>
    </section>
  </main>
</body>
</html>
