<?php
declare(strict_types=1);

const GD_GA4_SCOPE = 'https://www.googleapis.com/auth/analytics.readonly';
const GD_GA4_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GD_GA4_API_BASE = 'https://analyticsdata.googleapis.com/v1beta/properties/';
const GD_GA4_CACHE_SECONDS = 20;


function gd_ga4_config(): array
{
    return gd_private_config();
}


function gd_ga4_property_id(): string
{
    $property = trim((string) (gd_ga4_config()['ga4_property_id'] ?? ''));
    if ($property === '' || !ctype_digit($property)) throw new RuntimeException('ga4_property_missing');
    return $property;
}


function gd_ga4_measurement_id(): string
{
    return trim((string) (gd_ga4_config()['ga4_measurement_id'] ?? ''));
}


function gd_ga4_service_account(): array
{
    $path = (string) (gd_ga4_config()['google_service_account_file'] ?? '');
    if ($path === '' || !is_file($path)) throw new RuntimeException('service_account_missing');
    $json = json_decode((string) file_get_contents($path), true);
    if (!is_array($json) || empty($json['client_email']) || empty($json['private_key'])) {
        throw new RuntimeException('service_account_invalid');
    }
    return $json;
}


function gd_ga4_b64(string $value): string
{
    return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
}


function gd_ga4_jwt(array $account): string
{
    $now = time();
    $header = gd_ga4_b64((string) json_encode(['alg' => 'RS256', 'typ' => 'JWT']));
    $claims = [
        'iss' => $account['client_email'], 'scope' => GD_GA4_SCOPE,
        'aud' => GD_GA4_TOKEN_URL, 'iat' => $now, 'exp' => $now + 3600,
    ];
    $payload = gd_ga4_b64((string) json_encode($claims, JSON_UNESCAPED_SLASHES));
    $signed = $header . '.' . $payload;
    if (!function_exists('openssl_sign')) throw new RuntimeException('openssl_unavailable');
    if (!openssl_sign($signed, $signature, (string) $account['private_key'], OPENSSL_ALGO_SHA256)) {
        throw new RuntimeException('jwt_sign_failed');
    }
    return $signed . '.' . gd_ga4_b64($signature);
}


function gd_ga4_http(string $url, array $headers, string $body): array
{
    if (function_exists('curl_init')) return gd_ga4_http_curl($url, $headers, $body);
    return gd_ga4_http_stream($url, $headers, $body);
}


function gd_ga4_http_curl(string $url, array $headers, string $body): array
{
    $curl = curl_init($url);
    curl_setopt_array($curl, [
        CURLOPT_RETURNTRANSFER => true, CURLOPT_POST => true, CURLOPT_POSTFIELDS => $body,
        CURLOPT_HTTPHEADER => $headers, CURLOPT_TIMEOUT => 12,
    ]);
    $response = curl_exec($curl);
    $status = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
    curl_close($curl);
    return [$status, is_string($response) ? $response : ''];
}


function gd_ga4_http_stream(string $url, array $headers, string $body): array
{
    $context = stream_context_create(['http' => [
        'method' => 'POST', 'header' => implode("\r\n", $headers), 'content' => $body,
        'timeout' => 12, 'ignore_errors' => true,
    ]]);
    $response = @file_get_contents($url, false, $context);
    $line = $http_response_header[0] ?? '';
    preg_match('/\s(\d{3})\s/', $line, $match);
    return [(int) ($match[1] ?? 0), is_string($response) ? $response : ''];
}


function gd_ga4_access_token(): string
{
    static $token = '';
    if ($token !== '') return $token;
    $assertion = gd_ga4_jwt(gd_ga4_service_account());
    $body = http_build_query([
        'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        'assertion' => $assertion,
    ]);
    [$status, $response] = gd_ga4_http(
        GD_GA4_TOKEN_URL, ['Content-Type: application/x-www-form-urlencoded'], $body
    );
    $data = json_decode($response, true);
    if ($status !== 200 || !is_array($data) || empty($data['access_token'])) {
        throw new RuntimeException('google_auth_failed');
    }
    return $token = (string) $data['access_token'];
}


function gd_ga4_request(string $method, array $payload): array
{
    $url = GD_GA4_API_BASE . gd_ga4_property_id() . ':' . $method;
    $body = (string) json_encode($payload, JSON_UNESCAPED_SLASHES);
    [$status, $response] = gd_ga4_http($url, [
        'Authorization: Bearer ' . gd_ga4_access_token(), 'Content-Type: application/json',
    ], $body);
    $data = json_decode($response, true);
    if ($status !== 200 || !is_array($data)) throw new RuntimeException(gd_ga4_api_error($data, $status));
    return $data;
}


function gd_ga4_api_error(mixed $data, int $status): string
{
    if ($status === 403) return 'ga4_forbidden_or_api_disabled';
    if ($status === 404) return 'ga4_property_missing';
    if ($status === 429) return 'ga4_quota_exceeded';
    $message = is_array($data) ? (string) ($data['error']['message'] ?? '') : '';
    return $message !== '' ? 'ga4_api_error: ' . $message : 'ga4_api_error';
}


function gd_ga4_metric(array $row, int $index): int
{
    return (int) round((float) ($row['metricValues'][$index]['value'] ?? 0));
}


function gd_ga4_realtime_summary(): array
{
    $data = gd_ga4_request('runRealtimeReport', [
        'metrics' => [
            ['name' => 'activeUsers'], ['name' => 'eventCount'], ['name' => 'screenPageViews'],
        ],
    ]);
    $row = (array) ($data['rows'][0] ?? []);
    return [
        'activeUsers' => gd_ga4_metric($row, 0),
        'eventCount' => gd_ga4_metric($row, 1),
        'screenPageViews' => gd_ga4_metric($row, 2),
    ];
}


function gd_ga4_realtime_pages(): array
{
    $data = gd_ga4_request('runRealtimeReport', [
        'dimensions' => [['name' => 'unifiedScreenName']],
        'metrics' => [['name' => 'activeUsers'], ['name' => 'screenPageViews']],
        'limit' => 8,
        'orderBys' => [['metric' => ['metricName' => 'screenPageViews'], 'desc' => true]],
    ]);
    $rows = [];
    foreach ((array) ($data['rows'] ?? []) as $row) {
        $rows[] = [
            'label' => (string) ($row['dimensionValues'][0]['value'] ?? '–'),
            'activeUsers' => gd_ga4_metric((array) $row, 0),
            'views' => gd_ga4_metric((array) $row, 1),
        ];
    }
    return $rows;
}


function gd_ga4_cache_path(): string
{
    return __DIR__ . '/data/ga4-realtime-cache.json';
}


function gd_ga4_cached_payload(): ?array
{
    $path = gd_ga4_cache_path();
    if (!is_file($path) || filemtime($path) < time() - GD_GA4_CACHE_SECONDS) return null;
    $data = json_decode((string) @file_get_contents($path), true);
    return is_array($data) ? $data : null;
}


function gd_ga4_store_cache(array $payload): void
{
    $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if (is_string($json)) @file_put_contents(gd_ga4_cache_path(), $json, LOCK_EX);
}


function gd_ga4_dashboard_payload(bool $force = false): array
{
    if (!$force && ($cached = gd_ga4_cached_payload())) return $cached;
    $summary = gd_ga4_realtime_summary();
    $pages = gd_ga4_realtime_pages();
    $payload = [
        'ok' => true, 'configured' => true, 'property' => gd_ga4_property_id(),
        'measurementId' => gd_ga4_measurement_id(),
        'realtime' => $summary + [
            'topPage' => $pages[0]['label'] ?? '–', 'pages' => $pages,
            'updatedAt' => date(DATE_ATOM),
        ],
    ];
    gd_ga4_store_cache($payload);
    return $payload;
}


function gd_ga4_history_dashboard_payload(string $range = '30', bool $force = false): array
{
    $range = gd_ga4_history_normalize_range($range);
    $cache = gd_ga4_history_cache_path($range);

    if (!$force && ($cached = gd_ga4_history_cached_payload($cache, 900)) !== null) {
        return $cached;
    }

    if (!$force && $range === '30') {
        $legacy = gd_ga4_history_cached_payload(__DIR__ . '/data/ga4-history-v4-30.json', 3600);
        if ($legacy !== null) return gd_ga4_history_mark_fallback($legacy, 'Vorhandener GA4-Cache wird verwendet.');
    }

    $lockPath = gd_ga4_history_lock_path($range);
    $lock = @fopen($lockPath, 'c+');
    if ($lock && !@flock($lock, LOCK_EX | LOCK_NB)) {
        $fallback = gd_ga4_history_fallback_payload($range);
        fclose($lock);
        if ($fallback !== null) return gd_ga4_history_mark_fallback($fallback, 'Aktualisierung läuft bereits.');
        throw new RuntimeException('ga4_history_busy');
    }

    try {
        $period = gd_ga4_history_period($range);
        $dailyReport = gd_ga4_request('runReport', gd_ga4_history_report_request(
            ['start' => '2020-01-01', 'end' => 'today'], ['date'], ['screenPageViews'], 5000,
            [['dimension' => ['dimensionName' => 'date']]]
        ));
        $daily = gd_ga4_history_daily_map($dailyReport);
        $summary = gd_ga4_history_summary($daily);
        $periodViews = gd_ga4_history_sum_period($daily, $period['startDate'], $period['endDate']);

        $reports = gd_ga4_history_detail_reports($period, $periodViews);
        $events = gd_ga4_history_event_counts($reports['events'] ?? []);
        $summary['demos'] = (int) ($events['demo_click'] ?? 0);
        $summary['contact'] = (int) ($events['contact_click'] ?? 0) + (int) ($events['whatsapp_click'] ?? 0);
        $summary['github'] = (int) ($events['github_click'] ?? 0);
        $summary['activeNow'] = 0;
        $summary['conversion'] = gd_ga4_history_rate($summary['contact'], $periodViews);
        $summary['contactRate'] = $summary['conversion'];
        $summary['demosRate'] = gd_ga4_history_rate($summary['demos'], $periodViews);

        $payload = [
            'ok' => true,
            'configured' => true,
            'source' => 'ga4-history-v7',
            'propertyId' => gd_ga4_property_id(),
            'measurementId' => gd_ga4_measurement_id(),
            'range' => $range,
            'generatedAt' => date(DATE_ATOM),
            'historyAvailable' => $summary['total'] > 0,
            'summary' => $summary,
            'rankings' => [
                'pages' => gd_ga4_history_rows($reports['pages'] ?? []),
                'landingPages' => gd_ga4_history_rows($reports['landing'] ?? []),
                'referrers' => gd_ga4_history_rows($reports['referrers'] ?? []),
                'demos' => gd_ga4_history_event_ranking($events, 'demo_click', 'Demo-Starts'),
                'portfolio' => gd_ga4_history_event_ranking($events, 'portfolio_click', 'Portfolio-Klicks'),
                'ctas' => gd_ga4_history_event_ranking($events, 'cta_click', 'CTA-Klicks'),
                'contacts' => gd_ga4_history_contact_ranking($events),
                'browsers' => gd_ga4_history_rows($reports['browsers'] ?? []),
                'operatingSystems' => gd_ga4_history_rows($reports['os'] ?? []),
                'screens' => gd_ga4_history_rows($reports['screens'] ?? []),
            ],
            'insights' => [
                'bestHour' => gd_ga4_history_best_hour($reports['hours'] ?? []),
                'bestDay' => gd_ga4_history_best_day($daily, $period),
                'topProject' => null,
                'topProjectClicks' => null,
                'lastEvent' => date(DATE_ATOM),
            ],
            'funnel' => [
                'pageviews' => $periodViews,
                'portfolio' => (int) ($events['portfolio_click'] ?? 0),
                'demos' => $summary['demos'],
                'contact' => $summary['contact'],
            ],
            'sources' => gd_ga4_history_sources($reports['sources'] ?? []),
            'devices' => gd_ga4_history_devices($reports['devices'] ?? []),
            'series' => gd_ga4_history_series($daily, $period),
        ];

        gd_ga4_history_store_cache($cache, $payload);
        return $payload;
    } catch (RuntimeException $error) {
        $fallback = gd_ga4_history_fallback_payload($range);
        if ($fallback !== null) return gd_ga4_history_mark_fallback($fallback, $error->getMessage());
        throw $error;
    } finally {
        if ($lock) {
            @flock($lock, LOCK_UN);
            fclose($lock);
        }
    }
}


function gd_ga4_history_payload(string $range = '30', bool $force = false): array
{
    return gd_ga4_history_dashboard_payload($range, $force);
}


function gd_ga4_history_normalize_range(string $range): string
{
    return in_array($range, ['7', '30', '90', 'all'], true) ? $range : '30';
}


function gd_ga4_history_period(string $range): array
{
    if ($range === 'all') return ['startDate' => '2020-01-01', 'endDate' => date('Y-m-d')];
    $days = (int) $range;
    return [
        'startDate' => date('Y-m-d', strtotime('-' . ($days - 1) . ' days')),
        'endDate' => date('Y-m-d'),
    ];
}


function gd_ga4_history_report_request(array $period, array $dimensions, array $metrics, int $limit, array $orderBys = []): array
{
    $request = [
        'dateRanges' => [[
            'startDate' => (string) ($period['startDate'] ?? $period['start'] ?? '30daysAgo'),
            'endDate' => (string) ($period['endDate'] ?? $period['end'] ?? 'today'),
        ]],
        'metrics' => array_map(static fn(string $name): array => ['name' => $name], $metrics),
        'limit' => (string) $limit,
    ];
    if ($dimensions !== []) $request['dimensions'] = array_map(static fn(string $name): array => ['name' => $name], $dimensions);
    if ($orderBys !== []) $request['orderBys'] = $orderBys;
    return $request;
}


function gd_ga4_history_daily_map(array $report): array
{
    $result = [];
    foreach ((array) ($report['rows'] ?? []) as $row) {
        $raw = (string) ($row['dimensionValues'][0]['value'] ?? '');
        $date = DateTime::createFromFormat('Ymd', $raw);
        if (!$date) continue;
        $result[$date->format('Y-m-d')] = gd_ga4_metric((array) $row, 0);
    }
    ksort($result);
    return $result;
}


function gd_ga4_history_summary(array $daily): array
{
    $today = date('Y-m-d');
    $yesterday = date('Y-m-d', strtotime('-1 day'));
    $dayBefore = date('Y-m-d', strtotime('-2 days'));
    $week = gd_ga4_history_sum_last_days($daily, 7, 0);
    $previousWeek = gd_ga4_history_sum_last_days($daily, 7, 7);
    $month = gd_ga4_history_sum_last_days($daily, 30, 0);
    $previousMonth = gd_ga4_history_sum_last_days($daily, 30, 30);
    $todayViews = (int) ($daily[$today] ?? 0);
    $yesterdayViews = (int) ($daily[$yesterday] ?? 0);

    return [
        'today' => $todayViews,
        'yesterday' => $yesterdayViews,
        'week' => $week,
        'month' => $month,
        'total' => array_sum($daily),
        'todayDelta' => gd_ga4_history_percent_change($todayViews, $yesterdayViews),
        'yesterdayDelta' => gd_ga4_history_percent_change($yesterdayViews, (int) ($daily[$dayBefore] ?? 0)),
        'weekDelta' => gd_ga4_history_percent_change($week, $previousWeek),
        'monthDelta' => gd_ga4_history_percent_change($month, $previousMonth),
    ];
}


function gd_ga4_history_sum_last_days(array $daily, int $days, int $offset): int
{
    $sum = 0;
    for ($index = $offset; $index < $offset + $days; $index++) {
        $key = date('Y-m-d', strtotime('-' . $index . ' days'));
        $sum += (int) ($daily[$key] ?? 0);
    }
    return $sum;
}


function gd_ga4_history_sum_period(array $daily, string $start, string $end): int
{
    $sum = 0;
    foreach ($daily as $date => $value) {
        if ($date >= $start && $date <= $end) $sum += (int) $value;
    }
    return $sum;
}


function gd_ga4_history_percent_change(int $current, int $previous): ?float
{
    if ($previous === 0) return $current === 0 ? 0.0 : null;
    return ($current - $previous) / $previous * 100;
}


function gd_ga4_history_detail_reports(array $period, int $periodViews): array
{
    $specs = [
        'pages' => gd_ga4_history_report_request($period, ['pageTitle'], ['screenPageViews'], 20, [gd_ga4_history_metric_order('screenPageViews')]),
        'landing' => gd_ga4_history_report_request($period, ['landingPagePlusQueryString'], ['sessions'], 20, [gd_ga4_history_metric_order('sessions')]),
        'referrers' => gd_ga4_history_report_request($period, ['sessionSourceMedium'], ['sessions'], 20, [gd_ga4_history_metric_order('sessions')]),
        'sources' => gd_ga4_history_report_request($period, ['sessionSource'], ['sessions'], 50, [gd_ga4_history_metric_order('sessions')]),
        'devices' => gd_ga4_history_report_request($period, ['deviceCategory'], ['activeUsers'], 10, [gd_ga4_history_metric_order('activeUsers')]),
        'browsers' => gd_ga4_history_report_request($period, ['browser'], ['activeUsers'], 15, [gd_ga4_history_metric_order('activeUsers')]),
        'os' => gd_ga4_history_report_request($period, ['operatingSystem'], ['activeUsers'], 15, [gd_ga4_history_metric_order('activeUsers')]),
        'screens' => gd_ga4_history_report_request($period, ['screenResolution'], ['activeUsers'], 15, [gd_ga4_history_metric_order('activeUsers')]),
        'hours' => gd_ga4_history_report_request($period, ['hour'], ['screenPageViews'], 24, [gd_ga4_history_metric_order('screenPageViews')]),
        'events' => gd_ga4_history_report_request($period, ['eventName'], ['eventCount'], 100, [gd_ga4_history_metric_order('eventCount')]),
    ];

    try {
        $reports = gd_ga4_history_batch_reports($specs);
        if ($periodViews > 0 && empty($reports['pages']['rows'])) return gd_ga4_history_direct_reports($specs);
        return $reports;
    } catch (RuntimeException) {
        return gd_ga4_history_direct_reports($specs);
    }
}


function gd_ga4_history_batch_reports(array $specs): array
{
    $result = [];
    foreach (array_chunk($specs, 5, true) as $chunk) {
        $response = gd_ga4_request('batchRunReports', ['requests' => array_values($chunk)]);
        $reports = array_values((array) ($response['reports'] ?? []));
        if (count($reports) !== count($chunk)) throw new RuntimeException('ga4_history_incomplete');
        foreach (array_keys($chunk) as $index => $name) $result[$name] = (array) ($reports[$index] ?? []);
    }
    return $result;
}


function gd_ga4_history_direct_reports(array $specs): array
{
    $result = [];
    foreach ($specs as $name => $request) {
        try { $result[$name] = gd_ga4_request('runReport', $request); }
        catch (RuntimeException) { $result[$name] = []; }
    }
    return $result;
}


function gd_ga4_history_metric_order(string $metric): array
{
    return ['metric' => ['metricName' => $metric], 'desc' => true];
}


function gd_ga4_history_rows(array $report, int $limit = 8): array
{
    $result = [];
    foreach (array_slice((array) ($report['rows'] ?? []), 0, $limit) as $row) {
        $label = trim((string) ($row['dimensionValues'][0]['value'] ?? ''));
        $value = gd_ga4_metric((array) $row, 0);
        if ($label !== '' && $label !== '(not set)' && $value > 0) $result[] = ['label' => $label, 'value' => $value];
    }
    return $result;
}


function gd_ga4_history_event_counts(array $report): array
{
    $result = [];
    foreach ((array) ($report['rows'] ?? []) as $row) {
        $name = trim((string) ($row['dimensionValues'][0]['value'] ?? ''));
        if ($name !== '') $result[$name] = gd_ga4_metric((array) $row, 0);
    }
    return $result;
}


function gd_ga4_history_event_ranking(array $events, string $event, string $label): array
{
    $value = (int) ($events[$event] ?? 0);
    return $value > 0 ? [['label' => $label, 'value' => $value]] : [];
}


function gd_ga4_history_contact_ranking(array $events): array
{
    $labels = ['whatsapp_click' => 'WhatsApp', 'contact_click' => 'Kontakt', 'contact_form_submit' => 'Formular bestätigt'];
    $result = [];
    foreach ($labels as $event => $label) {
        $value = (int) ($events[$event] ?? 0);
        if ($value > 0) $result[] = ['label' => $label, 'value' => $value];
    }
    return $result;
}


function gd_ga4_history_rate(int $value, int $views): ?float
{
    return $views > 0 ? $value / $views * 100 : null;
}


function gd_ga4_history_sources(array $report): array
{
    $counts = ['Direkt' => 0, 'Google' => 0, 'Social' => 0, 'Sonstige' => 0];
    foreach (gd_ga4_history_rows($report, 100) as $row) {
        $source = strtolower((string) $row['label']);
        $group = 'Sonstige';
        if ($source === '(direct)' || $source === 'direct') $group = 'Direkt';
        elseif (str_contains($source, 'google')) $group = 'Google';
        elseif (preg_match('/facebook|instagram|tiktok|linkedin|twitter|x\.com|youtube|reddit|pinterest/', $source)) $group = 'Social';
        $counts[$group] += (int) $row['value'];
    }
    $total = array_sum($counts);
    $result = [];
    foreach ($counts as $label => $value) {
        $result[] = ['label' => $label, 'value' => $value, 'percent' => $total > 0 ? $value / $total * 100 : 0];
    }
    return $result;
}


function gd_ga4_history_devices(array $report): array
{
    $result = ['desktop' => 0, 'tablet' => 0, 'mobile' => 0];
    foreach (gd_ga4_history_rows($report, 20) as $row) {
        $key = strtolower((string) $row['label']);
        if (array_key_exists($key, $result)) $result[$key] += (int) $row['value'];
    }
    return $result;
}


function gd_ga4_history_series(array $daily, array $period): array
{
    $result = [];
    foreach ($daily as $date => $views) {
        if ($date < $period['startDate'] || $date > $period['endDate']) continue;
        $result[] = ['date' => $date, 'views' => (int) $views];
    }
    return $result;
}


function gd_ga4_history_best_day(array $daily, array $period): string
{
    $series = gd_ga4_history_series($daily, $period);
    if ($series === []) return '–';
    usort($series, static fn(array $a, array $b): int => $b['views'] <=> $a['views']);
    return date('d.m.Y', strtotime((string) $series[0]['date']));
}


function gd_ga4_history_best_hour(array $report): string
{
    $rows = gd_ga4_history_rows($report, 1);
    if ($rows === []) return '–';
    $hour = max(0, min(23, (int) preg_replace('/\D/', '', (string) $rows[0]['label'])));
    return sprintf('%02d:00–%02d:59', $hour, $hour);
}


function gd_ga4_history_cache_path(string $range): string
{
    return __DIR__ . '/data/ga4-history-v7-' . $range . '.json';
}


function gd_ga4_history_lock_path(string $range): string
{
    return __DIR__ . '/data/ga4-history-v7-' . $range . '.lock';
}


function gd_ga4_history_cached_payload(string $path, int $maxAge = 900): ?array
{
    clearstatcache(true, $path);
    if (!is_file($path) || filemtime($path) < time() - $maxAge) return null;
    return gd_ga4_history_read_payload($path);
}


function gd_ga4_history_read_payload(string $path): ?array
{
    if (!is_file($path) || !is_readable($path)) return null;
    $data = json_decode((string) @file_get_contents($path), true);
    return is_array($data) && isset($data['summary']['week']) ? $data : null;
}


function gd_ga4_history_fallback_payload(string $range): ?array
{
    $candidates = [
        gd_ga4_history_cache_path($range),
        __DIR__ . '/data/ga4-history-v4-' . $range . '.json',
    ];
    foreach ($candidates as $path) {
        $payload = gd_ga4_history_read_payload($path);
        if ($payload !== null) return $payload;
    }
    return null;
}


function gd_ga4_history_mark_fallback(array $payload, string $reason): array
{
    $payload['ok'] = true;
    $payload['source'] = 'ga4-cache-fallback';
    $payload['stale'] = true;
    $payload['warning'] = $reason;
    return $payload;
}


function gd_ga4_history_store_cache(string $path, array $payload): void
{
    $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if (is_string($json)) @file_put_contents($path, $json, LOCK_EX);
}
