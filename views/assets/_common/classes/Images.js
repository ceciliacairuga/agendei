import HttpClientBase from "./HttpClientBase.js";

/**
 * Serviço HTTP de imagens (Etapa 07). Não manipula a interface.
 * Todos os envios usam FormData: o navegador define sozinho o Content-Type
 * "multipart/form-data; boundary=..." (o HttpClientBase remove o Content-Type JSON nesse caso).
 */
export default class Images extends HttpClientBase {
    /** Formatos e limites aceitos (a validação DEFINITIVA é feita na API). */
    static ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
    static ACCEPT_ATTR = "image/jpeg,image/png,image/webp";
    static MAX_USER_PHOTO_BYTES = 2 * 1024 * 1024;
    static MAX_SERVICE_IMAGE_BYTES = 5 * 1024 * 1024;
    static MAX_FILES_PER_UPLOAD = 10;

    /** Valida no navegador (UX). Retorna a mensagem de erro ou null se estiver ok. */
    static validateFile(file, maxBytes) {
        if (!file) return "Selecione uma imagem.";
        if (!Images.ACCEPTED_TYPES.includes(file.type)) return `"${file.name}": formato não permitido. Use JPG, PNG ou WEBP.`;
        if (file.size > maxBytes) return `"${file.name}": excede o limite de ${Images.formatBytes(maxBytes)}.`;
        if (file.size === 0) return `"${file.name}": o arquivo está vazio.`;
        return null;
    }

    static formatBytes(bytes) {
        return bytes >= 1048576 ? `${(bytes / 1048576).toFixed(0)} MB` : `${Math.round(bytes / 1024)} KB`;
    }

    #ensureSuccess(response, fallback) {
        const ok = response?.status === "success" || response?.status === "created";
        if (!ok) {
            const error = new Error(response?.message || fallback);
            error.details = response?.data ?? null;
            throw error;
        }
        return response.data;
    }

    // ---- Foto de perfil ------------------------------------------------
    /** POST /users/photo — o usuário é identificado pelo token, nunca por um ID enviado. */
    async uploadUserPhoto(file) {
        const formData = new FormData();
        formData.append("photo", file);
        return this.#ensureSuccess(await this.post("/users/photo", formData), "Não foi possível enviar a foto.");
    }

    // ---- Galeria de serviços -------------------------------------------
    async listServiceImages(serviceId) {
        const response = await this.get("/services/:service_id/images", { service_id: serviceId });
        return this.#ensureSuccess(response, "Não foi possível carregar a galeria.") ?? [];
    }

    /** Envia 1..N arquivos. Retorna { saved: [...], failed: [{file, error}] }. */
    async uploadServiceImages(serviceId, files) {
        const formData = new FormData();
        Array.from(files).forEach((file) => formData.append("images[]", file));
        const response = await this.post("/services/:service_id/images", formData, { service_id: serviceId });
        return this.#ensureSuccess(response, "Não foi possível enviar as imagens.");
    }

    async removeServiceImage(serviceId, imageId) {
        const response = await this.delete("/services/:service_id/images/:image_id", { service_id: serviceId, image_id: imageId });
        return this.#ensureSuccess(response, "Não foi possível remover a imagem.");
    }
}
