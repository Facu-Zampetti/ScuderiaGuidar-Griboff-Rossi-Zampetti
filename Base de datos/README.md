# Base de Datos — ScuderiaGuidar

Esta carpeta contiene la estructura de base de datos utilizada por **ScuderiaGuidar**, sistema web desarrollado para la gestión y alquiler de vehículos.

## Contenido

El archivo `.sql` incluido permite crear/importar la base de datos necesaria para el funcionamiento del sistema.

La base de datos almacena información relacionada con:

- Clientes y usuarios.
- Roles de usuario.
- Vehículos.
- Tipos y categorías de vehículos.
- Sucursales.
- Relación entre vehículos y sucursales.
- Reservas.
- Estados de las reservas.
- Precios y datos asociados a las operaciones.
- Información necesaria para las funcionalidades adicionales incorporadas al sistema.

## Relaciones principales

El modelo se encuentra centrado principalmente en la gestión de reservas:

- Un cliente puede realizar múltiples reservas.
- Cada reserva corresponde a un vehículo.
- Cada reserva posee un estado.
- Los vehículos pertenecen a una categoría o tipo.
- Un vehículo puede encontrarse asociado a una o varias sucursales.
- Las reservas registran una sucursal de retiro y una sucursal de devolución.

## Importación

La base de datos puede importarse utilizando herramientas como **phpMyAdmin** o mediante un cliente compatible con MySQL.

En el entorno de producción de ScuderiaGuidar, la base de datos se encuentra alojada en un servidor administrado mediante **cPanel**.

## Tecnologías relacionadas

- MySQL
- PHP
- PDO MySQL
- Eloquent ORM
- Illuminate Database

---

**Proyecto:** ScuderiaGuidar  
**Asignatura:** Laboratorio III  
**Carrera:** Ingeniería Informática
