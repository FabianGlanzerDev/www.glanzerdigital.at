<?php
declare(strict_types=1);
require dirname(__DIR__) . '/includes/bootstrap.php';

gd_require_firebase_admin();
if ($_SERVER['REQUEST_METHOD'] !== 'GET') gd_admin_json(['ok' => false, 'message' => 'Methode nicht erlaubt.'], 405);

$privateDir = gd_admin_private_path();
$dataDir = gd_admin_private_path('data');
$config = is_file(gd_admin_private_path('config.php')) ? require gd_admin_private_path('config.php') : [];
$serviceFile = is_array($config) ? (string) ($config['google_service_account_file'] ?? '') : '';

gd_admin_json([
    'ok' => true,
    'checks' => [
        'privateStorage' => is_dir($privateDir) && is_dir($dataDir) && is_writable($dataDir),
        'analyticsFile' => is_file(gd_admin_private_path('data/analytics.json')) && is_writable(gd_admin_private_path('data/analytics.json')),
        'openssl' => function_exists('openssl_verify') && function_exists('openssl_sign'),
        'searchConsole' => $serviceFile !== '' && is_file($serviceFile),
        'ga4' => $serviceFile !== '' && is_file($serviceFile) && !empty($config['ga4_property_id']),
        'sitemap' => is_file(gd_admin_website_path('sitemap.xml')),
        'robots' => is_file(gd_admin_website_path('robots.txt')),
    ],
]);
