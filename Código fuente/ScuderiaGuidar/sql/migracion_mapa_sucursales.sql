START TRANSACTION;

-- 1) Agregar coordenadas geograficas a sucursales
ALTER TABLE `sucursales`
  ADD COLUMN IF NOT EXISTS `Latitud` DECIMAL(10,7) NULL AFTER `Direccion`,
  ADD COLUMN IF NOT EXISTS `Longitud` DECIMAL(10,7) NULL AFTER `Latitud`;

-- 2) Cargar coordenadas para las sucursales existentes (Cordoba)
UPDATE `sucursales`
SET `Latitud` = -31.4102439,
    `Longitud` = -64.2116337
WHERE `ID` = 1;

UPDATE `sucursales`
SET `Latitud` = -31.4317820,
    `Longitud` = -64.1880530
WHERE `ID` = 2;

UPDATE `sucursales`
SET `Latitud` = -31.3675352,
    `Longitud` = -64.2486057
WHERE `ID` = 3;

-- 3) Fallback por nombre (por si los ID difieren en otro entorno)
UPDATE `sucursales`
SET `Latitud` = -31.4102439,
    `Longitud` = -64.2116337
WHERE `Nombre` = 'Casa Central Cordoba';

UPDATE `sucursales`
SET `Latitud` = -31.4317820,
    `Longitud` = -64.1880530
WHERE `Nombre` = 'Sucursal Nueva Cordoba';

UPDATE `sucursales`
SET `Latitud` = -31.3675352,
    `Longitud` = -64.2486057
WHERE `Nombre` = 'Sucursal Cerro de las Rosas';

COMMIT;
