<?php
declare(strict_types=1);

require dirname(__DIR__) . '/includes/bootstrap.php';

gd_require_firebase_admin();
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    gd_admin_json(['ok' => false, 'message' => 'Methode nicht erlaubt.'], 405);
}

$library = gd_admin_private_path('lib.php');
$analytics = gd_admin_private_path('google-analytics.php');
if (!is_file($library) || !is_file($analytics)) {
    gd_admin_json(['ok' => false, 'message' => 'GA4-Serverintegration fehlt.'], 503);
}

require_once $library;
require_once $analytics;

try {
    $force = ($_GET['force'] ?? '') === '1';
    gd_admin_json(gd_ga4_dashboard_payload($force));
} catch (RuntimeException $error) {
    gd_admin_json(['ok' => false, 'message' => gd_ga4_admin_error($error->getMessage())], 503);
}


function gd_ga4_admin_error(string $code): string
{
    $messages = [
        'service_account_missing' => 'Google-Service-Account fehlt.',
        'service_account_invalid' => 'Google-Service-Account ist ungültig.',
        'ga4_property_missing' => 'GA4 Property-ID fehlt oder ist nicht erreichbar.',
        'ga4_forbidden_or_api_disabled' => 'GA4-Zugriff verweigert: Data API und Betrachter-Berechtigung prüfen.',
        'ga4_quota_exceeded' => 'GA4-API-Limit vorübergehend erreicht.',
        'google_auth_failed' => 'Google-Service-Account konnte nicht authentifiziert werden.',
        'openssl_unavailable' => 'OpenSSL ist auf dem Server nicht verfügbar.',
    ];
    return $messages[$code] ?? (str_starts_with($code, 'ga4_api_error:') ? $code : 'GA4 Data API nicht erreichbar.');
}
