<?php

require_once __DIR__ . '/config.php';

if (version_compare(PHP_VERSION, '8.1.0', '<')) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Version de PHP no compatible',
        'mensaje' => 'El servidor debe usar PHP 8.1 o superior para ejecutar Eloquent.'
    ]);
    exit;
}

if (!extension_loaded('pdo_mysql')) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Extension faltante',
        'mensaje' => 'La extension pdo_mysql no esta habilitada en el servidor.'
    ]);
    exit;
}

$autoloadPath = __DIR__ . '/../vendor/autoload.php';
if (!file_exists($autoloadPath)) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Eloquent no esta instalado',
        'mensaje' => 'Ejecuta composer install en la raiz del proyecto para usar Eloquent standalone.'
    ]);
    exit;
}

require_once $autoloadPath;

use Illuminate\Container\Container;
use Illuminate\Events\Dispatcher;
use Illuminate\Database\Capsule\Manager as Capsule;

if (empty($GLOBALS['ELOQUENT_BOOTSTRAPPED'])) {
    $capsule = new Capsule;
    $capsule->addConnection([
        'driver' => 'mysql',
        'host' => $GLOBALS['DB_CONFIG']['host'],
        'port' => $GLOBALS['DB_CONFIG']['port'],
        'database' => $GLOBALS['DB_CONFIG']['database'],
        'username' => $GLOBALS['DB_CONFIG']['username'],
        'password' => $GLOBALS['DB_CONFIG']['password'],
        'charset' => 'utf8mb4',
        'collation' => 'utf8mb4_unicode_ci',
        'prefix' => '',
    ]);

    $capsule->setEventDispatcher(new Dispatcher(new Container));
    $capsule->setAsGlobal();
    $capsule->bootEloquent();

    $GLOBALS['ELOQUENT_BOOTSTRAPPED'] = true;
}
