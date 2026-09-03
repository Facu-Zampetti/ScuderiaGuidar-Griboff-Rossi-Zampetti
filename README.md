# 🚗 ScuderiaGuidar

> Plataforma web para alquiler y gestión de vehículos desarrollada como proyecto final de **Laboratorio III**.

[![PHP](https://img.shields.io/badge/PHP-8.1%2B-777BB4?logo=php&logoColor=white)](https://www.php.net/)
[![MySQL](https://img.shields.io/badge/MySQL-Database-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com/)
[![JavaScript](https://img.shields.io/badge/JavaScript-Frontend-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/es/docs/Web/JavaScript)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Gemini](https://img.shields.io/badge/Google-Gemini%20API-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![GitHub](https://img.shields.io/badge/GitHub-Repositorio-181717?logo=github&logoColor=white)](https://github.com/Facu-Zampetti/ScuderiaGuidar-Griboff-Rossi-Zampetti)

---

## 📌 Sobre el proyecto

**ScuderiaGuidar** es un sistema web orientado al alquiler de vehículos.

La plataforma permite que los usuarios consulten la flota disponible, conozcan sus características y precios, seleccionen fechas y sucursales y realicen reservas desde el sitio.

Además, incorpora herramientas administrativas para gestionar clientes, vehículos, reservas, sucursales y estadísticas generales del negocio.

El proyecto integra desarrollo **Frontend y Backend**, base de datos, ORM, APIs externas, dashboard estadístico, publicación en hosting, marketing digital y una funcionalidad de Inteligencia Artificial basada en **Google Gemini**.

---

## 🌐 Sitios publicados

### Sistema principal

🔗 **https://scuderiaguidar.com.ar/**

Aplicación principal utilizada por clientes y administradores para consultar vehículos, gestionar cuentas y realizar reservas.

### Web promocional

🔗 **https://wp3.scuderiaguidar.com.ar/**

Sitio desarrollado en WordPress para la presentación comercial de ScuderiaGuidar.

---

## ✨ Funcionalidades principales

### 👤 Usuarios

- Registro de clientes.
- Validación de datos.
- Verificación de correo electrónico.
- Inicio y cierre de sesión.
- Manejo de roles.
- Acceso diferenciado para clientes y administradores.

### 🚘 Catálogo de vehículos

- Visualización de la flota.
- Clasificación por categorías.
- Consulta de precios diarios.
- Filtros de búsqueda.
- Ordenamiento de vehículos.
- Vehículos destacados.
- Asociación entre vehículos y sucursales.

### 📅 Reservas

- Selección de vehículo.
- Selección de fecha de retiro y devolución.
- Elección de sucursal de retiro y devolución.
- Verificación de disponibilidad.
- Control de superposición de reservas.
- Cálculo automático del precio total.
- Consulta de reservas realizadas.
- Cancelación según el estado de la operación.

### 🛠️ Administración

Los usuarios con rol administrador pueden gestionar:

- Clientes.
- Roles.
- Vehículos.
- Categorías.
- Sucursales.
- Reservas.
- Estados.
- Vehículos destacados.
- Estadísticas del sistema.

---

## 🤖 Recomendador inteligente con Google Gemini

ScuderiaGuidar incorpora un **asistente de recomendación de vehículos basado en Inteligencia Artificial**.

Desde el catálogo, el usuario puede indicar diferentes preferencias:

- Duración del alquiler.
- Cantidad de pasajeros.
- Equipaje.
- Estilo de viaje.
- Presupuesto.
- Extras deseados.

El sistema filtra primero los vehículos disponibles y construye un perfil con las preferencias ingresadas. Luego consulta **Google Gemini API** para generar una recomendación personalizada.

### Componentes principales

```text
pages/vehicle_catalog.html
        ↓
public/vehicle-recommender.js
        ↓
api/recomendar.php
        ↓
Google Gemini API
```

El backend se encarga de realizar la comunicación con Gemini, evitando que las credenciales del servicio queden expuestas en el frontend.

---

## 📊 Dashboard de estadísticas

El panel administrativo incluye un dashboard desarrollado con **Chart.js**.

### Indicadores

- Total de reservas.
- Ingresos totales.
- Clientes registrados.
- Auto más reservado.

### Gráficos

- Reservas por estado.
- Distribución de la flota por tipo.
- Top 5 de vehículos más reservados.
- Ingresos por fecha de operación.

Los datos son obtenidos dinámicamente desde la base de datos.

---

## 🗺️ Integraciones externas

### Google Maps JavaScript API

Permite representar las sucursales mediante mapas interactivos, marcadores e información geográfica.

### Google Gemini API

Utilizada por el recomendador inteligente para generar sugerencias personalizadas de vehículos.

### PHPMailer

Utilizado para enviar correos de verificación de cuenta mediante SMTP.

---

## 🧰 Tecnologías utilizadas

### Frontend

- HTML5
- CSS3
- JavaScript
- Tailwind CSS

### Backend

- PHP 8.1+
- Eloquent ORM
- Illuminate Database
- Illuminate Events
- Composer

### Base de datos

- MySQL
- PDO MySQL

### Librerías y servicios

- Chart.js
- PHPMailer
- Google Maps JavaScript API
- Google Gemini API

### Infraestructura

- cPanel
- Apache
- phpMyAdmin
- GitHub
- WordPress

---

## 🗄️ Base de datos y ORM

La persistencia del sistema se realiza mediante **MySQL**.

Entre las principales entidades se encuentran:

- Clientes
- Vehículos
- Tipos
- Sucursales
- Reservas
- Estados

Los vehículos pueden pertenecer a diferentes sucursales mediante una relación intermedia.

Para el acceso a los datos se utiliza **Eloquent ORM en modo standalone**, instalado mediante Composer.

Esto permite trabajar con modelos y relaciones sin necesidad de utilizar una aplicación Laravel completa.

---

## 📂 Estructura de la entrega

El repositorio se encuentra dividido según los diferentes componentes desarrollados durante el proyecto:

```text
ScuderiaGuidar/
│
├── 📁 Base de datos/
│   └── Scripts SQL utilizados por el sistema.
│
├── 📁 Código fuente/
│   └── Aplicación web completa.
│
├── 📁 Consignas de Trabajo/
│   └── TP-Final.pdf con los requerimientos establecidos por la cátedra.
│
├── 📁 Informe descriptivo/
│   └── Informe Final de ScuderiaGuidar.
│
├── 📁 Marketing/
│   └── Brochure comercial del proyecto.
│
└── README.md
```

### Acceso a cada sección

| Sección | Descripción |
|---|---|
| [📁 Base de datos](./Base%20de%20datos/) | Scripts y estructura SQL utilizados por el sistema. |
| [📁 Código fuente](./C%C3%B3digo%20fuente/) | Código completo de la aplicación ScuderiaGuidar. |
| [📁 Consignas de Trabajo](./Consignas%20de%20Trabajo/) | Requerimientos establecidos para el trabajo final. |
| [📁 Informe descriptivo](./Informe%20descriptivo/) | Informe Final con la documentación del proyecto. |
| [📁 Marketing](./Marketing/) | Brochure y material correspondiente a la propuesta comercial. |

---

## 🔄 Arquitectura general

La aplicación utiliza una separación simple por responsabilidades:

```text
┌───────────────────────┐
│       Frontend        │
│ HTML / CSS / JS       │
│ Tailwind CSS          │
└──────────┬────────────┘
           │
           │ HTTP / fetch
           ▼
┌───────────────────────┐
│       Backend         │
│         PHP           │
│      Endpoints        │
└──────────┬────────────┘
           │
           │ Eloquent ORM
           ▼
┌───────────────────────┐
│        MySQL          │
│    Base de datos      │
└───────────────────────┘
```

El backend también se comunica con servicios externos como:

```text
Backend PHP
   │
   ├── Google Gemini API
   │
   ├── PHPMailer / SMTP
   │
   └── Google Maps
```

---

## 🚀 Publicación

La versión de producción se encuentra desplegada en un servidor administrado mediante **cPanel**.

El entorno contempla:

- PHP 8.1 o superior.
- Base de datos MySQL.
- Composer.
- Dependencias PHP.
- Variables de entorno.
- Configuración SMTP.
- Credenciales para Google Maps.
- Credenciales para Google Gemini.

---

## 📄 Documentación

El repositorio incluye un **Informe Final** en el que se detallan:

- Objetivos.
- Requerimientos.
- Supuestos y restricciones.
- Infraestructura.
- Base de datos.
- Diccionario de datos.
- Diagramas.
- Wireframes.
- Librerías.
- APIs.
- Endpoints.
- Dashboard.
- ORM.
- Funcionalidades.
- Inteligencia Artificial.
- Marketing.
- Publicación.
- Seguridad.
- Material complementario.

El informe puede encontrarse en:

📁 [`Informe descriptivo`](./Informe%20descriptivo/)

---

## 📢 Marketing y comercialización

Como parte de la entrega se desarrollaron dos elementos principales:

### Brochure

Presentación comercial de ScuderiaGuidar orientada principalmente a:

- Turistas.
- Profesionales.
- Empresas.

### Web promocional

Desarrollada con **WordPress** e integrada por:

- Home.
- Nuestro Sistema.
- Precio.
- Pedí una Demo.
- Novedades.
- Contacto.
- Formularios Call to Action.
- WhatsApp.
- Promoción del 20% para solicitud de demo.

🔗 **https://wp3.scuderiaguidar.com.ar/**

---

## 👥 Integrantes

- **Ignacio Griboff**
- **Gonzalo Rossi**
- **Facundo Zampetti**

---

## 🎓 Contexto académico

**Asignatura:** Laboratorio III  
**Carrera:** Ingeniería Informática  
**Curso:** 3er Año “A”  
**Profesor:** Gustavo Adolfo Funes

---

## 🔗 Enlaces

- 🌐 **Sistema:** https://scuderiaguidar.com.ar/
- 📢 **Web promocional:** https://wp3.scuderiaguidar.com.ar/
- 💻 **Repositorio:** https://github.com/Facu-Zampetti/ScuderiaGuidar-Griboff-Rossi-Zampetti

---

<p align="center">
  <strong>ScuderiaGuidar</strong><br>
  Tu viaje comienza aquí.
</p>
