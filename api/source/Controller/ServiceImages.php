<?php

namespace Source\Controller;

use Source\Core\Connect;
use Source\Models\ServiceImage;
use Source\Support\Upload;


class ServiceImages extends Api
{
    public function list(array $data): void
    {
        $serviceId = $this->serviceId($data);
        if ($serviceId === null) return;

        $images = (new ServiceImage())->listByService($serviceId);
        $this->call(200, "success", $images ? "Imagens do serviço." : "Este serviço ainda não possui imagens.", "success")->back($images);
    }

    public function insert(array $data): void
    {
        if (!$this->authToken(1)) {
            $this->call(401, "unauthorized", "Acesso de administrador necessário.", "error")->back();
            return;
        }
        $serviceId = $this->serviceId($data);
        if ($serviceId === null) return;

        // Aceita images[] (várias) ou image (uma só).
        $files = Upload::normalizeFiles($_FILES['images'] ?? $_FILES['image'] ?? null);
        $files = array_values(array_filter($files, fn($f) => ($f['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE));

        if (!$files) {
            // Com post_max_size estourado o PHP descarta $_FILES e $_POST inteiros.
            $tooBig = empty($_FILES) && !empty($_SERVER['CONTENT_LENGTH']);
            $this->call(400, "bad_request", $tooBig
                ? "O envio excede o tamanho total permitido pelo servidor (post_max_size)."
                : "Selecione ao menos uma imagem.", "error")->back();
            return;
        }
        if (count($files) > CONF_UPLOAD_MAX_FILES_PER_REQUEST) {
            $this->call(400, "bad_request", "Envie no máximo " . CONF_UPLOAD_MAX_FILES_PER_REQUEST . " imagens por vez.", "error")->back();
            return;
        }

        $model = new ServiceImage();
        $current = $model->countByService($serviceId);
        if ($current + count($files) > CONF_UPLOAD_MAX_IMAGES_PER_SERVICE) {
            $this->call(400, "bad_request", "Cada serviço pode ter no máximo " . CONF_UPLOAD_MAX_IMAGES_PER_SERVICE . " imagens (já possui {$current}).", "error")->back();
            return;
        }

        $serviceName = (string)Connect::getInstance()->query("SELECT name FROM services WHERE id = " . (int)$serviceId)->fetchColumn();
        $upload = new Upload();
        $saved = [];
        $failed = [];

        foreach ($files as $file) {
            $originalName = mb_substr(basename((string)($file['name'] ?? 'imagem')), 0, 80);
            $path = $upload->image($file, CONF_UPLOAD_DIR_SERVICES, CONF_UPLOAD_MAX_SERVICE_IMAGE);
            if ($path === null) {
                $failed[] = ["file" => $originalName, "error" => $upload->getError()];
                continue;
            }

            $image = new ServiceImage(null, $serviceId, $path, mb_substr($serviceName, 0, 200), $model->nextPosition($serviceId));
            if (!$image->insert()) {
                // Falha ao registrar no banco: não pode sobrar arquivo órfão no disco.
                $upload->remove($path);
                $failed[] = ["file" => $originalName, "error" => "Não foi possível registrar a imagem no banco de dados."];
                continue;
            }
            $saved[] = [
                "id" => $image->getId(), "service_id" => $serviceId, "image_path" => $path,
                "image_url" => storage_url($path), "alt_text" => $image->getAltText(), "position" => $image->getPosition(),
            ];
        }

        if (!$saved) {
            $this->call(400, "bad_request", $failed[0]['error'] ?? "Nenhuma imagem foi enviada.", "error")->back(["saved" => [], "failed" => $failed]);
            return;
        }

        $msg = count($saved) === 1 ? "Imagem enviada com sucesso." : count($saved) . " imagens enviadas com sucesso.";
        if ($failed) $msg .= " " . count($failed) . " arquivo(s) não foram aceitos.";
        $this->call(201, "created", $msg, "success")->back(["saved" => $saved, "failed" => $failed]);
    }

    public function delete(array $data): void
    {
        if (!$this->authToken(1)) {
            $this->call(401, "unauthorized", "Acesso de administrador necessário.", "error")->back();
            return;
        }
        $serviceId = $this->serviceId($data);
        if ($serviceId === null) return;

        $imageId = filter_var($data['image_id'] ?? null, FILTER_VALIDATE_INT);
        if (!$imageId || $imageId < 1) {
            $this->call(400, "bad_request", "ID da imagem inválido.", "error")->back();
            return;
        }

        $model = new ServiceImage();
        $row = $model->findInService($imageId, $serviceId);   // garante que a imagem pertence ao serviço
        if (!$row) {
            $this->call(404, "not_found", "Imagem não encontrada neste serviço.", "error")->back();
            return;
        }

        // Ordem: 1) remove o registro; 2) só então apaga o arquivo.
        // Se o banco falhar, o arquivo permanece e nada fica inconsistente.
        if (!$model->deleteInService($imageId, $serviceId)) {
            $this->call(500, "internal_server_error", "Não foi possível remover a imagem.", "error")->back();
            return;
        }
        $removed = (new Upload())->remove($row->image_path);

        $this->call(200, "success", "Imagem removida com sucesso.", "success")->back(["file_removed" => $removed]);
    }

    /** Valida {service_id} e confirma que o serviço existe. Responde 400/404 e devolve null se falhar. */
    private function serviceId(array $data): ?int
    {
        $id = filter_var($data['service_id'] ?? null, FILTER_VALIDATE_INT);
        if (!$id || $id < 1) {
            $this->call(400, "bad_request", "ID do serviço inválido.", "error")->back();
            return null;
        }
        $stmt = Connect::getInstance()->prepare("SELECT id FROM services WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        if (!$stmt->fetch()) {
            $this->call(404, "not_found", "Serviço não encontrado.", "error")->back();
            return null;
        }
        return (int)$id;
    }
}
