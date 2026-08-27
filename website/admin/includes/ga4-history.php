<?php
declare(strict_types=1);

const GD_HISTORY_CACHE_SECONDS = 60;

function gd_history_payload(string $range, bool $force = false): array
{
    $cache = gd_history_cache_path($range);
    if (!$force && ($cached = gd_history_read_cache($cache)) !== null) return $cached;

    $period = gd_history_period($range);
    $reports = gd_history_reports($period);
    $events = gd_history_event_counts($reports['events'] ?? []);
    $views = gd_history_metric($reports['periodViews'] ?? []);

    $summary = [
        'today' => gd_history_metric($reports['today'] ?? []),
        'yesterday' => gd_history_metric($reports['yesterday'] ?? []),
        'week' => gd_history_metric($reports['week'] ?? []),
        'month' => gd_history_metric($reports['month'] ?? []),
        'total' => gd_history_metric($reports['total'] ?? []),
        'demos' => (int) ($events['demo_click'] ?? 0),
        'contact' => (int) ($events['contact_click'] ?? 0) + (int) ($events['whatsapp_click'] ?? 0),
        'github' => (int) ($events['github_click'] ?? 0),
        'activeNow' => 0,
    ];

    $summary['conversion'] = gd_history_rate($summary['contact'], $views);
    $summary['contactRate'] = $summary['conversion'];
    $summary['demosRate'] = gd_history_rate($summary['demos'], $views);
    $summary['todayDelta'] = gd_admin_percent_change($summary['today'], gd_history_metric($reports['previousDay'] ?? []));
    $summary['yesterdayDelta'] = gd_admin_percent_change($summary['yesterday'], gd_history_metric($reports['dayBefore'] ?? []));
    $summary['weekDelta'] = gd_admin_percent_change($summary['week'], gd_history_metric($reports['previousWeek'] ?? []));
    $summary['monthDelta'] = gd_admin_percent_change($summary['month'], gd_history_metric($reports['previousMonth'] ?? []));

    $payload = [
        'ok' => true,
        'source' => 'ga4-shared-service',
        'propertyId' => gd_ga4_property_id(),
        'range' => $range,
        'generatedAt' => date(DATE_ATOM),
        'summary' => $summary,
        'rankings' => [
            'pages' => gd_history_rows($reports['pages'] ?? []),
            'landingPages' => gd_history_rows($reports['landing'] ?? []),
            'referrers' => gd_history_rows($reports['referrers'] ?? []),
            'demos' => gd_history_event_ranking($events, 'demo_click', 'Demo-Starts'),
            'portfolio' => gd_history_event_ranking($events, 'portfolio_click', 'Portfolio-Klicks'),
            'ctas' => gd_history_event_ranking($events, 'cta_click', 'CTA-Klicks'),
            'contacts' => gd_history_contact_ranking($events),
            'browsers' => gd_history_rows($reports['browsers'] ?? []),
            'operatingSystems' => gd_history_rows($reports['os'] ?? []),
            'screens' => gd_history_rows($reports['screens'] ?? []),
        ],
        'insights' => [
            'bestHour' => gd_history_best_hour($reports['hours'] ?? []),
            'bestDay' => gd_history_best_day($reports['series'] ?? []),
            'topProject' => null,
            'topProjectClicks' => null,
            'lastEvent' => date(DATE_ATOM),
        ],
        'funnel' => [
            'pageviews' => $views,
            'portfolio' => (int) ($events['portfolio_click'] ?? 0),
            'demos' => $summary['demos'],
            'contact' => $summary['contact'],
        ],
        'sources' => gd_history_sources($reports['sources'] ?? []),
        'devices' => gd_history_devices($reports['devices'] ?? []),
        'series' => gd_history_series($reports['series'] ?? []),
    ];

    gd_history_write_cache($cache, $payload);
    return $payload;
}

function gd_history_reports(array $period): array
{
    $specs = [
        'today' => gd_history_request(['start' => 'today', 'end' => 'today'], [], ['screenPageViews'], 1),
        'previousDay' => gd_history_request(['start' => 'yesterday', 'end' => 'yesterday'], [], ['screenPageViews'], 1),
        'yesterday' => gd_history_request(['start' => 'yesterday', 'end' => 'yesterday'], [], ['screenPageViews'], 1),
        'dayBefore' => gd_history_request(['start' => '2daysAgo', 'end' => '2daysAgo'], [], ['screenPageViews'], 1),
        'week' => gd_history_request(['start' => '6daysAgo', 'end' => 'today'], [], ['screenPageViews'], 1),
        'previousWeek' => gd_history_request(['start' => '13daysAgo', 'end' => '7daysAgo'], [], ['screenPageViews'], 1),
        'month' => gd_history_request(['start' => '29daysAgo', 'end' => 'today'], [], ['screenPageViews'], 1),
        'previousMonth' => gd_history_request(['start' => '59daysAgo', 'end' => '30daysAgo'], [], ['screenPageViews'], 1),
        'total' => gd_history_request(['start' => '2020-01-01', 'end' => 'today'], [], ['screenPageViews'], 1),
        'periodViews' => gd_history_request($period, [], ['screenPageViews'], 1),
        'series' => gd_history_request($period, ['date'], ['screenPageViews'], 1000, [['dimension' => ['dimensionName' => 'date']]]),
        'pages' => gd_history_request($period, ['pageTitle'], ['screenPageViews'], 20, [gd_history_metric_order('screenPageViews')]),
        'landing' => gd_history_request($period, ['landingPagePlusQueryString'], ['sessions'], 20, [gd_history_metric_order('sessions')]),
        'referrers' => gd_history_request($period, ['sessionSourceMedium'], ['sessions'], 20, [gd_history_metric_order('sessions')]),
        'sources' => gd_history_request($period, ['sessionSource'], ['sessions'], 50, [gd_history_metric_order('sessions')]),
        'devices' => gd_history_request($period, ['deviceCategory'], ['activeUsers'], 10, [gd_history_metric_order('activeUsers')]),
        'browsers' => gd_history_request($period, ['browser'], ['activeUsers'], 15, [gd_history_metric_order('activeUsers')]),
        'os' => gd_history_request($period, ['operatingSystem'], ['activeUsers'], 15, [gd_history_metric_order('activeUsers')]),
        'screens' => gd_history_request($period, ['screenResolution'], ['activeUsers'], 15, [gd_history_metric_order('activeUsers')]),
        'hours' => gd_history_request($period, ['hour'], ['screenPageViews'], 24, [gd_history_metric_order('screenPageViews')]),
        'events' => gd_history_request($period, ['eventName'], ['eventCount'], 100, [gd_history_metric_order('eventCount')]),
    ];

    $result = [];
    foreach (array_chunk($specs, 5, true) as $chunk) {
        $response = gd_ga4_request('batchRunReports', ['requests' => array_values($chunk)]);
        $batch = array_values((array) ($response['reports'] ?? []));
        if (count($batch) !== count($chunk)) throw new RuntimeException('ga4_history_incomplete');
        foreach (array_keys($chunk) as $index => $name) $result[$name] = (array) ($batch[$index] ?? []);
    }
    return $result;
}

function gd_history_request(array $period, array $dimensions, array $metrics, int $limit, array $orderBys = []): array
{
    $request = [
        'dateRanges' => [['startDate' => $period['start'], 'endDate' => $period['end']]],
        'metrics' => array_map(static fn(string $name): array => ['name' => $name], $metrics),
        'limit' => (string) $limit,
    ];
    if ($dimensions !== []) $request['dimensions'] = array_map(static fn(string $name): array => ['name' => $name], $dimensions);
    if ($orderBys !== []) $request['orderBys'] = $orderBys;
    return $request;
}

function gd_history_metric_order(string $metric): array
{
    return ['metric' => ['metricName' => $metric], 'desc' => true];
}

function gd_history_period(string $range): array
{
    if ($range === 'all') return ['start' => '2020-01-01', 'end' => 'today'];
    $days = in_array((int) $range, [7, 30, 90], true) ? (int) $range : 30;
    return ['start' => ($days - 1) . 'daysAgo', 'end' => 'today'];
}

function gd_history_metric(array $report): int
{
    return (int) round((float) ($report['rows'][0]['metricValues'][0]['value'] ?? 0));
}

function gd_history_rows(array $report, int $limit = 8): array
{
    $result = [];
    foreach (array_slice((array) ($report['rows'] ?? []), 0, $limit) as $row) {
        $label = trim((string) ($row['dimensionValues'][0]['value'] ?? ''));
        $value = (int) round((float) ($row['metricValues'][0]['value'] ?? 0));
        if ($label !== '' && $label !== '(not set)' && $value > 0) $result[] = ['label' => $label, 'value' => $value];
    }
    return $result;
}

function gd_history_event_counts(array $report): array
{
    $result = [];
    foreach ((array) ($report['rows'] ?? []) as $row) {
        $name = trim((string) ($row['dimensionValues'][0]['value'] ?? ''));
        if ($name !== '') $result[$name] = (int) round((float) ($row['metricValues'][0]['value'] ?? 0));
    }
    return $result;
}

function gd_history_event_ranking(array $events, string $event, string $label): array
{
    $value = (int) ($events[$event] ?? 0);
    return $value > 0 ? [['label' => $label, 'value' => $value]] : [];
}

function gd_history_contact_ranking(array $events): array
{
    $map = ['whatsapp_click' => 'WhatsApp', 'contact_click' => 'Kontakt', 'contact_form_submit' => 'Formular bestätigt'];
    $result = [];
    foreach ($map as $event => $label) {
        $value = (int) ($events[$event] ?? 0);
        if ($value > 0) $result[] = ['label' => $label, 'value' => $value];
    }
    return $result;
}

function gd_history_rate(int $value, int $views): ?float
{
    return $views > 0 ? $value / $views * 100 : null;
}

function gd_history_sources(array $report): array
{
    $counts = ['Direkt' => 0, 'Google' => 0, 'Social' => 0, 'Sonstige' => 0];
    foreach (gd_history_rows($report, 100) as $row) {
        $source = strtolower((string) $row['label']);
        $group = 'Sonstige';
        if ($source === '(direct)' || $source === 'direct') $group = 'Direkt';
        elseif (str_contains($source, 'google')) $group = 'Google';
        elseif (preg_match('/facebook|instagram|tiktok|linkedin|twitter|x\.com|youtube|reddit|pinterest/', $source)) $group = 'Social';
        $counts[$group] += (int) $row['value'];
    }
    $total = array_sum($counts);
    return array_map(static fn(string $label, int $value): array => [
        'label' => $label,
        'value' => $value,
        'percent' => $total > 0 ? $value / $total * 100 : 0,
    ], array_keys($counts), array_values($counts));
}

function gd_history_devices(array $report): array
{
    $result = ['desktop' => 0, 'tablet' => 0, 'mobile' => 0];
    foreach (gd_history_rows($report, 20) as $row) {
        $key = strtolower((string) $row['label']);
        if (array_key_exists($key, $result)) $result[$key] += (int) $row['value'];
    }
    return $result;
}

function gd_history_series(array $report): array
{
    $result = [];
    foreach ((array) ($report['rows'] ?? []) as $row) {
        $raw = (string) ($row['dimensionValues'][0]['value'] ?? '');
        $date = DateTime::createFromFormat('Ymd', $raw);
        if (!$date) continue;
        $result[] = ['date' => $date->format('Y-m-d'), 'views' => (int) round((float) ($row['metricValues'][0]['value'] ?? 0))];
    }
    return $result;
}

function gd_history_best_day(array $report): string
{
    $rows = (array) ($report['rows'] ?? []);
    if ($rows === []) return '–';
    usort($rows, static fn(array $a, array $b): int => ((float) ($b['metricValues'][0]['value'] ?? 0)) <=> ((float) ($a['metricValues'][0]['value'] ?? 0)));
    $date = DateTime::createFromFormat('Ymd', (string) ($rows[0]['dimensionValues'][0]['value'] ?? ''));
    return $date ? $date->format('d.m.Y') : '–';
}

function gd_history_best_hour(array $report): string
{
    $rows = gd_history_rows($report, 1);
    if ($rows === []) return '–';
    $hour = max(0, min(23, (int) preg_replace('/\D/', '', (string) $rows[0]['label'])));
    return sprintf('%02d:00–%02d:59', $hour, $hour);
}

function gd_history_cache_path(string $range): string
{
    return gd_admin_private_path('data/ga4-history-v3-' . $range . '.json');
}

function gd_history_read_cache(string $path): ?array
{
    clearstatcache(true, $path);
    if (!is_file($path) || filemtime($path) < time() - GD_HISTORY_CACHE_SECONDS) return null;
    $data = json_decode((string) @file_get_contents($path), true);
    return is_array($data) && isset($data['summary']['week']) ? $data : null;
}

function gd_history_write_cache(string $path, array $payload): void
{
    @file_put_contents($path, json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), LOCK_EX);
}
