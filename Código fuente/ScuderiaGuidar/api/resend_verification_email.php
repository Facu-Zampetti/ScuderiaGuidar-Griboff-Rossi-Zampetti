<?php
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/bootstrap_eloquent.php';
require_once __DIR__ . '/verification_utils.php';

use App\Models\Cliente;
use Illuminate\Database\Capsule\Manager as Capsule;

function respond_json_resend(array $payload, int $statusCode = 200): void
{
    http_response_code($statusCode);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$email = trim((string) (($input['email'] ?? '')));

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond_json_resend([
        'success' => false,
        'message' => 'Email invalido.',
    ], 400);
}

$hasEmailVerifiedColumn = Capsule::schema()->hasColumn('clientes', 'Email_Verificado');
$hasEmailVerifiedAtColumn = Capsule::schema()->hasColumn('clientes', 'Email_Verificado_En');
if (!$hasEmailVerifiedColumn || !$hasEmailVerifiedAtColumn) {
    respond_json_resend([
        'success' => false,
        'message' => 'La base de datos no tiene campos de verificacion de email. Ejecuta la migracion SQL.',
    ], 500);
}

$user = Cliente::query()
    ->select('ID', 'Nombre', 'Apellido', 'Mail', 'Email_Verificado')
    ->where('Mail', $email)
    ->first();

if (!$user) {
    // Respuesta generica para no exponer existencia de cuentas.
    respond_json_resend([
        'success' => true,
        'email_sent' => true,
        'message' => 'Si el email existe, se envio un nuevo enlace de verificacion.',
    ]);
}

if ((int) $user->Email_Verificado === 1) {
    respond_json_resend([
        'success' => false,
        'code' => 'already_verified',
        'message' => 'La cuenta ya esta verificada. Puedes iniciar sesion.',
    ], 409);
}

$fullName = trim(((string) $user->Nombre) . ' ' . ((string) $user->Apellido));
$token = create_email_verification_token((int) $user->ID, (string) $user->Mail);
$link = build_email_verification_link($token);

$emailSent = send_email_verification_mail((string) $user->Mail, $fullName, $link);
if (!$emailSent) {
    log_verification_link_fallback((string) $user->Mail, $link, 'resend');
}

respond_json_resend([
    'success' => true,
    'email_sent' => $emailSent,
    'message' => $emailSent
        ? 'Te enviamos un nuevo enlace de verificacion.'
        : 'No se pudo enviar el email automaticamente; revisa la configuracion de correo del servidor.',
]);
