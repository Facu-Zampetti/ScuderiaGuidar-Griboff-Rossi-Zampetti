<?php
require_once __DIR__ . '/config.php';

$apiKey = trim((string) (getenv('GOOGLE_MAPS_API_KEY') ?: ''));

echo json_encode([
    'apiKey' => $apiKey,
    'cityCenter' => [
        'lat' => -31.4201,
        'lng' => -64.1888,
    ],
    'airport' => [
        'name' => 'Aeropuerto Internacional Ingeniero Aeronautico Ambrosio Taravella',
        'address' => 'Av. La Voz del Interior 8500, Cordoba',
        'lat' => -31.3236,
        'lng' => -64.2080,
    ],
], JSON_UNESCAPED_UNICODE);
?>
