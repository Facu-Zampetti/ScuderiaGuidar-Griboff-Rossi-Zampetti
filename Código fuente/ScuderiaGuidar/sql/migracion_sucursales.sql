START TRANSACTION;

-- 1) Nueva tabla de sucursales
CREATE TABLE `sucursales` (
  `ID` INT(11) NOT NULL AUTO_INCREMENT,
  `Nombre` VARCHAR(80) NOT NULL,
  `Direccion` VARCHAR(150) NOT NULL,
  `Horario_Apertura` TIME NOT NULL,
  `Horario_Cierre` TIME NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- 2) Sucursales iniciales (puedes editarlas)
INSERT INTO `sucursales` (`Nombre`, `Direccion`, `Horario_Apertura`, `Horario_Cierre`) VALUES
('Casa Central Cordoba', 'Av. Colon 1500, Cordoba', '08:00:00', '20:00:00'),
('Sucursal Nueva Cordoba', 'Bv. Chacabuco 850, Cordoba', '09:00:00', '19:00:00'),
('Sucursal Cerro de las Rosas', 'Av. Rafael Nunez 4200, Cordoba', '09:00:00', '18:00:00');

-- 3) Tabla relacional auto-sucursal (muchos a muchos)
CREATE TABLE `autos_sucursales` (
  `ID_Auto` INT(11) NOT NULL,
  `ID_Sucursal` INT(11) NOT NULL,
  PRIMARY KEY (`ID_Auto`, `ID_Sucursal`),
  KEY `idx_autos_sucursales_sucursal` (`ID_Sucursal`),
  CONSTRAINT `fk_autos_sucursales_auto`
    FOREIGN KEY (`ID_Auto`) REFERENCES `autos` (`ID`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_autos_sucursales_sucursal`
    FOREIGN KEY (`ID_Sucursal`) REFERENCES `sucursales` (`ID`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- 4) Nuevas columnas en reservas para sucursal de retiro y devolucion
ALTER TABLE `reservas`
  ADD COLUMN `ID_Sucursal_Retiro` INT(11) NULL AFTER `ID_Auto`,
  ADD COLUMN `ID_Sucursal_Devolucion` INT(11) NULL AFTER `ID_Sucursal_Retiro`;

-- 5) Backfill de datos existentes: usa la primera sucursal creada como default
SET @sucursal_default := (SELECT `ID` FROM `sucursales` ORDER BY `ID` ASC LIMIT 1);

UPDATE `reservas`
SET
  `ID_Sucursal_Retiro` = COALESCE(`ID_Sucursal_Retiro`, @sucursal_default),
  `ID_Sucursal_Devolucion` = COALESCE(`ID_Sucursal_Devolucion`, @sucursal_default);

-- 6) Asegurar que todos los autos actuales tengan al menos una sucursal asignada
INSERT INTO `autos_sucursales` (`ID_Auto`, `ID_Sucursal`)
SELECT a.`ID`, @sucursal_default
FROM `autos` a
WHERE NOT EXISTS (
  SELECT 1
  FROM `autos_sucursales` af
  WHERE af.`ID_Auto` = a.`ID`
);

-- 7) Volver obligatorios los nuevos campos y agregar indices/foreign keys
ALTER TABLE `reservas`
  MODIFY `ID_Sucursal_Retiro` INT(11) NOT NULL,
  MODIFY `ID_Sucursal_Devolucion` INT(11) NOT NULL,
  ADD KEY `idx_reservas_sucursal_retiro` (`ID_Sucursal_Retiro`),
  ADD KEY `idx_reservas_sucursal_devolucion` (`ID_Sucursal_Devolucion`),
  ADD CONSTRAINT `fk_reservas_sucursal_retiro`
    FOREIGN KEY (`ID_Sucursal_Retiro`) REFERENCES `sucursales` (`ID`),
  ADD CONSTRAINT `fk_reservas_sucursal_devolucion`
    FOREIGN KEY (`ID_Sucursal_Devolucion`) REFERENCES `sucursales` (`ID`);

COMMIT;
