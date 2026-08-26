<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    analytics_response(false, 405);
}

if (!request_is_same_origin()) {
    analytics_response(false, 403);
}

$body = file_get_contents('php://input');
if (!is_string($body) || $body === '' || strlen($body) > 2048) {
    analytics_response(false, 400);
}

$payload = json_decode($body, true);
if (!is_array($payload) || ($payload['consent'] ?? null) !== true) {
    analytics_response(false, 400);
}

$library = find_private_library();
if ($library === null) {
    analytics_response(false, 503);
}

require $library;
analytics_response(gd_track_event($payload), 200, 500);


function analytics_response(bool $ok, int $successStatus, ?int $failureStatus = null): never
{
    http_response_code($ok ? $successStatus : ($failureStatus ?? $successStatus));
    echo json_encode(['ok' => $ok], JSON_UNESCAPED_SLASHES);
    exit;
}


function find_private_library(): ?string
{
    $documentRoot = rtrim((string) ($_SERVER['DOCUMENT_ROOT'] ?? ''), '/\\');
    $candidates = [
        dirname(__DIR__, 2) . '/server-private/lib.php',
        $documentRoot !== '' ? dirname($documentRoot) . '/server-private/lib.php' : '',
    ];

    foreach (array_unique($candidates) as $candidate) {
        if ($candidate !== '' && @is_file($candidate) && @is_readable($candidate)) return $candidate;
    }

    return null;
}


function request_is_same_origin(): bool
{
    $origin = trim((string) ($_SERVER['HTTP_ORIGIN'] ?? ''));
    if ($origin === '') return true;

    $originHost = strtolower((string) parse_url($origin, PHP_URL_HOST));
    $requestHost = strtolower((string) ($_SERVER['HTTP_HOST'] ?? ''));
    $requestHost = preg_replace('/:\\d+$/', '', $requestHost) ?: '';

    return $originHost !== '' && hash_equals($requestHost, $originHost);
}
