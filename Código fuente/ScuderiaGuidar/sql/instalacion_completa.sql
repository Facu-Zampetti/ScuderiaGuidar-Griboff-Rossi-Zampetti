-- ===================================================================
-- ScuderiaGuidar - Instalacion completa de base de datos (produccion)
-- ===================================================================
-- Usar este script SOLO para una base de datos nueva y vacia en cPanel.
-- Incluye la estructura final de todas las tablas (ya con los cambios
-- de las migraciones de sucursales/mapa, verificacion de email y el
-- recomendador IA con Gemini aplicados desde el inicio).
--
-- Se insertan unicamente los catalogos que la aplicacion necesita para
-- funcionar (tipos de vehiculo y estados de reserva). No se incluyen
-- autos, sucursales, clientes ni reservas de prueba: esos datos se
-- cargan desde el panel de administrador una vez que el sitio este
-- online.
--
-- Si tu base ya existe y solo te faltan columnas puntuales, usa en
-- cambio los scripts individuales migracion_*.sql de esta carpeta.
-- ===================================================================

START TRANSACTION;

-- --- Catalogo de tipos de vehiculo -------------------------------------
CREATE TABLE IF NOT EXISTS `tipos` (
  `ID_Tipos` int(11) NOT NULL AUTO_INCREMENT,
  `Nombre` varchar(25) NOT NULL,
  `Descripcion` varchar(255) NOT NULL,
  `Precio` decimal(10,0) NOT NULL,
  PRIMARY KEY (`ID_Tipos`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --- Catalogo de estados de reserva -------------------------------------
CREATE TABLE IF NOT EXISTS `estados` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `Nombre` varchar(25) NOT NULL,
  `Descripcion` varchar(255) NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --- Sucursales (se carga vacia; alta real desde el panel admin) -------
CREATE TABLE IF NOT EXISTS `sucursales` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `Nombre` varchar(80) NOT NULL,
  `Direccion` varchar(150) NOT NULL,
  `Latitud` decimal(10,7) DEFAULT NULL,
  `Longitud` decimal(10,7) DEFAULT NULL,
  `Horario_Apertura` time NOT NULL,
  `Horario_Cierre` time NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --- Flota de autos (vacia; alta real desde el panel admin) -------------
-- Capacidad_Pasajeros / Capacidad_Equipaje / Transmision_Automatica /
-- Aire_Acondicionado son los campos usados por el recomendador IA (Gemini).
CREATE TABLE IF NOT EXISTS `autos` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `ID_Tipos` int(11) NOT NULL,
  `Marca` varchar(25) NOT NULL,
  `Modelo` varchar(25) NOT NULL,
  `Patente` varchar(25) NOT NULL,
  `Disponibilidad` tinyint(1) NOT NULL,
  `Capacidad_Pasajeros` tinyint(2) NOT NULL DEFAULT 5,
  `Capacidad_Equipaje` varchar(20) NOT NULL DEFAULT 'mediano',
  `Transmision_Automatica` tinyint(1) NOT NULL DEFAULT 0,
  `Aire_Acondicionado` tinyint(1) NOT NULL DEFAULT 1,
  `Foto` varchar(255) NOT NULL,
  `Destacado` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`ID`),
  KEY `fk_autos_tipos` (`ID_Tipos`),
  CONSTRAINT `fk_autos_tipos` FOREIGN KEY (`ID_Tipos`) REFERENCES `tipos` (`ID_Tipos`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --- Clientes (vacia; se llena con registros reales de usuarios) -------
CREATE TABLE IF NOT EXISTS `clientes` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `Rol` tinyint(4) NOT NULL,
  `Nombre` varchar(25) NOT NULL,
  `Apellido` varchar(25) NOT NULL,
  `DNI` int(11) NOT NULL,
  `Mail` varchar(255) NOT NULL,
  `Email_Verificado` tinyint(1) NOT NULL DEFAULT 0,
  `Email_Verificado_En` datetime DEFAULT NULL,
  `Telefono` varchar(25) NOT NULL,
  `Nacimiento` date NOT NULL,
  `Licencia` tinyint(1) NOT NULL,
  `Contraseña` varchar(255) NOT NULL,
  `Direccion` varchar(25) NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --- Relacion muchos a muchos auto <-> sucursal -------------------------
CREATE TABLE IF NOT EXISTS `autos_sucursales` (
  `ID_Auto` int(11) NOT NULL,
  `ID_Sucursal` int(11) NOT NULL,
  PRIMARY KEY (`ID_Auto`,`ID_Sucursal`),
  KEY `idx_autos_sucursales_sucursal` (`ID_Sucursal`),
  CONSTRAINT `fk_autos_sucursales_auto` FOREIGN KEY (`ID_Auto`) REFERENCES `autos` (`ID`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_autos_sucursales_sucursal` FOREIGN KEY (`ID_Sucursal`) REFERENCES `sucursales` (`ID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --- Reservas ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `reservas` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `ID_Auto` int(11) NOT NULL,
  `ID_Sucursal_Retiro` int(11) NOT NULL,
  `ID_Sucursal_Devolucion` int(11) NOT NULL,
  `ID_Cliente` int(11) NOT NULL,
  `ID_Estado` int(11) NOT NULL,
  `Numero` int(11) NOT NULL,
  `Fecha_Inicio` date NOT NULL,
  `Fecha_Fin` date NOT NULL,
  `Precio_Total` decimal(10,2) NOT NULL,
  `Fecha_Operacion` date NOT NULL,
  PRIMARY KEY (`ID`),
  KEY `fk_reservas_autos` (`ID_Auto`),
  KEY `fk_reservas_clientes` (`ID_Cliente`),
  KEY `fk_reservas_estados` (`ID_Estado`),
  KEY `idx_reservas_sucursal_retiro` (`ID_Sucursal_Retiro`),
  KEY `idx_reservas_sucursal_devolucion` (`ID_Sucursal_Devolucion`),
  CONSTRAINT `fk_reservas_autos` FOREIGN KEY (`ID_Auto`) REFERENCES `autos` (`ID`),
  CONSTRAINT `fk_reservas_clientes` FOREIGN KEY (`ID_Cliente`) REFERENCES `clientes` (`ID`),
  CONSTRAINT `fk_reservas_estados` FOREIGN KEY (`ID_Estado`) REFERENCES `estados` (`ID`),
  CONSTRAINT `fk_reservas_sucursal_devolucion` FOREIGN KEY (`ID_Sucursal_Devolucion`) REFERENCES `sucursales` (`ID`),
  CONSTRAINT `fk_reservas_sucursal_retiro` FOREIGN KEY (`ID_Sucursal_Retiro`) REFERENCES `sucursales` (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --- Datos de catalogo requeridos por la aplicacion ---------------------
INSERT INTO `tipos` (`ID_Tipos`, `Nombre`, `Descripcion`, `Precio`) VALUES
(1, 'Sedan', 'Auto familiar de 4 puertas, versatil, espacioso y economico', 50),
(2, 'SUV', 'Vehiculo espacioso, versatil, comodo, deportivo y utilitario para el uso diario', 80),
(3, 'Deportivo', 'Auto rapido y emocionante, agil, potente, una experiencia inolvidable', 120),
(4, 'Lujo', 'Autos refinados para una experiencia con la ultima tecnologia en comodidad.', 150);

INSERT INTO `estados` (`ID`, `Nombre`, `Descripcion`) VALUES
(1, 'Pendiente', 'La reserva se creo pero falta confirmacion de pago o aprobacion administrativa.'),
(2, 'Confirmada', 'Reserva aprobada. El auto esta bloqueado para las fechas indicadas.'),
(3, 'En Curso', 'El cliente ha retirado el vehiculo y el alquiler esta activo.'),
(4, 'Finalizada', 'El vehiculo fue devuelto y revisado. El proceso concluyo exitosamente.'),
(5, 'Cancelada', 'La reserva fue dada de baja por el cliente o la empresa.');

COMMIT;
