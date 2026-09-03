<?php

header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/bootstrap_eloquent.php';

use App\Models\Reserva;
use Illuminate\Database\Capsule\Manager as Capsule;

// ---  Validar sesion ---
session_start();
if (!isset($_SESSION['cliente_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Debes iniciar sesión.']);
    exit;
}
$id_cliente = $_SESSION['cliente_id'];

// ---  leer datos ---
$input = json_decode(file_get_contents('php://input'), true);
$id_auto    = (int)($input['id_auto'] ?? 0);
$fecha_ini  = $input['fecha_inicio'] ?? '';
$fecha_fin  = $input['fecha_fin'] ?? '';
$id_sucursal_retiro = (int)($input['id_sucursal_retiro'] ?? 0);
$id_sucursal_devolucion = (int)($input['id_sucursal_devolucion'] ?? 0);

// ---  Validaciones basicas ---
if (
    $id_auto <= 0
    || empty($fecha_ini)
    || empty($fecha_fin)
    || $id_sucursal_retiro <= 0
    || $id_sucursal_devolucion <= 0
) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Datos incompletos.']);
    exit;
}
if ($fecha_fin < $fecha_ini) {
    echo json_encode(['success' => false, 'message' => 'Fechas inválidas.']);
    exit;
}

try {
    $precio_total = Capsule::connection()->transaction(function () use (
        $id_auto,
        $id_cliente,
        $fecha_ini,
        $fecha_fin,
        $id_sucursal_retiro,
        $id_sucursal_devolucion
    ) {
        if (!Capsule::schema()->hasTable('sucursales') || !Capsule::schema()->hasTable('autos_sucursales')) {
            throw new Exception('No se encontraron tablas de sucursales. Ejecuta la migracion SQL.');
        }

        $pickupBranchExists = Capsule::table('sucursales')
            ->where('ID', $id_sucursal_retiro)
            ->exists();

        $dropoffBranchExists = Capsule::table('sucursales')
            ->where('ID', $id_sucursal_devolucion)
            ->exists();

        if (!$pickupBranchExists || !$dropoffBranchExists) {
            throw new Exception('Sucursal de retiro o devolucion invalida.');
        }

        $carInPickupBranch = Capsule::table('autos_sucursales')
            ->where('ID_Auto', $id_auto)
            ->where('ID_Sucursal', $id_sucursal_retiro)
            ->exists();

        if (!$carInPickupBranch) {
            throw new Exception('El vehiculo no se encuentra disponible en la sucursal de retiro seleccionada.');
        }

        $ocupada = Reserva::query()
            ->where('ID_Auto', $id_auto)
            ->whereIn('ID_Estado', [1, 2])
            ->where('Fecha_Inicio', '<=', $fecha_fin)
            ->where('Fecha_Fin', '>=', $fecha_ini)
            ->exists();

        if ($ocupada) {
            throw new Exception('El vehículo no está disponible en esas fechas.');
        }

        $precio_diario = Capsule::table('autos as a')
            ->join('tipos as t', 'a.ID_Tipos', '=', 't.ID_Tipos')
            ->where('a.ID', $id_auto)
            ->value('t.Precio');

        if ($precio_diario === null) {
            throw new Exception('Auto no encontrado.');
        }

        $d1 = new DateTime($fecha_ini);
        $d2 = new DateTime($fecha_fin);
        $dias = $d1->diff($d2)->days + 1;
        $precio_total = $dias * (float) $precio_diario;

        Reserva::query()->create([
            'ID_Auto' => $id_auto,
            'ID_Cliente' => $id_cliente,
            'ID_Estado' => 1,
            'Numero' => rand(100000, 999999),
            'Fecha_Inicio' => $fecha_ini,
            'Fecha_Fin' => $fecha_fin,
            'ID_Sucursal_Retiro' => $id_sucursal_retiro,
            'ID_Sucursal_Devolucion' => $id_sucursal_devolucion,
            'Fecha_Operacion' => date('Y-m-d'),
            'Precio_Total' => $precio_total,
        ]);

        return $precio_total;
    });

    echo json_encode(['success' => true, 'message' => 'Reserva creada exitosamente', 'total' => $precio_total]); //Mensaje que se le envia a reservation.js

} catch (Throwable $e) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>