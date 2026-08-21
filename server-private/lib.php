<?php

declare(strict_types=1);

const GD_ANALYTICS_RETENTION_DAYS = 400;

date_default_timezone_set('Europe/Vienna');


function gd_private_path(string $relative = ''): string
{
    return __DIR__ . ($relative !== '' ? DIRECTORY_SEPARATOR . ltrim($relative, '/\\') : '');
}


function gd_website_path(string $relative = ''): string
{
    $root = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'website';
    return $root . ($relative !== '' ? DIRECTORY_SEPARATOR . ltrim($relative, '/\\') : '');
}


function gd_json_read(string $path, array $fallback = []): array
{
    if (!is_file($path)) return $fallback;
    $data = json_decode((string) file_get_contents($path), true);
    return is_array($data) ? $data : $fallback;
}


function gd_json_write(string $path, array $data): bool
{
    $dir = dirname($path);
    if (!is_dir($dir)) mkdir($dir, 0755, true);
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    return $json !== false && file_put_contents($path, $json . PHP_EOL, LOCK_EX) !== false;
}


function gd_maintenance_enabled(): bool
{
    return is_file(gd_website_path('.maintenance'));
}


function gd_set_maintenance(bool $enabled): bool
{
    $path = gd_website_path('.maintenance');
    if ($enabled) return file_put_contents($path, date('c') . PHP_EOL, LOCK_EX) !== false;
    return !is_file($path) || unlink($path);
}


function gd_clean_path(string $path): string
{
    $path = parse_url($path, PHP_URL_PATH) ?: '/';
    $path = preg_replace('~/{2,}~', '/', $path) ?: '/';
    return substr($path, 0, 180);
}


function gd_track_event(array $payload): bool
{
    $allowed = ['page_view', 'demo_click', 'contact_click', 'github_click', 'portfolio_click', 'cta_click'];
    $event = (string) ($payload['event'] ?? '');
    if (!in_array($event, $allowed, true)) return false;
    $day = date('Y-m-d');
    $path = gd_private_path('data/analytics.json');
    $data = gd_json_read($path, ['version' => 1, 'days' => []]);
    gd_add_analytics_event($data, $day, $event, $payload);
    gd_prune_analytics($data);
    $data['updated_at'] = date('c');
    return gd_json_write($path, $data);
}


function gd_add_analytics_event(array &$data, string $day, string $event, array $payload): void
{
    if (!isset($data['days'][$day])) $data['days'][$day] = ['page_views' => 0, 'events' => [], 'pages' => [], 'devices' => []];
    $bucket = &$data['days'][$day];
    $bucket['events'][$event] = (int) ($bucket['events'][$event] ?? 0) + 1;
    if ($event === 'page_view') gd_add_page_view($bucket, $payload);
}


function gd_add_page_view(array &$bucket, array $payload): void
{
    $page = gd_clean_path((string) ($payload['page'] ?? '/'));
    $device = (string) ($payload['device'] ?? 'unknown');
    if (!in_array($device, ['desktop', 'tablet', 'mobile'], true)) $device = 'unknown';
    $bucket['page_views'] = (int) ($bucket['page_views'] ?? 0) + 1;
    $bucket['pages'][$page] = (int) ($bucket['pages'][$page] ?? 0) + 1;
    $bucket['devices'][$device] = (int) ($bucket['devices'][$device] ?? 0) + 1;
}


function gd_prune_analytics(array &$data): void
{
    $cutoff = strtotime('-' . GD_ANALYTICS_RETENTION_DAYS . ' days');
    foreach (array_keys($data['days'] ?? []) as $date) {
        $stamp = strtotime($date . ' 00:00:00 UTC');
        if ($stamp !== false && $stamp < $cutoff) unset($data['days'][$date]);
    }
}
