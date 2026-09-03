# Checklist de despliegue en cPanel

## Datos del hosting

- [ ] Dominio activo y apuntando al hosting.
- [ ] Cuenta cPanel con acceso a File Manager, MySQL y PHP selector.
- [ ] Version de PHP seleccionada: 8.1 o superior.

## Base de datos

- [ ] Base de datos creada en cPanel.
- [ ] Usuario MySQL creado y asignado a la base.
- [ ] Usuario con privilegios completos sobre la base.
- [ ] Base nueva: importado `sql/instalacion_completa.sql` (estructura completa + catalogos `tipos`/`estados`, sin datos de prueba).
- [ ] Base existente: aplicados los `migracion_*.sql` pendientes en orden.
- [ ] Tablas verificadas: `autos`, `clientes`, `estados`, `reservas`, `tipos`, `sucursales`, `autos_sucursales`.
- [ ] Verificacion email lista: `clientes.Email_Verificado` y `clientes.Email_Verificado_En`.
- [ ] Columnas del recomendador IA en `autos`: `Capacidad_Pasajeros`, `Capacidad_Equipaje`, `Transmision_Automatica`, `Aire_Acondicionado`.
- [ ] Primer usuario administrador creado (registro + `UPDATE clientes SET Rol = 1 WHERE Mail = '...'`).

## Variables de entorno (.env)

- [ ] Copiado `.env.example` a `.env` en raiz.
- [ ] Configurados DB vars: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS`.
- [ ] Configurado Google Maps: `GOOGLE_MAPS_API_KEY` (opcional, hay fallback a OpenStreetMap).
- [ ] Configurado IA Gemini: `GEMINI_API_KEY` (opcional `GEMINI_MODEL`).
- [ ] Configurado JWT/JWS: `JWT_VERIFICATION_SECRET` y `VERIFICATION_TOKEN_TTL_SECONDS`.
- [ ] Configurado SMTP: `SMTP_HOST`, `SMTP_PORT`, `SMTP_ENCRYPTION`, `SMTP_USERNAME`, `SMTP_PASSWORD`.
- [ ] Configurado remitente: `MAIL_FROM_ADDRESS`, `MAIL_FROM_NAME`.
- [ ] Configurado `APP_BASE_URL` sin slash final (`https://tudominio.com`).

## Archivos del proyecto

- [ ] Proyecto subido a `public_html` con estructura completa.
- [ ] Carpeta `vendor/` presente en el servidor.
- [ ] `.htaccess` presente en raiz.
- [ ] `.user.ini` presente en raiz.
- [ ] `.env` presente en raiz y no expuesto publicamente.
- [ ] Archivos SQL/backups fuera de carpeta publica o inaccesibles por URL.

## Composer

- [ ] Ejecutado `composer install --no-dev --optimize-autoloader` en servidor.
- [ ] Si no hay terminal, `vendor/` subido desde local.

## Permisos

- [ ] Directorios con permiso `755`.
- [ ] Archivos con permiso `644`.
- [ ] `img/autos/` con permisos de escritura para subidas del admin.

## Pruebas funcionales

- [ ] Carga `https://tudominio.com/`.
- [ ] Carga `https://tudominio.com/pages/homepage.html`.
- [ ] Responde `https://tudominio.com/api/get_vehicles.php` con JSON valido.
- [ ] Responde `https://tudominio.com/api/get_types.php` con JSON valido.
- [ ] Responde `https://tudominio.com/api/get_sucursales.php` con JSON valido.
- [ ] Responde `https://tudominio.com/api/get_maps_config.php` con JSON valido (si `apiKey` esta vacio debe funcionar fallback de mapa).
- [ ] Responde `https://tudominio.com/api/recomendar.php` con recomendaciones (usuario logueado + `GEMINI_API_KEY`).
- [ ] Registro de usuario funcionando.
- [ ] Llega email de verificacion.
- [ ] Verificacion por link funcionando.
- [ ] Login bloquea no verificados y permite reenvio.
- [ ] Login de verificados funcionando.
- [ ] Creacion de reserva funcionando.
- [ ] Panel admin operativo (clientes, flota, reservas).

## Seguridad basica

- [ ] `display_errors` desactivado en produccion.
- [ ] Listado de directorios desactivado.
- [ ] Acceso directo a `vendor/`, `models/`, `sql`, `.env` bloqueado por `.htaccess`.
- [ ] No quedan contrasenas ni API keys hardcodeadas en codigo.
- [ ] `.env.example` solo contiene placeholders, no valores reales.
- [ ] `.env` no aparece en `git status` como archivo para commitear.

## Logs y monitoreo

- [ ] Revisado `error_log` luego de primeras pruebas.
- [ ] Revisado `api/debug_smtp.log` si falla el envio de email.
- [ ] Revisado `api/debug_verification_links.log` como respaldo.

## Entrega

- [ ] Guardada copia segura del `.env` y accesos de DB/correo.
- [ ] Documentado usuario administrador inicial.
- [ ] Confirmado que el cliente puede acceder y operar el sistema.
