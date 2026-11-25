-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema agendei
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema agendei
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `agendei` DEFAULT CHARACTER SET utf8mb3 ;
USE `agendei` ;

-- -----------------------------------------------------
-- Table `agendei`.`users_types`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `agendei`.`users_types` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `active` TINYINT(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`))
ENGINE = InnoDB
AUTO_INCREMENT = 3
DEFAULT CHARACTER SET = utf8mb3;


-- -----------------------------------------------------
-- Table `agendei`.`users`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `agendei`.`users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `type_id` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `photo` VARCHAR(255) NULL DEFAULT NULL,
  `active` TINYINT(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  INDEX `fk_users_user_types_idx` (`type_id` ASC) VISIBLE,
  CONSTRAINT `fk_users_user_types`
    FOREIGN KEY (`type_id`)
    REFERENCES `agendei`.`users_types` (`id`))
ENGINE = InnoDB
AUTO_INCREMENT = 3
DEFAULT CHARACTER SET = utf8mb3;


-- -----------------------------------------------------
-- Table `agendei`.`services_type`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `agendei`.`services_type` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NULL DEFAULT NULL,
  PRIMARY KEY (`id`))
ENGINE = MyISAM
DEFAULT CHARACTER SET = utf8mb3;


-- -----------------------------------------------------
-- Table `agendei`.`services`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `agendei`.`services` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `services_type_id` INT NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT NOT NULL,
  `duration` INT NOT NULL,
  `price` DECIMAL(10,2) NOT NULL,
  `active` TINYINT(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  INDEX `fk_services_services_type1_idx1` (`services_type_id` ASC) VISIBLE)
ENGINE = MyISAM
DEFAULT CHARACTER SET = utf8mb3;


-- -----------------------------------------------------
-- Table `agendei`.`appointments`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `agendei`.`appointments` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `service_id` INT NOT NULL,
  `appointment_time` TIME NOT NULL,
  `appointment_date` DATE NOT NULL,
  `status` ENUM('pending', 'confirmed', 'completed', 'cancelled') NULL DEFAULT 'pending',
  PRIMARY KEY (`id`),
  INDEX `fk_appointments_users1_idx1` (`user_id` ASC) VISIBLE,
  INDEX `fk_appointments_services1_idx1` (`service_id` ASC) VISIBLE)
ENGINE = MyISAM
DEFAULT CHARACTER SET = utf8mb3;


-- -----------------------------------------------------
-- Table `agendei`.`faqs_categories`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `agendei`.`faqs_categories` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `active` TINYINT(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`))
ENGINE = InnoDB
AUTO_INCREMENT = 6
DEFAULT CHARACTER SET = utf8mb3;


-- -----------------------------------------------------
-- Table `agendei`.`faqs`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `agendei`.`faqs` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `faqs_category_id` INT NOT NULL,
  `question` VARCHAR(255) NOT NULL,
  `answer` VARCHAR(255) NOT NULL,
  `active` TINYINT(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  INDEX `fk_faqs_faqs_categories1_idx` (`faqs_category_id` ASC) VISIBLE,
  CONSTRAINT `fk_faqs_faqs_categories1`
    FOREIGN KEY (`faqs_category_id`)
    REFERENCES `agendei`.`faqs_categories` (`id`))
ENGINE = InnoDB
AUTO_INCREMENT = 16
DEFAULT CHARACTER SET = utf8mb3;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
