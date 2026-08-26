<?php
declare(strict_types=1);
require dirname(__DIR__) . '/includes/bootstrap.php';

gd_require_firebase_admin();
if ($_SERVER['REQUEST_METHOD'] !== 'GET') gd_admin_json(['ok' => false, 'message' => 'Methode nicht erlaubt.'], 405);

require gd_admin_private_path('lib.php');
require gd_admin_private_path('search-console.php');

try {
    gd_admin_json(gd_search_dashboard_payload());
} catch (RuntimeException $error) {
    [$message, $status] = gd_search_console_error($error->getMessage());
    gd_admin_json(['ok' => false, 'configured' => false, 'message' => $message], $status);
}


function gd_search_console_error(string $code): array
{
    if ($code === 'service_account_missing') return ['Google-Service-Account fehlt im server-private Ordner.', 503];
    if ($code === 'search_console_forbidden') return ['Service-Account hat noch keinen Zugriff auf die Search-Console-Property.', 403];
    if ($code === 'search_console_property_missing') return ['Die Search-Console-Property wurde bei Google nicht gefunden.', 404];
    if ($code === 'property_missing') return ['Search-Console-Property fehlt in der Server-Konfiguration.', 503];
    return ['Google Search Console konnte nicht geladen werden.', 502];
}
