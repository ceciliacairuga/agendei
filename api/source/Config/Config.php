<?php

const CONF_URL_BASE = "http://localhost/agendei"; // URL base do site, geralmente localhost em desenvolvimento
const CONF_URL_TEST = "http://localhost/agendei"; // URL base do site, geralmente localhost em desenvolvimento


const CONF_DB_HOST = "localhost";
const CONF_DB_NAME = "agendei";
const CONF_DB_USER= "root";
const CONF_DB_PASS = "";
const CONF_DB_PORT = "3306";

const JWT_SECRET_KEY = "e17851db9fee8e49f728550fc2f82111c4374f426c9cadda9403390ef638073ff21fd7a7e35d025861e175b0fb93609d838fba3185c859c13b9f43cf92ecbd48";

// ============================================================
//  UPLOADS (Etapa 07)
// ============================================================
// Pasta física onde os arquivos enviados são gravados (fora de api/ e views/).
const CONF_STORAGE_DIR = __DIR__ . "/../../../storage";
// Subpasta de uploads dentro de storage/ (o caminho salvo no banco é relativo a storage/).
const CONF_UPLOAD_DIR_USERS = "uploads/users";
const CONF_UPLOAD_DIR_SERVICES = "uploads/services";
// Limites (devem ser MENORES que upload_max_filesize / post_max_size do php.ini).
const CONF_UPLOAD_MAX_USER_PHOTO = 2 * 1024 * 1024;     // 2 MB por foto de perfil
const CONF_UPLOAD_MAX_SERVICE_IMAGE = 5 * 1024 * 1024;  // 5 MB por imagem de serviço
const CONF_UPLOAD_MAX_FILES_PER_REQUEST = 10;           // imagens por requisição
const CONF_UPLOAD_MAX_IMAGES_PER_SERVICE = 20;          // imagens por serviço

// ============================================================
//  AGENDAMENTOS (regras de negócio)
// ============================================================
const CONF_APPT_OPEN = "09:00";           // abertura do salão
const CONF_APPT_CLOSE = "18:00";          // fechamento do salão
const CONF_APPT_STEP_MINUTES = 30;        // intervalo entre horários oferecidos
const CONF_APPT_CANCEL_MIN_HOURS = 2;     // antecedência mínima para o cliente cancelar
const CONF_APPT_MAX_DAYS_AHEAD = 120;     // até quantos dias à frente é possível agendar
