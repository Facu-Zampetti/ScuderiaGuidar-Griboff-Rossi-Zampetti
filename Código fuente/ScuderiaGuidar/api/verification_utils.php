<?php

function base64url_encode_custom(string $data): string
{
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64url_decode_custom(string $data): string|false
{
    $padding = strlen($data) % 4;
    if ($padding > 0) {
        $data .= str_repeat('=', 4 - $padding);
    }

    return base64_decode(strtr($data, '-_', '+/'));
}

function get_verification_jwt_secret(): string
{
    $secret = trim((string) (getenv('JWT_VERIFICATION_SECRET') ?: ''));
    if ($secret !== '') {
        return $secret;
    }

    $fallback = trim((string) (getenv('APP_SECRET') ?: ''));
    if ($fallback !== '') {
        return $fallback;
    }

    return 'scuderiaguidar-email-verification-secret-change-me';
}

function get_verification_token_ttl_seconds(): int
{
    $ttl = (int) (getenv('VERIFICATION_TOKEN_TTL_SECONDS') ?: 3600);
    return $ttl > 0 ? $ttl : 3600;
}

function create_email_verification_token(int $userId, string $email): string
{
    $now = time();
    $header = [
        'alg' => 'HS256',
        'typ' => 'JWT',
    ];
    $payload = [
        'sub' => (string) $userId,
        'email' => $email,
        'purpose' => 'email_verification',
        'iat' => $now,
        'exp' => $now + get_verification_token_ttl_seconds(),
        'jti' => bin2hex(random_bytes(16)),
    ];

    $encodedHeader = base64url_encode_custom(json_encode($header, JSON_UNESCAPED_UNICODE));
    $encodedPayload = base64url_encode_custom(json_encode($payload, JSON_UNESCAPED_UNICODE));
    $signatureInput = $encodedHeader . '.' . $encodedPayload;

    $signature = hash_hmac('sha256', $signatureInput, get_verification_jwt_secret(), true);
    $encodedSignature = base64url_encode_custom($signature);

    return $signatureInput . '.' . $encodedSignature;
}

function decode_email_verification_token(string $token): array
{
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        return [
            'valid' => false,
            'code' => 'invalid_token',
            'message' => 'Token malformado.',
        ];
    }

    [$encodedHeader, $encodedPayload, $encodedSignature] = $parts;

    $headerJson = base64url_decode_custom($encodedHeader);
    $payloadJson = base64url_decode_custom($encodedPayload);
    $signature = base64url_decode_custom($encodedSignature);

    if ($headerJson === false || $payloadJson === false || $signature === false) {
        return [
            'valid' => false,
            'code' => 'invalid_token',
            'message' => 'Token malformado.',
        ];
    }

    $header = json_decode($headerJson, true);
    $payload = json_decode($payloadJson, true);
    if (!is_array($header) || !is_array($payload)) {
        return [
            'valid' => false,
            'code' => 'invalid_token',
            'message' => 'Token inválido.',
        ];
    }

    if (($header['alg'] ?? '') !== 'HS256') {
        return [
            'valid' => false,
            'code' => 'invalid_token',
            'message' => 'Algoritmo de token no soportado.',
        ];
    }

    $signatureInput = $encodedHeader . '.' . $encodedPayload;
    $expectedSignature = hash_hmac('sha256', $signatureInput, get_verification_jwt_secret(), true);
    if (!hash_equals($expectedSignature, $signature)) {
        return [
            'valid' => false,
            'code' => 'invalid_token',
            'message' => 'Firma de token inválida.',
        ];
    }

    if (($payload['purpose'] ?? '') !== 'email_verification') {
        return [
            'valid' => false,
            'code' => 'invalid_token',
            'message' => 'Tipo de token inválido.',
        ];
    }

    $exp = (int) ($payload['exp'] ?? 0);
    if ($exp <= 0 || $exp < time()) {
        return [
            'valid' => false,
            'code' => 'token_expired',
            'message' => 'El enlace de verificación expiró.',
            'payload' => $payload,
        ];
    }

    return [
        'valid' => true,
        'payload' => $payload,
    ];
}

function get_app_base_url(): string
{
    $envBaseUrl = trim((string) (getenv('APP_BASE_URL') ?: ''));
    if ($envBaseUrl !== '') {
        return rtrim($envBaseUrl, '/');
    }

    $scheme = 'http';
    if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
        $scheme = 'https';
    }

    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $scriptName = $_SERVER['SCRIPT_NAME'] ?? '';

    $projectPath = rtrim(str_replace('\\', '/', dirname(dirname($scriptName))), '/');
    if ($projectPath === '.' || $projectPath === '/') {
        $projectPath = '';
    }

    return $scheme . '://' . $host . $projectPath;
}

function build_email_verification_link(string $token): string
{
    return get_app_base_url() . '/pages/verify_email.html?token=' . urlencode($token);
}

function env_bool(string $name, bool $default = false): bool
{
    $value = getenv($name);
    if ($value === false) {
        return $default;
    }

    $normalized = strtolower(trim((string) $value));
    if (in_array($normalized, ['1', 'true', 'yes', 'on'], true)) {
        return true;
    }
    if (in_array($normalized, ['0', 'false', 'no', 'off'], true)) {
        return false;
    }

    return $default;
}

function log_smtp_error(string $message): void
{
    $line = sprintf("[%s] %s%s", date('Y-m-d H:i:s'), $message, PHP_EOL);
    @file_put_contents(__DIR__ . '/debug_smtp.log', $line, FILE_APPEND);
}

function send_email_verification_mail(string $email, string $fullName, string $verificationLink): bool
{
    if (!class_exists('PHPMailer\\PHPMailer\\PHPMailer')) {
        log_smtp_error('PHPMailer no esta disponible en autoload.');
        return false;
    }

    $smtpHost = trim((string) (getenv('SMTP_HOST') ?: getenv('MAIL_HOST') ?: 'mail.scuderiaguidar.com.ar'));
    $smtpPort = (int) (getenv('SMTP_PORT') ?: getenv('MAIL_PORT') ?: 465);
    $smtpUser = trim((string) (getenv('SMTP_USERNAME') ?: getenv('MAIL_USERNAME') ?: 'noreply@scuderiaguidar.com.ar'));
    $smtpPass = (string) (getenv('SMTP_PASSWORD') ?: getenv('MAIL_PASSWORD') ?: '');
    $smtpEncryption = strtolower(trim((string) (getenv('SMTP_ENCRYPTION') ?: getenv('MAIL_ENCRYPTION') ?: 'ssl')));

    $fromAddress = trim((string) (getenv('MAIL_FROM_ADDRESS') ?: $smtpUser));
    $fromName = trim((string) (getenv('MAIL_FROM_NAME') ?: 'ScuderiaGuidar'));

    $subject = 'Verifica tu cuenta en ScuderiaGuidar';

    $safeName = $fullName !== '' ? $fullName : 'cliente';
    $textBody = "Hola {$safeName},\n\n" .
        "Gracias por registrarte en ScuderiaGuidar.\n" .
        "Para activar tu cuenta, haz clic en el siguiente enlace:\n\n" .
        $verificationLink . "\n\n" .
        "Este enlace vence en 1 hora.\n" .
        "Si no solicitaste esta cuenta, ignora este mensaje.\n";

    $htmlBody =
        '<p>Hola ' . htmlspecialchars($safeName, ENT_QUOTES, 'UTF-8') . ',</p>' .
        '<p>Gracias por registrarte en ScuderiaGuidar.</p>' .
        '<p>Para activar tu cuenta, haz clic en el siguiente enlace:</p>' .
        '<p><a href="' . htmlspecialchars($verificationLink, ENT_QUOTES, 'UTF-8') . '">' .
        htmlspecialchars($verificationLink, ENT_QUOTES, 'UTF-8') .
        '</a></p>' .
        '<p>Este enlace vence en 1 hora.</p>' .
        '<p>Si no solicitaste esta cuenta, ignora este mensaje.</p>';

    if ($smtpHost === '' || $smtpUser === '' || $smtpPass === '') {
        log_smtp_error('Faltan datos SMTP (host/username/password).');
        return false;
    }

    $mail = new PHPMailer\PHPMailer\PHPMailer(true);

    try {
        $mail->isSMTP();
        $mail->Host = $smtpHost;
        $mail->Port = $smtpPort > 0 ? $smtpPort : 465;
        $mail->SMTPAuth = true;
        $mail->Username = $smtpUser;
        $mail->Password = $smtpPass;
        $mail->CharSet = 'UTF-8';

        if ($smtpEncryption === 'tls') {
            $mail->SMTPSecure = PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
        } elseif ($smtpEncryption === 'none' || $smtpEncryption === '') {
            $mail->SMTPSecure = false;
            $mail->SMTPAutoTLS = false;
        } else {
            $mail->SMTPSecure = PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS;
        }

        if (env_bool('SMTP_ALLOW_SELF_SIGNED', false)) {
            $mail->SMTPOptions = [
                'ssl' => [
                    'verify_peer' => false,
                    'verify_peer_name' => false,
                    'allow_self_signed' => true,
                ],
            ];
        }

        $mail->setFrom($fromAddress, $fromName);
        $mail->addAddress($email, $safeName);
        $mail->addReplyTo($fromAddress, $fromName);

        $mail->Subject = $subject;
        $mail->isHTML(true);
        $mail->Body = $htmlBody;
        $mail->AltBody = $textBody;

        $mail->send();
        return true;
    } catch (Throwable $e) {
        log_smtp_error('Error SMTP enviando verificacion a ' . $email . ': ' . $e->getMessage());
        return false;
    }
}

function log_verification_link_fallback(string $email, string $verificationLink, string $source): void
{
    $line = sprintf(
        "[%s] source=%s email=%s link=%s%s",
        date('Y-m-d H:i:s'),
        $source,
        $email,
        $verificationLink,
        PHP_EOL
    );

    @file_put_contents(__DIR__ . '/debug_verification_links.log', $line, FILE_APPEND);
}
