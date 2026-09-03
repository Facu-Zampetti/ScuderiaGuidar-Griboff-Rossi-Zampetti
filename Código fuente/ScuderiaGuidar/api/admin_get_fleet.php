<?php
ini_set('display_errors', 0);
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/bootstrap_eloquent.php';

use Illuminate\Database\Capsule\Manager as Capsule;

session_start();

if (!isset($_SESSION['cliente_rol']) || $_SESSION['cliente_rol'] != 1) {
    http_response_code(403);
    echo json_encode(['error' => 'Acceso denegado.']);
    exit;
}

try {
    $hasBranchTables = Capsule::schema()->hasTable('autos_sucursales')
        && Capsule::schema()->hasTable('sucursales');

    $query = Capsule::table('autos as a')
        ->leftJoin('tipos as t', 'a.ID_Tipos', '=', 't.ID_Tipos')
        ->select(
            'a.ID',
            'a.Marca',
            'a.Modelo',
            'a.Patente',
            'a.Disponibilidad',
            'a.Destacado',
            'a.Foto',
            'a.ID_Tipos',
            't.Nombre as TipoNombre',
            't.Precio'
        );

    if ($hasBranchTables) {
        $query->leftJoin('autos_sucursales as af', 'a.ID', '=', 'af.ID_Auto')
            ->leftJoin('sucursales as s', 'af.ID_Sucursal', '=', 's.ID')
            ->selectRaw("GROUP_CONCAT(DISTINCT s.ID ORDER BY s.Nombre SEPARATOR ',') as SucursalesIdsRaw")
            ->selectRaw("GROUP_CONCAT(DISTINCT s.Nombre ORDER BY s.Nombre SEPARATOR '||') as SucursalesNombresRaw")
            ->groupBy(
                'a.ID',
                'a.Marca',
                'a.Modelo',
                'a.Patente',
                'a.Disponibilidad',
                'a.Destacado',
                'a.Foto',
                'a.ID_Tipos',
                't.Nombre',
                't.Precio'
            );
    }

    $data = $query
        ->orderBy('a.ID', 'desc')
        ->get()
        ->map(function ($row) use ($hasBranchTables) {
            $item = (array) $row;

            if (!$hasBranchTables) {
                $item['SucursalesIds'] = [];
                $item['SucursalesNombres'] = [];
                return $item;
            }

            $ids = [];
            $rawIds = trim((string) ($item['SucursalesIdsRaw'] ?? ''));
            if ($rawIds !== '') {
                foreach (explode(',', $rawIds) as $idValue) {
                    $id = (int) $idValue;
                    if ($id > 0 && !in_array($id, $ids, true)) {
                        $ids[] = $id;
                    }
                }
            }

            $names = [];
            $rawNames = (string) ($item['SucursalesNombresRaw'] ?? '');
            if ($rawNames !== '') {
                foreach (explode('||', $rawNames) as $nameValue) {
                    $name = trim($nameValue);
                    if ($name !== '') {
                        $names[] = $name;
                    }
                }
            }

            unset($item['SucursalesIdsRaw'], $item['SucursalesNombresRaw']);
            $item['SucursalesIds'] = $ids;
            $item['SucursalesNombres'] = $names;

            return $item;
        })
        ->all();

    echo json_encode($data, JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>