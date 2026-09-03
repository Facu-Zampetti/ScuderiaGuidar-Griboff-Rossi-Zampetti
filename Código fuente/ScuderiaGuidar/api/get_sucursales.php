<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/bootstrap_eloquent.php';

use Illuminate\Database\Capsule\Manager as Capsule;

try {
    if (!Capsule::schema()->hasTable('sucursales')) {
        echo json_encode([], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $hasCoordinates = Capsule::schema()->hasColumn('sucursales', 'Latitud')
        && Capsule::schema()->hasColumn('sucursales', 'Longitud');

    $query = Capsule::table('sucursales')
        ->select('ID', 'Nombre', 'Direccion', 'Horario_Apertura', 'Horario_Cierre')
        ->orderBy('Nombre', 'asc');

    if ($hasCoordinates) {
        $query->addSelect('Latitud', 'Longitud');
    } else {
        $query->selectRaw('NULL as Latitud')
            ->selectRaw('NULL as Longitud');
    }

    $sucursales = $query
        ->get()
        ->map(function ($row) {
            return (array) $row;
        })
        ->all();

    echo json_encode($sucursales, JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error en consulta SQL: ' . $e->getMessage()]);
}
?>
