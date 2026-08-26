<?php
declare(strict_types=1);

const GD_SEARCH_SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';
const GD_GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GD_SEARCH_API_BASE = 'https://www.googleapis.com/webmasters/v3/sites/';


function gd_search_config(): array
{
    return gd_private_config();
}


function gd_search_service_account(): array
{
    $path = (string) (gd_search_config()['google_service_account_file'] ?? '');
    if ($path === '' || !is_file($path)) throw new RuntimeException('service_account_missing');
    $json = json_decode((string) file_get_contents($path), true);
    if (!is_array($json)) throw new RuntimeException('service_account_invalid');
    if (empty($json['client_email']) || empty($json['private_key'])) throw new RuntimeException('service_account_invalid');
    return $json;
}


function gd_search_b64(string $value): string
{
    return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
}


function gd_search_jwt(array $account): string
{
    $now = time();
    $header = gd_search_b64(json_encode(['alg' => 'RS256', 'typ' => 'JWT'], JSON_UNESCAPED_SLASHES));
    $claims = ['iss' => $account['client_email'], 'scope' => GD_SEARCH_SCOPE, 'aud' => GD_GOOGLE_TOKEN_URL, 'iat' => $now, 'exp' => $now + 3600];
    $payload = gd_search_b64(json_encode($claims, JSON_UNESCAPED_SLASHES));
    $signed = $header . '.' . $payload;
    if (!function_exists('openssl_sign')) throw new RuntimeException('openssl_unavailable');
    if (!openssl_sign($signed, $signature, (string) $account['private_key'], OPENSSL_ALGO_SHA256)) throw new RuntimeException('jwt_sign_failed');
    return $signed . '.' . gd_search_b64($signature);
}


function gd_search_http(string $url, array $headers, string $body): array
{
    if (function_exists('curl_init')) return gd_search_http_curl($url, $headers, $body);
    return gd_search_http_stream($url, $headers, $body);
}


function gd_search_http_curl(string $url, array $headers, string $body): array
{
    $curl = curl_init($url);
    curl_setopt_array($curl, [CURLOPT_RETURNTRANSFER => true, CURLOPT_POST => true, CURLOPT_POSTFIELDS => $body, CURLOPT_HTTPHEADER => $headers, CURLOPT_TIMEOUT => 12]);
    $response = curl_exec($curl);
    $status = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
    curl_close($curl);
    return [$status, is_string($response) ? $response : ''];
}


function gd_search_http_stream(string $url, array $headers, string $body): array
{
    $context = stream_context_create(['http' => ['method' => 'POST', 'header' => implode("\r\n", $headers), 'content' => $body, 'timeout' => 12, 'ignore_errors' => true]]);
    $response = @file_get_contents($url, false, $context);
    $line = $http_response_header[0] ?? '';
    preg_match('/\s(\d{3})\s/', $line, $match);
    return [(int) ($match[1] ?? 0), is_string($response) ? $response : ''];
}


function gd_search_access_token(): string
{
    static $token = '';
    if ($token !== '') return $token;
    $assertion = gd_search_jwt(gd_search_service_account());
    $body = http_build_query(['grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer', 'assertion' => $assertion]);
    [$status, $response] = gd_search_http(GD_GOOGLE_TOKEN_URL, ['Content-Type: application/x-www-form-urlencoded'], $body);
    $data = json_decode($response, true);
    if ($status !== 200 || !is_array($data) || empty($data['access_token'])) throw new RuntimeException('google_auth_failed');
    return $token = (string) $data['access_token'];
}


function gd_search_query(array $dimensions = [], int $limit = 1000): array
{
    $property = (string) (gd_search_config()['search_console_property'] ?? '');
    if ($property === '') throw new RuntimeException('property_missing');
    $url = GD_SEARCH_API_BASE . rawurlencode($property) . '/searchAnalytics/query';
    $body = gd_search_request_body($dimensions, $limit);
    [$status, $response] = gd_search_http($url, ['Authorization: Bearer ' . gd_search_access_token(), 'Content-Type: application/json'], $body);
    $data = json_decode($response, true);
    if ($status !== 200 || !is_array($data)) throw new RuntimeException(gd_search_api_error($data, $status));
    return (array) ($data['rows'] ?? []);
}


function gd_search_request_body(array $dimensions, int $limit): string
{
    $end = date('Y-m-d', strtotime('-2 days'));
    $start = date('Y-m-d', strtotime($end . ' -27 days'));
    $payload = ['startDate' => $start, 'endDate' => $end, 'rowLimit' => max(1, min(25000, $limit)), 'dataState' => 'final'];
    if ($dimensions !== []) $payload['dimensions'] = $dimensions;
    return (string) json_encode($payload, JSON_UNESCAPED_SLASHES);
}


function gd_search_api_error(mixed $data, int $status): string
{
    $message = is_array($data) ? (string) ($data['error']['message'] ?? '') : '';
    if ($status === 403) return 'search_console_forbidden';
    if ($status === 404) return 'search_console_property_missing';
    return $message !== '' ? 'google_api_error: ' . $message : 'google_api_error';
}


function gd_search_metric_row(array $row): array
{
    return ['clicks' => (float) ($row['clicks'] ?? 0), 'impressions' => (float) ($row['impressions'] ?? 0), 'ctr' => (float) ($row['ctr'] ?? 0), 'position' => (float) ($row['position'] ?? 0)];
}


function gd_search_summary(): array
{
    $rows = gd_search_query([], 1);
    return $rows ? gd_search_metric_row($rows[0]) : ['clicks' => 0, 'impressions' => 0, 'ctr' => 0, 'position' => 0];
}


function gd_search_rows(string $dimension, int $limit = 100): array
{
    $rows = gd_search_query([$dimension], $limit);
    return array_map(static fn(array $row): array => gd_search_named_row($dimension, $row), $rows);
}


function gd_search_named_row(string $dimension, array $row): array
{
    $value = (string) (($row['keys'][0] ?? '') ?: '–');
    $metrics = gd_search_metric_row($row);
    if ($dimension === 'query') return ['query' => $value] + $metrics;
    return ['label' => gd_search_label($dimension, $value)] + $metrics;
}


function gd_search_label(string $dimension, string $value): string
{
    if ($dimension === 'device') return ['DESKTOP' => 'Desktop', 'MOBILE' => 'Smartphone', 'TABLET' => 'Tablet'][$value] ?? $value;
    if ($dimension === 'page') return gd_search_page_label($value);
    if ($dimension === 'country') return gd_search_country_label($value);
    return $value;
}


function gd_search_page_label(string $value): string
{
    $path = (string) parse_url($value, PHP_URL_PATH);
    return $path !== '' ? $path : $value;
}


function gd_search_country_label(string $value): string
{
    $map = ['aut' => 'Österreich', 'deu' => 'Deutschland', 'che' => 'Schweiz', 'usa' => 'USA', 'gbr' => 'Vereinigtes Königreich'];
    $key = strtolower($value);
    return $map[$key] ?? strtoupper($value);
}


function gd_search_opportunity(array $queries): array
{
    $candidates = array_filter($queries, static fn(array $row): bool => ($row['impressions'] ?? 0) >= 10 && ($row['position'] ?? 0) >= 4 && ($row['position'] ?? 0) <= 20);
    usort($candidates, static fn(array $a, array $b): int => gd_search_score($b) <=> gd_search_score($a));
    if (!$candidates) return [];
    $best = $candidates[0];
    return ['query' => $best['query'], 'description' => 'Viele Impressionen bei Position ' . number_format((float) $best['position'], 1, ',', '.') . ' – hier lohnt sich gezielte SEO-Optimierung.'];
}


function gd_search_score(array $row): int
{
    return (int) round((float) ($row['impressions'] ?? 0) * max(0.05, 1 - (float) ($row['ctr'] ?? 0)));
}


function gd_search_dashboard_payload(): array
{
    $queries = gd_search_rows('query', 250);
    return [
        'ok' => true, 'configured' => true, 'property' => (string) (gd_search_config()['search_console_property'] ?? ''),
        'summary' => gd_search_summary(), 'queries' => array_slice($queries, 0, 12),
        'countries' => gd_search_rows('country', 20), 'pages' => gd_search_rows('page', 20),
        'devices' => gd_search_rows('device', 10), 'opportunity' => gd_search_opportunity($queries),
    ];
}
