<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/bootstrap_eloquent.php';

use App\Models\Reserva;

session_start();

if (!isset($_SESSION['cliente_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'No autorizado']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$id_reserva = $input['id_reserva'] ?? 0;
$id_cliente = $_SESSION['cliente_id'];

if (!$id_reserva) {
    echo json_encode(['success' => false, 'message' => 'ID de reserva inválido']);
    exit;
}

$data = Reserva::query()
    ->select('ID', 'ID_Estado')
    ->where('ID', $id_reserva)
    ->where('ID_Cliente', $id_cliente)
    ->first();

if (!$data) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Reserva no encontrada o no te pertenece']);
    exit;
}

if ((int) $data->ID_Estado === 5 || (int) $data->ID_Estado === 4) {
    echo json_encode(['success' => false, 'message' => 'Esta reserva no se puede cancelar']);
    exit;
}

if (Reserva::query()->where('ID', $id_reserva)->update(['ID_Estado' => 5])) {
    echo json_encode(['success' => true, 'message' => 'Reserva cancelada correctamente']);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al cancelar']);
}
?>