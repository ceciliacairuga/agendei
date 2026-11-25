<?php

namespace Source\Support;

/**
 * Upload de imagens.
 *
 * ATENÇÃO: o enunciado cita que esta classe "já estaria disponível", mas o arquivo
 * api/source/Support/Upload.php NÃO veio no ZIP enviado. Esta é uma implementação
 * compatível, criada para o Agendei. Se o professor fornecer a versão oficial,
 * basta substituir este arquivo e ajustar as chamadas em
 * Controller/Users.php (photo) e Controller/ServiceImages.php, que usam somente:
 *
 *   $upload = new Upload();
 *   $path   = $upload->image($_FILES['campo'], 'uploads/users', 2*1024*1024);   // string|null
 *   $upload->getError();                                                        // ?string
 *   $upload->remove($path);                                                     // bool
 *   Upload::normalizeFiles($_FILES['images']);                                  // array de arquivos
 *
 * Regras de segurança aplicadas:
 *  - confere os códigos de erro do PHP (UPLOAD_ERR_*);
 *  - confirma que o arquivo veio de um upload HTTP real (is_uploaded_file);
 *  - valida o tamanho real em disco (não o informado pelo navegador);
 *  - detecta o MIME real pelo CONTEÚDO (finfo) e confirma que é imagem decodificável (getimagesize);
 *  - ignora nome, extensão e MIME enviados pelo navegador;
 *  - gera nome aleatório e extensão a partir do MIME detectado;
 *  - grava somente dentro de CONF_STORAGE_DIR e devolve caminho RELATIVO (nunca o absoluto).
 */
class Upload
{
    /** MIME real => extensão que será gravada */
    public const ALLOWED = [
        'image/jpeg' => 'jpg',
        'image/png'  => 'png',
        'image/webp' => 'webp',
    ];

    /** Limite de pixels por lado (evita imagens "bomba" de descompressão). */
    private const MAX_SIDE = 8000;

    private ?string $error = null;
    private string $baseDir;

    public function __construct(?string $baseDir = null)
    {
        $this->baseDir = rtrim($baseDir ?? CONF_STORAGE_DIR, '/\\');
    }

    public function getError(): ?string
    {
        return $this->error;
    }

    /**
     * Valida e grava uma imagem.
     *
     * @param array  $file     entrada de $_FILES (um único arquivo)
     * @param string $subDir   subpasta relativa a storage/ (ex.: uploads/users)
     * @param int    $maxBytes tamanho máximo permitido em bytes
     * @return string|null     caminho relativo salvo (ex.: uploads/users/ab12.jpg) ou null em caso de erro
     */
    public function image(array $file, string $subDir, int $maxBytes): ?string
    {
        $this->error = null;

        if (!$this->validate($file, $maxBytes, $mime)) {
            return null;
        }

        $subDir = trim(str_replace('\\', '/', $subDir), '/');
        if ($subDir === '' || str_contains($subDir, '..')) {
            $this->error = 'Destino de upload inválido.';
            return null;
        }

        $targetDir = $this->baseDir . '/' . $subDir;
        if (!is_dir($targetDir) && !@mkdir($targetDir, 0775, true) && !is_dir($targetDir)) {
            $this->error = 'Não foi possível preparar a pasta de destino.';
            return null;
        }

        $fileName = bin2hex(random_bytes(16)) . '.' . self::ALLOWED[$mime];
        $target = $targetDir . '/' . $fileName;

        if (!$this->moveFile($file['tmp_name'], $target)) {
            $this->error = 'Não foi possível gravar o arquivo enviado.';
            return null;
        }
        @chmod($target, 0644);

        return $subDir . '/' . $fileName;
    }

    /** Remove um arquivo gravado por esta classe. Só aceita caminhos dentro de uploads/. */
    public function remove(?string $relativePath): bool
    {
        $absolute = $this->absolutePath($relativePath);
        if ($absolute === null || !is_file($absolute)) {
            return false;
        }
        return @unlink($absolute);
    }

    /** Caminho absoluto de um caminho relativo salvo no banco (ou null se for suspeito). */
    public function absolutePath(?string $relativePath): ?string
    {
        if ($relativePath === null || $relativePath === '') {
            return null;
        }
        $relativePath = str_replace('\\', '/', $relativePath);
        if (str_contains($relativePath, '..') || !str_starts_with($relativePath, 'uploads/')
            || preg_match('#^uploads/[a-z0-9_/-]+/[a-f0-9]{32}\.(jpg|png|webp)$#', $relativePath) !== 1) {
            return null; // legado/URL externa/caminho manipulado: nunca tocar no disco
        }
        return $this->baseDir . '/' . $relativePath;
    }

    /**
     * Converte $_FILES['campo'] (único ou múltiplo) numa lista de arquivos individuais.
     * @return array<int,array>
     */
    public static function normalizeFiles(?array $input): array
    {
        if (!$input || !isset($input['name'])) {
            return [];
        }
        if (!is_array($input['name'])) {
            return [$input];
        }
        $files = [];
        foreach (array_keys($input['name']) as $i) {
            $files[] = [
                'name'     => $input['name'][$i],
                'type'     => $input['type'][$i] ?? '',
                'tmp_name' => $input['tmp_name'][$i] ?? '',
                'error'    => $input['error'][$i] ?? UPLOAD_ERR_NO_FILE,
                'size'     => $input['size'][$i] ?? 0,
            ];
        }
        return $files;
    }

    // ------------------------------------------------------------------

    private function validate(array $file, int $maxBytes, ?string &$mime): bool
    {
        $code = $file['error'] ?? UPLOAD_ERR_NO_FILE;
        if ($code !== UPLOAD_ERR_OK) {
            $this->error = match ($code) {
                UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE => 'O arquivo excede o tamanho máximo permitido pelo servidor.',
                UPLOAD_ERR_PARTIAL => 'O envio do arquivo foi interrompido. Tente novamente.',
                UPLOAD_ERR_NO_FILE => 'Nenhum arquivo foi enviado.',
                UPLOAD_ERR_NO_TMP_DIR, UPLOAD_ERR_CANT_WRITE, UPLOAD_ERR_EXTENSION => 'O servidor não conseguiu receber o arquivo.',
                default => 'Falha desconhecida no envio do arquivo.',
            };
            return false;
        }

        $tmp = (string)($file['tmp_name'] ?? '');
        if ($tmp === '' || !$this->isUploadedFile($tmp)) {
            $this->error = 'Arquivo de upload inválido.';
            return false;
        }

        $size = @filesize($tmp);
        if ($size === false || $size < 1) {
            $this->error = 'O arquivo enviado está vazio.';
            return false;
        }
        if ($size > $maxBytes) {
            $this->error = 'O arquivo excede o limite de ' . self::formatBytes($maxBytes) . '.';
            return false;
        }

        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mime = (string)$finfo->file($tmp);
        if (!isset(self::ALLOWED[$mime])) {
            $this->error = 'Formato não permitido. Envie uma imagem JPG, PNG ou WEBP.';
            return false;
        }

        $info = @getimagesize($tmp);
        if ($info === false || empty($info[0]) || empty($info[1])) {
            $this->error = 'O arquivo não é uma imagem válida.';
            return false;
        }
        if ($info[0] > self::MAX_SIDE || $info[1] > self::MAX_SIDE) {
            $this->error = 'A imagem é grande demais (máximo ' . self::MAX_SIDE . ' px por lado).';
            return false;
        }
        // O tipo decodificado precisa bater com o MIME detectado.
        $decodedMime = $info['mime'] ?? '';
        if ($decodedMime !== $mime) {
            $this->error = 'O conteúdo do arquivo não corresponde a uma imagem válida.';
            return false;
        }

        return true;
    }

    /** Separado para permitir testes automatizados sem um POST HTTP real (ver tests/). */
    protected function isUploadedFile(string $path): bool
    {
        return is_uploaded_file($path);
    }

    protected function moveFile(string $from, string $to): bool
    {
        return @move_uploaded_file($from, $to);
    }

    public static function formatBytes(int $bytes): string
    {
        return $bytes >= 1048576
            ? rtrim(rtrim(number_format($bytes / 1048576, 1, ',', ''), '0'), ',') . ' MB'
            : (int)round($bytes / 1024) . ' KB';
    }
}
