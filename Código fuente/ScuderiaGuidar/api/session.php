<?php
header('Content-Type: application/json; charset=utf-8');

if (session_status() !== PHP_SESSION_ACTIVE) session_start();

if (isset($_SESSION['cliente_id'])) {
    echo json_encode([
        'logged' => true,
        'user' => [
            'id' => (int)$_SESSION['cliente_id'],
            'nombre' => $_SESSION['cliente_nombre'],
            'mail' => $_SESSION['cliente_mail'],
            'rol' => isset($_SESSION['cliente_rol']) ? (int)$_SESSION['cliente_rol'] : 0
        ]
    ]);
} else {
    echo json_encode(['logged' => false]);
}
?>