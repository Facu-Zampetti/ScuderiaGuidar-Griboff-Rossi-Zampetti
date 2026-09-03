<?php
require_once __DIR__ . '/bootstrap_eloquent.php';

use Illuminate\Database\Capsule\Manager as Capsule;

if (session_status() !== PHP_SESSION_ACTIVE) session_start();

// Acceso exclusivo para administradores (Rol = 1)
if (!isset($_SESSION['cliente_id']) || (int)$_SESSION['cliente_rol'] !== 1) {
    http_response_code(403);
    echo json_encode(['error' => 'Acceso denegado']);
    exit;
}

$stats = [];

try {
    $stats['total_reservas'] = (int) Capsule::table('reservas')->count();

    $stats['total_ingresos'] = (float) Capsule::table('reservas')
        ->whereIn('ID_Estado', [2, 3, 4])
        ->sum('Precio_Total');

    $stats['total_clientes'] = (int) Capsule::table('clientes')->count();

    $autoMasReservado = Capsule::table('reservas as r')
        ->join('autos as a', 'a.ID', '=', 'r.ID_Auto')
        ->selectRaw("CONCAT(a.Marca, ' ', a.Modelo) AS auto_nombre, COUNT(r.ID) AS cantidad")
        ->groupBy('a.ID', 'a.Marca', 'a.Modelo')
        ->orderBy('cantidad', 'desc')
        ->first();

    $stats['auto_mas_reservado'] = $autoMasReservado
        ? ['nombre' => $autoMasReservado->auto_nombre, 'cantidad' => (int) $autoMasReservado->cantidad]
        : ['nombre' => 'Sin datos', 'cantidad' => 0];

    $stats['reservas_por_estado'] = Capsule::table('estados as e')
        ->leftJoin('reservas as r', 'r.ID_Estado', '=', 'e.ID')
        ->select('e.Nombre')
        ->selectRaw('COUNT(r.ID) AS cantidad')
        ->groupBy('e.ID', 'e.Nombre')
        ->orderBy('e.ID')
        ->get()
        ->map(function ($row) {
            return [
                'estado' => $row->Nombre,
                'cantidad' => (int) $row->cantidad,
            ];
        })
        ->all();

    $stats['autos_por_tipo'] = Capsule::table('tipos as t')
        ->leftJoin('autos as a', 'a.ID_Tipos', '=', 't.ID_Tipos')
        ->select('t.Nombre')
        ->selectRaw('COUNT(a.ID) AS cantidad')
        ->groupBy('t.ID_Tipos', 't.Nombre')
        ->orderBy('t.ID_Tipos')
        ->get()
        ->map(function ($row) {
            return [
                'tipo' => $row->Nombre,
                'cantidad' => (int) $row->cantidad,
            ];
        })
        ->all();

    $stats['ingresos_por_fecha'] = Capsule::table('reservas')
        ->selectRaw("DATE_FORMAT(Fecha_Operacion, '%Y-%m-%d') AS fecha")
        ->selectRaw('SUM(Precio_Total) AS total')
        ->whereIn('ID_Estado', [2, 3, 4])
        ->whereNotNull('Fecha_Operacion')
        ->groupBy('Fecha_Operacion')
        ->orderBy('Fecha_Operacion')
        ->limit(30)
        ->get()
        ->map(function ($row) {
            return [
                'fecha' => $row->fecha,
                'total' => (float) $row->total,
            ];
        })
        ->all();

    $stats['top_autos'] = Capsule::table('reservas as r')
        ->join('autos as a', 'a.ID', '=', 'r.ID_Auto')
        ->selectRaw("CONCAT(a.Marca, ' ', a.Modelo) AS auto, COUNT(r.ID) AS cantidad")
        ->groupBy('a.ID', 'a.Marca', 'a.Modelo')
        ->orderBy('cantidad', 'desc')
        ->limit(5)
        ->get()
        ->map(function ($row) {
            return [
                'auto' => $row->auto,
                'cantidad' => (int) $row->cantidad,
            ];
        })
        ->all();

    echo json_encode($stats);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
