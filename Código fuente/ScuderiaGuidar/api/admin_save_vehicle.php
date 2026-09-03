<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/bootstrap_eloquent.php';

use App\Models\Auto;
use Illuminate\Database\Capsule\Manager as Capsule;

session_start();

if (!isset($_SESSION['cliente_rol']) || $_SESSION['cliente_rol'] != 1) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'No autorizado']);
    exit;
}

$id      = isset($_POST['id']) && $_POST['id'] !== '' ? (int) $_POST['id'] : null;
$marca   = trim($_POST['marca'] ?? '');
$modelo  = trim($_POST['modelo'] ?? '');
$patente = trim($_POST['patente'] ?? '');
$tipo    = (int) ($_POST['tipo'] ?? 1);

$hasBranchTables = Capsule::schema()->hasTable('autos_sucursales')
    && Capsule::schema()->hasTable('sucursales');

$sucursalIdsInput = $_POST['sucursales'] ?? [];
if (!is_array($sucursalIdsInput)) {
    $sucursalIdsInput = [$sucursalIdsInput];
}

$sucursalIds = [];
foreach ($sucursalIdsInput as $value) {
    $branchId = (int) $value;
    if ($branchId > 0 && !in_array($branchId, $sucursalIds, true)) {
        $sucursalIds[] = $branchId;
    }
}

if (!$marca || !$modelo) {
    echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
    exit;
}

if ($hasBranchTables && count($sucursalIds) === 0) {
    echo json_encode(['success' => false, 'message' => 'Selecciona al menos una sucursal.']);
    exit;
}

if ($hasBranchTables && count($sucursalIds) > 0) {
    $validBranches = Capsule::table('sucursales')->whereIn('ID', $sucursalIds)->count();
    if ((int) $validBranches !== count($sucursalIds)) {
        echo json_encode(['success' => false, 'message' => 'Hay sucursales invalidas en la seleccion.']);
        exit;
    }
}

$rutaFoto = null;
if (isset($_FILES['imagen']) && $_FILES['imagen']['error'] === UPLOAD_ERR_OK) {
    $ext = pathinfo($_FILES['imagen']['name'], PATHINFO_EXTENSION);
    $nombreArchivo = strtolower($marca . '_' . $modelo . '_' . time() . '.' . $ext);
    $targetDir = __DIR__ . '/../img/autos/'; 
    if (!is_dir($targetDir)) mkdir($targetDir, 0755, true);
    if (move_uploaded_file($_FILES['imagen']['tmp_name'], $targetDir . $nombreArchivo)) {
        $rutaFoto = "../img/autos/" . $nombreArchivo;
    }
}

try {
    Capsule::connection()->transaction(function () use (
        $id,
        $marca,
        $modelo,
        $patente,
        $tipo,
        $rutaFoto,
        $hasBranchTables,
        $sucursalIds
    ) {
        if ($id) {
            $payload = [
                'Marca' => $marca,
                'Modelo' => $modelo,
                'Patente' => $patente,
                'ID_Tipos' => $tipo,
            ];

            if ($rutaFoto) {
                $payload['Foto'] = $rutaFoto;
            }

            Auto::query()->where('ID', $id)->update($payload);
            $autoId = $id;
        } else {
            $finalFoto = $rutaFoto ?? '../img/autos/default.jpg';

            $auto = Auto::query()->create([
                'Marca' => $marca,
                'Modelo' => $modelo,
                'Patente' => $patente,
                'ID_Tipos' => $tipo,
                'Foto' => $finalFoto,
                'Disponibilidad' => 1,
                'Destacado' => 0,
            ]);

            $autoId = (int) $auto->ID;
        }

        if ($hasBranchTables) {
            Capsule::table('autos_sucursales')->where('ID_Auto', $autoId)->delete();

            $rows = [];
            foreach ($sucursalIds as $branchId) {
                $rows[] = [
                    'ID_Auto' => $autoId,
                    'ID_Sucursal' => $branchId,
                ];
            }

            if (!empty($rows)) {
                Capsule::table('autos_sucursales')->insert($rows);
            }
        }
    });

    echo json_encode(['success' => true]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>