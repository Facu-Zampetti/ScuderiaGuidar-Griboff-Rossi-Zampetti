-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 03-12-2025 a las 02:27:28
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `scuderiaguidar_flota`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `autos`
--

CREATE TABLE `autos` (
  `ID` int(11) NOT NULL,
  `ID_Tipos` int(11) NOT NULL,
  `Marca` varchar(25) NOT NULL,
  `Modelo` varchar(25) NOT NULL,
  `Patente` varchar(25) NOT NULL,
  `Disponibilidad` tinyint(1) NOT NULL,
  `Foto` varchar(255) NOT NULL,
  `Destacado` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Volcado de datos para la tabla `autos`
--

INSERT INTO `autos` (`ID`, `ID_Tipos`, `Marca`, `Modelo`, `Patente`, `Disponibilidad`, `Foto`, `Destacado`) VALUES
(1, 1, 'Toyota', 'Corolla', 'ABC123', 1, '../img/autos/corolla.jpg', 0),
(2, 3, 'Ford', 'Mustang', 'XYZ789', 1, '../img/autos/mustang.jpg', 0),
(3, 2, 'Bmw', 'X6', 'AF180BC', 1, '../img/autos/bmwx6.jpg', 0),
(4, 3, 'Bmw', 'M4', 'AD180LC', 1, '../img/autos/bmwm4.jpg', 1),
(5, 4, 'Mercedes-Benz', 'Clase-S', 'AH201AA', 1, '../img/autos/benz.jpg', 0),
(6, 2, 'Audi', 'Q3', 'AA290AF', 1, '../img/autos/audi_q3_1764702064.jpg', 0);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `clientes`
--

CREATE TABLE `clientes` (
  `ID` int(11) NOT NULL,
  `Rol` tinyint(4) NOT NULL,
  `Nombre` varchar(25) NOT NULL,
  `Apellido` varchar(25) NOT NULL,
  `DNI` int(11) NOT NULL,
  `Mail` varchar(255) NOT NULL,
  `Telefono` varchar(25) NOT NULL,
  `Nacimiento` date NOT NULL,
  `Licencia` tinyint(1) NOT NULL,
  `Contraseña` varchar(255) NOT NULL,
  `Direccion` varchar(25) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Volcado de datos para la tabla `clientes`
--

INSERT INTO `clientes` (`ID`, `Rol`, `Nombre`, `Apellido`, `DNI`, `Mail`, `Telefono`, `Nacimiento`, `Licencia`, `Contraseña`, `Direccion`) VALUES
(2, 1, 'gonzaloo', 'rossi', 46505588, 'gonzalorossi481@gmail.com', '543517459616', '1990-05-15', 1, '$2y$10$4nUlJoZsx9KlUpuXh1IBaOudcq4zJE6AA2Ak2cGrBb9ZIS9rkhW3y', 'betania 3163'),
(7, 1, 'prueba', 'ricompensa', 9999999, 'prueba@gmail.com', '543517459616', '1990-05-15', 1, '$2y$10$TtfLKykBMawKKmcvoKsX6uUEfmwCz73FIdM2SBm38DC/lJ21R2MLW', 'betania 3153'),
(8, 0, 'Facu', 'Zampetti', 46588456, 'facuzampetti@gmail.com', '54351549895786', '1990-05-15', 1, '$2y$10$AOPafF6BAdd3Mpo8DhfAbe.TF2Y3Ql91iMfH2wF6GLk1FK8r901Hi', 'Italia 194'),
(9, 0, 'Ignacio', 'Griboff', 12345678, 'ignacio@gmail.com', '32165498', '2000-03-02', 1, '$2y$10$nx0AlZC0TajtPXOSWGoOt..JTelhcXO4oVRECg7DmdTcUHGavXslO', 'betania1234'),
(10, 0, 'Ignacio', 'Griboff', 46709111, 'igna@gmail.com', '3512481111', '2000-07-27', 1, '$2y$10$MLElqaULba9imihw7HIw7.NdkIH.5tpQC4OXynMQ8ojh8gNjMw6eu', 'Jose A. Goyechea 1111'),
(11, 0, 'Prueba', 'Uno', 12345679, 'prueba1@gmail.com', '351123123', '2004-09-14', 1, '$2y$10$1eN/dn2CZv8SSulZvLX/W.BDLqk4Mbb1tfG1KgyzC8I5hp0qgjbB6', 'abcd123'),
(13, 1, 'Gustavo', 'Funes', 22371124, 'gafunes@gmail.com', '3515332332', '1971-09-09', 1, '$2y$10$0Jx3xZxkOVy9cGxtSybSEerFYCvFWNXnhoxCSFMjcv9b0Yw7RmJI6', 'Cordoba');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estados`
--

CREATE TABLE `estados` (
  `ID` int(11) NOT NULL,
  `Nombre` varchar(25) NOT NULL,
  `Descripcion` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Volcado de datos para la tabla `estados`
--

INSERT INTO `estados` (`ID`, `Nombre`, `Descripcion`) VALUES
(1, 'Pendiente', 'La reserva se creó pero falta confirmación de pago o aprobación administrativa.'),
(2, 'Confirmada', 'Reserva aprobada. El auto está bloqueado para las fechas indicadas.'),
(3, 'En Curso', 'El cliente ha retirado el vehículo y el alquiler está activo.'),
(4, 'Finalizada', 'El vehículo fue devuelto y revisado. El proceso concluyó exitosamente.'),
(5, 'Cancelada', 'La reserva fue dada de baja por el cliente o la empresa.');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `reservas`
--

CREATE TABLE `reservas` (
  `ID` int(11) NOT NULL,
  `ID_Auto` int(11) NOT NULL,
  `ID_Cliente` int(11) NOT NULL,
  `ID_Estado` int(11) NOT NULL,
  `Numero` int(11) NOT NULL,
  `Fecha_Inicio` date NOT NULL,
  `Fecha_Fin` date NOT NULL,
  `Precio_Total` decimal(10,2) NOT NULL,
  `Fecha_Operacion` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Volcado de datos para la tabla `reservas`
--

INSERT INTO `reservas` (`ID`, `ID_Auto`, `ID_Cliente`, `ID_Estado`, `Numero`, `Fecha_Inicio`, `Fecha_Fin`, `Precio_Total`, `Fecha_Operacion`) VALUES
(1, 3, 7, 5, 835378, '2025-11-26', '2025-11-30', 400.00, '2025-11-26'),
(2, 4, 7, 3, 828815, '2025-11-21', '2025-11-28', 960.00, '2025-11-27'),
(3, 2, 7, 4, 492596, '2025-11-27', '2025-11-30', 480.00, '2025-11-27'),
(4, 4, 7, 1, 971380, '2025-11-29', '2025-11-30', 240.00, '2025-11-28'),
(5, 1, 7, 1, 723889, '2025-11-28', '2025-11-30', 150.00, '2025-11-28'),
(6, 2, 8, 1, 203948, '2025-11-28', '2025-11-30', 360.00, '2025-11-28'),
(7, 4, 10, 5, 436788, '2026-02-01', '2026-02-03', 360.00, '2025-11-30'),
(8, 1, 10, 5, 710392, '2026-10-20', '2026-10-23', 200.00, '2025-11-30'),
(9, 2, 10, 1, 971002, '2025-12-25', '2025-12-28', 480.00, '2025-11-30'),
(10, 4, 7, 2, 943830, '2025-11-12', '2025-11-14', 360.00, '2025-11-30'),
(11, 4, 7, 1, 227972, '2003-01-12', '2003-01-15', 480.00, '2025-11-30'),
(12, 3, 7, 1, 867517, '2025-12-09', '2025-12-10', 160.00, '2025-11-30'),
(13, 1, 11, 5, 213399, '2025-12-01', '2025-12-02', 100.00, '2025-11-30'),
(14, 1, 11, 1, 710655, '2025-12-03', '2025-12-04', 100.00, '2025-11-30'),
(15, 5, 7, 5, 979900, '2026-01-08', '2026-01-11', 600.00, '2025-12-01'),
(16, 5, 11, 5, 191008, '2025-12-01', '2025-12-03', 450.00, '2025-12-01'),
(17, 2, 13, 1, 960882, '2025-12-03', '2025-12-05', 360.00, '2025-12-01'),
(18, 2, 11, 1, 394749, '2025-12-09', '2025-12-12', 480.00, '2025-12-01'),
(19, 5, 10, 1, 467343, '2025-12-11', '2025-12-12', 300.00, '2025-12-02');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tipos`
--

CREATE TABLE `tipos` (
  `ID_Tipos` int(11) NOT NULL,
  `Nombre` varchar(25) NOT NULL,
  `Descripcion` varchar(255) NOT NULL,
  `Precio` decimal(10,0) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Volcado de datos para la tabla `tipos`
--

INSERT INTO `tipos` (`ID_Tipos`, `Nombre`, `Descripcion`, `Precio`) VALUES
(1, 'Sedan', 'Auto familiar de 4 puertas, versatil, espacioso y economico', 50),
(2, 'SUV', 'Vehículo espacioso, versatil, comodo, deportivo y utilitario para el uso diario', 80),
(3, 'Deportivo', 'Auto rápido y emocionante, agil, potente, una experiencia inolvidable', 120),
(4, 'Lujo', 'Autos refinados para una experiencia con la ultima tecnologia en comodidad.', 150);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `autos`
--
ALTER TABLE `autos`
  ADD PRIMARY KEY (`ID`),
  ADD KEY `fk_autos_tipos` (`ID_Tipos`);

--
-- Indices de la tabla `clientes`
--
ALTER TABLE `clientes`
  ADD PRIMARY KEY (`ID`);

--
-- Indices de la tabla `estados`
--
ALTER TABLE `estados`
  ADD PRIMARY KEY (`ID`);

--
-- Indices de la tabla `reservas`
--
ALTER TABLE `reservas`
  ADD PRIMARY KEY (`ID`),
  ADD KEY `fk_reservas_autos` (`ID_Auto`),
  ADD KEY `fk_reservas_clientes` (`ID_Cliente`),
  ADD KEY `fk_reservas_estados` (`ID_Estado`);

--
-- Indices de la tabla `tipos`
--
ALTER TABLE `tipos`
  ADD PRIMARY KEY (`ID_Tipos`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `autos`
--
ALTER TABLE `autos`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `clientes`
--
ALTER TABLE `clientes`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT de la tabla `estados`
--
ALTER TABLE `estados`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `reservas`
--
ALTER TABLE `reservas`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT de la tabla `tipos`
--
ALTER TABLE `tipos`
  MODIFY `ID_Tipos` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `autos`
--
ALTER TABLE `autos`
  ADD CONSTRAINT `fk_autos_tipos` FOREIGN KEY (`ID_Tipos`) REFERENCES `tipos` (`ID_Tipos`);

--
-- Filtros para la tabla `reservas`
--
ALTER TABLE `reservas`
  ADD CONSTRAINT `fk_reservas_autos` FOREIGN KEY (`ID_Auto`) REFERENCES `autos` (`ID`),
  ADD CONSTRAINT `fk_reservas_clientes` FOREIGN KEY (`ID_Cliente`) REFERENCES `clientes` (`ID`),
  ADD CONSTRAINT `fk_reservas_estados` FOREIGN KEY (`ID_Estado`) REFERENCES `estados` (`ID`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
