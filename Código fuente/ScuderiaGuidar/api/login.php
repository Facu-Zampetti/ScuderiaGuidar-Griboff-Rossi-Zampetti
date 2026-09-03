<?php
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/bootstrap_eloquent.php';

use App\Models\Cliente;
use Illuminate\Database\Capsule\Manager as Capsule;

$raw = file_get_contents('php://input');
$input = json_decode($raw, true);
if (!$input || !isset($input['email']) || !isset($input['password'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
    exit;
}

$email = trim($input['email']);
$password = $input['password'];

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Email inválido']);
    exit;
}

try {
    $hasEmailVerifiedColumn = Capsule::schema()->hasColumn('clientes', 'Email_Verificado');

    $query = Cliente::query()
        ->select('ID', 'Nombre', 'Mail', 'Contraseña', 'Rol')
        ->where('Mail', $email);

    if ($hasEmailVerifiedColumn) {
        $query->addSelect('Email_Verificado');
    }

    $user = $query->first();

    if (!$user) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Credenciales inválidas']);
        exit;
    }

    if (!password_verify($password, $user->Contraseña)) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Credenciales inválidas']);
        exit;
    }

    if ($hasEmailVerifiedColumn && (int) ($user->Email_Verificado ?? 0) !== 1) {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'code' => 'email_not_verified',
            'message' => 'Debes verificar tu cuenta antes de iniciar sesión.',
            'email' => $user->Mail,
            'can_resend' => true,
        ]);
        exit;
    }

    if (session_status() !== PHP_SESSION_ACTIVE) session_start();
    session_regenerate_id(true);

    $_SESSION['cliente_id'] = (int) $user->ID;
    $_SESSION['cliente_nombre'] = $user->Nombre;
    $_SESSION['cliente_mail'] = $user->Mail;
    $_SESSION['cliente_rol'] = (int) $user->Rol;

    echo json_encode([
        'success' => true,
        'user' => [
            'id' => (int) $user->ID,
            'nombre' => $user->Nombre,
            'mail' => $user->Mail,
            'rol' => (int) $user->Rol
        ]
    ]);
    exit;

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error en servidor']);
    exit;
}
?>