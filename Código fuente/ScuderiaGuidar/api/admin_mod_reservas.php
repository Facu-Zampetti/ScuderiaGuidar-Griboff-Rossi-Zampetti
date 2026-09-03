<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/bootstrap_eloquent.php';

use App\Models\Reserva;

session_start();

// Verificar sesión administrador
if (!isset($_SESSION['cliente_rol']) || $_SESSION['cliente_rol'] != 1){
    echo json_encode(['success' => false, 'message' => 'No autorizado']);
    exit;
}

// Leer cuerpo JSON
$input = json_decode(file_get_contents("php://input"), true);

if (!isset($input['id_reserva']) || !isset($input['new_estado'])) {
    echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
    exit;
}

$id_reserva = intval($input['id_reserva']);
$new_estado = intval($input['new_estado']);

// Validar estados permitidos
if (!in_array($new_estado, [1, 2, 5], true)) {
    echo json_encode(['success' => false, 'message' => 'Estado no válido']);
    exit;
}

try {
    Reserva::query()
        ->where('ID', $id_reserva)
        ->update(['ID_Estado' => $new_estado]);

    echo json_encode(['success' => true, 'message' => 'Estado actualizado']);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error SQL: ' . $e->getMessage()]);
}
