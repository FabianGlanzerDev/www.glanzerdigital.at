<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
http_response_code(503);
echo json_encode([
    'ok' => false,
    'code' => 'firebase_auth_not_configured',
    'message' => 'Wartungssteuerung wird nach Firebase-Tokenprüfung aktiviert.',
], JSON_UNESCAPED_UNICODE);
