<?php
header('Content-Type: application/json');
require_once __DIR__ . '/bootstrap_eloquent.php';

use App\Models\Cliente;

session_start();

if (!isset($_SESSION['cliente_rol']) || $_SESSION['cliente_rol'] != 1) {
    echo json_encode(['success' => false, 'message' => 'Acceso no autorizado']);
    exit;
}

$id = isset($_POST['id']) ? (int) $_POST['id'] : null;
$nombre = $_POST['nombre'] ?? '';
$apellido = $_POST['apellido'] ?? '';
$dni = $_POST['dni'] ?? '';
$mail = $_POST['mail'] ?? '';
$telefono = $_POST['telefono'] ?? '';
$nacimiento = $_POST['nacimiento'] ?? null;
$licencia = $_POST['licencia'] ?? null;
$direccion = $_POST['direccion'] ?? '';

if (!$id || !$nombre || !$apellido || !$dni || !$mail) {
    echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
    exit;
}

try {
    Cliente::query()
        ->where('ID', $id)
        ->update([
            'Nombre' => $nombre,
            'Apellido' => $apellido,
            'DNI' => (int) $dni,
            'Mail' => $mail,
            'Telefono' => $telefono,
            'Nacimiento' => $nacimiento,
            'Licencia' => (int) $licencia,
            'Direccion' => $direccion,
        ]);

    echo json_encode(['success' => true]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
