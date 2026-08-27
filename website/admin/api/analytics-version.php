<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('X-Glanzer-Analytics-Build: 20260827-endpoint-reset-2');
echo json_encode([
    'ok' => true,
    'build' => '20260827-endpoint-reset-2',
    'endpoint' => 'analytics-history-v2.php',
], JSON_UNESCAPED_SLASHES);
