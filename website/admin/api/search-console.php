<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, max-age=0');
http_response_code(503);

echo json_encode([
    'ok' => false,
    'configured' => false,
    'code' => 'search_console_not_configured',
    'message' => 'Google Search Console ist vorbereitet, aber noch nicht verbunden.',
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
