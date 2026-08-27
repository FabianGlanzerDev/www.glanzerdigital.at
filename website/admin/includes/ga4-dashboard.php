<?php
declare(strict_types=1);

const GD_GA4_API = 'https://analyticsdata.googleapis.com/v1beta';
const GD_GA4_ADMIN_API = 'https://analyticsadmin.googleapis.com/v1beta';
const GD_GA4_SCOPE = 'https://www.googleapis.com/auth/analytics.readonly';
const GD_GA4_CACHE_TTL = 60;


function gd_ga4_historical_payload(string $range, bool $force = false): array
{
    $cache = gd_ga4_history_cache_path($range);
    if (!$force) {
        $cached = gd_ga4_read_cache($cache, GD_GA4_CACHE_TTL);
        if ($cached !== null) return $cached;
    }

    $context = gd_ga4_context();
    $payload = gd_ga4_build_history_payload($context, $range);
    gd_ga4_write_cache($cache, $payload);
    return $payload;
}


function gd_ga4_context(): array
{
    $privateRoot = gd_admin_private_path();
    $config = gd_ga4_load_private_config($privateRoot);
    $service = gd_ga4_load_service_account($privateRoot, $config);
    $token = gd_ga4_access_token($service);
    $propertyId = gd_ga4_property_id($privateRoot, $config, $token);
    return ['token' => $token, 'propertyId' => $propertyId];
}


function gd_ga4_load_private_config(string $privateRoot): array
{
    foreach (['analytics-config.php', 'config.php'] as $name) {
        $path = $privateRoot . DIRECTORY_SEPARATOR . $name;
        if (!is_file($path)) continue;
        $config = require $path;
        if (is_array($config)) return $config;
    }
    return [];
}


function gd_ga4_load_service_account(string $privateRoot, array $config): array
{
    $configured = gd_ga4_configured_service_file($privateRoot, $config);
    if ($configured !== null) return gd_ga4_decode_service_account($configured);

    foreach (gd_ga4_json_candidates($privateRoot) as $path) {
        try { return gd_ga4_decode_service_account($path); }
        catch (RuntimeException) { continue; }
    }
    throw new RuntimeException('service_account_missing');
}


function gd_ga4_configured_service_file(string $root, array $config): ?string
{
    foreach (['service_account_file', 'google_service_account_file', 'serviceAccountFile'] as $key) {
        $value = trim((string) ($config[$key] ?? ''));
        if ($value === '') continue;
        $path = gd_ga4_resolve_path($root, $value);
        if (is_file($path)) return $path;
    }
    return null;
}


function gd_ga4_json_candidates(string $root): array
{
    $files = glob($root . DIRECTORY_SEPARATOR . '*.json') ?: [];
    usort($files, static function (string $a, string $b): int {
        $score = static fn(string $path): int => preg_match('/service[-_ ]?account|google/i', basename($path)) ? 0 : 1;
        return $score($a) <=> $score($b);
    });
    return $files;
}


function gd_ga4_resolve_path(string $root, string $path): string
{
    if (preg_match('~^(?:[A-Za-z]:[\\\\/]|/)~', $path)) return $path;
    return $root . DIRECTORY_SEPARATOR . ltrim($path, '/\\');
}


function gd_ga4_decode_service_account(string $path): array
{
    $data = json_decode((string) @file_get_contents($path), true);
    if (!is_array($data)) throw new RuntimeException('service_account_invalid');
    foreach (['client_email', 'private_key'] as $key) {
        if (trim((string) ($data[$key] ?? '')) === '') throw new RuntimeException('service_account_invalid');
    }
    return $data;
}


function gd_ga4_property_id(string $privateRoot, array $config, string $token): string
{
    $configured = gd_ga4_property_from_config($config);
    if ($configured !== null) return $configured;

    $scanned = gd_ga4_property_from_private_files($privateRoot);
    if ($scanned !== null) return $scanned;

    return gd_ga4_property_from_admin_api($token);
}


function gd_ga4_property_from_config(array $config): ?string
{
    foreach (['ga4_property_id', 'property_id', 'google_analytics_property_id'] as $key) {
        $value = gd_ga4_normalize_property((string) ($config[$key] ?? ''));
        if ($value !== null) return $value;
    }
    return null;
}


function gd_ga4_property_from_private_files(string $root): ?string
{
    $files = array_merge(glob($root . '/*.php') ?: [], glob($root . '/*.txt') ?: []);
    foreach ($files as $path) {
        $content = (string) @file_get_contents($path);
        foreach (gd_ga4_property_patterns() as $pattern) {
            if (!preg_match($pattern, $content, $match)) continue;
            $value = gd_ga4_normalize_property((string) ($match[1] ?? ''));
            if ($value !== null) return $value;
        }
    }
    return null;
}


function gd_ga4_property_patterns(): array
{
    return [
        '/ga4_property_id[^0-9]{0,30}([0-9]{6,})/i',
        '/properties\\/([0-9]{6,})/i',
        '/property[_ -]?id[^0-9]{0,30}([0-9]{6,})/i',
    ];
}


function gd_ga4_normalize_property(string $value): ?string
{
    if (preg_match('/([0-9]{6,})/', $value, $match)) return $match[1];
    return null;
}


function gd_ga4_property_from_admin_api(string $token): string
{
    $data = gd_ga4_http_json('GET', GD_GA4_ADMIN_API . '/accountSummaries?pageSize=200', $token);
    $properties = gd_ga4_admin_properties($data);
    if ($properties === []) throw new RuntimeException('ga4_property_missing');

    foreach ($properties as $property) {
        if (stripos((string) ($property['displayName'] ?? ''), 'glanzer') !== false) return $property['id'];
    }
    if (count($properties) === 1) return $properties[0]['id'];
    throw new RuntimeException('ga4_property_missing');
}


function gd_ga4_admin_properties(array $data): array
{
    $result = [];
    foreach ((array) ($data['accountSummaries'] ?? []) as $account) {
        foreach ((array) ($account['propertySummaries'] ?? []) as $property) {
            $id = gd_ga4_normalize_property((string) ($property['property'] ?? ''));
            if ($id !== null) $result[] = ['id' => $id, 'displayName' => (string) ($property['displayName'] ?? '')];
        }
    }
    return $result;
}


function gd_ga4_access_token(array $service): string
{
    $cache = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . 'gd-ga4-access-token.json';
    $cached = gd_ga4_read_token_cache($cache, (string) $service['client_email']);
    if ($cached !== null) return $cached;

    $assertion = gd_ga4_signed_assertion($service);
    $data = gd_ga4_token_request($assertion);
    $token = trim((string) ($data['access_token'] ?? ''));
    if ($token === '') throw new RuntimeException('google_auth_failed');
    gd_ga4_write_token_cache($cache, $token, (string) $service['client_email'], (int) ($data['expires_in'] ?? 3600));
    return $token;
}


function gd_ga4_signed_assertion(array $service): string
{
    if (!function_exists('openssl_sign')) throw new RuntimeException('openssl_unavailable');
    $now = time();
    $header = gd_ga4_base64url(json_encode(['alg' => 'RS256', 'typ' => 'JWT'], JSON_UNESCAPED_SLASHES));
    $claims = ['iss' => $service['client_email'], 'scope' => GD_GA4_SCOPE, 'aud' => 'https://oauth2.googleapis.com/token', 'iat' => $now, 'exp' => $now + 3600];
    $payload = gd_ga4_base64url(json_encode($claims, JSON_UNESCAPED_SLASHES));
    $unsigned = $header . '.' . $payload;
    if (!openssl_sign($unsigned, $signature, (string) $service['private_key'], OPENSSL_ALGO_SHA256)) throw new RuntimeException('google_auth_failed');
    return $unsigned . '.' . gd_ga4_base64url($signature);
}


function gd_ga4_base64url(string $value): string
{
    return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
}


function gd_ga4_token_request(string $assertion): array
{
    $body = http_build_query(['grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer', 'assertion' => $assertion]);
    return gd_ga4_http_json('POST', 'https://oauth2.googleapis.com/token', '', $body, ['Content-Type: application/x-www-form-urlencoded']);
}


function gd_ga4_build_history_payload(array $context, string $range): array
{
    $period = gd_ga4_range_dates($range);
    $base = gd_ga4_load_base_reports($context, $period);
    $optional = gd_ga4_load_optional_reports($context, $period);
    $events = gd_ga4_event_counts($optional['events']);
    $local = gd_ga4_local_fallback($range);
    return gd_ga4_compose_payload($context, $range, $period, $base, $optional, $events, $local);
}


function gd_ga4_load_base_reports(array $context, array $period): array
{
    $specs = [
        'today' => gd_ga4_report_request(['start' => 'today', 'end' => 'today'], [], ['screenPageViews'], 1),
        'yesterday' => gd_ga4_report_request(['start' => 'yesterday', 'end' => 'yesterday'], [], ['screenPageViews'], 1),
        'dayBefore' => gd_ga4_report_request(['start' => '2daysAgo', 'end' => '2daysAgo'], [], ['screenPageViews'], 1),
        'week' => gd_ga4_report_request(['start' => '6daysAgo', 'end' => 'today'], [], ['screenPageViews'], 1),
        'previousWeek' => gd_ga4_report_request(['start' => '13daysAgo', 'end' => '7daysAgo'], [], ['screenPageViews'], 1),
        'month' => gd_ga4_report_request(['start' => '29daysAgo', 'end' => 'today'], [], ['screenPageViews'], 1),
        'previousMonth' => gd_ga4_report_request(['start' => '59daysAgo', 'end' => '30daysAgo'], [], ['screenPageViews'], 1),
        'total' => gd_ga4_report_request(['start' => '2020-01-01', 'end' => 'today'], [], ['screenPageViews'], 1),
        'periodViews' => gd_ga4_report_request($period, [], ['screenPageViews'], 1),
        'series' => gd_ga4_report_request($period, ['date'], ['screenPageViews'], 1000, [['dimension' => ['dimensionName' => 'date']]]),
        'pages' => gd_ga4_report_request($period, ['pageTitle'], ['screenPageViews'], 10, [gd_ga4_metric_order('screenPageViews')]),
    ];
    $reports = gd_ga4_batch_named_reports($context, $specs);
    foreach (['today', 'yesterday', 'dayBefore', 'week', 'previousWeek', 'month', 'previousMonth', 'total', 'periodViews'] as $key) {
        $reports[$key] = (int) round(gd_ga4_first_metric($reports[$key] ?? []));
    }
    return $reports;
}


function gd_ga4_load_optional_reports(array $context, array $period): array
{
    $specs = [
        'landing' => gd_ga4_report_request($period, ['landingPagePlusQueryString'], ['sessions'], 10, [gd_ga4_metric_order('sessions')]),
        'referrers' => gd_ga4_report_request($period, ['sessionSourceMedium'], ['sessions'], 10, [gd_ga4_metric_order('sessions')]),
        'sources' => gd_ga4_report_request($period, ['sessionSource'], ['sessions'], 50, [gd_ga4_metric_order('sessions')]),
        'devices' => gd_ga4_report_request($period, ['deviceCategory'], ['activeUsers'], 10, [gd_ga4_metric_order('activeUsers')]),
        'browsers' => gd_ga4_report_request($period, ['browser'], ['activeUsers'], 10, [gd_ga4_metric_order('activeUsers')]),
        'os' => gd_ga4_report_request($period, ['operatingSystem'], ['activeUsers'], 10, [gd_ga4_metric_order('activeUsers')]),
        'screens' => gd_ga4_report_request($period, ['screenResolution'], ['activeUsers'], 10, [gd_ga4_metric_order('activeUsers')]),
        'hours' => gd_ga4_report_request($period, ['hour'], ['screenPageViews'], 24, [gd_ga4_metric_order('screenPageViews')]),
        'events' => gd_ga4_report_request($period, ['eventName'], ['eventCount'], 100, [gd_ga4_metric_order('eventCount')]),
    ];
    try {
        return gd_ga4_batch_named_reports($context, $specs);
    } catch (RuntimeException) {
        $empty = [];
        foreach (array_keys($specs) as $key) $empty[$key] = [];
        return $empty;
    }
}


function gd_ga4_report_request(array $period, array $dimensions, array $metrics, int $limit = 10, array $orderBys = []): array
{
    $request = ['dateRanges' => [['startDate' => $period['start'], 'endDate' => $period['end']]], 'limit' => (string) $limit];
    if ($dimensions !== []) $request['dimensions'] = array_map(static fn(string $name): array => ['name' => $name], $dimensions);
    if ($metrics !== []) $request['metrics'] = array_map(static fn(string $name): array => ['name' => $name], $metrics);
    if ($orderBys !== []) $request['orderBys'] = $orderBys;
    return $request;
}


function gd_ga4_batch_named_reports(array $context, array $specs): array
{
    $result = [];
    foreach (array_chunk($specs, 5, true) as $chunk) {
        $url = GD_GA4_API . '/properties/' . rawurlencode($context['propertyId']) . ':batchRunReports';
        $payload = json_encode(['requests' => array_values($chunk)], JSON_UNESCAPED_SLASHES);
        $data = gd_ga4_http_json('POST', $url, $context['token'], $payload, ['Content-Type: application/json']);
        $reports = array_values((array) ($data['reports'] ?? []));
        if (count($reports) !== count($chunk)) throw new RuntimeException('ga4_api_error:incomplete_batch');
        $index = 0;
        foreach (array_keys($chunk) as $name) $result[$name] = is_array($reports[$index] ?? null) ? $reports[$index++] : [];
    }
    return $result;
}


function gd_ga4_metric(array $context, string $start, string $end, string $metric): int
{
    $report = gd_ga4_report($context, ['start' => $start, 'end' => $end], [], [$metric], 1);
    return (int) round(gd_ga4_first_metric($report));
}


function gd_ga4_report(array $context, array $period, array $dimensions, array $metrics, int $limit = 10, array $orderBys = []): array
{
    $request = ['dateRanges' => [['startDate' => $period['start'], 'endDate' => $period['end']]], 'limit' => (string) $limit];
    if ($dimensions !== []) $request['dimensions'] = array_map(static fn(string $name): array => ['name' => $name], $dimensions);
    if ($metrics !== []) $request['metrics'] = array_map(static fn(string $name): array => ['name' => $name], $metrics);
    if ($orderBys !== []) $request['orderBys'] = $orderBys;
    $url = GD_GA4_API . '/properties/' . rawurlencode($context['propertyId']) . ':runReport';
    return gd_ga4_http_json('POST', $url, $context['token'], json_encode($request, JSON_UNESCAPED_SLASHES), ['Content-Type: application/json']);
}


function gd_ga4_safe_report(array $context, array $period, array $dimensions, array $metrics, int $limit = 10, array $orderBys = []): array
{
    try { return gd_ga4_report($context, $period, $dimensions, $metrics, $limit, $orderBys); }
    catch (RuntimeException) { return []; }
}


function gd_ga4_metric_order(string $metric): array
{
    return ['metric' => ['metricName' => $metric], 'desc' => true];
}


function gd_ga4_first_metric(array $report): float
{
    $row = $report['rows'][0] ?? null;
    $value = is_array($row) ? ($row['metricValues'][0]['value'] ?? 0) : 0;
    return (float) $value;
}


function gd_ga4_range_dates(string $range): array
{
    if ($range === 'all') return ['start' => '2020-01-01', 'end' => 'today'];
    $days = in_array((int) $range, [7, 30, 90], true) ? (int) $range : 30;
    return ['start' => ($days - 1) . 'daysAgo', 'end' => 'today'];
}


function gd_ga4_compose_payload(array $context, string $range, array $period, array $base, array $optional, array $events, array $local): array
{
    $views = (int) $base['periodViews'];
    $custom = gd_ga4_custom_metrics($events, $local, $views);
    $demos = gd_ga4_demo_ranking($events, $local);
    return [
        'ok' => true,
        'source' => 'ga4',
        'propertyId' => $context['propertyId'],
        'range' => $range,
        'generatedAt' => date(DATE_ATOM),
        'summary' => gd_ga4_summary($base, $custom, $views),
        'rankings' => gd_ga4_rankings($base, $optional, $events, $local, $demos),
        'insights' => gd_ga4_insights($base, $optional, $demos),
        'funnel' => gd_ga4_funnel($custom, $views),
        'sources' => gd_ga4_source_distribution($optional['sources']),
        'devices' => gd_ga4_device_counts($optional['devices']),
        'series' => gd_ga4_series($base['series']),
    ];
}


function gd_ga4_summary(array $base, array $custom, int $views): array
{
    return [
        'today' => $base['today'], 'yesterday' => $base['yesterday'], 'week' => $base['week'], 'month' => $base['month'], 'total' => $base['total'],
        'demos' => $custom['demos'], 'contact' => $custom['contact'], 'github' => $custom['github'], 'activeNow' => 0,
        'conversion' => gd_ga4_rate($custom['contact'], $views), 'contactRate' => gd_ga4_rate($custom['contact'], $views), 'demosRate' => gd_ga4_rate($custom['demos'], $views),
        'todayDelta' => gd_admin_percent_change($base['today'], $base['yesterday']),
        'yesterdayDelta' => gd_admin_percent_change($base['yesterday'], $base['dayBefore']),
        'weekDelta' => gd_admin_percent_change($base['week'], $base['previousWeek']),
        'monthDelta' => gd_admin_percent_change($base['month'], $base['previousMonth']),
    ];
}


function gd_ga4_custom_metrics(array $events, array $local, int $views): array
{
    $localEvents = (array) ($local['events'] ?? []);
    $demo = gd_ga4_prefer_metric($events['demo_click'] ?? 0, $localEvents['demo_click'] ?? 0);
    $github = gd_ga4_prefer_metric($events['github_click'] ?? 0, $localEvents['github_click'] ?? 0);
    $portfolio = gd_ga4_prefer_metric($events['portfolio_click'] ?? 0, $localEvents['portfolio_click'] ?? 0);
    $contactGa4 = (int) ($events['contact_click'] ?? 0) + (int) ($events['whatsapp_click'] ?? 0);
    $contact = gd_ga4_prefer_metric($contactGa4, $localEvents['contact_click'] ?? 0);
    return ['demos' => $demo, 'github' => $github, 'portfolio' => $portfolio, 'contact' => $contact, 'views' => $views];
}


function gd_ga4_prefer_metric(int $ga4, int $local): int
{
    return $ga4 > 0 ? $ga4 : $local;
}


function gd_ga4_rate(int $value, int $views): ?float
{
    return $views > 0 ? $value / $views * 100 : null;
}


function gd_ga4_rankings(array $base, array $optional, array $events, array $local, array $demos): array
{
    return [
        'pages' => gd_ga4_rows($base['pages']),
        'demos' => $demos,
        'landingPages' => gd_ga4_rows($optional['landing']),
        'referrers' => gd_ga4_rows($optional['referrers']),
        'portfolio' => gd_ga4_portfolio_ranking($events, $local),
        'ctas' => gd_ga4_cta_ranking($events, $local),
        'contacts' => gd_ga4_contact_ranking($events, $local),
        'browsers' => gd_ga4_rows($optional['browsers']),
        'operatingSystems' => gd_ga4_rows($optional['os']),
        'screens' => gd_ga4_rows($optional['screens']),
    ];
}


function gd_ga4_rows(array $report, int $limit = 8): array
{
    $rows = [];
    foreach (array_slice((array) ($report['rows'] ?? []), 0, $limit) as $row) {
        $label = trim((string) ($row['dimensionValues'][0]['value'] ?? ''));
        $value = (int) round((float) ($row['metricValues'][0]['value'] ?? 0));
        if ($label !== '' && $label !== '(not set)' && $value > 0) $rows[] = ['label' => $label, 'value' => $value];
    }
    return $rows;
}


function gd_ga4_event_counts(array $report): array
{
    $counts = [];
    foreach ((array) ($report['rows'] ?? []) as $row) {
        $name = trim((string) ($row['dimensionValues'][0]['value'] ?? ''));
        $value = (int) round((float) ($row['metricValues'][0]['value'] ?? 0));
        if ($name !== '') $counts[$name] = $value;
    }
    return $counts;
}


function gd_ga4_demo_ranking(array $events, array $local): array
{
    $localRows = (array) ($local['demos'] ?? []);
    if ($localRows !== []) return $localRows;
    $value = (int) ($events['demo_click'] ?? 0);
    return $value > 0 ? [['label' => 'Demo-Starts', 'value' => $value]] : [];
}


function gd_ga4_portfolio_ranking(array $events, array $local): array
{
    $rows = (array) ($local['portfolio'] ?? []);
    if ($rows !== []) return $rows;
    $value = (int) ($events['portfolio_click'] ?? 0);
    return $value > 0 ? [['label' => 'Portfolio-Klicks', 'value' => $value]] : [];
}


function gd_ga4_cta_ranking(array $events, array $local): array
{
    $rows = (array) ($local['ctas'] ?? []);
    if ($rows !== []) return $rows;
    $value = (int) ($events['cta_click'] ?? 0);
    return $value > 0 ? [['label' => 'CTA-Klicks', 'value' => $value]] : [];
}


function gd_ga4_contact_ranking(array $events, array $local): array
{
    $rows = (array) ($local['contacts'] ?? []);
    if ($rows !== []) return $rows;
    $map = ['whatsapp_click' => 'WhatsApp', 'contact_click' => 'Kontakt', 'contact_form_submit' => 'Formular bestätigt'];
    $result = [];
    foreach ($map as $event => $label) {
        $value = (int) ($events[$event] ?? 0);
        if ($value > 0) $result[] = ['label' => $label, 'value' => $value];
    }
    return $result;
}


function gd_ga4_insights(array $base, array $optional, array $demos): array
{
    return [
        'bestHour' => gd_ga4_best_hour($optional['hours']),
        'bestDay' => gd_ga4_best_day($base['series']),
        'topProject' => $demos[0]['label'] ?? null,
        'topProjectClicks' => $demos[0]['value'] ?? null,
        'lastEvent' => date(DATE_ATOM),
    ];
}


function gd_ga4_best_hour(array $report): string
{
    $rows = gd_ga4_rows($report, 1);
    if ($rows === []) return '–';
    $hour = (int) preg_replace('/\D/', '', $rows[0]['label']);
    return sprintf('%02d:00–%02d:59', $hour, $hour);
}


function gd_ga4_best_day(array $report): string
{
    $rows = (array) ($report['rows'] ?? []);
    if ($rows === []) return '–';
    usort($rows, static fn(array $a, array $b): int => ((float) ($b['metricValues'][0]['value'] ?? 0)) <=> ((float) ($a['metricValues'][0]['value'] ?? 0)));
    $date = (string) ($rows[0]['dimensionValues'][0]['value'] ?? '');
    $stamp = DateTime::createFromFormat('Ymd', $date);
    return $stamp ? $stamp->format('d.m.Y') : '–';
}


function gd_ga4_funnel(array $custom, int $views): array
{
    return ['pageviews' => $views, 'portfolio' => $custom['portfolio'], 'demos' => $custom['demos'], 'contact' => $custom['contact']];
}


function gd_ga4_source_distribution(array $report): array
{
    $counts = ['Direkt' => 0, 'Google' => 0, 'Social' => 0, 'Sonstige' => 0];
    foreach (gd_ga4_rows($report, 100) as $row) $counts[gd_ga4_source_group($row['label'])] += $row['value'];
    $total = array_sum($counts);
    $result = [];
    foreach ($counts as $label => $value) $result[] = ['label' => $label, 'value' => $value, 'percent' => $total > 0 ? $value / $total * 100 : 0];
    return $result;
}


function gd_ga4_source_group(string $source): string
{
    $value = strtolower($source);
    if ($value === '(direct)' || $value === 'direct' || $value === '(not set)') return 'Direkt';
    if (str_contains($value, 'google')) return 'Google';
    foreach (['facebook', 'instagram', 'tiktok', 'linkedin', 'twitter', 'x.com', 'youtube', 'reddit', 'pinterest'] as $social) {
        if (str_contains($value, $social)) return 'Social';
    }
    return 'Sonstige';
}


function gd_ga4_device_counts(array $report): array
{
    $devices = ['desktop' => 0, 'tablet' => 0, 'mobile' => 0];
    foreach (gd_ga4_rows($report, 20) as $row) {
        $key = strtolower($row['label']);
        if (array_key_exists($key, $devices)) $devices[$key] += $row['value'];
    }
    return $devices;
}


function gd_ga4_series(array $report): array
{
    $series = [];
    foreach ((array) ($report['rows'] ?? []) as $row) {
        $raw = (string) ($row['dimensionValues'][0]['value'] ?? '');
        $date = DateTime::createFromFormat('Ymd', $raw);
        if (!$date) continue;
        $series[] = ['date' => $date->format('Y-m-d'), 'views' => (int) round((float) ($row['metricValues'][0]['value'] ?? 0))];
    }
    return $series;
}


function gd_ga4_local_fallback(string $range): array
{
    $stored = gd_admin_read_analytics();
    $days = is_array($stored['days'] ?? null) ? $stored['days'] : [];
    $aggregate = gd_admin_aggregate($days, gd_admin_date_keys($days, $range));
    $demos = gd_admin_ranking($aggregate['demos'] ?: gd_admin_fallback_demo_ranking($aggregate['pages']));
    return [
        'events' => $aggregate['events'], 'demos' => $demos, 'portfolio' => gd_admin_ranking($aggregate['portfolio']),
        'ctas' => gd_admin_ranking($aggregate['ctas']), 'contacts' => gd_admin_ranking($aggregate['contacts']),
    ];
}


function gd_ga4_http_json(string $method, string $url, string $token = '', string $body = '', array $headers = []): array
{
    $headers[] = 'Accept: application/json';
    if ($token !== '') $headers[] = 'Authorization: Bearer ' . $token;
    if (function_exists('curl_init')) return gd_ga4_http_curl($method, $url, $body, $headers);
    return gd_ga4_http_stream($method, $url, $body, $headers);
}


function gd_ga4_http_curl(string $method, string $url, string $body, array $headers): array
{
    $curl = curl_init($url);
    $options = [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 15, CURLOPT_CUSTOMREQUEST => $method, CURLOPT_HTTPHEADER => $headers];
    if ($body !== '') $options[CURLOPT_POSTFIELDS] = $body;
    curl_setopt_array($curl, $options);
    $response = curl_exec($curl);
    $status = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
    $error = curl_error($curl);
    curl_close($curl);
    if (!is_string($response)) throw new RuntimeException('ga4_api_error:' . $error);
    return gd_ga4_decode_http_response($response, $status);
}


function gd_ga4_http_stream(string $method, string $url, string $body, array $headers): array
{
    $options = ['http' => ['method' => $method, 'header' => implode("\r\n", $headers), 'content' => $body, 'timeout' => 15, 'ignore_errors' => true]];
    $response = @file_get_contents($url, false, stream_context_create($options));
    $status = gd_ga4_stream_status($http_response_header ?? []);
    if (!is_string($response)) throw new RuntimeException('ga4_api_error:network');
    return gd_ga4_decode_http_response($response, $status);
}


function gd_ga4_stream_status(array $headers): int
{
    foreach ($headers as $header) {
        if (preg_match('~^HTTP/\S+\s+(\d{3})~', $header, $match)) return (int) $match[1];
    }
    return 0;
}


function gd_ga4_decode_http_response(string $response, int $status): array
{
    $data = json_decode($response, true);
    if ($status >= 200 && $status < 300 && is_array($data)) return $data;
    if ($status === 401) throw new RuntimeException('google_auth_failed');
    if ($status === 403) throw new RuntimeException('ga4_forbidden_or_api_disabled');
    if ($status === 429) throw new RuntimeException('ga4_quota_exceeded');
    $message = is_array($data) ? (string) ($data['error']['message'] ?? 'unknown') : 'unknown';
    throw new RuntimeException('ga4_api_error:' . $status . ':' . $message);
}


function gd_ga4_history_cache_path(string $range): string
{
    $safe = preg_replace('/[^a-z0-9_-]/i', '', $range) ?: '30';
    return rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . 'gd-ga4-history-' . $safe . '.json';
}


function gd_ga4_read_cache(string $path, int $ttl): ?array
{
    if (!is_file($path) || filemtime($path) < time() - $ttl) return null;
    $data = json_decode((string) @file_get_contents($path), true);
    return is_array($data) ? $data : null;
}


function gd_ga4_write_cache(string $path, array $payload): void
{
    @file_put_contents($path, json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), LOCK_EX);
}


function gd_ga4_read_token_cache(string $path, string $email): ?string
{
    $data = json_decode((string) @file_get_contents($path), true);
    if (!is_array($data) || ($data['email'] ?? '') !== $email || (int) ($data['expiresAt'] ?? 0) <= time() + 60) return null;
    $token = trim((string) ($data['token'] ?? ''));
    return $token !== '' ? $token : null;
}


function gd_ga4_write_token_cache(string $path, string $token, string $email, int $expiresIn): void
{
    $data = ['email' => $email, 'token' => $token, 'expiresAt' => time() + max(300, $expiresIn - 60)];
    @file_put_contents($path, json_encode($data, JSON_UNESCAPED_SLASHES), LOCK_EX);
}
