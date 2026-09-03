<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/bootstrap_eloquent.php';

use Illuminate\Database\Capsule\Manager as Capsule;

session_start();

if (!isset($_SESSION['cliente_id']) || !isset($_SESSION['cliente_rol']) || (int) $_SESSION['cliente_rol'] !== 1) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'No autorizado']);
    exit;
}

try {
    $hasBranchTables = Capsule::schema()->hasTable('sucursales')
        && Capsule::schema()->hasColumn('reservas', 'ID_Sucursal_Retiro')
        && Capsule::schema()->hasColumn('reservas', 'ID_Sucursal_Devolucion');

    $query = Capsule::table('reservas as r')
        ->join('autos as a', 'r.ID_Auto', '=', 'a.ID')
        ->join('tipos as t', 'a.ID_Tipos', '=', 't.ID_Tipos')
        ->join('estados as e', 'r.ID_Estado', '=', 'e.ID')
        ->join('clientes as c', 'r.ID_Cliente', '=', 'c.ID')
        ->select(
            'r.ID as ReservaID',
            'r.Fecha_Inicio',
            'r.Fecha_Fin',
            'r.Fecha_Operacion',
            'r.Precio_Total',
            'r.Numero as CodigoReserva',
            'r.ID_Estado',
            'e.Nombre as EstadoNombre',
            'a.Marca',
            'a.Modelo',
            'a.Foto',
            'a.ID_Tipos',
            't.Nombre as TipoNombre',
            'c.Nombre as ClienteNombre',
            'c.Mail as ClienteMail',
            'c.DNI as ClienteDNI'
        );

    if ($hasBranchTables) {
        $query->leftJoin('sucursales as sr', 'r.ID_Sucursal_Retiro', '=', 'sr.ID')
            ->leftJoin('sucursales as sd', 'r.ID_Sucursal_Devolucion', '=', 'sd.ID')
            ->addSelect(
                'r.ID_Sucursal_Retiro',
                'r.ID_Sucursal_Devolucion',
                'sr.Nombre as SucursalRetiroNombre',
                'sd.Nombre as SucursalDevolucionNombre'
            );
    } else {
        $query->selectRaw('NULL as ID_Sucursal_Retiro')
            ->selectRaw('NULL as ID_Sucursal_Devolucion')
            ->selectRaw('NULL as SucursalRetiroNombre')
            ->selectRaw('NULL as SucursalDevolucionNombre');
    }

    $tipoId = isset($_GET['tipo_id']) ? (int) $_GET['tipo_id'] : 0;
    if ($tipoId > 0) {
        $query->where('a.ID_Tipos', $tipoId);
    }

    $estadoId = isset($_GET['estado_id']) ? (int) $_GET['estado_id'] : 0;
    if ($estadoId > 0) {
        $query->where('r.ID_Estado', $estadoId);
    }

    if ($hasBranchTables) {
        $sucursalId = isset($_GET['sucursal_id']) ? (int) $_GET['sucursal_id'] : 0;
        if ($sucursalId > 0) {
            $query->where(function ($branchQuery) use ($sucursalId) {
                $branchQuery->where('r.ID_Sucursal_Retiro', $sucursalId)
                    ->orWhere('r.ID_Sucursal_Devolucion', $sucursalId);
            });
        }
    }

    $sortBy = $_GET['sort_by'] ?? 'fecha_operacion';
    $defaultDirection = $sortBy === 'fecha_operacion' ? 'desc' : 'asc';
    $sortDir = strtolower($_GET['sort_dir'] ?? $defaultDirection);
    if (!in_array($sortDir, ['asc', 'desc'], true)) {
        $sortDir = $defaultDirection;
    }

    switch ($sortBy) {
        case 'auto':
            $query->orderBy('a.Marca', $sortDir)->orderBy('a.Modelo', $sortDir);
            break;
        case 'precio_total':
            $query->orderBy('r.Precio_Total', $sortDir);
            break;
        case 'categoria':
            $query->orderBy('t.Nombre', $sortDir);
            break;
        case 'estado':
            $query->orderBy('e.Nombre', $sortDir);
            break;
        case 'sucursal':
            if ($hasBranchTables) {
                $query->orderByRaw('COALESCE(sr.Nombre, sd.Nombre, "") ' . $sortDir);
                $query->orderBy('r.Fecha_Operacion', 'desc');
            } else {
                $query->orderBy('r.Fecha_Operacion', 'desc');
            }
            break;
        case 'fecha_operacion':
        default:
            $query->orderBy('r.Fecha_Operacion', $sortDir)->orderBy('r.ID', 'desc');
            break;
    }

    $reservas = $query
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