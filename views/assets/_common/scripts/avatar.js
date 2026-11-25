/* views/assets/_common/scripts/avatar.js
 * Mostra a foto do usuário (quando existe) ou, senão, as iniciais.
 */

export function initialsOf(name) {
    return String(name || "?").trim().split(/\s+/).slice(0, 2).map((part) => part[0] || "").join("").toUpperCase() || "?";
}

/** Preenche um elemento de avatar com <img> (foto) ou texto (iniciais). */
export function applyAvatar(element, { name, photoUrl } = {}) {
    if (!element) return;
    element.replaceChildren();
    if (photoUrl) {
        const img = document.createElement("img");
        img.src = photoUrl;
        img.alt = name ? `Foto de ${name}` : "Foto de perfil";
        img.style.cssText = "width:100%;height:100%;object-fit:cover;border-radius:inherit;display:block";
        // Se a imagem falhar (arquivo removido, rede), volta para as iniciais.
        img.addEventListener("error", () => { element.textContent = initialsOf(name); });
        element.appendChild(img);
    } else {
        element.textContent = initialsOf(name);
    }
}

export function applyAvatars(selector, user) {
    document.querySelectorAll(selector).forEach((el) => applyAvatar(el, { name: user?.name, photoUrl: user?.photo_url ?? user?.photoUrl }));
}
