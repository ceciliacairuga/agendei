import Services from "../classes/Services.js";
import ServicesType from "../classes/ServicesType.js";

const servicesApi = new Services();
const typesApi = new ServicesType();
const grid = document.querySelector("#cat-grid");
const filterList = document.querySelector("#cat-filter-list");
const searchInput = document.querySelector("#cat-search");
const emptyState = document.querySelector("#cat-empty");
const feedback = document.querySelector("#cat-feedback");
const backLink = document.querySelector("#cat-back-link");
const contextBadge = document.querySelector("#cat-context-badge");

const referrer = document.referrer || "";
if (backLink && contextBadge) {
    const isAdmin = /painel\.html|usuarios\.html|novoservico-admin\.html/.test(referrer);
    backLink.href = isAdmin ? "painel.html" : "dashboard.html";
    contextBadge.textContent = isAdmin ? "Área Admin" : "Área do Cliente";
    if (isAdmin) { contextBadge.style.background = "#1C1730"; contextBadge.style.color = "#fff"; }
}

let services = [];
let categories = [];
let selectedCategory = "todos";

function slug(value) {
    return String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "outros";
}
function iconFor(name) {
    const text = String(name || "").toLowerCase();
    if (text.includes("unha") || text.includes("manicure") || text.includes("pedicure")) return "💅";
    if (text.includes("color")) return "🎨";
    if (text.includes("cabelo") || text.includes("corte") || text.includes("escova")) return "✂️";
    if (text.includes("trat")) return "💆";
    if (text.includes("sobrancelha") || text.includes("cilios")) return "✨";
    if (text.includes("maqui")) return "💄";
    return "✦";
}
function formatPrice(value) {
    return Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function formatDuration(value) {
    const minutes = Number(value || 0);
    if (minutes >= 60) {
        const hours = Math.floor(minutes / 60);
        const rest = minutes % 60;
        return `${hours}h${rest ? ` ${rest}min` : ""}`;
    }
    return `${minutes} min`;
}
function make(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}
function categoryName(id) {
    const item = categories.find(category => Number(category.id) === Number(id));
    return item?.name || "Outros";
}
function renderFilters() {
    filterList.replaceChildren();
    const all = make("button", "cat-filter-btn cat-filter-btn--active", "Todos");
    all.type = "button"; all.dataset.cat = "todos"; all.setAttribute("aria-pressed", "true");
    filterList.appendChild(make("li")).appendChild(all);
    categories.forEach(category => {
        const button = make("button", "cat-filter-btn", `${iconFor(category.name)} ${category.name}`);
        button.type = "button"; button.dataset.cat = String(category.id); button.setAttribute("aria-pressed", "false");
        const li = make("li"); li.appendChild(button); filterList.appendChild(li);
    });
}
function renderCards() {
    const query = searchInput.value.trim().toLowerCase();
    const filtered = services.filter(service => {
        const catMatch = selectedCategory === "todos" || Number(service.services_type_id ?? service.servicesTypeId) === Number(selectedCategory);
        const text = `${service.name || ""} ${service.description || ""} ${categoryName(service.services_type_id ?? service.servicesTypeId)}`.toLowerCase();
        return catMatch && text.includes(query);
    });
    grid.replaceChildren();
    filtered.forEach(service => {
        const catId = service.services_type_id ?? service.servicesTypeId;
        const category = categoryName(catId);
        const categorySlug = slug(category);
        const card = make("article", "cat-card");
        card.dataset.cat = String(catId);
        card.dataset.name = `${service.name} ${category}`.toLowerCase();
        const thumb = make("figure", `cat-card-thumb cat-thumb--${categorySlug}`, iconFor(category));
        thumb.setAttribute("aria-hidden", "true");
        if (service.cover_url) {   // foto da galeria do serviço (se houver); senão mantém o ícone da categoria
            const cover = document.createElement("img");
            cover.src = service.cover_url;
            cover.alt = "";
            cover.loading = "lazy";
            cover.style.cssText = "width:100%;height:100%;object-fit:cover;display:block";
            cover.addEventListener("error", () => { thumb.textContent = iconFor(category); });
            thumb.replaceChildren(cover);
        }
        const body = make("section", "cat-card-body");
        const header = make("header", "cat-card-header");
        header.append(make("h2", "cat-card-name", service.name), make("span", "cat-price", formatPrice(service.price)));
        body.appendChild(header);
        body.appendChild(make("p", "cat-card-desc", service.description || "Consulte mais informações no salão."));
        const info = make("ul", "cat-card-info"); info.setAttribute("role", "list");
        info.appendChild(make("li", "", `◷ ${formatDuration(service.duration)}`));
        body.appendChild(info);
        const footer = make("footer", "cat-card-footer");
        footer.appendChild(make("span", `cat-pill cat-pill--${categorySlug}`, category));
        footer.appendChild(make("span", "cat-badge-status", "Disponível"));
        body.appendChild(footer);
        card.append(thumb, body);
        grid.appendChild(card);
    });
    emptyState.hidden = filtered.length > 0;
    if (feedback) feedback.textContent = `${filtered.length} serviço${filtered.length === 1 ? "" : "s"} disponível${filtered.length === 1 ? "" : "is"}`;
}
filterList.addEventListener("click", event => {
    const button = event.target.closest("button[data-cat]");
    if (!button) return;
    selectedCategory = button.dataset.cat;
    filterList.querySelectorAll("button").forEach(item => {
        const active = item === button;
        item.classList.toggle("cat-filter-btn--active", active);
        item.setAttribute("aria-pressed", String(active));
    });
    renderCards();
});
searchInput.addEventListener("input", renderCards);

try {
    const [servicesResponse, typesResponse] = await Promise.all([servicesApi.listAll(), typesApi.listAll()]);
    if (servicesResponse.status !== "success") throw new Error(servicesResponse.message || "Não foi possível carregar os serviços.");
    if (typesResponse.status !== "success") throw new Error(typesResponse.message || "Não foi possível carregar as categorias.");
    services = (servicesResponse.data || []).filter(service => Number(service.active ?? 1) === 1);
    categories = typesResponse.data || [];
    renderFilters();
    renderCards();
} catch (error) {
    if (feedback) feedback.textContent = `Não foi possível carregar o catálogo: ${error.message}`;
    emptyState.hidden = false;
}
