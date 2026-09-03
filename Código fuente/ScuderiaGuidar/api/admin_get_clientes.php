<?php
ini_set('display_errors', 0);
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/bootstrap_eloquent.php';

use App\Models\Cliente;

session_start();

if (!isset($_SESSION['cliente_rol']) || $_SESSION['cliente_rol'] != 1) {
    http_response_code(403);
    echo json_encode(['error' => 'Acceso denegado.']);
    exit;
}

try {
    $data = Cliente::query()
        ->select('ID', 'Rol', 'Nombre', 'Apellido', 'DNI', 'Mail', 'Telefono', 'Nacimiento', 'Licencia', 'Direccion')
        ->orderBy('ID', 'asc')
        ->get()
        ->map(function ($row) {
            return $row->getAttributes();
        })
        ->all();

    echo json_encode($data, JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>