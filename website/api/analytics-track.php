<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit('{"ok":false}');
}

if (!request_is_same_site()) {
    http_response_code(403);
    exit('{"ok":false}');
}

$body = file_get_contents('php://input');
if (!is_string($body) || strlen($body) > 2048) {
    http_response_code(400);
    exit('{"ok":false}');
}

$payload = json_decode($body, true);
if (!is_array($payload)) {
    http_response_code(400);
    exit('{"ok":false}');
}

require dirname(__DIR__, 2) . '/server-private/lib.php';
$ok = gd_track_event($payload);
http_response_code($ok ? 204 : 400);

function request_is_same_site(): bool
{
    $fetchSite = strtolower((string) ($_SERVER['HTTP_SEC_FETCH_SITE'] ?? ''));
    if ($fetchSite !== '' && !in_array($fetchSite, ['same-origin', 'same-site', 'none'], true)) return false;
    $origin = (string) ($_SERVER['HTTP_ORIGIN'] ?? '');
    if ($origin === '') return true;
    $host = strtolower((string) ($_SERVER['HTTP_HOST'] ?? ''));
    return strtolower((string) parse_url($origin, PHP_URL_HOST)) === preg_replace('/:\d+$/', '', $host);
}
