<?php
declare(strict_types=1);
require __DIR__ . '/includes/bootstrap.php';
gd_logout();
header('Location: /admin/login.php');
exit;
