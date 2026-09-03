<?php
// Suprimir errores de PHP para que no rompan el JSON
ini_set('display_errors', 0);
error_reporting(0);

// Capturar warnings/notices que se mezclan con el output
ob_start();

// Capturar errores fatales (out of memory, parse error, etc.)
register_shutdown_function(function() {
    $err = error_get_last();
    if ($err && in_array($err['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        ob_end_clean();
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['success' => false, 'errors' => [
            'server' => 'Error fatal PHP: ' . $err['message'] . ' en linea ' . $err['line']
        ]]);
    }
});

header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/bootstrap_eloquent.php';
require_once __DIR__ . '/verification_utils.php';

use App\Models\Cliente;
use Illuminate\Database\Capsule\Manager as Capsule;

// --- LEER JSON ---
$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) {
    ob_end_clean();
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'JSON inválido.']);
    exit;
}

// --- FUNCION HELP ---
function fail($errors, $code = 400) {
    if (ob_get_level()) ob_end_clean();
    http_response_code($code);
    echo json_encode(['success' => false, 'errors' => $errors]);
    exit;
}

// --- CAMPOS ---
$first      = trim($data['firstName'] ?? '');
$last       = trim($data['lastName'] ?? '');
$email      = trim($data['email'] ?? '');
$phone      = trim($data['phone'] ?? '');
$dni        = trim($data['dni'] ?? '');
$birth      = trim($data['dateOfBirth'] ?? '');
$password   = $data['password'] ?? '';
$hasLicense = (int)($data['hasLicense'] ?? 0);
$address    = trim($data['address'] ?? '');

$errors = [];

// --- VALIDACIONES ---
if ($first === '') $errors['firstName'] = 'Nombre es requerido.';
if ($last === '')  $errors['lastName']  = 'Apellido es requerido.';
if ($email === '') $errors['email']     = 'Email es requerido.';
if ($dni === '')   $errors['dni']       = 'DNI es requerido.';
if ($birth === '') $errors['dateOfBirth'] = 'Fecha de nacimiento es requerida.';
if ($password === '') $errors['password'] = 'Contraseña es requerida.';
if (!$hasLicense)  $errors['hasLicense'] = 'Debes confirmar que tienes licencia.';

if ($email && !filter_var($email, FILTER_VALIDATE_EMAIL)) $errors['email'] = 'Email inválido.';
if ($dni && !preg_match('/^\d+$/', $dni)) $errors['dni'] = 'DNI debe contener solo números.';

if ($birth !== '') {
    $d = date_create_from_format('Y-m-d', $birth);
    if (!$d) $errors['dateOfBirth'] = 'Formato de fecha inválido (YYYY-MM-DD).';
    else {
        $today = new DateTime();
        $diff = $today->diff($d);
        if ($diff->y < 21) $errors['dateOfBirth'] = 'Debes tener al menos 21 años.';
    }
}

if (strlen($password) < 8 || !preg_match('/[A-Z]/', $password) || !preg_match('/\d/', $password)) {
    $errors['password'] = 'Contraseña insegura (mín. 8, 1 mayúscula, 1 número).';
}

if (!empty($errors)) fail($errors, 422);

// --- CHEQUEAR DUPLICADOS ---
$dni_int = (int)$dni; // convertir a int
$row = Cliente::query()
    ->select('ID', 'Mail', 'DNI')
    ->where('Mail', $email)
    ->orWhere('DNI', $dni_int)
    ->first();

if ($row) {
    $conflicts = [];
    if (strcasecmp($row->Mail, $email) === 0) $conflicts['email'] = 'El email ya está registrado.';
    if ((string)$row->DNI === (string)$dni_int) $conflicts['dni'] = 'El DNI ya está registrado.';
    if (!empty($conflicts)) fail($conflicts, 409);
}

// --- HASH CONTRASEÑA ---
$hash = password_hash($password, PASSWORD_DEFAULT);

// Truncar valores para respetar los límites varchar(25) en modo estricto
// Usar substr en vez de mb_substr para máxima compatibilidad con el hosting
$first   = substr($first,   0, 25);
$last    = substr($last,    0, 25);
$phone   = substr($phone,   0, 25);
$address = substr($address, 0, 25);

$lic = $hasLicense;

// --- INSERT FINAL ---
try {
    $hasEmailVerifiedColumn = Capsule::schema()->hasColumn('clientes', 'Email_Verificado');
    $hasEmailVerifiedAtColumn = Capsule::schema()->hasColumn('clientes', 'Email_Verificado_En');

    if ($hasEmailVerifiedColumn && $hasEmailVerifiedAtColumn) {
        $inserted = Capsule::insert(
            'INSERT INTO clientes (Rol, Nombre, Apellido, DNI, Mail, Telefono, Nacimiento, Licencia, Contraseña, Direccion, Email_Verificado, Email_Verificado_En)
             VALUES (0, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NULL)',
            [$first, $last, $dni_int, $email, $phone, $birth, $lic, $hash, $address]
        );
    } else {
        $inserted = Capsule::insert(
            'INSERT INTO clientes (Rol, Nombre, Apellido, DNI, Mail, Telefono, Nacimiento, Licencia, Contraseña, Direccion)
             VALUES (0, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [$first, $last, $dni_int, $email, $phone, $birth, $lic, $hash, $address]
        );
    }

    if (!$inserted) {
        ob_end_clean();
        fail(['server' => 'Error ejecutando INSERT.'], 500);
    }
} catch (Throwable $e) {
    ob_end_clean();
    fail(['server' => 'Error ejecutando INSERT: ' . $e->getMessage()], 500);
}

$newId = (int) Capsule::connection()->getPdo()->lastInsertId();

$verificationToken = create_email_verification_token($newId, $email);
$verificationLink = build_email_verification_link($verificationToken);
$fullName = trim($first . ' ' . $last);

$emailSent = send_email_verification_mail($email, $fullName, $verificationLink);
if (!$emailSent) {
    log_verification_link_fallback($email, $verificationLink, 'register');
}

ob_end_clean();
http_response_code(201);
echo json_encode([
    'success' => true,
    'id' => $newId,
    'requires_verification' => true,
    'email_sent' => $emailSent,
    'message' => $emailSent
        ? 'Cuenta creada. Te enviamos un enlace de verificacion por email.'
        : 'Cuenta creada. No se pudo enviar el email automaticamente; solicita reenvio desde el login.'
]);
exit;
