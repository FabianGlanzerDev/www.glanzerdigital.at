<?php
declare(strict_types=1);

require dirname(__DIR__) . '/includes/bootstrap.php';

gd_require_firebase_admin();
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    gd_admin_json(['ok' => false, 'message' => 'Methode nicht erlaubt.'], 405);
}

$range = (string) ($_GET['range'] ?? '30');
if (!in_array($range, ['7', '30', '90', 'all'], true)) $range = '30';
$force = ($_GET['force'] ?? '') === '1';


const GD_ANALYTICS_API_BUILD = '20260827-endpoint-reset-2';


function gd_admin_analytics_json(array $payload, int $status = 200): never
{
    $payload['build'] = GD_ANALYTICS_API_BUILD;
    header('X-Glanzer-Analytics-Build: ' . GD_ANALYTICS_API_BUILD);
    gd_admin_json($payload, $status);
}

$local = gd_admin_analytics_payload($range);
$library = gd_admin_private_path('lib.php');
$analytics = gd_admin_private_path('google-analytics.php');

if (!is_file($library) || !is_file($analytics)) {
    gd_admin_analytics_json(gd_admin_local_fallback($local, 'GA4-Serverintegration fehlt.'));
}

require_once $library;
require_once $analytics;

try {
    $history = gd_ga4_history_dashboard_payload($range, $force);
    if (!isset($history['summary']['week'])) {
        gd_admin_analytics_json(gd_admin_local_fallback($local, 'GA4-Historie lieferte kein vollständiges Dashboard.'));
    }
    gd_admin_analytics_json(gd_admin_merge_history_with_local($history, $local));
} catch (Throwable $error) {
    $warning = $error instanceof RuntimeException
        ? gd_admin_ga4_message($error->getMessage())
        : 'PHP-Fehler im GA4-Historienmodul (' . get_class($error) . ').';
    gd_admin_analytics_json(gd_admin_local_fallback($local, $warning));
}


function gd_admin_merge_history_with_local(array $history, array $local): array
{
    $localSummary = (array) ($local['summary'] ?? []);
    $historySummary = (array) ($history['summary'] ?? []);
    $historyRankings = (array) ($history['rankings'] ?? []);
    $localRankings = (array) ($local['rankings'] ?? []);

    $historySummary['activeNow'] = (int) ($localSummary['activeNow'] ?? 0);
    foreach (['demos', 'github'] as $key) {
        if ((int) ($historySummary[$key] ?? 0) === 0) {
            $historySummary[$key] = (int) ($localSummary[$key] ?? 0);
        }
    }
    $historySummary['contact'] = max(
        (int) ($historySummary['contact'] ?? 0),
        (int) ($localSummary['contact'] ?? 0)
    );

    foreach (['demos', 'contacts', 'portfolio', 'ctas'] as $name) {
        if ((array) ($localRankings[$name] ?? []) !== []) {
            $historyRankings[$name] = (array) $localRankings[$name];
        }
    }

    $historyRankings['contacts'] = gd_admin_normalize_contact_rows(
        (array) ($historyRankings['contacts'] ?? [])
    );

    $history['ok'] = true;
    $history['summary'] = $historySummary;
    $history['rankings'] = $historyRankings;
    $history['insights'] = array_replace(
        (array) ($history['insights'] ?? []),
        array_filter([
            'topProject' => $local['insights']['topProject'] ?? null,
            'topProjectClicks' => $local['insights']['topProjectClicks'] ?? null,
            'lastEvent' => $local['insights']['lastEvent'] ?? null,
        ], static fn($value): bool => $value !== null)
    );
    return $history;
}


function gd_admin_local_fallback(array $local, string $warning): array
{
    $local['ok'] = true;
    $local['source'] = 'local-analytics-fallback';
    $local['warning'] = $warning;
    $local['generatedAt'] = date(DATE_ATOM);
    return $local;
}


function gd_admin_ga4_message(string $code): string
{
    $messages = [
        'service_account_missing' => 'Google-Service-Account fehlt.',
        'service_account_invalid' => 'Google-Service-Account ist ungültig.',
        'ga4_property_missing' => 'GA4 Property-ID fehlt oder ist nicht erreichbar.',
        'ga4_forbidden_or_api_disabled' => 'GA4-Zugriff verweigert: Data API oder Betrachter-Berechtigung prüfen.',
        'ga4_quota_exceeded' => 'GA4-API-Limit vorübergehend erreicht.',
        'ga4_history_incomplete' => 'GA4 hat eine unvollständige historische Antwort geliefert.',
        'ga4_history_busy' => 'GA4-Historie wird gerade aktualisiert.',
        'google_auth_failed' => 'Google-Service-Account konnte nicht authentifiziert werden.',
        'openssl_unavailable' => 'OpenSSL ist auf dem Server nicht verfügbar.',
    ];
    if (isset($messages[$code])) return $messages[$code];
    return str_starts_with($code, 'ga4_api_error:') ? $code : 'GA4-Historie konnte nicht aktualisiert werden.';
}
