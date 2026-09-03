<?php
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/bootstrap_eloquent.php';

use Illuminate\Database\Capsule\Manager as Capsule;

const RECOMMENDER_ALLOWED_TRAVEL_STYLES = ['ciudad', 'ruta', 'familiar', 'aventura'];
const RECOMMENDER_ALLOWED_LUGGAGE_SIZES = ['pequeno', 'mediano', 'grande'];
const RECOMMENDER_ALLOWED_BUDGET_MODES = ['total', 'diario'];
const RECOMMENDER_ALLOWED_EXTRAS = ['transmision_automatica', 'aire_acondicionado'];

function respond_recommender(array $payload, int $statusCode = 200): void
{
    http_response_code($statusCode);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function normalize_bool_flag(mixed $value): bool
{
    return (int) $value === 1;
}

function map_vehicle_for_output(array $row): array
{
    return [
        'id' => (int) $row['ID'],
        'marca' => (string) $row['Marca'],
        'modelo' => (string) $row['Modelo'],
        'patente' => (string) $row['Patente'],
        'foto' => (string) $row['Foto'],
        'tipo' => (string) $row['TipoNombre'],
        'tipo_descripcion' => (string) $row['TipoDescripcion'],
        'precio_diario' => (float) $row['Precio'],
        'capacidad_pasajeros' => (int) $row['Capacidad_Pasajeros'],
        'capacidad_equipaje' => (string) $row['Capacidad_Equipaje'],
        'extras' => [
            'transmision_automatica' => normalize_bool_flag($row['Transmision_Automatica']),
            'aire_acondicionado' => normalize_bool_flag($row['Aire_Acondicionado']),
        ],
    ];
}

function build_recommender_system_prompt(): string
{
    return implode("\n", [
        'Eres un recomendador de vehiculos de alquiler.',
        'Debes responder SOLO JSON valido UTF-8, sin markdown y sin texto adicional.',
        'Formato exacto esperado:',
        '{"recommendations":[{"id":123,"reason":"texto breve"}]}',
        'Reglas:',
        '- Maximo 3 recomendaciones.',
        '- Usa exclusivamente IDs de la lista de vehiculos candidatos.',
        '- Prioriza ajuste a pasajeros, equipaje, estilo, kilometros, presupuesto y extras.',
        '- Si no hay opcion adecuada, devuelve {"recommendations":[]}.',
    ]);
}

function build_recommender_user_prompt(array $profile, array $vehicles): string
{
    return implode("\n\n", [
        'Perfil del usuario (JSON):',
        json_encode($profile, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        'Vehiculos candidatos (JSON):',
        json_encode($vehicles, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        'Devuelve SOLO el JSON solicitado.',
    ]);
}

function call_gemini_for_recommendation(string $apiKey, string $model, string $systemPrompt, string $userPrompt): array
{
    if (!function_exists('curl_init')) {
        return [
            'ok' => false,
            'error' => 'La extension cURL no esta habilitada en este servidor.',
        ];
    }

    $endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/' . rawurlencode($model) . ':generateContent?key=' . urlencode($apiKey);

    $body = [
        'contents' => [
            [
                'role' => 'user',
                'parts' => [
                    [
                        'text' => $systemPrompt . "\n\n" . $userPrompt,
                    ],
                ],
            ],
        ],
        'generationConfig' => [
            'temperature' => 0.2,
            'maxOutputTokens' => 600,
            'responseMimeType' => 'application/json',
        ],
    ];

    $ch = curl_init($endpoint);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
        ],
        CURLOPT_POSTFIELDS => json_encode($body, JSON_UNESCAPED_UNICODE),
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT => 35,
    ]);

    $rawResponse = curl_exec($ch);
    $curlError = curl_error($ch);
    $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($rawResponse === false) {
        return [
            'ok' => false,
            'error' => 'No se pudo contactar a Gemini: ' . $curlError,
        ];
    }

    $decoded = json_decode($rawResponse, true);

    if ($httpCode < 200 || $httpCode >= 300) {
        $remoteError = 'Error remoto de Gemini.';
        if (is_array($decoded) && isset($decoded['error']) && is_array($decoded['error']) && isset($decoded['error']['message'])) {
            $remoteError = (string) $decoded['error']['message'];
        }

        return [
            'ok' => false,
            'error' => $remoteError,
            'http_code' => $httpCode,
        ];
    }

    if (!is_array($decoded)) {
        return [
            'ok' => false,
            'error' => 'La respuesta de Gemini no es JSON valido.',
        ];
    }

    $parts = [];
    $candidates = $decoded['candidates'] ?? [];
    if (is_array($candidates)) {
        foreach ($candidates as $candidate) {
            if (!is_array($candidate)) {
                continue;
            }

            $candidateParts = $candidate['content']['parts'] ?? [];
            if (!is_array($candidateParts)) {
                continue;
            }

            foreach ($candidateParts as $part) {
                if (is_array($part) && isset($part['text'])) {
                    $parts[] = trim((string) $part['text']);
                }
            }
        }
    }

    $text = trim(implode("\n", $parts));
    if ($text === '') {
        return [
            'ok' => false,
            'error' => 'Gemini respondio sin contenido util.',
        ];
    }

    return [
        'ok' => true,
        'text' => $text,
    ];
}

function decode_recommendation_json(string $rawText): ?array
{
    $candidates = [];
    $trimmed = trim($rawText);

    if ($trimmed !== '') {
        $candidates[] = $trimmed;
    }

    $withoutFence = preg_replace('/^```(?:json)?\s*|\s*```$/i', '', $trimmed);
    if (is_string($withoutFence)) {
        $withoutFence = trim($withoutFence);
        if ($withoutFence !== '' && $withoutFence !== $trimmed) {
            $candidates[] = $withoutFence;
        }
    }

    $firstObjectPos = strpos($trimmed, '{');
    $lastObjectPos = strrpos($trimmed, '}');
    if ($firstObjectPos !== false && $lastObjectPos !== false && $lastObjectPos > $firstObjectPos) {
        $candidates[] = trim(substr($trimmed, $firstObjectPos, $lastObjectPos - $firstObjectPos + 1));
    }

    $firstArrayPos = strpos($trimmed, '[');
    $lastArrayPos = strrpos($trimmed, ']');
    if ($firstArrayPos !== false && $lastArrayPos !== false && $lastArrayPos > $firstArrayPos) {
        $candidates[] = trim(substr($trimmed, $firstArrayPos, $lastArrayPos - $firstArrayPos + 1));
    }

    foreach ($candidates as $candidate) {
        $decoded = json_decode($candidate, true);
        if (is_array($decoded)) {
            return $decoded;
        }
    }

    return null;
}

function normalize_ai_recommendations(array $decoded): array
{
    $items = [];

    if (array_is_list($decoded)) {
        $items = $decoded;
    } elseif (isset($decoded['recommendations']) && is_array($decoded['recommendations'])) {
        $items = $decoded['recommendations'];
    }

    $normalized = [];
    foreach ($items as $item) {
        if (!is_array($item)) {
            continue;
        }

        $id = (int) ($item['id'] ?? $item['ID'] ?? 0);
        $reasonRaw = trim((string) ($item['reason'] ?? $item['razon'] ?? ''));
        $reason = preg_replace('/\s+/', ' ', $reasonRaw);
        $reason = is_string($reason) ? trim($reason) : '';

        if ($id <= 0 || $reason === '') {
            continue;
        }

        $normalized[] = [
            'id' => $id,
            'reason' => substr($reason, 0, 280),
        ];

        if (count($normalized) >= 3) {
            break;
        }
    }

    return $normalized;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) {
    respond_recommender([
        'success' => false,
        'message' => 'JSON invalido.',
    ], 400);
}

$diasAlquiler = (int) ($input['dias_alquiler'] ?? 0);
$pasajeros = (int) ($input['pasajeros'] ?? 0);
$equipajeCantidad = (int) ($input['equipaje_cantidad'] ?? 0);
$equipajeTamano = strtolower(trim((string) ($input['equipaje_tamano'] ?? '')));
$estiloViaje = strtolower(trim((string) ($input['estilo_viaje'] ?? '')));
$kilometrosAprox = (int) ($input['kilometros_aprox'] ?? 0);
$presupuestoModo = strtolower(trim((string) ($input['presupuesto_modo'] ?? '')));
$presupuestoValor = (float) ($input['presupuesto_valor'] ?? 0);
$idSucursalRetiro = max(0, (int) ($input['id_sucursal_retiro'] ?? 0));
$consultaLibre = trim((string) ($input['consulta_libre'] ?? ''));

$errors = [];
if ($diasAlquiler < 1 || $diasAlquiler > 90) {
    $errors[] = 'La cantidad de dias debe estar entre 1 y 90.';
}
if ($pasajeros < 1 || $pasajeros > 12) {
    $errors[] = 'La cantidad de pasajeros debe estar entre 1 y 12.';
}
if ($equipajeCantidad < 0 || $equipajeCantidad > 20) {
    $errors[] = 'La cantidad de equipaje es invalida.';
}
if (!in_array($equipajeTamano, RECOMMENDER_ALLOWED_LUGGAGE_SIZES, true)) {
    $errors[] = 'El tamano de equipaje es invalido.';
}
if (!in_array($estiloViaje, RECOMMENDER_ALLOWED_TRAVEL_STYLES, true)) {
    $errors[] = 'El estilo de viaje es invalido.';
}
if ($kilometrosAprox < 0 || $kilometrosAprox > 10000) {
    $errors[] = 'Los kilometros aproximados son invalidos.';
}
if (!in_array($presupuestoModo, RECOMMENDER_ALLOWED_BUDGET_MODES, true)) {
    $errors[] = 'El tipo de presupuesto es invalido.';
}
if ($presupuestoValor <= 0) {
    $errors[] = 'Debes indicar un presupuesto mayor a 0.';
}
if (strlen($consultaLibre) > 800) {
    $errors[] = 'El mensaje para la IA no puede superar los 800 caracteres.';
}

$extrasInput = $input['extras'] ?? [];
if (!is_array($extrasInput)) {
    $extrasInput = [];
}

$extras = [];
foreach ($extrasInput as $extra) {
    $cleanExtra = strtolower(trim((string) $extra));
    if ($cleanExtra === '') {
        continue;
    }
    if (in_array($cleanExtra, RECOMMENDER_ALLOWED_EXTRAS, true) && !in_array($cleanExtra, $extras, true)) {
        $extras[] = $cleanExtra;
    }
}

if (!empty($errors)) {
    respond_recommender([
        'success' => false,
        'message' => implode(' ', $errors),
    ], 422);
}

$schema = Capsule::schema();
$requiredColumns = [
    'Capacidad_Pasajeros',
    'Capacidad_Equipaje',
    'Transmision_Automatica',
    'Aire_Acondicionado',
];

$missingColumns = [];
foreach ($requiredColumns as $columnName) {
    if (!$schema->hasColumn('autos', $columnName)) {
        $missingColumns[] = $columnName;
    }
}

if (!empty($missingColumns)) {
    respond_recommender([
        'success' => false,
        'message' => 'La base de datos no esta lista para el recomendador. Ejecuta la migracion SQL.',
        'missing_columns' => $missingColumns,
    ], 500);
}

$hasBranchTables = $schema->hasTable('autos_sucursales') && $schema->hasTable('sucursales');

$baseQuery = Capsule::table('autos as a')
    ->join('tipos as t', 'a.ID_Tipos', '=', 't.ID_Tipos')
    ->where('a.Disponibilidad', 1)
    ->where('a.Capacidad_Pasajeros', '>=', $pasajeros)
    ->select(
        'a.ID',
        'a.Marca',
        'a.Modelo',
        'a.Patente',
        'a.Foto',
        'a.Capacidad_Pasajeros',
        'a.Capacidad_Equipaje',
        'a.Transmision_Automatica',
        'a.Aire_Acondicionado',
        't.Nombre as TipoNombre',
        't.Descripcion as TipoDescripcion',
        't.Precio'
    );

if ($hasBranchTables && $idSucursalRetiro > 0) {
    $baseQuery->whereExists(function ($subQuery) use ($idSucursalRetiro) {
        $subQuery->selectRaw('1')
            ->from('autos_sucursales as af')
            ->whereColumn('af.ID_Auto', 'a.ID')
            ->where('af.ID_Sucursal', $idSucursalRetiro);
    });
}

$filteredRows = $baseQuery
    ->orderBy('t.Precio', 'asc')
    ->orderBy('a.Marca', 'asc')
    ->orderBy('a.Modelo', 'asc')
    ->get()
    ->map(function ($row) {
        return (array) $row;
    })
    ->all();

if (count($filteredRows) === 0) {
    respond_recommender([
        'success' => false,
        'code' => 'no_vehicles',
        'message' => 'No hay vehiculos disponibles que cumplan la capacidad de pasajeros solicitada.',
    ], 200);
}

$vehiclesForAi = array_map('map_vehicle_for_output', $filteredRows);
$presupuestoDiario = $presupuestoModo === 'diario'
    ? $presupuestoValor
    : round($presupuestoValor / max(1, $diasAlquiler), 2);

$userProfile = [
    'dias_alquiler' => $diasAlquiler,
    'pasajeros' => $pasajeros,
    'equipaje' => [
        'cantidad' => $equipajeCantidad,
        'tamano' => $equipajeTamano,
    ],
    'estilo_viaje' => $estiloViaje,
    'kilometros_aprox' => $kilometrosAprox,
    'presupuesto' => [
        'modo' => $presupuestoModo,
        'valor' => $presupuestoValor,
        'valor_estimado_diario' => $presupuestoDiario,
    ],
    'extras_solicitados' => $extras,
    'consulta_libre' => $consultaLibre,
];

$geminiApiKey = trim((string) (getenv('GEMINI_API_KEY') ?: ''));
if ($geminiApiKey === '') {
    respond_recommender([
        'success' => false,
        'message' => 'No se encontro GEMINI_API_KEY en .env.',
    ], 500);
}

$geminiModel = trim((string) (getenv('GEMINI_MODEL') ?: 'gemini-flash-lite-latest'));
$systemPrompt = build_recommender_system_prompt();
$userPrompt = build_recommender_user_prompt($userProfile, $vehiclesForAi);

$aiCall = call_gemini_for_recommendation($geminiApiKey, $geminiModel, $systemPrompt, $userPrompt);
if (!($aiCall['ok'] ?? false)) {
    respond_recommender([
        'success' => false,
        'code' => 'ai_call_failed',
        'message' => 'No se pudo obtener una recomendacion IA en este momento.',
        'detail' => $aiCall['error'] ?? 'Error desconocido',
    ], 502);
}

$decodedRecommendation = decode_recommendation_json((string) $aiCall['text']);
if (!is_array($decodedRecommendation)) {
    respond_recommender([
        'success' => false,
        'code' => 'invalid_ai_format',
        'message' => 'La IA no devolvio un JSON valido de recomendaciones.',
    ], 422);
}

$rawRecommendations = normalize_ai_recommendations($decodedRecommendation);
if (empty($rawRecommendations)) {
    respond_recommender([
        'success' => false,
        'code' => 'invalid_ai_format',
        'message' => 'La IA no devolvio recomendaciones en el formato esperado.',
    ], 422);
}

$idsFromAi = [];
foreach ($rawRecommendations as $rec) {
    $id = (int) $rec['id'];
    if ($id > 0 && !in_array($id, $idsFromAi, true)) {
        $idsFromAi[] = $id;
    }
}

$validationQuery = Capsule::table('autos as a')
    ->join('tipos as t', 'a.ID_Tipos', '=', 't.ID_Tipos')
    ->whereIn('a.ID', $idsFromAi)
    ->where('a.Disponibilidad', 1)
    ->where('a.Capacidad_Pasajeros', '>=', $pasajeros)
    ->select(
        'a.ID',
        'a.Marca',
        'a.Modelo',
        'a.Patente',
        'a.Foto',
        'a.Capacidad_Pasajeros',
        'a.Capacidad_Equipaje',
        'a.Transmision_Automatica',
        'a.Aire_Acondicionado',
        't.Nombre as TipoNombre',
        't.Descripcion as TipoDescripcion',
        't.Precio'
    );

if ($hasBranchTables && $idSucursalRetiro > 0) {
    $validationQuery->whereExists(function ($subQuery) use ($idSucursalRetiro) {
        $subQuery->selectRaw('1')
            ->from('autos_sucursales as af')
            ->whereColumn('af.ID_Auto', 'a.ID')
            ->where('af.ID_Sucursal', $idSucursalRetiro);
    });
}

$validatedRows = $validationQuery
    ->get()
    ->map(function ($row) {
        return (array) $row;
    })
    ->all();

$validatedById = [];
foreach ($validatedRows as $row) {
    $vehicle = map_vehicle_for_output($row);
    $validatedById[(int) $vehicle['id']] = $vehicle;
}

$finalRecommendations = [];
foreach ($rawRecommendations as $rec) {
    $id = (int) $rec['id'];
    if (!isset($validatedById[$id])) {
        continue;
    }

    $finalRecommendations[] = [
        'id' => $id,
        'reason' => $rec['reason'],
        'vehicle' => $validatedById[$id],
    ];

    if (count($finalRecommendations) >= 3) {
        break;
    }
}

if (empty($finalRecommendations)) {
    respond_recommender([
        'success' => false,
        'code' => 'recommendations_unavailable',
        'message' => 'No se pudieron validar recomendaciones disponibles en este momento.',
    ], 422);
}

respond_recommender([
    'success' => true,
    'recommendations' => $finalRecommendations,
    'filtered_candidates' => count($filteredRows),
]);
