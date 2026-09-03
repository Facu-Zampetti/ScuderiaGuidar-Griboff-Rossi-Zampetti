<?php
ini_set('display_errors', 0);
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/bootstrap_eloquent.php';

use App\Models\Cliente;

session_start();

// Verificar rol de administrador
if (!isset($_SESSION['cliente_rol']) || $_SESSION['cliente_rol'] != 1) {
    http_response_code(403);
    echo json_encode(['error' => 'Acceso denegado.']);
    exit;
}

// Verificar método HTTP
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido. Solo POST.']);
    exit;
}

// Obtener el ID desde JSON enviado por JavaScript
$input = json_decode(file_get_contents("php://input"), true);

if (!isset($input['id']) || !is_numeric($input['id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'ID inválido o no enviado.']);
    exit;
}

$client_id = intval($input['id']);

try {
    $deleted = Cliente::query()->where('ID', $client_id)->delete();

    if ($deleted === 0) {
        echo json_encode(['error' => 'No existe un cliente con ese ID.']);
        exit;
    }

    echo json_encode(['success' => true, 'message' => 'Cliente eliminado correctamente.']);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
