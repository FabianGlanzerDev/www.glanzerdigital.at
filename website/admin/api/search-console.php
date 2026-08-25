<?php
declare(strict_types=1);
require dirname(__DIR__) . '/includes/bootstrap.php';

gd_require_firebase_admin();
if ($_SERVER['REQUEST_METHOD'] !== 'GET') gd_admin_json(['ok' => false, 'message' => 'Methode nicht erlaubt.'], 405);
gd_admin_json([
    'ok' => false,
    'configured' => false,
    'code' => 'search_console_not_configured',
    'message' => 'Google Search Console ist vorbereitet, aber noch nicht verbunden.',
], 503);
