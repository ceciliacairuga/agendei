import SessionStorage from "../../_common/scripts/storage.js";
import Services from "../../_common/classes/Services.js";
import ServicesType from "../../_common/classes/ServicesType.js";
import Service from "../../_common/classes/Service.js";
import Images from "../../_common/classes/Images.js";

const session = new SessionStorage("admin");
const services = new Services();
const serviceTypes = new ServicesType();
const imagesApi = new Images();
const token = session.getToken();

if (token) {
    services.setAuthToken(token);
    serviceTypes.setAuthToken(token);
    imagesApi.setAuthToken(token);
}

const table = document.querySelector("#services-table");
const searchInput = document.querySelector("#search-services");
const filterCat = document.querySelector("#filter-cat");
const filterStatus = document.querySelector("#filter-status");
const countLabel = document.querySelector("#count-label");
const emptyState = document.querySelector("#empty-state");
const overlay = document.querySelector("#modal-overlay");
const form = document.querySelector("#new-service-form");
const submitButton = document.querySelector("#svc-submit");
const modalTitle = document.querySelector("#modal-title");
const categorySelect = document.querySelector("#svc-cat");
const serviceName = document.querySelector("#svc-name");
const serviceDescription = document.querySelector("#svc-desc");
const servicePrice = document.querySelector("#svc-price");
const serviceDuration = document.querySelector("#svc-duration");
const serviceStatus = document.querySelector("#svc-status");

let serviceList = [];
let typeList = [];
let editingId = null;

// ---- Galeria de imagens ------------------------------------------------
const imagesInput = document.querySelector("#svc-images");
const galleryExisting = document.querySelector("#gallery-existing");
const galleryExistingWrap = document.querySelector("#gallery-existing-wrap");
const galleryPending = document.querySelector("#gallery-pending");
const galleryPendingWrap = document.querySelector("#gallery-pending-wrap");
const galleryEmpty = document.querySelector("#gallery-empty");
const galleryError = document.querySelector("#gallery-error");

let existingImages = [];          // já salvas no servidor (service_images)
let pendingImages = [];           // [{ file, url }] escolhidas, ainda não enviadas

function messageOf(error) {
    return String(error?.message || error || "Erro desconhecido.").replace(/^Request failed:\s*/, "");
}

function showGalleryError(message) {
    if (!galleryError) return;
    galleryError.textContent = message || "";
    galleryError.hidden = !message;
}

function makeGalleryItem(src, alt, label, onRemove, isNew = false) {
    const item = document.createElement("li");
    item.className = `gallery-item${isNew ? " gallery-item--new" : ""}`;
    const img = document.createElement("img");
    img.src = src;
    img.alt = alt;
    img.loading = "lazy";
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "×";
    button.setAttribute("aria-label", label);
    button.title = label;
    button.addEventListener("click", () => onRemove(button));
    item.append(img, button);
    return item;
}

function renderGallery() {
    galleryExisting.replaceChildren(...existingImages.map(image => makeGalleryItem(
        image.image_url, image.alt_text || "Imagem do serviço", "Remover esta imagem", button => removeExistingImage(image, button)
    )));
    galleryPending.replaceChildren(...pendingImages.map((entry, index) => makeGalleryItem(
        entry.url, entry.file.name, "Descartar esta imagem", () => removePending(index), true
    )));
    galleryExistingWrap.hidden = existingImages.length === 0;
    galleryPendingWrap.hidden = pendingImages.length === 0;
    // Mensagem de "sem imagens" só no modo edição (no cadastro ainda não há galeria salva)
    galleryEmpty.hidden = !(editingId && existingImages.length === 0 && pendingImages.length === 0);
}

function clearPending() {
    pendingImages.forEach(entry => URL.revokeObjectURL(entry.url));
    pendingImages = [];
    if (imagesInput) imagesInput.value = "";
}

function removePending(index) {
    const [removed] = pendingImages.splice(index, 1);
    if (removed) URL.revokeObjectURL(removed.url);
    renderGallery();
}

async function loadGallery(serviceId) {
    existingImages = [];
    renderGallery();
    if (!serviceId) return;
    try {
        existingImages = await imagesApi.listServiceImages(serviceId);
    } catch (error) {
        showGalleryError(`Não foi possível carregar a galeria: ${messageOf(error)}`);
    }
    renderGallery();
}

async function removeExistingImage(image, button) {
    if (!window.confirm("Remover esta imagem da galeria?")) return;
    button.disabled = true;
    showGalleryError("");
    try {
        await imagesApi.removeServiceImage(editingId, image.id);
        existingImages = existingImages.filter(item => item.id !== image.id);
        renderGallery();
        await loadData(false);   // atualiza a miniatura/contagem da lista
    } catch (error) {
        button.disabled = false;
        showGalleryError(messageOf(error));
    }
}

imagesInput?.addEventListener("change", () => {
    showGalleryError("");
    const problems = [];
    Array.from(imagesInput.files).forEach(file => {
        if (pendingImages.length >= Images.MAX_FILES_PER_UPLOAD) {
            problems.push(`Limite de ${Images.MAX_FILES_PER_UPLOAD} imagens por envio atingido.`);
            return;
        }
        const problem = Images.validateFile(file, Images.MAX_SERVICE_IMAGE_BYTES);
        if (problem) { problems.push(problem); return; }
        pendingImages.push({ file, url: URL.createObjectURL(file) });
    });
    imagesInput.value = "";   // permite escolher o mesmo arquivo de novo
    if (problems.length) showGalleryError([...new Set(problems)].join(" "));
    renderGallery();
});

/** Envia as imagens escolhidas. Retorna true se tudo foi enviado (ou não havia nada a enviar). */
async function uploadPendingImages(serviceId) {
    if (!pendingImages.length) return true;
    const files = pendingImages.map(entry => entry.file);
    try {
        const result = await imagesApi.uploadServiceImages(serviceId, files);
        const failed = result.failed ?? [];
        // Mantém na fila apenas as que falharam, para o admin ver e tentar de novo.
        const failedNames = new Set(failed.map(item => item.file));
        pendingImages = pendingImages.filter(entry => {
            const keep = failedNames.has(entry.file.name.slice(0, 80));
            if (!keep) URL.revokeObjectURL(entry.url);
            return keep;
        });
        if (failed.length) showGalleryError(failed.map(item => `${item.file}: ${item.error}`).join(" "));
        existingImages = await imagesApi.listServiceImages(serviceId);
        renderGallery();
        return failed.length === 0;
    } catch (error) {
        showGalleryError(`Serviço salvo, mas as imagens não foram enviadas: ${messageOf(error)}`);
        return false;
    }
}

function responseData(response) {
    if (!response || response.status !== "success") {
        throw new Error(response?.message || "Não foi possível concluir a operação.");
    }
    return response.data ?? [];
}

function getId(item) {
    return Number(item.id);
}

function getTypeId(item) {
    return Number(item.servicesTypeId ?? item.services_type_id);
}

function getActive(item) {
    return Number(item.active ?? 1) === 1;
}

function typeName(typeId) {
    const type = typeList.find(item => getId(item) === Number(typeId));
    return type ? type.name : "Sem categoria";
}

function typeSlug(typeId) {
    return typeName(typeId).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function categoryEmoji(name) {
    const value = name.toLowerCase();
    if (value.includes("cabelo")) return "✂️";
    if (value.includes("color")) return "🎨";
    if (value.includes("trat")) return "💆";
    if (value.includes("unha")) return "💅";
    return "✦";
}

function formatPrice(value) {
    return Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDuration(value) {
    const minutes = Number(value);
    if (minutes >= 60) {
        const hours = Math.floor(minutes / 60);
        const rest = minutes % 60;
        return `${hours}h${rest ? ` ${rest}min` : ""}`;
    }
    return `${minutes} min`;
}

function makeCell(tag, className, value) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    element.textContent = value;
    return element;
}

function renderServices() {
    const header = table.querySelector(".st-header");
    table.replaceChildren();
    if (header) table.appendChild(header);

    serviceList.forEach(service => {
        const active = getActive(service);
        const category = typeName(getTypeId(service));
        const row = document.createElement("li");
        row.className = "st-row";
        row.setAttribute("role", "row");
        row.dataset.id = getId(service);
        row.dataset.cat = String(getTypeId(service));
        row.dataset.status = active ? "ativo" : "inativo";
        row.dataset.name = service.name;
        if (!active) row.classList.add("inactive");

        const serviceCell = document.createElement("section");
        serviceCell.className = "st-service";
        serviceCell.setAttribute("role", "cell");
        const thumb = makeCell("figure", "st-emoji", service.cover_url ? "" : categoryEmoji(category));
        if (service.cover_url) {
            const cover = document.createElement("img");
            cover.src = service.cover_url;
            cover.alt = `Imagem de ${service.name}`;
            cover.loading = "lazy";
            thumb.appendChild(cover);
        }
        serviceCell.appendChild(thumb);
        const details = document.createElement("section");
        details.appendChild(makeCell("p", "st-name", service.name));
        details.appendChild(makeCell("p", "st-pros", service.description || ""));
        serviceCell.appendChild(details);

        const catCell = document.createElement("span");
        catCell.className = "st-cat";
        catCell.setAttribute("role", "cell");
        catCell.appendChild(makeCell("span", `cat-pill cat-pill--${typeSlug(getTypeId(service))}`, category));

        row.appendChild(serviceCell);
        row.appendChild(catCell);
        row.appendChild(makeCell("span", "st-dur", formatDuration(service.duration)));
        row.appendChild(makeCell("span", "st-price", formatPrice(service.price)));

        const statusCell = document.createElement("span");
        statusCell.setAttribute("role", "cell");
        statusCell.appendChild(makeCell("span", `badge ${active ? "badge--green" : "badge--red"}`, active ? "Ativo" : "Inativo"));
        row.appendChild(statusCell);

        const actions = document.createElement("section");
        actions.className = "st-actions";
        actions.setAttribute("role", "cell");
        const editButton = makeCell("button", "btn btn--ghost btn--sm btn-edit", "Editar");
        editButton.type = "button";
        editButton.addEventListener("click", () => openEdit(service));
        const toggleButton = makeCell("button", `btn ${active ? "btn--danger" : "btn--outline"} btn--sm btn-toggle`, active ? "Desativar" : "Ativar");
        toggleButton.type = "button";
        toggleButton.addEventListener("click", () => toggleService(service));
        const deleteButton = makeCell("button", "btn btn--ghost btn--sm btn-delete-service", "Excluir");
        deleteButton.type = "button";
        deleteButton.addEventListener("click", () => deleteService(service));
        actions.append(editButton, toggleButton, deleteButton);
        row.appendChild(actions);
        table.appendChild(row);
    });

    applyFilters();
}

function applyFilters() {
    const query = (searchInput?.value || "").trim().toLowerCase();
    const category = filterCat?.value || "";
    const status = filterStatus?.value || "";
    let visible = 0;

    table.querySelectorAll(".st-row").forEach(row => {
        const matchesName = row.dataset.name.toLowerCase().includes(query);
        const matchesCategory = !category || row.dataset.cat === category;
        const matchesStatus = !status || row.dataset.status === status;
        const show = matchesName && matchesCategory && matchesStatus;
        row.classList.toggle("hidden", !show);
        if (show) visible++;
    });

    if (countLabel) countLabel.textContent = `${visible} serviço${visible === 1 ? "" : "s"}`;
    if (emptyState) emptyState.hidden = visible > 0;
}

function fillCategories() {
    const currentFilter = filterCat.value;
    const currentForm = categorySelect.value;
    filterCat.replaceChildren(new Option("Todas as categorias", ""));
    categorySelect.replaceChildren(new Option("Selecione uma categoria", ""));

    typeList.forEach(type => {
        const id = String(getId(type));
        filterCat.add(new Option(type.name, id));
        categorySelect.add(new Option(type.name, id));
    });

    if ([...filterCat.options].some(option => option.value === currentFilter)) filterCat.value = currentFilter;
    if ([...categorySelect.options].some(option => option.value === currentForm)) categorySelect.value = currentForm;
}

function showGlobalError(message) {
    const error = document.querySelector("#svc-error");
    if (error) {
        error.textContent = message;
        error.hidden = false;
    }
}

function clearFeedback() {
    ["svc-name-error", "svc-cat-error", "svc-price-error", "svc-duration-error"].forEach(id => {
        const element = document.querySelector(`#${id}`);
        if (element) {
            element.textContent = "";
            element.hidden = true;
        }
    });
    ["svc-success", "svc-error"].forEach(id => {
        const element = document.querySelector(`#${id}`);
        if (element) element.hidden = true;
    });
}

function openModal() {
    editingId = null;
    form.reset();
    clearFeedback();
    modalTitle.textContent = "Adicionar novo serviço";
    submitButton.textContent = "Adicionar serviço";
    clearPending();
    existingImages = [];
    showGalleryError("");
    renderGallery();
    overlay.hidden = false;
    overlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    serviceName.focus();
}

function openEdit(service) {
    editingId = getId(service);
    clearFeedback();
    modalTitle.textContent = "Editar serviço";
    submitButton.textContent = "Salvar alterações";
    serviceName.value = service.name || "";
    serviceDescription.value = service.description || "";
    categorySelect.value = String(getTypeId(service));
    servicePrice.value = Number(service.price).toFixed(2);
    serviceDuration.value = service.duration;
    serviceStatus.value = getActive(service) ? "ativo" : "inativo";
    clearPending();
    showGalleryError("");
    loadGallery(editingId);
    overlay.hidden = false;
    overlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    serviceName.focus();
}

function closeModal() {
    overlay.hidden = true;
    overlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    form.reset();
    clearFeedback();
    clearPending();
    existingImages = [];
    showGalleryError("");
    editingId = null;
}

async function loadData(showErrors = true) {
    try {
        const [serviceResponse, typeResponse] = await Promise.all([services.listAll(), serviceTypes.listAll()]);
        serviceList = responseData(serviceResponse).map(item => Service.fromJSON(item));
        typeList = responseData(typeResponse);
        fillCategories();
        renderServices();
    } catch (error) {
        if (showErrors) showGlobalError(`Não foi possível carregar os serviços: ${error.message}`);
        else console.error(error);
    }
}

async function deleteService(service) {
    const name = service.name || "este serviço";
    const extra = Number(service.image_count) > 0 ? ` As ${service.image_count} imagem(ns) da galeria também serão apagadas.` : "";
    if (!window.confirm(`Excluir "${name}" definitivamente?${extra}`)) return;
    try {
        const response = await services.remove(getId(service));
        if (response.status !== "success") throw new Error(response.message || "Não foi possível excluir o serviço.");
        await loadData();
    } catch (error) {
        window.alert(messageOf(error));   // ex.: serviço com agendamentos -> orienta a desativar
    }
}

async function toggleService(service) {
    const nextActive = getActive(service) ? 0 : 1;
    try {
        const response = await services.update(getId(service), { active: nextActive });
        if (response.status !== "success") throw new Error(response.message || "Não foi possível alterar o status.");
        service.active = nextActive;
        renderServices();
    } catch (error) {
        alert(error.message);
    }
}

form.addEventListener("submit", async event => {
    event.preventDefault();
    clearFeedback();

    const name = serviceName.value.trim();
    const description = serviceDescription.value.trim();
    const typeId = Number(categorySelect.value);
    const price = Number(servicePrice.value);
    const duration = Number(serviceDuration.value);
    let valid = true;

    if (!name) { document.querySelector("#svc-name-error").textContent = "Informe o nome do serviço."; document.querySelector("#svc-name-error").hidden = false; valid = false; }
    if (!description) { showGlobalError("Informe uma descrição para o serviço."); valid = false; }
    if (!typeId) { document.querySelector("#svc-cat-error").textContent = "Selecione uma categoria."; document.querySelector("#svc-cat-error").hidden = false; valid = false; }
    if (!servicePrice.value || !Number.isFinite(price) || price < 0) { document.querySelector("#svc-price-error").textContent = "Informe um preço válido."; document.querySelector("#svc-price-error").hidden = false; valid = false; }
    if (!serviceDuration.value || !Number.isInteger(duration) || duration < 1) { document.querySelector("#svc-duration-error").textContent = "Informe uma duração válida em minutos."; document.querySelector("#svc-duration-error").hidden = false; valid = false; }
    if (!valid) return;

    submitButton.disabled = true;
    submitButton.textContent = "Salvando...";
    const payload = {
        services_type_id: typeId,
        name,
        description,
        price,
        duration,
        active: serviceStatus.value === "ativo" ? 1 : 0
    };

    try {
        let response;
        if (editingId) response = await services.update(editingId, payload);
        else response = await services.insert(payload);

        if (response.status !== "success" && response.status !== "created") {
            throw new Error(response.message || "A API não conseguiu salvar o serviço.");
        }
        const wasEditing = !!editingId;
        const savedId = editingId || Number(response.data?.id);
        // Passa para o modo edição: se o envio das imagens falhar, "tentar de novo" não duplica o serviço.
        if (!wasEditing && savedId) {
            editingId = savedId;
            modalTitle.textContent = "Editar serviço";
        }

        const imagesOk = savedId ? await uploadPendingImages(savedId) : true;
        const success = document.querySelector("#svc-success");
        success.textContent = wasEditing ? "Serviço atualizado com sucesso!" : "Serviço cadastrado com sucesso!";
        success.hidden = false;
        await loadData();
        if (imagesOk) window.setTimeout(closeModal, 900);
    } catch (error) {
        showGlobalError(messageOf(error));
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = editingId ? "Salvar alterações" : "Adicionar serviço";
    }
});

document.querySelector("#open-new-service")?.addEventListener("click", openModal);
document.querySelector("#modal-close")?.addEventListener("click", closeModal);
document.querySelector("#modal-cancel")?.addEventListener("click", closeModal);
overlay?.addEventListener("click", event => { if (event.target === overlay) closeModal(); });
document.addEventListener("keydown", event => { if (event.key === "Escape" && !overlay.hidden) closeModal(); });
searchInput?.addEventListener("input", applyFilters);
filterCat?.addEventListener("change", applyFilters);
filterStatus?.addEventListener("change", applyFilters);

loadData();
