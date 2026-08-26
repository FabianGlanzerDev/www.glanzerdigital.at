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
