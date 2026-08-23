<?php
declare(strict_types=1);
require dirname(__DIR__) . '/includes/bootstrap.php';

gd_require_firebase_admin();
if ($_SERVER['REQUEST_METHOD'] !== 'GET') gd_admin_json(['ok' => false, 'message' => 'Methode nicht erlaubt.'], 405);
$range = (string) ($_GET['range'] ?? '30');
if (!in_array($range, ['7', '30', '90', 'all'], true)) $range = '30';
gd_admin_json(gd_admin_analytics_payload($range));
