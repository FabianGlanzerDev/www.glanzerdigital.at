<?php
declare(strict_types=1);
require __DIR__ . '/includes/bootstrap.php';
gd_require_admin();

$today = gd_analytics_summary(1);
$week = gd_analytics_summary(7);
$month = gd_analytics_summary(30);
$chart = gd_analytics_summary(14);
$maintenance = gd_maintenance_enabled();
$maxViews = max(1, ...array_map(static fn(array $row): int => (int) $row['views'], $chart['series']));
$checks = [
    'Startseite' => is_file(gd_website_path('index.html')),
    'Sitemap' => is_file(gd_website_path('sitemap.xml')),
    'robots.txt' => is_file(gd_website_path('robots.txt')),
    'Analytics-Speicher' => is_writable(gd_private_path('data')),
];

function e(string $value): string { return htmlspecialchars($value, ENT_QUOTES, 'UTF-8'); }
function count_event(array $data, string $key): int { return (int) ($data['events'][$key] ?? 0); }
?>
<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <meta name="theme-color" content="#07101d">
  <title>Admin Dashboard | Glanzer Digital</title>
  <link rel="stylesheet" href="styles/admin.css">
  <script src="scripts/admin.js" defer></script>
</head>
<body class="admin-body">
  <a class="admin-skip" href="#admin-main">Zum Inhalt springen</a>
  <aside class="admin-sidebar" aria-label="Admin-Navigation">
    <a class="admin-brand admin-brand--sidebar" href="/admin/" aria-label="Glanzer Digital Admin Startseite">
      <span class="admin-brand-mark">GD</span><span>Admin</span>
    </a>
    <nav class="admin-nav" aria-label="Dashboard-Bereiche">
      <a href="#overview" aria-current="page">Übersicht</a>
      <a href="#analytics">Analytics</a>
      <a href="#maintenance">Wartung</a>
      <a href="#status">Systemstatus</a>
    </nav>
    <div class="admin-sidebar-footer">
      <a href="/" target="_blank" rel="noopener noreferrer">Website öffnen</a>
      <a href="logout.php">Abmelden</a>
    </div>
  </aside>

  <main class="admin-main" id="admin-main">
    <header class="admin-topbar">
      <div>
        <span class="admin-kicker">Glanzer Digital</span>
        <h1>Website Control Center</h1>
      </div>
      <div class="admin-site-state <?= $maintenance ? 'is-maintenance' : 'is-online' ?>" role="status">
        <span aria-hidden="true"></span><?= $maintenance ? 'Wartungsmodus' : 'Website online' ?>
      </div>
    </header>

    <section class="admin-section" id="overview" aria-labelledby="overview-title">
      <div class="admin-section-heading">
        <div><span class="admin-kicker">Übersicht</span><h2 id="overview-title">Was auf der Website passiert</h2></div>
        <span class="admin-muted">Cookielose, lokale Zählung ohne IP-Speicherung</span>
      </div>
      <div class="admin-stats-grid">
        <article class="admin-stat-card"><span>Heute</span><strong><?= $today['page_views'] ?></strong><small>Seitenaufrufe</small></article>
        <article class="admin-stat-card"><span>7 Tage</span><strong><?= $week['page_views'] ?></strong><small>Seitenaufrufe</small></article>
        <article class="admin-stat-card"><span>30 Tage</span><strong><?= $month['page_views'] ?></strong><small>Seitenaufrufe</small></article>
        <article class="admin-stat-card"><span>Demos</span><strong><?= count_event($month, 'demo_click') ?></strong><small>Starts in 30 Tagen</small></article>
        <article class="admin-stat-card"><span>Kontakt</span><strong><?= count_event($month, 'contact_click') ?></strong><small>Klicks in 30 Tagen</small></article>
        <article class="admin-stat-card"><span>GitHub</span><strong><?= count_event($month, 'github_click') ?></strong><small>Klicks in 30 Tagen</small></article>
      </div>
    </section>

    <section class="admin-section" id="analytics" aria-labelledby="analytics-title">
      <div class="admin-section-heading"><div><span class="admin-kicker">Analytics</span><h2 id="analytics-title">Letzte 14 Tage</h2></div></div>
      <div class="admin-analytics-layout">
        <article class="admin-panel admin-chart-panel">
          <h3>Seitenaufrufe</h3>
          <div class="admin-chart" role="img" aria-label="Seitenaufrufe der letzten 14 Tage">
            <?php foreach ($chart['series'] as $row): $height = max(4, (int) round(((int) $row['views'] / $maxViews) * 100)); ?>
              <div class="admin-chart-column" title="<?= e($row['date']) ?>: <?= (int) $row['views'] ?>">
                <span class="admin-chart-value"><?= (int) $row['views'] ?></span>
                <span class="admin-chart-bar" style="height: <?= $height ?>%"></span>
                <span class="admin-chart-label"><?= e(substr($row['date'], 5)) ?></span>
              </div>
            <?php endforeach; ?>
          </div>
        </article>

        <article class="admin-panel">
          <h3>Geräte · 30 Tage</h3>
          <dl class="admin-metrics-list">
            <div><dt>Desktop</dt><dd><?= (int) ($month['devices']['desktop'] ?? 0) ?></dd></div>
            <div><dt>Tablet</dt><dd><?= (int) ($month['devices']['tablet'] ?? 0) ?></dd></div>
            <div><dt>Smartphone</dt><dd><?= (int) ($month['devices']['mobile'] ?? 0) ?></dd></div>
          </dl>
        </article>
      </div>

      <div class="admin-analytics-layout admin-analytics-layout--tables">
        <article class="admin-panel">
          <h3>Meistbesuchte Seiten · 30 Tage</h3>
          <div class="admin-table-wrap">
            <table class="admin-table">
              <thead><tr><th>Seite</th><th>Aufrufe</th></tr></thead>
              <tbody>
              <?php foreach (array_slice($month['pages'], 0, 8, true) as $page => $count): ?>
                <tr><td><?= e($page) ?></td><td><?= (int) $count ?></td></tr>
              <?php endforeach; ?>
              <?php if (!$month['pages']): ?><tr><td colspan="2">Noch keine Daten vorhanden.</td></tr><?php endif; ?>
              </tbody>
            </table>
          </div>
        </article>

        <article class="admin-panel">
          <h3>Interaktionen · 30 Tage</h3>
          <dl class="admin-metrics-list">
            <div><dt>Demo-Starts</dt><dd><?= count_event($month, 'demo_click') ?></dd></div>
            <div><dt>Kontakt-Klicks</dt><dd><?= count_event($month, 'contact_click') ?></dd></div>
            <div><dt>GitHub-Klicks</dt><dd><?= count_event($month, 'github_click') ?></dd></div>
            <div><dt>Portfolio-Klicks</dt><dd><?= count_event($month, 'portfolio_click') ?></dd></div>
            <div><dt>CTA-Klicks</dt><dd><?= count_event($month, 'cta_click') ?></dd></div>
          </dl>
        </article>
      </div>
    </section>

    <section class="admin-section" id="maintenance" aria-labelledby="maintenance-title">
      <div class="admin-section-heading"><div><span class="admin-kicker">Website-Steuerung</span><h2 id="maintenance-title">Wartungsmodus</h2></div></div>
      <article class="admin-maintenance-card <?= $maintenance ? 'is-maintenance' : 'is-online' ?>">
        <div>
          <span class="admin-maintenance-label">Aktueller Zustand</span>
          <h3><?= $maintenance ? 'Website befindet sich im Wartungsmodus' : 'Website ist öffentlich erreichbar' ?></h3>
          <p><?= $maintenance ? 'Besucher erhalten eine 503-Wartungsseite. Der Adminbereich bleibt weiterhin erreichbar.' : 'Alle öffentlichen Seiten und Demos sind normal erreichbar.' ?></p>
        </div>
        <form action="api/maintenance.php" method="post" data-maintenance-form>
          <input type="hidden" name="csrf" value="<?= e(gd_csrf_token()) ?>">
          <input type="hidden" name="enabled" value="<?= $maintenance ? '0' : '1' ?>">
          <button class="admin-button <?= $maintenance ? 'admin-button--success' : 'admin-button--danger' ?>" type="submit">
            <?= $maintenance ? 'Website wieder online schalten' : 'Wartungsmodus aktivieren' ?>
          </button>
        </form>
      </article>
    </section>

    <section class="admin-section" id="status" aria-labelledby="status-title">
      <div class="admin-section-heading"><div><span class="admin-kicker">System</span><h2 id="status-title">Technischer Status</h2></div></div>
      <div class="admin-status-grid">
        <?php foreach ($checks as $label => $ok): ?>
          <article class="admin-status-card <?= $ok ? 'is-ok' : 'is-error' ?>">
            <span class="admin-status-dot" aria-hidden="true"></span>
            <div><strong><?= e($label) ?></strong><small><?= $ok ? 'Bereit' : 'Prüfen' ?></small></div>
          </article>
        <?php endforeach; ?>
      </div>
    </section>
  </main>
</body>
</html>
