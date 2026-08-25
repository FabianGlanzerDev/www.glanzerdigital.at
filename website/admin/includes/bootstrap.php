<?php
declare(strict_types=1);

date_default_timezone_set('Europe/Vienna');

const GD_FIREBASE_PROJECT_ID = 'glanzerdigital';
const GD_ALLOWED_ADMIN_UIDS = ['8sXo9V8XkAOPs7kqtx6wQsQsCat1'];
const GD_FIREBASE_CERTS_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';


function gd_admin_json(array $payload, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}


function gd_admin_website_path(string $relative = ''): string
{
    $root = dirname(__DIR__, 2);
    return $relative === '' ? $root : $root . DIRECTORY_SEPARATOR . ltrim($relative, '/\\');
}


function gd_admin_private_path(string $relative = ''): string
{
    $root = dirname(__DIR__, 3) . DIRECTORY_SEPARATOR . 'server-private';
    return $relative === '' ? $root : $root . DIRECTORY_SEPARATOR . ltrim($relative, '/\\');
}


function gd_admin_bearer_token(): string
{
    $header = (string) ($_SERVER['HTTP_AUTHORIZATION'] ?? '');
    if (!preg_match('/^Bearer\s+(.+)$/i', trim($header), $matches)) return '';
    return trim($matches[1]);
}


function gd_admin_base64url_decode(string $value): string
{
    $padding = strlen($value) % 4;
    if ($padding) $value .= str_repeat('=', 4 - $padding);
    $decoded = base64_decode(strtr($value, '-_', '+/'), true);
    if ($decoded === false) throw new RuntimeException('invalid_token');
    return $decoded;
}


function gd_admin_decode_json_segment(string $segment): array
{
    $decoded = json_decode(gd_admin_base64url_decode($segment), true);
    if (!is_array($decoded)) throw new RuntimeException('invalid_token');
    return $decoded;
}


function gd_admin_fetch_url(string $url): string
{
    if (function_exists('curl_init')) return gd_admin_fetch_with_curl($url);
    $context = stream_context_create(['http' => ['timeout' => 5, 'ignore_errors' => true]]);
    $body = @file_get_contents($url, false, $context);
    if (!is_string($body) || $body === '') throw new RuntimeException('cert_unavailable');
    return $body;
}


function gd_admin_fetch_with_curl(string $url): string
{
    $curl = curl_init($url);
    curl_setopt_array($curl, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 5, CURLOPT_FOLLOWLOCATION => false]);
    $body = curl_exec($curl);
    $status = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
    curl_close($curl);
    if (!is_string($body) || $status !== 200) throw new RuntimeException('cert_unavailable');
    return $body;
}


function gd_admin_certificate_cache_path(): string
{
    return rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . 'gd-firebase-certs.json';
}


function gd_admin_google_certs(bool $forceRefresh = false): array
{
    $cache = gd_admin_certificate_cache_path();
    if (!$forceRefresh && is_file($cache) && filemtime($cache) > time() - 21600) {
        $cached = json_decode((string) file_get_contents($cache), true);
        if (is_array($cached)) return $cached;
    }
    $certs = json_decode(gd_admin_fetch_url(GD_FIREBASE_CERTS_URL), true);
    if (!is_array($certs) || $certs === []) throw new RuntimeException('cert_unavailable');
    @file_put_contents($cache, json_encode($certs), LOCK_EX);
    return $certs;
}


function gd_admin_certificate_for_kid(string $kid): string
{
    $certs = gd_admin_google_certs();
    if (isset($certs[$kid])) return (string) $certs[$kid];
    $certs = gd_admin_google_certs(true);
    if (!isset($certs[$kid])) throw new RuntimeException('unknown_key');
    return (string) $certs[$kid];
}


function gd_admin_verify_signature(string $signed, string $signature, string $certificate): void
{
    if (!function_exists('openssl_verify')) throw new RuntimeException('openssl_unavailable');
    $result = openssl_verify($signed, $signature, $certificate, OPENSSL_ALGO_SHA256);
    if ($result !== 1) throw new RuntimeException('invalid_signature');
}


function gd_admin_validate_claims(array $payload): void
{
    $now = time();
    if (($payload['aud'] ?? '') !== GD_FIREBASE_PROJECT_ID) throw new RuntimeException('invalid_audience');
    if (($payload['iss'] ?? '') !== 'https://securetoken.google.com/' . GD_FIREBASE_PROJECT_ID) throw new RuntimeException('invalid_issuer');
    if ((int) ($payload['exp'] ?? 0) <= $now) throw new RuntimeException('expired_token');
    if ((int) ($payload['iat'] ?? PHP_INT_MAX) > $now + 300) throw new RuntimeException('invalid_iat');
    $uid = (string) ($payload['sub'] ?? '');
    if ($uid === '' || strlen($uid) > 128) throw new RuntimeException('invalid_subject');
    if (!in_array($uid, GD_ALLOWED_ADMIN_UIDS, true)) throw new RuntimeException('forbidden_uid');
}


function gd_admin_verify_firebase_token(string $token): array
{
    $parts = explode('.', $token);
    if (count($parts) !== 3) throw new RuntimeException('invalid_token');
    [$encodedHeader, $encodedPayload, $encodedSignature] = $parts;
    $header = gd_admin_decode_json_segment($encodedHeader);
    $payload = gd_admin_decode_json_segment($encodedPayload);
    if (($header['alg'] ?? '') !== 'RS256' || empty($header['kid'])) throw new RuntimeException('invalid_header');
    $certificate = gd_admin_certificate_for_kid((string) $header['kid']);
    gd_admin_verify_signature($encodedHeader . '.' . $encodedPayload, gd_admin_base64url_decode($encodedSignature), $certificate);
    gd_admin_validate_claims($payload);
    return $payload;
}


function gd_require_firebase_admin(): array
{
    $token = gd_admin_bearer_token();
    if ($token === '') gd_admin_json(['ok' => false, 'message' => 'Firebase-ID-Token fehlt.'], 401);
    try { return gd_admin_verify_firebase_token($token); }
    catch (RuntimeException $error) {
        $status = in_array($error->getMessage(), ['cert_unavailable', 'openssl_unavailable'], true) ? 503 : 401;
        gd_admin_json(['ok' => false, 'message' => $status === 503 ? 'Tokenprüfung ist serverseitig nicht verfügbar.' : 'Firebase-ID-Token ist ungültig.'], $status);
    }
}


function gd_admin_read_analytics(): array
{
    $path = gd_admin_private_path('data/analytics.json');
    if (!is_file($path)) return ['days' => [], 'recent_events' => [], 'updated_at' => null];
    $data = json_decode((string) file_get_contents($path), true);
    return is_array($data) ? $data : ['days' => [], 'recent_events' => [], 'updated_at' => null];
}


function gd_admin_date_keys(array $days, string $range): array
{
    $keys = array_keys($days);
    sort($keys);
    if ($range === 'all') return $keys;
    $count = in_array((int) $range, [7, 30, 90], true) ? (int) $range : 30;
    $wanted = [];
    for ($i = $count - 1; $i >= 0; $i--) $wanted[] = date('Y-m-d', strtotime("-{$i} days"));
    return $wanted;
}


function gd_admin_merge_counts(array &$target, array $values): void
{
    foreach ($values as $key => $value) $target[$key] = (int) ($target[$key] ?? 0) + (int) $value;
}


function gd_admin_aggregate(array $days, array $keys): array
{
    $buckets = ['events', 'pages', 'devices', 'browsers', 'operating_systems', 'screens', 'hours', 'landing_pages', 'referrers', 'sources', 'demos', 'portfolio', 'ctas', 'contacts'];
    $result = ['views' => 0, 'series' => []];
    foreach ($buckets as $bucket) $result[$bucket] = [];
    foreach ($keys as $date) gd_admin_add_day($result, (array) ($days[$date] ?? []), $date, $buckets);
    return $result;
}


function gd_admin_add_day(array &$result, array $day, string $date, array $buckets): void
{
    $views = (int) ($day['page_views'] ?? 0);
    $result['views'] += $views;
    $result['series'][] = ['date' => $date, 'views' => $views];
    foreach ($buckets as $bucket) gd_admin_merge_counts($result[$bucket], (array) ($day[$bucket] ?? []));
}


function gd_admin_views_for_days(array $days, int $count, int $offset = 0): int
{
    $views = 0;
    for ($i = $offset; $i < $offset + $count; $i++) {
        $date = date('Y-m-d', strtotime("-{$i} days"));
        $views += (int) ($days[$date]['page_views'] ?? 0);
    }
    return $views;
}


function gd_admin_ranking(array $counts, int $limit = 8): array
{
    arsort($counts);
    $rows = [];
    foreach (array_slice($counts, 0, $limit, true) as $label => $value) $rows[] = ['label' => (string) $label, 'value' => (int) $value];
    return $rows;
}


function gd_admin_fallback_demo_ranking(array $pages): array
{
    $demos = [];
    foreach ($pages as $path => $count) {
        if (!preg_match('~/demos/([^/]+)/?~', (string) $path, $match)) continue;
        $label = ucwords(str_replace('-', ' ', $match[1]));
        $demos[$label] = (int) ($demos[$label] ?? 0) + (int) $count;
    }
    return $demos;
}


function gd_admin_best_day(array $series): string
{
    if ($series === []) return '–';
    usort($series, static fn(array $a, array $b): int => ((int) $b['views']) <=> ((int) $a['views']));
    if ((int) ($series[0]['views'] ?? 0) === 0) return '–';
    $stamp = strtotime((string) $series[0]['date']);
    return $stamp ? date('d.m.Y', $stamp) : '–';
}


function gd_admin_best_hour(array $hours): string
{
    if ($hours === []) return '–';
    arsort($hours);
    $hour = array_key_first($hours);
    if ($hour === null || (int) ($hours[$hour] ?? 0) === 0) return '–';
    return sprintf('%02d:00–%02d:59', (int) $hour, (int) $hour);
}


function gd_admin_active_events(array $recentEvents): int
{
    $cutoff = time() - 300;
    return count(array_filter($recentEvents, static fn($stamp): bool => (int) $stamp >= $cutoff));
}


function gd_admin_sources(array $counts): array
{
    $labels = ['Direkt', 'Google', 'Social', 'Sonstige'];
    $total = array_sum($counts);
    $rows = [];
    foreach ($labels as $label) {
        $value = (int) ($counts[$label] ?? 0);
        $rows[] = ['label' => $label, 'value' => $value, 'percent' => $total > 0 ? $value / $total * 100 : 0];
    }
    return $rows;
}


function gd_admin_analytics_payload(string $range): array
{
    $stored = gd_admin_read_analytics();
    $days = is_array($stored['days'] ?? null) ? $stored['days'] : [];
    $aggregate = gd_admin_aggregate($days, gd_admin_date_keys($days, $range));
    $events = $aggregate['events'];
    $demoCounts = $aggregate['demos'] ?: gd_admin_fallback_demo_ranking($aggregate['pages']);
    $demos = gd_admin_ranking($demoCounts);
    $contact = (int) ($events['contact_click'] ?? 0);
    $views = (int) $aggregate['views'];
    return gd_admin_build_payload($days, $stored, $aggregate, $events, $demos, $contact, $views);
}


function gd_admin_build_payload(array $days, array $stored, array $aggregate, array $events, array $demos, int $contact, int $views): array
{
    $totalViews = array_sum(array_map(static fn(array $day): int => (int) ($day['page_views'] ?? 0), $days));
    return [
        'ok' => true,
        'summary' => gd_admin_summary($days, $stored, $events, $contact, $views, $totalViews),
        'rankings' => gd_admin_rankings($aggregate, $demos),
        'insights' => gd_admin_insights($stored, $aggregate, $demos),
        'funnel' => gd_admin_funnel($events, $contact, $views),
        'sources' => gd_admin_sources($aggregate['sources']),
        'devices' => $aggregate['devices'],
        'series' => $aggregate['series'],
    ];
}


function gd_admin_summary(array $days, array $stored, array $events, int $contact, int $views, int $totalViews): array
{
    $rate = $views > 0 ? $contact / $views * 100 : null;
    return [
        'today' => gd_admin_views_for_days($days, 1), 'yesterday' => gd_admin_views_for_days($days, 1, 1),
        'week' => gd_admin_views_for_days($days, 7), 'month' => gd_admin_views_for_days($days, 30), 'total' => $totalViews,
        'demos' => (int) ($events['demo_click'] ?? 0), 'contact' => $contact, 'github' => (int) ($events['github_click'] ?? 0),
        'activeNow' => gd_admin_active_events((array) ($stored['recent_events'] ?? [])), 'conversion' => $rate, 'contactRate' => $rate,
    ];
}


function gd_admin_rankings(array $aggregate, array $demos): array
{
    return [
        'pages' => gd_admin_ranking($aggregate['pages']), 'demos' => $demos,
        'landingPages' => gd_admin_ranking($aggregate['landing_pages']), 'referrers' => gd_admin_ranking($aggregate['referrers']),
        'portfolio' => gd_admin_ranking($aggregate['portfolio']), 'ctas' => gd_admin_ranking($aggregate['ctas']),
        'contacts' => gd_admin_ranking($aggregate['contacts']), 'browsers' => gd_admin_ranking($aggregate['browsers']),
        'operatingSystems' => gd_admin_ranking($aggregate['operating_systems']), 'screens' => gd_admin_ranking($aggregate['screens']),
    ];
}


function gd_admin_insights(array $stored, array $aggregate, array $demos): array
{
    return [
        'bestHour' => gd_admin_best_hour($aggregate['hours']), 'bestDay' => gd_admin_best_day($aggregate['series']),
        'topProject' => $demos[0]['label'] ?? null, 'topProjectClicks' => $demos[0]['value'] ?? null,
        'lastEvent' => $stored['updated_at'] ?? null,
    ];
}


function gd_admin_funnel(array $events, int $contact, int $views): array
{
    return [
        'pageviews' => $views, 'portfolio' => (int) ($events['portfolio_click'] ?? 0),
        'demos' => (int) ($events['demo_click'] ?? 0), 'contact' => $contact,
    ];
}


function gd_admin_maintenance_enabled(): bool
{
    return is_file(gd_admin_website_path('.maintenance'));
}


function gd_admin_set_maintenance(bool $enabled): bool
{
    $path = gd_admin_website_path('.maintenance');
    if ($enabled) return file_put_contents($path, date('c') . PHP_EOL, LOCK_EX) !== false;
    return !is_file($path) || unlink($path);
}
