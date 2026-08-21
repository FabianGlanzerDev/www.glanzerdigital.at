<?php
declare(strict_types=1);

$privateRoot = dirname(__DIR__, 3) . DIRECTORY_SEPARATOR . 'server-private';
$library = $privateRoot . DIRECTORY_SEPARATOR . 'lib.php';

if (!is_file($library)) {
    http_response_code(500);
    exit('Admin-Konfiguration fehlt.');
}

require_once $library;
gd_session_start();
