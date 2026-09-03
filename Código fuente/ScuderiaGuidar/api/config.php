<?php

function load_env_file(string $filePath): void
{
    if (!is_file($filePath) || !is_readable($filePath)) {
        return;
    }

    $lines = file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if (!is_array($lines)) {
        return;
    }

    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#')) {
            continue;
        }

        if (str_starts_with($line, 'export ')) {
            $line = trim(substr($line, 7));
        }

        $eqPos = strpos($line, '=');
        if ($eqPos === false) {
            continue;
        }

        $key = trim(substr($line, 0, $eqPos));
        $value = trim(substr($line, $eqPos + 1));

        if ($key === '') {
            continue;
        }

        if (
            (str_starts_with($value, '"') && str_ends_with($value, '"'))
            || (str_starts_with($value, "'") && str_ends_with($value, "'"))
        ) {
            $value = substr($value, 1, -1);
        }

        if (getenv($key) !== false) {
            continue;
        }

        putenv($key . '=' . $value);
        $_ENV[$key] = $value;
        $_SERVER[$key] = $value;
    }
}

header('Content-Type: application/json; charset=utf-8');

$projectRoot = dirname(__DIR__);
load_env_file($projectRoot . '/.env');
load_env_file($projectRoot . '/.env.local');

$httpHost = strtolower($_SERVER['HTTP_HOST'] ?? '');
$httpHost = preg_replace('/:\d+$/', '', $httpHost);
$isLocal = in_array($httpHost, ['localhost', '127.0.0.1'], true) || $httpHost === '';

$DB_HOST = getenv('DB_HOST') ?: 'localhost';
$DB_PORT = (int)(getenv('DB_PORT') ?: 3306);

if ($isLocal) {
    $DB_USER = getenv('DB_USER') ?: 'root';
    $DB_PASS = getenv('DB_PASS');
    $DB_PASS = ($DB_PASS === false) ? '' : $DB_PASS;
    $DB_NAME = getenv('DB_NAME') ?: 'scuderiaguidar_flota';
} else {
    $DB_USER = getenv('DB_USER') ?: 'scuderiaguidar_usuariodatos';
    $DB_PASS = getenv('DB_PASS');
    $DB_PASS = ($DB_PASS === false) ? '' : $DB_PASS;
    $DB_NAME = getenv('DB_NAME') ?: 'scuderiaguidar_flota';
}

$GLOBALS['DB_CONFIG'] = [
    'host' => $DB_HOST,
    'port' => $DB_PORT,
    'database' => $DB_NAME,
    'username' => $DB_USER,
    'password' => $DB_PASS,
];

?>