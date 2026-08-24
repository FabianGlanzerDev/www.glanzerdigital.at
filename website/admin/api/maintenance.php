<?php
declare(strict_types=1);
require dirname(__DIR__) . '/includes/bootstrap.php';

gd_require_firebase_admin();
if ($_SERVER['REQUEST_METHOD'] === 'GET') gd_admin_json(['ok' => true, 'enabled' => gd_admin_maintenance_enabled()]);
if ($_SERVER['REQUEST_METHOD'] !== 'POST') gd_admin_json(['ok' => false, 'message' => 'Methode nicht erlaubt.'], 405);
$body = file_get_contents('php://input');
$payload = json_decode(is_string($body) ? $body : '', true);
if (!is_array($payload) || !array_key_exists('enabled', $payload)) gd_admin_json(['ok' => false, 'message' => 'Ungültige Anfrage.'], 400);
$enabled = filter_var($payload['enabled'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
if ($enabled === null) gd_admin_json(['ok' => false, 'message' => 'Ungültiger Wartungsstatus.'], 400);
if (!gd_admin_set_maintenance($enabled)) gd_admin_json(['ok' => false, 'message' => 'Wartungsmodus konnte nicht geändert werden.'], 500);
gd_admin_json(['ok' => true, 'enabled' => gd_admin_maintenance_enabled()]);
