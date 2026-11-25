/* views/assets/app/scripts/app-guard.js
 * Protege as telas da área do cliente. Incluir com type="module" ANTES
 * dos demais scripts da página.
 */
import { initProtectedPage } from "../../_common/scripts/auth-guard.js";

initProtectedPage({
    scope: "default",
    loginUrl: "/agendei/views/assets/public/login.html",
    logoutUrl: "/agendei/views/assets/public/login.html",
});
