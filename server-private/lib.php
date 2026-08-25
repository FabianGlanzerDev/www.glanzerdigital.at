<?php
declare(strict_types=1);

date_default_timezone_set('Europe/Vienna');

const GD_ANALYTICS_RETENTION_DAYS = 365;
const GD_ALLOWED_EVENTS = ['page_view', 'demo_click', 'contact_click', 'github_click', 'portfolio_click', 'cta_click'];


function gd_track_event(array $payload): bool
{
    $event = gd_clean_event((string) ($payload['event'] ?? ''));
    if ($event === '') return false;
    $data = gd_read_analytics_locked($handle);
    gd_apply_event($data, $payload, $event);
    gd_prune_analytics($data);
    return gd_write_analytics_locked($handle, $data);
}


function gd_clean_event(string $event): string
{
    return in_array($event, GD_ALLOWED_EVENTS, true) ? $event : '';
}


function gd_analytics_path(): string
{
    $dir = __DIR__ . DIRECTORY_SEPARATOR . 'data';
    if (!is_dir($dir)) @mkdir($dir, 0750, true);
    return $dir . DIRECTORY_SEPARATOR . 'analytics.json';
}


function gd_read_analytics_locked(&$handle): array
{
    $path = gd_analytics_path();
    $handle = fopen($path, 'c+');
    if (!$handle) return gd_empty_analytics();
    if (!flock($handle, LOCK_EX)) { fclose($handle); $handle = null; return gd_empty_analytics(); }
    rewind($handle);
    $raw = stream_get_contents($handle);
    $data = json_decode(is_string($raw) ? $raw : '', true);
    return is_array($data) ? $data : gd_empty_analytics();
}


function gd_empty_analytics(): array
{
    return ['days' => [], 'recent_events' => [], 'updated_at' => null];
}


function gd_write_analytics_locked($handle, array $data): bool
{
    if (!is_resource($handle)) return false;
    rewind($handle);
    ftruncate($handle, 0);
    $written = fwrite($handle, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    fflush($handle);
    flock($handle, LOCK_UN);
    fclose($handle);
    return $written !== false;
}


function gd_apply_event(array &$data, array $payload, string $event): void
{
    $date = date('Y-m-d');
    $day = is_array($data['days'][$date] ?? null) ? $data['days'][$date] : gd_empty_day();
    gd_increment($day['events'], $event);
    if ($event === 'page_view') $day['page_views']++;
    gd_apply_dimensions($day, $payload, $event);
    $data['days'][$date] = $day;
    $data['updated_at'] = date('c');
    gd_add_recent_event($data);
}


function gd_empty_day(): array
{
    return [
        'page_views' => 0, 'events' => [], 'pages' => [], 'devices' => [],
        'browsers' => [], 'operating_systems' => [], 'screens' => [], 'hours' => [],
        'landing_pages' => [], 'referrers' => [], 'sources' => [], 'demos' => [],
        'portfolio' => [], 'ctas' => [], 'contacts' => [],
    ];
}


function gd_apply_dimensions(array &$day, array $payload, string $event): void
{
    $page = gd_clean_path((string) ($payload['page'] ?? '/'));
    $device = gd_allowed_value((string) ($payload['device'] ?? ''), ['desktop', 'tablet', 'mobile']);
    $screen = gd_allowed_value((string) ($payload['screen'] ?? ''), ['<400 px', '400–767 px', '768–1023 px', '1024–1439 px', '1440+ px']);
    $referrer = gd_clean_host((string) ($payload['referrer'] ?? ''));
    $label = gd_clean_label((string) ($payload['label'] ?? ''));
    gd_increment($day['pages'], $page);
    if ($device !== '') gd_increment($day['devices'], $device);
    if ($screen !== '') gd_increment($day['screens'], $screen);
    gd_increment($day['browsers'], gd_browser_family());
    gd_increment($day['operating_systems'], gd_os_family());
    gd_increment($day['hours'], date('H'));
    if ($event === 'page_view') gd_apply_entry_dimensions($day, $page, $referrer);
    gd_apply_event_label($day, $event, $label);
}


function gd_apply_entry_dimensions(array &$day, string $page, string $referrer): void
{
    gd_increment($day['landing_pages'], $page);
    if ($referrer !== '' && !gd_is_internal_host($referrer)) gd_increment($day['referrers'], $referrer);
    gd_increment($day['sources'], gd_source_from_referrer($referrer));
}


function gd_apply_event_label(array &$day, string $event, string $label): void
{
    if ($label === '') return;
    $map = ['demo_click' => 'demos', 'portfolio_click' => 'portfolio', 'cta_click' => 'ctas', 'contact_click' => 'contacts'];
    if (isset($map[$event])) gd_increment($day[$map[$event]], $label);
}


function gd_increment(array &$bucket, string $key): void
{
    if ($key === '') return;
    $bucket[$key] = (int) ($bucket[$key] ?? 0) + 1;
}


function gd_clean_path(string $path): string
{
    $path = (string) (parse_url($path, PHP_URL_PATH) ?: '/');
    if (!str_starts_with($path, '/')) $path = '/' . $path;
    return gd_limit_text(preg_replace('~[^a-zA-Z0-9/_\-.]~', '', $path) ?: '/', 180);
}


function gd_clean_host(string $host): string
{
    $host = strtolower(trim($host));
    if (!preg_match('/^(?:[a-z0-9-]+\.)*[a-z0-9-]+$/', $host)) return '';
    return gd_limit_text($host, 120);
}


function gd_clean_label(string $label): string
{
    $label = trim(preg_replace('/\s+/u', ' ', strip_tags($label)) ?? '');
    return gd_limit_text($label, 60);
}


function gd_limit_text(string $value, int $length): string
{
    return function_exists('mb_substr') ? mb_substr($value, 0, $length) : substr($value, 0, $length);
}


function gd_allowed_value(string $value, array $allowed): string
{
    return in_array($value, $allowed, true) ? $value : '';
}


function gd_is_internal_host(string $host): bool
{
    return $host === 'glanzerdigital.at' || str_ends_with($host, '.glanzerdigital.at');
}


function gd_source_from_referrer(string $host): string
{
    if ($host === '' || gd_is_internal_host($host)) return 'Direkt';
    if (str_contains($host, 'google.')) return 'Google';
    foreach (['linkedin.com', 'instagram.com', 'facebook.com', 'tiktok.com', 'x.com', 'twitter.com'] as $social) {
        if ($host === $social || str_ends_with($host, '.' . $social)) return 'Social';
    }
    return 'Sonstige';
}


function gd_browser_family(): string
{
    $ua = strtolower((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''));
    if (str_contains($ua, 'edg/')) return 'Edge';
    if (str_contains($ua, 'firefox/')) return 'Firefox';
    if (str_contains($ua, 'chrome/') || str_contains($ua, 'crios/')) return 'Chrome';
    if (str_contains($ua, 'safari/') && !str_contains($ua, 'chrome/')) return 'Safari';
    return 'Sonstige';
}


function gd_os_family(): string
{
    $ua = strtolower((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''));
    if (str_contains($ua, 'windows')) return 'Windows';
    if (str_contains($ua, 'android')) return 'Android';
    if (str_contains($ua, 'iphone') || str_contains($ua, 'ipad')) return 'iOS / iPadOS';
    if (str_contains($ua, 'mac os') || str_contains($ua, 'macintosh')) return 'macOS';
    if (str_contains($ua, 'linux')) return 'Linux';
    return 'Sonstige';
}


function gd_add_recent_event(array &$data): void
{
    $recent = is_array($data['recent_events'] ?? null) ? $data['recent_events'] : [];
    $recent[] = time();
    $cutoff = time() - 600;
    $data['recent_events'] = array_values(array_filter($recent, static fn($stamp): bool => (int) $stamp >= $cutoff));
}


function gd_prune_analytics(array &$data): void
{
    $cutoff = strtotime('-' . GD_ANALYTICS_RETENTION_DAYS . ' days');
    foreach ((array) ($data['days'] ?? []) as $date => $_day) {
        $stamp = strtotime((string) $date);
        if ($stamp && $stamp < $cutoff) unset($data['days'][$date]);
    }
}
