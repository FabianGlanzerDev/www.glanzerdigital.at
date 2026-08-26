<?php
declare(strict_types=1);

date_default_timezone_set('Europe/Vienna');

const GD_ANALYTICS_EVENTS = [
    'page_view', 'demo_click', 'contact_click', 'github_click', 'portfolio_click', 'cta_click'
];


function gd_private_config(): array
{
    static $config;
    if (is_array($config)) return $config;
    $loaded = require __DIR__ . '/config.php';
    $config = is_array($loaded) ? $loaded : [];
    return $config;
}


function gd_analytics_path(): string
{
    return __DIR__ . '/data/analytics.json';
}


function gd_default_analytics(): array
{
    return ['days' => [], 'recent_events' => [], 'updated_at' => null];
}


function gd_sanitize_path(mixed $value): string
{
    $path = '/' . ltrim((string) $value, '/');
    $path = preg_replace('~/{2,}~', '/', $path) ?: '/';
    if (strlen($path) > 180) $path = substr($path, 0, 180);
    return preg_match('~^[A-Za-z0-9/_\-.%]+$~', $path) ? $path : '/';
}


function gd_sanitize_label(mixed $value): string
{
    $label = trim(preg_replace('/\s+/u', ' ', (string) $value) ?: '');
    $label = preg_replace('/[^\p{L}\p{N}\s._+&\-\/]/u', '', $label) ?: '';
    return function_exists('mb_substr') ? mb_substr($label, 0, 60, 'UTF-8') : substr($label, 0, 60);
}


function gd_sanitize_referrer(mixed $value): string
{
    $host = strtolower(trim((string) $value));
    $host = preg_replace('/^www\./', '', $host) ?: '';
    if ($host === '' || strlen($host) > 120) return '';
    return preg_match('/^[a-z0-9.-]+$/', $host) ? $host : '';
}


function gd_is_internal_referrer(string $host): bool
{
    return $host === 'glanzerdigital.at' || str_ends_with($host, '.glanzerdigital.at');
}


function gd_source_for_referrer(string $host): string
{
    if ($host === '') return 'Direkt';
    if (preg_match('/(^|\.)google\./', $host)) return 'Google';
    if (preg_match('/(^|\.)(instagram|facebook|fb|linkedin|tiktok|x|twitter)\./', $host)) return 'Social';
    return 'Sonstige';
}


function gd_browser_family(string $agent): string
{
    if (stripos($agent, 'Edg/') !== false) return 'Edge';
    if (stripos($agent, 'OPR/') !== false || stripos($agent, 'Opera') !== false) return 'Opera';
    if (stripos($agent, 'Firefox/') !== false) return 'Firefox';
    if (stripos($agent, 'Chrome/') !== false || stripos($agent, 'CriOS/') !== false) return 'Chrome';
    if (stripos($agent, 'Safari/') !== false) return 'Safari';
    return 'Sonstige';
}


function gd_os_family(string $agent): string
{
    if (stripos($agent, 'Windows') !== false) return 'Windows';
    if (stripos($agent, 'Android') !== false) return 'Android';
    if (preg_match('/iPhone|iPad|iPod/i', $agent)) return 'iOS / iPadOS';
    if (stripos($agent, 'Mac OS X') !== false) return 'macOS';
    if (stripos($agent, 'Linux') !== false) return 'Linux';
    return 'Sonstige';
}


function gd_increment(array &$bucket, string $key): void
{
    if ($key === '') return;
    $bucket[$key] = (int) ($bucket[$key] ?? 0) + 1;
}


function gd_day_template(): array
{
    $keys = ['events', 'pages', 'devices', 'browsers', 'operating_systems', 'screens', 'hours'];
    $keys = array_merge($keys, ['landing_pages', 'referrers', 'sources', 'demos', 'portfolio', 'ctas', 'contacts']);
    $day = ['page_views' => 0];
    foreach ($keys as $key) $day[$key] = [];
    return $day;
}


function gd_prepare_day(array $day): array
{
    $template = gd_day_template();
    foreach ($template as $key => $value) {
        if (!array_key_exists($key, $day) || !is_array($day[$key]) && is_array($value)) $day[$key] = $value;
    }
    $day['page_views'] = (int) ($day['page_views'] ?? 0);
    return $day;
}


function gd_record_page_view(array &$day, array $event): void
{
    $day['page_views']++;
    gd_increment($day['pages'], $event['page']);
    gd_increment($day['devices'], $event['device']);
    gd_increment($day['browsers'], $event['browser']);
    gd_increment($day['operating_systems'], $event['os']);
    gd_increment($day['screens'], $event['screen']);
    gd_increment($day['hours'], $event['hour']);
    gd_record_entry($day, $event);
}


function gd_record_entry(array &$day, array $event): void
{
    if (gd_is_internal_referrer($event['referrer'])) return;
    gd_increment($day['landing_pages'], $event['page']);
    gd_increment($day['sources'], gd_source_for_referrer($event['referrer']));
    if ($event['referrer'] !== '') gd_increment($day['referrers'], $event['referrer']);
}


function gd_record_labeled_event(array &$day, array $event): void
{
    $map = ['demo_click' => 'demos', 'portfolio_click' => 'portfolio', 'cta_click' => 'ctas', 'contact_click' => 'contacts'];
    $bucket = $map[$event['name']] ?? '';
    if ($bucket !== '') gd_increment($day[$bucket], $event['label'] ?: 'Unbekannt');
}


function gd_build_event(array $payload): ?array
{
    $name = strtolower(trim((string) ($payload['event'] ?? '')));
    if (!in_array($name, GD_ANALYTICS_EVENTS, true)) return null;
    return gd_complete_event($payload, $name);
}


function gd_complete_event(array $payload, string $name): array
{
    $agent = (string) ($_SERVER['HTTP_USER_AGENT'] ?? '');
    return [
        'name' => $name, 'page' => gd_sanitize_path($payload['page'] ?? '/'),
        'device' => gd_device_value($payload['device'] ?? ''), 'screen' => gd_screen_value($payload['screen'] ?? ''),
        'referrer' => gd_sanitize_referrer($payload['referrer'] ?? ''), 'label' => gd_sanitize_label($payload['label'] ?? ''),
        'browser' => gd_browser_family($agent), 'os' => gd_os_family($agent), 'hour' => date('H'),
    ];
}


function gd_device_value(mixed $value): string
{
    $value = strtolower((string) $value);
    return in_array($value, ['desktop', 'tablet', 'mobile'], true) ? $value : 'unknown';
}


function gd_screen_value(mixed $value): string
{
    $allowed = ['<400 px', '400–767 px', '768–1023 px', '1024–1439 px', '1440+ px'];
    $value = (string) $value;
    return in_array($value, $allowed, true) ? $value : 'Unbekannt';
}


function gd_prune_analytics(array &$data): void
{
    $retention = max(1, (int) (gd_private_config()['analytics_retention_days'] ?? 365));
    $cutoff = date('Y-m-d', strtotime('-' . ($retention - 1) . ' days'));
    foreach (array_keys((array) ($data['days'] ?? [])) as $date) if ($date < $cutoff) unset($data['days'][$date]);
    $recentCutoff = time() - 3600;
    $data['recent_events'] = array_values(array_filter((array) ($data['recent_events'] ?? []), static fn($stamp): bool => (int) $stamp >= $recentCutoff));
}


function gd_apply_event(array &$data, array $event): void
{
    $date = date('Y-m-d');
    $day = gd_prepare_day((array) ($data['days'][$date] ?? []));
    gd_increment($day['events'], $event['name']);
    if ($event['name'] === 'page_view') gd_record_page_view($day, $event);
    else gd_record_labeled_event($day, $event);
    $data['days'][$date] = $day;
    $data['recent_events'][] = time();
    $data['updated_at'] = date(DATE_ATOM);
}


function gd_read_locked_file($handle): array
{
    rewind($handle);
    $raw = stream_get_contents($handle);
    $decoded = is_string($raw) && $raw !== '' ? json_decode($raw, true) : null;
    return is_array($decoded) ? $decoded : gd_default_analytics();
}


function gd_write_locked_file($handle, array $data): bool
{
    $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    if (!is_string($json)) return false;
    rewind($handle);
    if (!ftruncate($handle, 0)) return false;
    return fwrite($handle, $json . PHP_EOL) !== false && fflush($handle);
}


function gd_track_event(array $payload): bool
{
    $event = gd_build_event($payload);
    if ($event === null || !gd_ensure_analytics_storage()) return false;
    $handle = @fopen(gd_analytics_path(), 'c+');
    if (!$handle || !flock($handle, LOCK_EX)) return false;
    return gd_store_event($handle, $event);
}


function gd_store_event($handle, array $event): bool
{
    $data = gd_read_locked_file($handle);
    gd_apply_event($data, $event);
    gd_prune_analytics($data);
    $ok = gd_write_locked_file($handle, $data);
    flock($handle, LOCK_UN);
    fclose($handle);
    return $ok;
}


function gd_ensure_analytics_storage(): bool
{
    $dir = dirname(gd_analytics_path());
    if (!is_dir($dir) && !@mkdir($dir, 0750, true)) return false;
    if (is_file(gd_analytics_path())) return is_writable(gd_analytics_path());
    return @file_put_contents(gd_analytics_path(), json_encode(gd_default_analytics()), LOCK_EX) !== false;
}
