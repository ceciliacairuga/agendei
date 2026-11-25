-- =====================================================================
-- AGENDEI — Migração das Etapas 06 e 07
-- Importe no phpMyAdmin com o banco `agendei` SELECIONADO (ou: mysql -u root agendei < arquivo.sql).
--
-- * É IDEMPOTENTE: pode ser executada mais de uma vez sem erro.
-- * NÃO apaga tabelas nem registros. Só adiciona/ajusta estrutura.
-- * Compatível com MySQL 5.7/8.x (WAMP) e MariaDB.
-- =====================================================================

USE `agendei`;

-- ---------------------------------------------------------------------
-- 1) appointments.employee_id  (profissional escolhido pelo cliente)
--    O dump original NÃO possui esta coluna, mas o código da API a usa.
--    Sem ela, GET /appointments/list falha e o dashboard não carrega.
-- ---------------------------------------------------------------------
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
                    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'appointments' AND COLUMN_NAME = 'employee_id');
SET @sql := IF(@col_exists = 0,
               'ALTER TABLE `appointments` ADD COLUMN `employee_id` INT NULL DEFAULT NULL AFTER `user_id`',
               'SELECT ''appointments.employee_id já existe'' AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists := (SELECT COUNT(*) FROM information_schema.STATISTICS
                    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'appointments' AND INDEX_NAME = 'idx_appointments_employee_date');
SET @sql := IF(@idx_exists = 0,
               'ALTER TABLE `appointments` ADD INDEX `idx_appointments_employee_date` (`employee_id`, `appointment_date`)',
               'SELECT ''índice employee/date já existe'' AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists := (SELECT COUNT(*) FROM information_schema.STATISTICS
                    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'appointments' AND INDEX_NAME = 'idx_appointments_date_time');
SET @sql := IF(@idx_exists = 0,
               'ALTER TABLE `appointments` ADD INDEX `idx_appointments_date_time` (`appointment_date`, `appointment_time`)',
               'SELECT ''índice date/time já existe'' AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------------------------
-- 2) services precisa ser InnoDB para aceitar a chave estrangeira da
--    galeria. No dump original ela é MyISAM (não suporta FOREIGN KEY).
--    A conversão preserva todas as linhas existentes.
-- ---------------------------------------------------------------------
SET @engine := (SELECT ENGINE FROM information_schema.TABLES
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'services');
SET @sql := IF(@engine <> 'InnoDB',
               'ALTER TABLE `services` ENGINE = InnoDB',
               'SELECT ''services já é InnoDB'' AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------------------------
-- 3) Galeria de imagens dos serviços (relação 1:N)
--    Um serviço tem 0..N imagens; cada imagem pertence a 1 serviço.
--    ON DELETE CASCADE remove os registros ao excluir o serviço
--    (os ARQUIVOS são apagados pela API, pois o MySQL não toca no disco).
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `service_images` (
  `id`         INT          NOT NULL AUTO_INCREMENT,
  `service_id` INT          NOT NULL,
  `image_path` VARCHAR(255) NOT NULL,
  `alt_text`   VARCHAR(255) NULL DEFAULT NULL,
  `position`   INT          NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_service_images_service` (`service_id`, `position`),
  CONSTRAINT `fk_service_images_services`
    FOREIGN KEY (`service_id`) REFERENCES `services` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb3;

-- ---------------------------------------------------------------------
-- 4) users.photo já existe no dump (VARCHAR(255) NULL). Nada a alterar.
--    Ela passa a guardar o caminho RELATIVO, ex.: uploads/users/ab12.jpg
-- ---------------------------------------------------------------------
