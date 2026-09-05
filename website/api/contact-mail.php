<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

const RECIPIENT_EMAIL = 'fabsdev@gmx.at';
const SENDER_EMAIL = 'noreply@glanzerdigital.at';
const MAX_BODY_BYTES = 12000;
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW = 900;


function respond(int $status, bool $success, string $error = ''): void
{
    http_response_code($status);
    $payload = ['success' => $success];
    if ($error !== '') $payload['error'] = $error;
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}


function requestOriginAllowed(): bool
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origin === '') return true;
    return in_array($origin, ['https://glanzerdigital.at', 'https://www.glanzerdigital.at'], true);
}


function limitText(string $value, int $maxLength): string
{
    if (function_exists('mb_substr')) return mb_substr($value, 0, $maxLength, 'UTF-8');
    return substr($value, 0, $maxLength);
}


function textLength(string $value): int
{
    if (function_exists('mb_strlen')) return mb_strlen($value, 'UTF-8');
    return strlen($value);
}


function cleanLine($value, int $maxLength): string
{
    $text = trim((string) $value);
    $text = preg_replace('/[\r\n\x00-\x1F\x7F]+/u', ' ', $text) ?? '';
    return limitText($text, $maxLength);
}


function cleanMessage($value): string
{
    $text = trim((string) $value);
    return limitText(str_replace("\0", '', $text), 1200);
}


function rateLimitKey(): string
{
    $ip = (string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
    return sys_get_temp_dir() . '/glanzerdigital-contact-' . hash('sha256', $ip) . '.json';
}


function withinRateLimit(): bool
{
    $path = rateLimitKey();
    $now = time();
    $times = is_file($path) ? json_decode((string) file_get_contents($path), true) : [];
    $times = is_array($times) ? array_values(array_filter($times, fn($time) => is_int($time) && $time > $now - RATE_LIMIT_WINDOW)) : [];
    if (count($times) >= RATE_LIMIT_MAX) return false;
    $times[] = $now;
    file_put_contents($path, json_encode($times), LOCK_EX);
    return true;
}


function buildMailBody(array $data): string
{
    $lines = [
        'Neue Projektanfrage über glanzerdigital.at',
        '',
        'Name: ' . $data['name'],
        'E-Mail: ' . $data['email'],
        'Projektstand: ' . $data['projectStatus'],
        'Zeitraum: ' . $data['timeframe'],
    ];
    if ($data['industry'] !== '') $lines[] = 'Branche / Beispiel: ' . $data['industry'];
    return implode("\n", [...$lines, '', 'Projektbeschreibung:', $data['message']]);
}


function sendContactMail(array $data): bool
{
    $subject = 'Website-Anfrage von ' . $data['name'];
    if (function_exists('mb_encode_mimeheader')) $subject = mb_encode_mimeheader($subject, 'UTF-8');
    $headers = [
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'From: GlanzerDigital Website <' . SENDER_EMAIL . '>',
        'Reply-To: ' . $data['email'],
        'X-Mailer: GlanzerDigital Contact Form',
    ];
    return mail(
        RECIPIENT_EMAIL,
        $subject,
        buildMailBody($data),
        implode("\r\n", $headers),
        '-f' . SENDER_EMAIL
    );
}


if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') respond(204, true);
if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(405, false, 'Method not allowed');
if (!requestOriginAllowed()) respond(403, false, 'Origin not allowed');

$raw = (string) file_get_contents('php://input');
if ($raw === '' || strlen($raw) > MAX_BODY_BYTES) respond(400, false, 'Invalid request');

$payload = json_decode($raw, true);
if (!is_array($payload) || json_last_error() !== JSON_ERROR_NONE) respond(400, false, 'Invalid JSON');
if (trim((string) ($payload['website'] ?? '')) !== '') respond(200, true);

$data = [
    'name' => cleanLine($payload['name'] ?? '', 120),
    'email' => cleanLine($payload['email'] ?? '', 254),
    'projectStatus' => cleanLine($payload['projectStatus'] ?? '', 160),
    'timeframe' => cleanLine($payload['timeframe'] ?? '', 160),
    'industry' => cleanLine($payload['industry'] ?? '', 160),
    'message' => cleanMessage($payload['message'] ?? ''),
    'privacy' => cleanLine($payload['privacy'] ?? '', 10),
];

if (textLength($data['name']) < 2) respond(400, false, 'Invalid name');
if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) respond(400, false, 'Invalid email');
if ($data['projectStatus'] === '' || $data['timeframe'] === '') respond(400, false, 'Missing project data');
if (textLength($data['message']) < 20) respond(400, false, 'Invalid message');
if ($data['privacy'] !== 'on') respond(400, false, 'Privacy confirmation missing');
if (!withinRateLimit()) respond(429, false, 'Too many requests');
if (!sendContactMail($data)) respond(500, false, 'Mail delivery failed');

respond(200, true);
