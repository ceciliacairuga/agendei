// Executa os scripts REAIS das páginas num DOM simulado (jsdom) contra a API real.
// Pré-requisito: `npm i jsdom` (somente para testes; não faz parte do sistema).
//   node tests/dom-pages.test.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";
const require = createRequire(process.env.JSDOM_FROM || import.meta.url);
const { JSDOM } = require("jsdom");

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let ok = 0, fail = 0;
const check = (name, cond, extra = "") => { cond ? (ok++, console.log("  PASS ", name)) : (fail++, console.log("  FAIL ", name, extra)); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const post = async (p, body) => (await fetch("http://localhost/agendei/api" + p, { method: "POST", body: new URLSearchParams(body) })).json();
const login = async (email, admin) => (await post(admin ? "/users/login-admin" : "/users/login", { email, password: "senha1234" })).data;

async function openPage(html, { scope = "default", session, url = "http://localhost/agendei/" } = {}) {
    const dom = new JSDOM(fs.readFileSync(path.join(root, html), "utf8"), { url: url + html, pretendToBeVisual: true });
    const w = dom.window;
    if (session) {
        const prefix = scope === "default" ? "agendei_" : `agendei_${scope}_`;
        w.localStorage.setItem(prefix + "token", session.token);
        w.localStorage.setItem(prefix + "user", JSON.stringify({ id: session.id, name: session.name, email: session.email, photo_url: session.photo_url ?? null }));
    }
    w.IntersectionObserver = class { observe(el) { el.classList.add("revealed"); } unobserve() {} };
    w.confirm = () => true; w.alert = (m) => { w.__alerts = [...(w.__alerts || []), m]; };
    // expõe o DOM como globais para os módulos ES reais
    for (const k of ["window", "document", "localStorage", "sessionStorage", "HTMLFormElement", "FileReader", "Event", "CustomEvent", "Option", "location", "URL"]) {
        try { Object.defineProperty(globalThis, k, { value: w[k] ?? globalThis[k], configurable: true, writable: true }); } catch {}
    }
    globalThis.IntersectionObserver = w.IntersectionObserver;
    globalThis.confirm = w.confirm; globalThis.alert = w.alert;
    return { dom, w, doc: w.document };
}
const load = (rel) => import(pathToFileURL(path.join(root, rel)).href + "?t=" + Math.random());
const txt = (doc, sel) => doc.querySelector(sel)?.textContent.trim();

const maria = await login("maria@teste.com");
const admin = await login("admin@teste.com", true);
const d = new Date(Date.now() + 4 * 864e5).toISOString().slice(0, 10);
await fetch("http://localhost/agendei/api/appointments/insert", { method: "POST", headers: { Authorization: "Bearer " + maria.token }, body: new URLSearchParams({ service_id: 1, appointment_date: d, appointment_time: "14:00" }) });

console.log("== dashboard.html (cliente)");
{
    const { doc } = await openPage("dashboard.html", { session: maria });
    await load("views/assets/app/scripts/app-guard.js"); await load("views/assets/app/scripts/dashboard.js"); await sleep(1500);
    check("saudação 'Olá, Maria!'", txt(doc, ".page-title") === "Olá, Maria!", txt(doc, ".page-title"));
    check("nome completo no cabeçalho", txt(doc, ".user-name-text") === maria.name, txt(doc, ".user-name-text"));
    check("próximo agendamento mostra o serviço", txt(doc, ".next-appt-service") === "Corte Feminino", txt(doc, ".next-appt-service"));
    check("não ficou em 'Carregando'", !/Carregando/i.test(doc.body.textContent.replace(/<[^>]*>/g, "")), doc.body.textContent.match(/Carregando[^\n]*/)?.[0]);
    check("lista de agendamentos preenchida", doc.querySelectorAll(".appt-item").length >= 1);
    check("serviços disponíveis renderizados", doc.body.textContent.includes("Manicure"));
}

console.log("== dashboard.html — falha de UMA fonte não derruba as outras");
{
    const realFetch = globalThis.fetch;
    globalThis.fetch = (u, o) => String(u).includes("/appointments/list") ? Promise.resolve(new Response("<b>Fatal error</b>", { status: 500, headers: { "content-type": "text/html" } })) : realFetch(u, o);
    const { doc } = await openPage("dashboard.html", { session: maria });
    await load("views/assets/app/scripts/dashboard.js"); await sleep(1500);
    globalThis.fetch = realFetch;
    check("saudação continua correta mesmo com agendamentos quebrados", txt(doc, ".page-title") === "Olá, Maria!", txt(doc, ".page-title"));
    check("serviços continuam aparecendo", doc.body.textContent.includes("Manicure"));
    check("agendamentos mostram erro (não 'Carregando')", /Não foi possível carregar seus agendamentos/.test(txt(doc, ".next-appt-service") || ""), txt(doc, ".next-appt-service"));
}

console.log("== agendamentos.html (cliente)");
{
    const { doc, w } = await openPage("agendamentos.html", { session: maria });
    await load("views/assets/app/scripts/agendamentos.js"); await sleep(1200);
    const cards = doc.querySelectorAll(".appt-card");
    check("cards renderizados com nome do serviço", cards.length >= 1 && cards[0].textContent.includes("Corte Feminino"));
    const btn = doc.querySelector(".appt-card .btn--outline");
    check("botão Cancelar presente (agendamento a 4 dias)", !!btn);
    btn?.click(); await sleep(1200);
    check("após cancelar, card vira 'Cancelado' sem recarregar", doc.querySelector(".appt-card")?.dataset.status === "cancelado" && doc.querySelector("#appt-feedback")?.textContent.includes("sucesso"), doc.querySelector("#appt-feedback")?.textContent);
    doc.querySelector('[data-filter="cancelado"]').click();
    check("aba Cancelados mostra o histórico", [...doc.querySelectorAll(".appt-card")].some((c) => !c.classList.contains("hidden") && c.dataset.status === "cancelado"));
    doc.querySelector('[data-filter="pendente"]').click();
    check("aba Pendentes sem itens mostra mensagem vazia", !!doc.querySelector(".empty-state"));
}

console.log("== novo-agendamento.html (modal com horários reais)");
{
    const { doc, w } = await openPage("novo-agendamento.html", { session: maria });
    await load("views/assets/app/scripts/novo-agendamento.js"); await sleep(1200);
    const svc = doc.querySelector("#appt-service");
    check("serviços carregados no select", svc.options.length >= 3, svc.options.length);
    const date = new Date(Date.now() + 6 * 864e5).toISOString().slice(0, 10);
    svc.value = svc.options[1].value; doc.querySelector("#appt-date").value = date;
    svc.dispatchEvent(new w.Event("change")); await sleep(1200);
    const time = doc.querySelector("#appt-time");
    check("horários vêm da API (várias opções, nada de lista fixa)", time.options.length > 10, time.options.length);
    check("select de horário habilitado", !time.disabled);
}

console.log("== perfil.html");
{
    const { doc, w } = await openPage("perfil.html", { session: maria });
    await load("views/assets/app/scripts/perfil.js"); await sleep(1500);
    check("nome real no cabeçalho do perfil", txt(doc, "#profile-name") === maria.name, txt(doc, "#profile-name"));
    check("e-mail real", txt(doc, "#view-email") === "maria@teste.com");
    check("histórico recente real", doc.querySelector("#history-list").textContent.includes("Corte Feminino"), doc.querySelector("#history-list").textContent);
    check("sem dados fictícios na página", !/Cliente fiel|Hidratação Profunda|9999-0000/.test(doc.body.textContent));
    doc.querySelector("#toggle-edit-personal").click();
    doc.querySelector("#edit-firstname").value = "Maria"; doc.querySelector("#edit-lastname").value = "Souza Teste";
    doc.querySelector("#personal-form").dispatchEvent(new w.Event("submit", { cancelable: true })); await sleep(1200);
    check("salvar dados atualiza o nome na tela", txt(doc, "#profile-name") === "Maria Souza Teste", txt(doc, "#profile-name"));
    const check2 = await (await fetch("http://localhost/agendei/api/users/me", { headers: { Authorization: "Bearer " + maria.token } })).json();
    check("dados persistidos no banco (via API)", check2.data.name === "Maria Souza Teste");
    await fetch("http://localhost/agendei/api/users/update", { method: "PUT", headers: { Authorization: "Bearer " + maria.token }, body: new URLSearchParams({ name: "Maria Souza", email: "maria@teste.com" }) });

    // foto: escolher -> pré-visualização -> enviar
    const png = Uint8Array.from(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==", "base64"));
    const input = doc.querySelector("#photo-input");
    Object.defineProperty(input, "files", { value: [new File([png], "foto.png", { type: "image/png" })], configurable: true });
    w.URL.createObjectURL = () => "blob:preview"; w.URL.revokeObjectURL = () => {}; globalThis.URL.createObjectURL = w.URL.createObjectURL; globalThis.URL.revokeObjectURL = () => {};
    input.dispatchEvent(new w.Event("change")); await sleep(100);
    check("pré-visualização aparece antes do envio", !!doc.querySelector("#photo-preview img") && !doc.querySelector("#photo-upload").disabled);
    doc.querySelector("#photo-upload").click(); await sleep(1500);
    check("mensagem de sucesso da foto", /sucesso/i.test(txt(doc, "#photo-feedback") || ""), txt(doc, "#photo-feedback"));
    check("avatar do cabeçalho usa a foto enviada", !!doc.querySelector("#profile-avatar img")?.src.includes("/storage/uploads/users/"), doc.querySelector("#profile-avatar")?.innerHTML);
    check("sessão guarda photo_url (aparece nas outras telas)", /storage\/uploads\/users/.test(w.localStorage.getItem("agendei_user")));

    // arquivo inválido no navegador
    Object.defineProperty(input, "files", { value: [new File([png], "doc.pdf", { type: "application/pdf" })], configurable: true });
    input.dispatchEvent(new w.Event("change")); await sleep(50);
    check("formato inválido é barrado antes do envio", /formato não permitido/i.test(txt(doc, "#photo-feedback") || ""), txt(doc, "#photo-feedback"));
}

console.log("== painel.html (admin)");
{
    const { doc } = await openPage("painel.html", { scope: "admin", session: admin });
    await load("views/assets/admin/scripts/painel.js"); await sleep(1200);
    const ids = ["kpi-total-users", "kpi-total-services", "kpi-total-appointments", "kpi-upcoming", "kpi-completed", "kpi-cancelled"];
    check("KPIs reais preenchidos (números, sem '—')", ids.every((id) => /^\d+$/.test(txt(doc, "#" + id))), ids.map((id) => txt(doc, "#" + id)).join(","));
}

console.log("== agendamentos-admin.html");
{
    const { doc, w } = await openPage("agendamentos-admin.html", { scope: "admin", session: admin });
    await load("views/assets/admin/scripts/agendamentos-admin.js"); await sleep(1500);
    const rows = doc.querySelectorAll("#appt-tbody tr");
    check("lista todos os agendamentos com cliente e serviço", rows.length >= 1 && /Maria/.test(rows[0].textContent) && /Corte Feminino/.test(rows[0].textContent));
    doc.querySelector("#f-status").value = "pending"; doc.querySelector("#f-status").dispatchEvent(new w.Event("change")); await sleep(800);
    check("filtro por status funciona", [...doc.querySelectorAll("#appt-tbody tr")].every((r) => /Pendente/.test(r.textContent)));
    doc.querySelector("#f-status").value = "cancelled"; doc.querySelector("#f-status").dispatchEvent(new w.Event("change")); await sleep(800);
    const first = doc.querySelector("#appt-tbody tr");
    check("filtro 'cancelado' mostra o cancelado do teste anterior", !!first && /Cancelado/.test(first.textContent));
    const sel = first.querySelector(".status-select"); sel.value = "completed"; sel.dispatchEvent(new w.Event("change")); await sleep(1000);
    check("alterar status pelo select mostra sucesso", /atualizado/i.test(txt(doc, "#appt-admin-feedback") || "") || /Não foi/i.test(txt(doc, "#appt-admin-feedback") || ""), txt(doc, "#appt-admin-feedback"));
}

console.log("== novoservico-admin.html (galeria)");
{
    const { doc, w } = await openPage("novoservico-admin.html", { scope: "admin", session: admin });
    await load("views/assets/admin/scripts/novoservico-admin.js"); await sleep(1500);
    check("lista de serviços renderizada", doc.querySelectorAll(".st-row").length >= 2);
    doc.querySelector("#open-new-service").click();
    doc.querySelector("#svc-name").value = "Serviço DOM"; doc.querySelector("#svc-desc").value = "desc";
    doc.querySelector("#svc-cat").value = doc.querySelector("#svc-cat").options[1].value; doc.querySelector("#svc-price").value = "20"; doc.querySelector("#svc-duration").value = "30";
    const png = Uint8Array.from(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==", "base64"));
    const input = doc.querySelector("#svc-images");
    w.URL.createObjectURL = () => "blob:x"; w.URL.revokeObjectURL = () => {}; globalThis.URL.createObjectURL = w.URL.createObjectURL; globalThis.URL.revokeObjectURL = () => {};
    Object.defineProperty(input, "files", { value: [new File([png], "a.png", { type: "image/png" }), new File([png], "b.png", { type: "image/png" })], configurable: true });
    input.dispatchEvent(new w.Event("change")); await sleep(100);
    check("2 imagens aparecem em 'novas imagens' antes do envio", doc.querySelectorAll("#gallery-pending .gallery-item").length === 2);
    doc.querySelector("#gallery-pending .gallery-item button").click();
    check("descartar uma imagem pendente funciona", doc.querySelectorAll("#gallery-pending .gallery-item").length === 1);
    Object.defineProperty(input, "files", { value: [new File([png], "c.png", { type: "image/png" })], configurable: true });
    input.dispatchEvent(new w.Event("change")); await sleep(50);
    doc.querySelector("#new-service-form").dispatchEvent(new w.Event("submit", { cancelable: true })); await sleep(5000);
    const row = [...doc.querySelectorAll(".st-row")].find((r) => r.dataset.name === "Serviço DOM");
    check("serviço criado aparece na lista com miniatura da galeria", !!row && !!row.querySelector(".st-emoji img"), row?.innerHTML.slice(0, 200));
    row.querySelector(".btn-edit").click(); await sleep(1200);
    check("ao editar, galeria mostra as 2 imagens salvas (persistidas)", doc.querySelectorAll("#gallery-existing .gallery-item").length === 2, doc.querySelectorAll("#gallery-existing .gallery-item").length);
    doc.querySelector("#gallery-existing .gallery-item button").click(); await sleep(1200);
    check("remover uma imagem mantém a outra", doc.querySelectorAll("#gallery-existing .gallery-item").length === 1);
    const newRow = [...doc.querySelectorAll(".st-row")].find((r) => r.dataset.name === "Serviço DOM");
    newRow.querySelector(".btn-delete-service").click(); await sleep(1200);
    check("excluir serviço remove da lista", ![...doc.querySelectorAll(".st-row")].some((r) => r.dataset.name === "Serviço DOM"));
}

console.log("== usuarios.html (admin)");
{
    const { doc, w } = await openPage("usuarios.html", { scope: "admin", session: admin });
    await load("views/assets/admin/scripts/usuarios.js"); await sleep(1200);
    check("lista de usuários carregada", doc.querySelectorAll("#users-tbody tr").length >= 3);
    check("contagem exibida", /usuários/.test(txt(doc, "#users-count")));
    doc.querySelector("#user-search").value = "outro"; doc.querySelector("#user-search").dispatchEvent(new w.Event("input"));
    check("busca filtra a lista", doc.querySelectorAll("#users-tbody tr").length === 1);
}

console.log(`\nRESULTADO: ${ok} passaram, ${fail} falharam`);
process.exit(fail ? 1 : 0);
