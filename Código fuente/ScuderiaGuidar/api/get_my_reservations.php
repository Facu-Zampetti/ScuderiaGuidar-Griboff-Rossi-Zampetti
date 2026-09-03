<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/bootstrap_eloquent.php';

use Illuminate\Database\Capsule\Manager as Capsule;

session_start();

if (!isset($_SESSION['cliente_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'No autorizado']);
    exit;
}

$id_cliente = $_SESSION['cliente_id'];

try {
    $reservas = Capsule::table('reservas as r')
        ->join('autos as a', 'r.ID_Auto', '=', 'a.ID')
        ->join('estados as e', 'r.ID_Estado', '=', 'e.ID')
        ->where('r.ID_Cliente', $id_cliente)
        ->select(
            'r.ID as ReservaID',
            'r.Fecha_Inicio',
            'r.Fecha_Fin',
            'r.Precio_Total',
            'r.Numero as CodigoReserva',
            'r.ID_Estado',
            'e.Nombre as EstadoNombre',
            'a.Marca',
            'a.Modelo',
            'a.Foto'
        )
        ->orderBy('r.Fecha_Inicio', 'desc')
        ->get()
        ->map(function ($row) {
            return (array) $row;
        })
        ->all();

    echo json_encode($reservas, JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error SQL: ' . $e->getMessage()]);
}
?>