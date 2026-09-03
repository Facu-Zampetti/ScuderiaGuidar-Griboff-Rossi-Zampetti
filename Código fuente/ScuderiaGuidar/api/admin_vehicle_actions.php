<?php
ini_set('display_errors', 0);
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/bootstrap_eloquent.php';

use App\Models\Auto;
use Illuminate\Database\Capsule\Manager as Capsule;

session_start();

//  Seguridad
if (!isset($_SESSION['cliente_rol']) || $_SESSION['cliente_rol'] != 1) {
    http_response_code(403);
    echo json_encode(['error' => 'No autorizado']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? '';
$id = $input['id'] ?? 0;

if (!$id) {
    echo json_encode(['success' => false, 'message' => 'Falta ID']);
    exit;
}

try {
    if ($action === 'delete') {
        Auto::query()->where('ID', $id)->delete();
        echo json_encode(['success' => true, 'msg' => 'Eliminado']);

    } elseif ($action === 'toggle_star') {
        $msg = Capsule::connection()->transaction(function () use ($id) {
            $auto = Auto::query()->select('ID', 'Destacado')->where('ID', $id)->first();

            if (!$auto) {
                throw new Exception('Auto no encontrado');
            }

            if ((int) $auto->Destacado === 1) {
                Auto::query()->where('ID', $id)->update(['Destacado' => 0]);
                return 'Auto quitado de destacados';
            }

            Auto::query()->update(['Destacado' => 0]);
            Auto::query()->where('ID', $id)->update(['Destacado' => 1]);

            return '¡Nuevo auto destacado!';
        });

        echo json_encode(['success' => true, 'msg' => $msg]);
    } else {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Acción inválida']);
    }

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>