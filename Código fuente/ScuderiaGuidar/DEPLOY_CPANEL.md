# Despliegue en cPanel

## Requisitos del hosting

- PHP 8.1 o superior.
- Extensiones PHP: `pdo_mysql`, `mbstring`, `openssl`, `json`, `fileinfo`, `zip`.
- MariaDB/MySQL.
- Apache con `mod_rewrite` y soporte para `.htaccess`.
- Composer disponible en cPanel, o carpeta `vendor/` incluida en el paquete.

## 1. Preparar variables de entorno

1. Copiar `.env.example` como `.env` en la raíz del proyecto.
2. Completar valores reales de cPanel:
  - DB: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS`
  - Maps: `GOOGLE_MAPS_API_KEY` (opcional, existe fallback a OpenStreetMap)
  - IA recomendador: `GEMINI_API_KEY` (opcional `GEMINI_MODEL`, default `gemini-flash-lite-latest`)
  - JWT/JWS: `JWT_VERIFICATION_SECRET`
  - SMTP: `SMTP_HOST`, `SMTP_PORT`, `SMTP_ENCRYPTION`, `SMTP_USERNAME`, `SMTP_PASSWORD`
  - Remitente: `MAIL_FROM_ADDRESS`, `MAIL_FROM_NAME`
  - URL pública: `APP_BASE_URL` (ejemplo: `https://tudominio.com`)

`api/config.php` carga automáticamente `.env` y `.env.local`.

## 2. Crear / importar base de datos

1. En cPanel, abrir **MySQL Databases**.
2. Crear base y usuario MySQL.
3. Asignar el usuario a la base con todos los privilegios.
4. **Base de datos nueva (recomendado):** importar `sql/instalacion_completa.sql` en phpMyAdmin. Crea las 7 tablas ya con todas las columnas actuales (mapa de sucursales, verificación de email, campos del recomendador IA) y carga solo los catálogos que la app necesita (`tipos`, `estados`). No incluye autos, sucursales ni clientes de prueba: se cargan después desde el panel admin.
5. **Base de datos ya existente (migración de una instalación previa):** en vez del script anterior, ejecutar en orden los `migracion_*.sql` que falten según las columnas que ya tengas.
6. Verificar tablas: `autos`, `clientes`, `estados`, `reservas`, `tipos`, `sucursales`, `autos_sucursales`.
7. Verificar que `clientes` tenga columnas de verificación (`Email_Verificado`, `Email_Verificado_En`) y que `autos` tenga las columnas del recomendador IA (`Capacidad_Pasajeros`, `Capacidad_Equipaje`, `Transmision_Automatica`, `Aire_Acondicionado`).

### 2.1 Crear el primer usuario administrador

El registro público siempre crea cuentas con `Rol = 0` (cliente). Para tener un admin:

1. Registrar una cuenta normal desde `pages/registration.html` con el email real del administrador.
2. Verificar el email (o confirmarlo manualmente, ver 2.2).
3. En phpMyAdmin, ejecutar:
   ```sql
   UPDATE clientes SET Rol = 1 WHERE Mail = 'admin@tudominio.com';
   ```
4. Volver a iniciar sesión: el menú de administrador debe aparecer en el header.

### 2.2 Confirmar verificación de email manualmente (si el SMTP aún no está probado)

```sql
UPDATE clientes SET Email_Verificado = 1, Email_Verificado_En = NOW() WHERE Mail = 'admin@tudominio.com';
```

## 3. Subir archivos a public_html

Subir el contenido completo del proyecto manteniendo estructura:

```text
public_html/
  api/
  css/
  img/
  models/
  pages/
  public/
  vendor/
  .env
  .htaccess
  .user.ini
  composer.json
  composer.lock
  index.html
```

No subir SQL ni backups a rutas públicas accesibles por URL. Tampoco subir `api/error_log`, `api/debug_login.txt` ni `api/debug_*.log` si existen localmente: son artefactos de depuración local y se regeneran solos en el servidor (ya están excluidos en `.gitignore`).

## 4. Instalar dependencias

Si cPanel tiene Terminal:

```bash
cd ~/public_html
composer install --no-dev --optimize-autoloader
```

Si no hay Composer, subir `vendor/` ya generado localmente.

## 5. Configurar PHP y permisos

1. En **MultiPHP Manager** o **Select PHP Version**: PHP 8.1+.
2. Confirmar extensiones requeridas activas.
3. Permisos recomendados:
  - directorios `755`
  - archivos `644`
4. Carpeta `img/autos/` con escritura (`775` si el hosting lo requiere).

## 6. Pruebas post-deploy

Abrir:

```text
https://tudominio.com/
https://tudominio.com/pages/homepage.html
```

Verificar APIs:

```text
https://tudominio.com/api/get_vehicles.php
https://tudominio.com/api/get_types.php
https://tudominio.com/api/get_sucursales.php
https://tudominio.com/api/get_maps_config.php
https://tudominio.com/api/recomendar.php
```

Probar flujo completo:

1. Registro de usuario.
2. Llegada de email de verificación.
3. Apertura del link y verificación.
4. Login posterior.
5. Reenvío de verificación desde login cuando corresponda.

## 7. Logs útiles

- Error SMTP: `api/debug_smtp.log`
- Fallback de enlaces de verificación: `api/debug_verification_links.log`
- Error general PHP/cPanel: `error_log`

## Notas

- No ejecutar migraciones de Laravel: se usan tablas existentes con Eloquent standalone.
- El `.htaccess` bloquea listados y acceso directo a rutas sensibles (`vendor`, `models`, `sql`, `.env`).
- Si Maps no carga en producción, revisar restricciones de la API key por dominio en Google Cloud.
- Si `GOOGLE_MAPS_API_KEY` no esta definida o falla, la app usa fallback con OpenStreetMap/Leaflet.

## Seguridad de secretos

- `.env.example` solo trae placeholders (`reemplaza_con_...`). Los valores reales van únicamente en `.env`, que nunca se sube al repositorio (ver `.gitignore` en la raíz).
- Si en algún momento un secreto real (API key, password SMTP/BD, `JWT_VERIFICATION_SECRET`) quedó commiteado en git o expuesto por accidente, hay que rotarlo (generar uno nuevo) además de quitarlo del archivo.
- Antes de subir el proyecto a un repositorio remoto (GitHub, GitLab, etc.), confirmar que `.env` no aparezca en `git status` como archivo a commitear.
