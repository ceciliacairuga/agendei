CREATE DATABASE  IF NOT EXISTS `agendei` /*!40100 DEFAULT CHARACTER SET utf8mb3 */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `agendei`;
-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: localhost    Database: db-acme-manha
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

-- Table structure for table `faqs`
--

DROP TABLE IF EXISTS `faqs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `faqs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `faqs_category_id` int NOT NULL,
  `question` varchar(255) NOT NULL,
  `answer` varchar(255) NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `fk_faqs_faqs_categories1_idx` (`faqs_category_id`),
  CONSTRAINT `fk_faqs_faqs_categories1` FOREIGN KEY (`faqs_category_id`) REFERENCES `faqs_categories` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `faqs`
--

LOCK TABLES `faqs` WRITE;
/*!40000 ALTER TABLE `faqs` DISABLE KEYS */;
INSERT INTO `faqs` VALUES (1,1,'Como faço para acompanhar o status do meu pedido?','Acesse a área \"Meus Pedidos\" no seu perfil e clique sobre o número do pedido para ver o status detalhado.',1),(2,1,'Posso cancelar um pedido após a confirmação?','Pedidos podem ser cancelados em até 1 hora após a confirmação, desde que ainda não tenham sido separados para envio.',1),(3,1,'É possível alterar o endereço de entrega após o pedido?','Sim, contate nosso suporte em até 2 horas após a compra com o número do pedido e o novo endereço.',1),(4,2,'Quais formas de pagamento são aceitas?','Aceitamos cartão de crédito (Visa, Mastercard, Elo), boleto bancário e Pix.',1),(5,2,'Em quantas parcelas posso parcelar minha compra?','Compras com cartão de crédito podem ser parceladas em até 12 vezes sem juros para pedidos acima de R$ 200,00.',1),(6,2,'Meu pagamento foi recusado. O que fazer?','Verifique os dados do cartão e o limite disponível. Se o problema persistir, tente outra forma de pagamento ou entre em contato com seu banco.',1),(7,2,'O boleto venceu. Posso gerar um novo?','Sim. Acesse \"Meus Pedidos\", localize o pedido em questão e clique em \"Gerar novo boleto\". O prazo de pagamento será de 1 dia útil.',1),(8,3,'Qual o prazo de entrega?','O prazo varia conforme a região e o produto. Após a confirmação do pagamento, o prazo estimado é exibido no resumo do pedido.',1),(9,3,'Meu pedido está atrasado. O que fazer?','Se o prazo estimado já passou, acesse \"Meus Pedidos\" e clique em \"Falar com suporte\" para abrir um chamado de rastreamento.',1),(10,3,'Posso retirar meu pedido na loja?','Sim. Selecione a opção \"Retirar na loja\" durante o checkout e aguarde o e-mail de confirmação de disponibilidade.',1),(11,4,'Como solicito a troca de um produto?','Acesse \"Meus Pedidos\", selecione o produto e clique em \"Solicitar troca\". O prazo para solicitação é de até 7 dias após o recebimento.',1),(12,4,'Qual o prazo para devolução?','De acordo com o Código de Defesa do Consumidor, você tem até 7 dias corridos após o recebimento para desistir da compra.',1),(13,4,'Quem paga o frete da devolução?','Caso o produto apresente defeito, o frete de devolução é por nossa conta. Em caso de desistência, o frete é de responsabilidade do cliente.',1),(14,5,'Como altero minha senha?','Acesse \"Minha Conta\" > \"Segurança\" > \"Alterar senha\". Você receberá um e-mail de confirmação para concluir a alteração.',1),(15,5,'Esqueci minha senha. Como recuperá-la?','Na tela de login, clique em \"Esqueci minha senha\" e informe o e-mail cadastrado. Você receberá um link de redefinição em até 5 minutos.',1);
/*!40000 ALTER TABLE `faqs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `faqs_categories`
--

DROP TABLE IF EXISTS `faqs_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `faqs_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `faqs_categories`
--

LOCK TABLES `faqs_categories` WRITE;
/*!40000 ALTER TABLE `faqs_categories` DISABLE KEYS */;
INSERT INTO `faqs_categories` VALUES (1,'Pedidos',1),(2,'Pagamentos',1),(3,'Entregas',1),(4,'Devoluções e Trocas',1),(5,'Cadastro e Conta',1);
/*!40000 ALTER TABLE `faqs_categories` ENABLE KEYS */;
UNLOCK TABLES;


DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `type_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `photo` varchar(255) DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `fk_users_user_types_idx` (`type_id`),
  CONSTRAINT `fk_users_user_types` FOREIGN KEY (`type_id`) REFERENCES `users_types` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,1,'Fábio Santos','fabiosantos@ifsul.edu.br','12345678',NULL,1),(2,2,'Godofredo Silva','godofredo@gmail.com','12345678',NULL,1);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users_types`
--

DROP TABLE IF EXISTS `users_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users_types`
--

LOCK TABLES `users_types` WRITE;
/*!40000 ALTER TABLE `users_types` DISABLE KEYS */;
INSERT INTO `users_types` VALUES (1,'ADMIN',1),(2,'STANDARD',1);
/*!40000 ALTER TABLE `users_types` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

DROP TABLE IF EXISTS `services_type`;
CREATE TABLE `services_type` (
 `id` int NOT NULL  PRIMARY KEY AUTO_INCREMENT,
 `name` VARCHAR (100) 
);




DROP TABLE IF EXISTS `services`;
CREATE TABLE `services` (
  `id` int NOT NULL  PRIMARY KEY AUTO_INCREMENT,
  `name` VARCHAR (100) NOT NULL,
  `description` TEXT NOT NULL,
  `duration` INT NOT NULL,
  `price` DECIMAL (10,2) NOT NULL,
  
  employee_id INT NOT NULL,
  admin_id INT NOT NULL,
  category_id INT NOT NULL,
  
  
  CONSTRAINT fk_employee
	FOREIGN KEY (employee_id)
    REFERENCES users(id)
    ON DELETE CASCADE,
    
    CONSTRAINT fk_admin
	FOREIGN KEY (admin_id)
    REFERENCES users(id)
    ON DELETE CASCADE,
    
    CONSTRAINT fk_services_type
	FOREIGN KEY (category_id)
    REFERENCES services_type(id)
    ON DELETE CASCADE);
  
  



DROP TABLE IF EXISTS `appointments`;
CREATE TABLE `appointments` (
  `id` int NOT NULL PRIMARY KEY AUTO_INCREMENT,
  `appointment_time` TIME NOT NULL,
  `appointment_date` DATE NOT NULL,
  status ENUM(
  'pending', 
  'confirmed',
  'completed',
  'cancelled'
  ) default 'pending',
  
  client_id INT NOT NULL,
  employee_id INT NOT NULL,
  service_id INT NOT NULL,
  
	CONSTRAINT fk_client
	FOREIGN KEY (client_id)
    REFERENCES users(id)
    ON DELETE CASCADE,
    
	CONSTRAINT fk_employee
	FOREIGN KEY (employee_id)
    REFERENCES users(id)
    ON DELETE CASCADE,
    
	CONSTRAINT fk_appointment_service
	FOREIGN KEY (service_id)
    REFERENCES services(id)
    ON DELETE CASCADE
    );
    
    
    
    
    
    