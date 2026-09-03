# Código Fuente — ScuderiaGuidar

Esta carpeta contiene el código fuente completo de **ScuderiaGuidar**, una plataforma web destinada al alquiler y gestión de vehículos.

El proyecto contempla funcionalidades para visitantes, clientes registrados y administradores, integrando frontend, backend, base de datos, servicios externos y herramientas de Inteligencia Artificial.

## Funcionalidades principales

### Usuarios

- Registro de clientes.
- Validación de datos.
- Verificación de correo electrónico.
- Inicio y cierre de sesión.
- Manejo de roles de cliente y administrador.

### Vehículos

- Visualización del catálogo.
- Clasificación por categorías.
- Consulta de precios.
- Filtros y ordenamiento.
- Vehículos destacados.
- Asociación de vehículos con sucursales.

### Reservas

- Selección de vehículo.
- Selección de fechas.
- Sucursal de retiro.
- Sucursal de devolución.
- Validación de disponibilidad.
- Control de superposición de reservas.
- Cálculo automático del importe.
- Consulta de reservas realizadas.
- Cancelación de reservas según su estado.

### Administración

El sistema posee un área exclusiva para administradores desde la cual es posible gestionar:

- Clientes.
- Roles.
- Vehículos.
- Categorías.
- Sucursales.
- Reservas.
- Estados.
- Estadísticas generales del sistema.

## Dashboard de estadísticas

El panel administrativo incluye cuatro indicadores numéricos:

- Total de reservas.
- Ingresos totales.
- Clientes registrados.
- Auto más reservado.

También dispone de cuatro gráficos:

- Reservas por estado.
- Distribución de la flota por tipo.
- Top 5 de vehículos más reservados.
- Ingresos por fecha de operación.

Los gráficos son generados utilizando **Chart.js**.

## Recomendador inteligente con Gemini

ScuderiaGuidar incorpora un asistente que ayuda al usuario a seleccionar un vehículo según sus necesidades.

El usuario puede indicar:

- Días de alquiler.
- Cantidad de pasajeros.
- Equipaje.
- Estilo de viaje.
- Presupuesto.
- Extras deseados.

El sistema filtra primero los vehículos disponibles y posteriormente utiliza **Google Gemini API** para generar una recomendación personalizada.

### Archivos principales

- `pages/vehicle_catalog.html`  
  Interfaz del chatbot y formulario de preferencias.

- `public/vehicle-recommender.js`  
  Recopila los datos ingresados por el usuario y los envía al backend.

- `api/recomendar.php`  
  Procesa las preferencias, filtra los vehículos disponibles y realiza la consulta a Gemini.

- `css/main.css`  
  Contiene los estilos del botón, panel, formulario y mensajes del recomendador.

- `sql/migracion_recomendador_ia.sql`  
  Incluye los ajustes de base de datos relacionados con esta funcionalidad.

## Tecnologías utilizadas

### Frontend

- HTML5
- CSS3
- JavaScript
- Tailwind CSS

### Backend

- PHP 8.1+
- Eloquent ORM
- Illuminate Database
- Composer

### Base de datos

- MySQL

### Librerías y servicios externos

- Chart.js
- PHPMailer
- Google Maps JavaScript API
- Google Gemini API

## Organización general

```text
api/
    Endpoints PHP y lógica del backend

css/
    Estilos del sistema

img/
    Imágenes generales y fotografías de vehículos

models/
    Modelos utilizados por Eloquent ORM

pages/
    Interfaces HTML del sistema

public/
    Archivos JavaScript del frontend

sql/
    Scripts y migraciones de base de datos

vendor/
    Dependencias PHP administradas mediante Composer
