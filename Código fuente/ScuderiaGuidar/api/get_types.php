<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/bootstrap_eloquent.php';

use Illuminate\Database\Capsule\Manager as Capsule;

try {
    $types = Capsule::table('tipos as t')
        ->select('t.ID_Tipos', 't.Nombre', 't.Descripcion', 't.Precio')
        ->selectRaw('(SELECT Foto FROM autos a WHERE a.ID_Tipos = t.ID_Tipos AND a.Disponibilidad = 1 LIMIT 1) as FotoEjemplo')
        ->selectRaw('(SELECT COUNT(*) FROM autos a WHERE a.ID_Tipos = t.ID_Tipos) as CantidadAutos')
        ->orderBy('t.Nombre', 'asc')
        ->get()
        ->map(function ($row) {
            return (array) $row;
        })
        ->all();

    echo json_encode($types, JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error en consulta SQL: ' . $e->getMessage()]);
}
?>