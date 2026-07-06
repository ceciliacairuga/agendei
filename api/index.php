<?php

error_reporting(E_ALL & ~E_DEPRECATED & ~E_USER_DEPRECATED);
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

use CoffeeCode\Router\Router;

$route = new Router(url("api"), ":");
$route->namespace("Source\\Controller");

// ============================================================
//  HELLO / HEALTH CHECK
// ============================================================
$route->get("/hello", "Api:hello");

// ============================================================
//  USERS  (entidade principal)
// ============================================================
$route->group("/users");
$route->get("/list","Users:listAll");          // admin
$route->get("/list/{userId}","Users:listById");         // admin
$route->get("/list/paginator/{page}/{per_page}","Users:listPaginator");    // admin
$route->post("/register","Users:register");         // público
$route->post("/register-admin","Users:registerAdmin");    // admin
$route->post("/login","Users:auth");             // público
$route->post("/login-admin","Users:authAdmin");        // público
$route->put("/update","Users:update");           // auth user
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
$route->post("/insert",                                 "Appointments:insert");    // auth user
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
