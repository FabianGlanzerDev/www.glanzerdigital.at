<?php
declare(strict_types=1);

require dirname(__DIR__) . '/includes/bootstrap.php';

gd_require_firebase_admin();
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    gd_admin_json(['ok' => false, 'message' => 'Methode nicht erlaubt.'], 405);
}

$privateDir = gd_admin_private_path();
$dataDir = gd_admin_private_path('data');
$configPath = gd_admin_private_path('config.php');
$analyticsPath = gd_admin_private_path('google-analytics.php');
$serviceAccountPath = gd_admin_private_path('google-service-account.json');
$config = is_file($configPath) ? require $configPath : [];
$config = is_array($config) ? $config : [];
$property = trim((string) ($config['ga4_property_id'] ?? ''));
$contactMailPath = gd_admin_website_path('api/contact-mail.php');

$checks = [
    'privateStorage' => is_dir($privateDir) && is_dir($dataDir) && is_writable($dataDir),
    'analyticsFile' => is_file($analyticsPath) && is_readable($analyticsPath),
    'openssl' => function_exists('openssl_verify') && function_exists('openssl_sign'),
    'searchConsole' => is_file($serviceAccountPath) && is_readable($serviceAccountPath),
    'ga4' => ctype_digit($property) && is_file($serviceAccountPath) && is_file($analyticsPath),
    'sitemap' => is_file(gd_admin_website_path('sitemap.xml')),
    'robots' => is_file(gd_admin_website_path('robots.txt')),
    'contactMail' => is_file($contactMailPath) && is_readable($contactMailPath) && function_exists('mail'),
];

gd_admin_json(['ok' => true, 'checks' => $checks]);
