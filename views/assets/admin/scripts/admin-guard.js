/* views/assets/admin/scripts/admin-guard.js
 * Protege as telas da área administrativa. Incluir com type="module" ANTES
 * dos demais scripts da página.
 */
import { initProtectedPage } from "../../_common/scripts/auth-guard.js";

initProtectedPage({
    scope: "admin",
    loginUrl: "/agendei/views/assets/public/login-admin.html",
    logoutUrl: "/agendei/views/assets/public/login-admin.html",
});
