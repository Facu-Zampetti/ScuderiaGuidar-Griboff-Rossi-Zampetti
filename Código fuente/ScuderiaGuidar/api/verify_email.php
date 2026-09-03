<?php
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/bootstrap_eloquent.php';
require_once __DIR__ . '/verification_utils.php';

use App\Models\Cliente;
use Illuminate\Database\Capsule\Manager as Capsule;

function respond_json(array $payload, int $statusCode = 200): void
{
    http_response_code($statusCode);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

$token = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (is_array($input)) {
        $token = trim((string) ($input['token'] ?? ''));
    }
}

if ($token === '') {
    $token = trim((string) ($_GET['token'] ?? ''));
}

if ($token === '') {
    respond_json([
        'success' => false,
        'code' => 'missing_token',
        'message' => 'Falta token de verificacion.',
    ], 400);
}

$decoded = decode_email_verification_token($token);
if (!($decoded['valid'] ?? false)) {
    $payload = $decoded['payload'] ?? null;
    $resendEmail = null;

    if (is_array($payload) && !empty($payload['email']) && filter_var($payload['email'], FILTER_VALIDATE_EMAIL)) {
        $resendEmail = (string) $payload['email'];
    }

    respond_json([
        'success' => false,
        'code' => $decoded['code'] ?? 'invalid_token',
        'message' => $decoded['message'] ?? 'Token invalido.',
        'can_resend' => true,
        'email' => $resendEmail,
    ], 422);
}

$payload = $decoded['payload'];
$userId = (int) ($payload['sub'] ?? 0);
$email = trim((string) ($payload['email'] ?? ''));

if ($userId <= 0 || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond_json([
        'success' => false,
        'code' => 'invalid_token_payload',
        'message' => 'Token invalido.',
    ], 422);
}

$hasEmailVerifiedColumn = Capsule::schema()->hasColumn('clientes', 'Email_Verificado');
$hasEmailVerifiedAtColumn = Capsule::schema()->hasColumn('clientes', 'Email_Verificado_En');
if (!$hasEmailVerifiedColumn || !$hasEmailVerifiedAtColumn) {
    respond_json([
        'success' => false,
        'code' => 'schema_not_ready',
        'message' => 'La base de datos no tiene campos de verificacion de email. Ejecuta la migracion SQL.',
    ], 500);
}

$user = Cliente::query()
    ->select('ID', 'Mail', 'Email_Verificado')
    ->where('ID', $userId)
    ->where('Mail', $email)
    ->first();

if (!$user) {
    respond_json([
        'success' => false,
        'code' => 'user_not_found',
        'message' => 'No se encontro la cuenta asociada al token.',
    ], 404);
}

if ((int) $user->Email_Verificado === 1) {
    respond_json([
        'success' => true,
        'already_verified' => true,
        'message' => 'Tu cuenta ya estaba verificada. Ya puedes iniciar sesion.',
    ]);
}

Cliente::query()
    ->where('ID', $userId)
    ->update([
        'Email_Verificado' => 1,
        'Email_Verificado_En' => date('Y-m-d H:i:s'),
    ]);

respond_json([
    'success' => true,
    'message' => 'Cuenta verificada correctamente. Ya puedes iniciar sesion.',
]);
