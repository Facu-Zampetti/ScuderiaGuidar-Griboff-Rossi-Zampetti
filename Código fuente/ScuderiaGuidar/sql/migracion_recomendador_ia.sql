START TRANSACTION;

-- 1) Campos necesarios para recomendaciones IA por vehiculo
ALTER TABLE `autos`
  ADD COLUMN IF NOT EXISTS `Capacidad_Pasajeros` TINYINT(2) NOT NULL DEFAULT 5 AFTER `Disponibilidad`,
  ADD COLUMN IF NOT EXISTS `Capacidad_Equipaje` VARCHAR(20) NOT NULL DEFAULT 'mediano' AFTER `Capacidad_Pasajeros`,
  ADD COLUMN IF NOT EXISTS `Transmision_Automatica` TINYINT(1) NOT NULL DEFAULT 0 AFTER `Capacidad_Equipaje`,
  ADD COLUMN IF NOT EXISTS `Aire_Acondicionado` TINYINT(1) NOT NULL DEFAULT 1 AFTER `Transmision_Automatica`;

-- 2) Backfill de configuracion sugerida segun tipo actual
UPDATE `autos`
SET
  `Capacidad_Pasajeros` = CASE `ID_Tipos`
    WHEN 1 THEN 5
    WHEN 2 THEN 7
    WHEN 3 THEN 2
    WHEN 4 THEN 5
    ELSE `Capacidad_Pasajeros`
  END,
  `Capacidad_Equipaje` = CASE `ID_Tipos`
    WHEN 1 THEN 'mediano'
    WHEN 2 THEN 'grande'
    WHEN 3 THEN 'pequeno'
    WHEN 4 THEN 'grande'
    ELSE `Capacidad_Equipaje`
  END,
  `Transmision_Automatica` = CASE `ID_Tipos`
    WHEN 1 THEN 0
    WHEN 2 THEN 1
    WHEN 3 THEN 1
    WHEN 4 THEN 1
    ELSE `Transmision_Automatica`
  END,
  `Aire_Acondicionado` = 1;

COMMIT;
