START TRANSACTION;

-- 1) Agregar campos de verificacion de email
ALTER TABLE `clientes`
  ADD COLUMN IF NOT EXISTS `Email_Verificado` TINYINT(1) NOT NULL DEFAULT 0 AFTER `Mail`,
  ADD COLUMN IF NOT EXISTS `Email_Verificado_En` DATETIME NULL AFTER `Email_Verificado`;

-- 2) Marcar como verificados a los usuarios existentes para no bloquear acceso actual
UPDATE `clientes`
SET `Email_Verificado` = 1,
    `Email_Verificado_En` = COALESCE(`Email_Verificado_En`, NOW())
WHERE `Email_Verificado` = 0;

COMMIT;
