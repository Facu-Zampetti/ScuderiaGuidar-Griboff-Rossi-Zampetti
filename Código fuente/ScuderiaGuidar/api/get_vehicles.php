<?php
error_reporting(E_ALL);
ini_set('display_errors', 0); 

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/bootstrap_eloquent.php';

use Illuminate\Database\Capsule\Manager as Capsule;

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
            't.ID_Tipos',
            't.Nombre as TipoNombre',
            't.Precio'
        );

    if ($hasBranchTables) {
        $query->leftJoin('autos_sucursales as af', 'a.ID', '=', 'af.ID_Auto')
            ->leftJoin('sucursales as s', 'af.ID_Sucursal', '=', 's.ID')
            ->selectRaw("GROUP_CONCAT(DISTINCT s.ID ORDER BY s.Nombre SEPARATOR ',') as SucursalesIdsRaw")
            ->selectRaw("GROUP_CONCAT(DISTINCT s.Nombre ORDER BY s.Nombre SEPARATOR '||') as SucursalesNombresRaw");
    }

    if (isset($_GET['type']) && $_GET['type'] !== '') {
        $rawTypes = explode(',', $_GET['type']);
        $cleanIds = [];

        foreach ($rawTypes as $val) {
            $id = (int) $val;
            if ($id > 0) {
                $cleanIds[] = $id;
            }
        }

        if (count($cleanIds) > 0) {
            $query->whereIn('a.ID_Tipos', $cleanIds);
        }
    }

    if (isset($_GET['available']) && ($_GET['available'] === '0' || $_GET['available'] === '1')) {
        $query->where('a.Disponibilidad', (int) $_GET['available']);
    }

    if (isset($_GET['min_price']) && is_numeric($_GET['min_price'])) {
        $query->where('t.Precio', '>=', (float) $_GET['min_price']);
    }

    if (isset($_GET['max_price']) && is_numeric($_GET['max_price'])) {
        $query->where('t.Precio', '<=', (float) $_GET['max_price']);
    }

    if ($hasBranchTables && isset($_GET['sucursal']) && is_numeric($_GET['sucursal'])) {
        $sucursalId = (int) $_GET['sucursal'];
        if ($sucursalId > 0) {
            $query->whereExists(function ($subQuery) use ($sucursalId) {
                $subQuery->selectRaw('1')
                    ->from('autos_sucursales as af2')
                    ->whereColumn('af2.ID_Auto', 'a.ID')
                    ->where('af2.ID_Sucursal', $sucursalId);
            });
        }
    }

    $sort = $_GET['sort'] ?? 'alpha';
    switch ($sort) {
        case 'price_asc':
            $query->orderBy('t.Precio', 'asc');
            break;
        case 'price_desc':
            $query->orderBy('t.Precio', 'desc');
            break;
        case 'alpha':
        default:
            $query->orderBy('a.Marca', 'asc')->orderBy('a.Modelo', 'asc');
            break;
    }

    if ($hasBranchTables) {
        $query->groupBy(
            'a.ID',
            'a.Marca',
            'a.Modelo',
            'a.Patente',
            'a.Disponibilidad',
            'a.Destacado',
            'a.Foto',
            't.ID_Tipos',
            't.Nombre',
            't.Precio'
        );
    }

    $vehicles = $query->get()->map(function ($row) use ($hasBranchTables) {
        $item = (array) $row;

        if (!$hasBranchTables) {
            $item['SucursalesIds'] = [];
            $item['SucursalesNombres'] = [];
            $item['Sucursales'] = [];
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

        $sucursales = [];
        $maxLen = max(count($ids), count($names));
        for ($i = 0; $i < $maxLen; $i++) {
            $entry = [];
            if (array_key_exists($i, $ids)) {
                $entry['ID'] = $ids[$i];
            }
            if (array_key_exists($i, $names)) {
                $entry['Nombre'] = $names[$i];
            }
            if (!empty($entry)) {
                $sucursales[] = $entry;
            }
        }

        unset($item['SucursalesIdsRaw'], $item['SucursalesNombresRaw']);
        $item['SucursalesIds'] = $ids;
        $item['SucursalesNombres'] = $names;
        $item['Sucursales'] = $sucursales;

        return $item;
    })->all();

    echo json_encode($vehicles, JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error SQL Prepare: ' . $e->getMessage()]);
}
?>