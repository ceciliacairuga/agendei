<?php

error_reporting(E_ALL & ~E_DEPRECATED & ~E_USER_DEPRECATED);
// A API responde SOMENTE JSON: avisos/erros do PHP não podem ser impressos na resposta (corromperiam o JSON
// e fariam o frontend travar em "Carregando..."). Eles continuam sendo gravados no log de erros do PHP/Apache.
ini_set('display_errors', '0');
ini_set('log_errors', '1');
date_default_timezone_set('America/Sao_Paulo');

ob_start();

require __DIR__ . "/vendor/autoload.php";

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Qualquer erro não tratado vira JSON (nunca HTML com caminhos do servidor), para o frontend conseguir exibir a mensagem.
set_exception_handler(function (\Throwable $e) {
    error_log("[agendei] " . get_class($e) . ": " . $e->getMessage() . " em " . $e->getFile() . ":" . $e->getLine());
    while (ob_get_level() > 0) { ob_end_clean(); }
    http_response_code(500);
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode([
        "code" => 500, "type" => "error", "status" => "internal_server_error",
        "message" => "Erro interno ao processar a requisição."
    ], JSON_UNESCAPED_UNICODE);
    exit;
});

use CoffeeCode\Router\Router;

$route = new Router(url("api"), ":");
$route->namespace("Source\\Controller");

// ============================================================
//  DASHBOARD
// ============================================================
$route->get("/dashboard/admin", "Dashboard:admin");

// ============================================================
//  HELLO / HEALTH CHECK
// ============================================================
$route->get("/hello", "Api:hello");

// ============================================================
//  USERS  (entidade principal)
// ============================================================
$route->group("/users");
$route->get("/list","Users:listAll");
$route->get("/employees", "Users:listEmployees");          // admin
$route->get("/list/{userId}","Users:listById");         // admin
$route->get("/list/paginator/{page}/{per_page}","Users:listPaginator");    // admin
$route->post("/register","Users:register");         // público
$route->post("/register-admin","Users:registerAdmin");    // admin
$route->post("/create","Users:createByAdmin");
$route->put("/manage/{userId}","Users:manageByAdmin");
$route->post("/login","Users:auth");             // público
$route->post("/login-admin","Users:authAdmin");        // público
$route->get("/me", "Users:me");                    // auth user
$route->post("/photo", "Users:photo");             // auth user (multipart: photo) — Etapa 07
$route->put("/update","Users:update");           // auth user
$route->put("/update-password", "Users:updatePassword"); // auth user
$route->put("/update-admin","Users:updateAdmin");      // auth admin
$route->delete("/{userId}","Users:delete");           // admin
$route->group(null);

// ============================================================
//  USER TYPES
// ============================================================
$route->group("/user-types");
$route->get("/list","UserTypes:listAll");
$route->get("/list/{user_type_id}","UserTypes:listById");
$route->get("/list/paginator/{page}/{per_page}","UserTypes:listPaginator");
$route->post("/register",                                 "UserTypes:insert");       // admin
$route->put("/{user_type_id}","UserTypes:update");       // admin
$route->delete("/{user_type_id}","UserTypes:delete");       // admin
$route->group(null);

// ============================================================
//  SERVICES  (entidade secundária com CRUD completo)
// ============================================================
$route->group("/services");
$route->get("/list",                              "Services:listAll");
$route->get("/list/{service_id}",                 "Services:listById");
$route->get("/list/paginator/{page}/{per_page}",  "Services:listPaginator");
$route->post("/insert",                                 "Services:insert");        // admin
$route->put("/update/{service_id}",                      "Services:update");        // admin
$route->delete("/delete/{service_id}",                   "Services:delete");        // admin
// Galeria de imagens do serviço (1:N) — Etapa 07
$route->get("/{service_id}/images",                      "ServiceImages:list");     // público
$route->post("/{service_id}/images",                     "ServiceImages:insert");   // admin (multipart: images[])
$route->delete("/{service_id}/images/{image_id}",        "ServiceImages:delete");   // admin
$route->group(null);

// ============================================================
//  SERVICES TYPE
// ============================================================
$route->group("/services-type");
$route->get("/list",                              "ServicesType:listAll");
$route->get("/list/{services_type_id}",           "ServicesType:listById");
$route->get("/list/paginator/{page}/{per_page}",  "ServicesType:listPaginator");
$route->post("/insert",                                 "ServicesType:insert");    // admin
$route->put("/{services_type_id}",                "ServicesType:update");    // admin
$route->delete("/{services_type_id}",             "ServicesType:delete");    // admin
$route->group(null);

// ============================================================
//  APPOINTMENTS
// ============================================================
$route->group("/appointments");
$route->get("/list",                              "Appointments:listAll");
$route->get("/list/{appointment_id}",             "Appointments:listById");
$route->get("/list/paginator/{page}/{per_page}",  "Appointments:listPaginator");
$route->get("/availability",                      "Appointments:availability"); // auth user
$route->post("/insert",                                 "Appointments:insert");    // auth user
$route->put("/cancel/{appointment_id}",           "Appointments:cancel");    // auth user (dono do agendamento)
$route->put("/{appointment_id}",                  "Appointments:update");    // admin
$route->delete("/{appointment_id}",               "Appointments:delete");    // admin
$route->group(null);

// ============================================================
//  FAQS CATEGORIES
// ============================================================
$route->group("/faqs-categories");
$route->get("/list",                              "Faqs\\FaqsCategories:listAll");
$route->get("/list/{category_id}",                "Faqs\\FaqsCategories:listById");
$route->get("/list/paginator/{page}/{per_page}",  "Faqs\\FaqsCategories:listPaginator");
$route->post("/insert",                                 "Faqs\\FaqsCategories:insert");   // admin
$route->put("/{category_id}",                     "Faqs\\FaqsCategories:update");   // admin
$route->delete("/{category_id}",                  "Faqs\\FaqsCategories:delete");   // admin
$route->group(null);

// ============================================================
//  FAQS
// ============================================================
$route->group("/faqs");
$route->get("/list",                              "Faqs\\Faqs:listAll");
$route->get("/list/{faq_id}",                     "Faqs\\Faqs:listById");
$route->get("/list/paginator/{page}/{per_page}",  "Faqs\\Faqs:listPaginator");
$route->post("/insert",                                 "Faqs\\Faqs:insert");     // admin
$route->put("/{faq_id}",                          "Faqs\\Faqs:update");     // admin
$route->delete("/{faq_id}",                       "Faqs\\Faqs:delete");     // admin
$route->group(null);

// ============================================================
//  ROTAS LEGADAS 
// ============================================================
$route->get("/users/list",                              "Users:usersList");
$route->get("/servicesType/list",                       "ServicesType:servicesTypeListAll");
$route->get("/servicesType/list/{servicesTypeId}",      "ServicesType:servicesTypeListById");
$route->post("/servicesType/insert",                    "ServicesType:servicesTypeInsert");
$route->delete("/servicesType/delete/{servicesTypeId}", "ServicesType:servicesTypeDelete");

$route->get("/faqs-categories/list",                        "Faqs\\FaqsCategories:faqsCategoryList");
$route->get("/faqs-categories/list/{categoryId}",           "Faqs\\FaqsCategories:faqsCategoryListById");
$route->post("/faqs-categories/create",                     "Faqs\\FaqsCategories:faqsCategoriesCreate");
$route->put("/faqs-categories/update/{categoryId}",         "Faqs\\FaqsCategories:faqCategoryUpdate");
$route->delete("/faqs-categories/{categoryId}",             "Faqs\\FaqsCategories:faqCategoryDelete");

$route->get("/faqs/list",                  "Faqs\\Faqs:faqsListAll");
$route->get("/faqs/list/{faqId}",          "Faqs\\Faqs:faqsListById");
$route->post("/faqs/insert",               "Faqs\\Faqs:faqInsert");
$route->put("/faqs/update/{faqId}",        "Faqs\\Faqs:faqUpdate");
$route->delete("/faqs/{faqId}",            "Faqs\\Faqs:faqDelete");

// ============================================================
$route->dispatch();

if ($route->error()) {
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode([
        "code"    => 404,
        "status"  => "not_found",
        "message" => "URL não encontrada."
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}

ob_end_flush();
