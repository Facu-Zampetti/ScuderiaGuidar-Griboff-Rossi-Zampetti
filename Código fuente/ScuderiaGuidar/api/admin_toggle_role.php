<?php
header('Content-Type: application/json');
require_once __DIR__ . '/bootstrap_eloquent.php';

use App\Models\Cliente;

session_start();

if (!isset($_SESSION['cliente_rol']) || $_SESSION['cliente_rol'] != 1) {
    echo json_encode(['success' => false, 'message' => 'Acceso denegado']);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

if (!is_array($data) || !isset($data['id'], $data['nuevoRol'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
    exit;
}

$id = (int) $data['id'];
$nuevoRol = (int) $data['nuevoRol'];

try {
    Cliente::query()->where('ID', $id)->update(['Rol' => $nuevoRol]);
    echo json_encode(['success' => true]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
