<?php
declare(strict_types=1);
require __DIR__ . '/includes/bootstrap.php';

if (gd_is_configured()) {
    header('Location: /admin/login.php');
    exit;
}

$error = '';
$tokenPath = gd_private_path('setup-token.txt');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $token = trim((string) ($_POST['setup_token'] ?? ''));
    $email = trim((string) ($_POST['email'] ?? ''));
    $password = (string) ($_POST['password'] ?? '');
    $error = handle_setup($tokenPath, $token, $email, $password);
}

function handle_setup(string $tokenPath, string $token, string $email, string $password): string
{
    if (!gd_csrf_valid($_POST['csrf'] ?? null)) return 'Sicherheitsprüfung fehlgeschlagen.';
    if (!is_file($tokenPath)) return 'Setup-Token fehlt. Bitte die ZIP vollständig hochladen.';
    if (!hash_equals(trim((string) file_get_contents($tokenPath)), $token)) return 'Setup-Token ist falsch.';
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) return 'Bitte eine gültige E-Mail-Adresse eingeben.';
    if (strlen($password) < 12) return 'Das Passwort muss mindestens 12 Zeichen lang sein.';
    return write_admin_config($email, $password, $tokenPath) ? '' : 'Konfiguration konnte nicht gespeichert werden.';
}

function write_admin_config(string $email, string $password, string $tokenPath): bool
{
    $hash = password_hash($password, PASSWORD_DEFAULT);
    $content = "<?php\ndeclare(strict_types=1);\n\nreturn " . var_export(['admin_email' => $email, 'password_hash' => $hash], true) . ";\n";
    $ok = file_put_contents(gd_private_path('config.php'), $content, LOCK_EX) !== false;
    if ($ok) @unlink($tokenPath);
    if ($ok) header('Location: /admin/login.php?setup=done');
    if ($ok) exit;
    return false;
}
?>
<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>Admin einrichten | Glanzer Digital</title>
  <link rel="stylesheet" href="styles/admin.css">
</head>
<body class="admin-auth-body">
  <main class="admin-auth-shell">
    <section class="admin-auth-card" aria-labelledby="setup-title">
      <div class="admin-brand"><span class="admin-brand-mark">GD</span><span>Glanzer Digital Admin</span></div>
      <span class="admin-kicker">Ersteinrichtung</span>
      <h1 id="setup-title">Adminzugang einrichten</h1>
      <p>Lege den ersten Adminzugang fest. Der Setup-Token wird danach automatisch gelöscht.</p>
      <?php if ($error !== ''): ?><div class="admin-alert admin-alert--error" role="alert"><?= htmlspecialchars($error) ?></div><?php endif; ?>
      <form method="post" class="admin-form">
        <input type="hidden" name="csrf" value="<?= htmlspecialchars(gd_csrf_token()) ?>">
        <label>Setup-Token<input type="text" name="setup_token" autocomplete="off" required></label>
        <label>Admin-E-Mail<input type="email" name="email" autocomplete="username" required></label>
        <label>Passwort<input type="password" name="password" minlength="12" autocomplete="new-password" required></label>
        <button class="admin-button admin-button--primary" type="submit">Admin einrichten</button>
      </form>
    </section>
  </main>
</body>
</html>
