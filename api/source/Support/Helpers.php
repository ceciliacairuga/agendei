<?php

function url(?string $path = null): string
{
    if($_SERVER['HTTP_HOST'] === "localhost")
    {
        if($path){
            return CONF_URL_TEST . "/" . ($path[0] == "/" ? mb_substr($path, 1) : $path);
        }
        return CONF_URL_TEST;
    }
    if($path)
    {
        return CONF_URL_BASE . "/" . ($path[0] == "/" ? mb_substr($path, 1) : $path);
    }
    return CONF_URL_BASE;
}

/**
 * URL pública de um arquivo salvo em storage/ (caminho relativo guardado no banco).
 * Nunca expõe caminho absoluto do servidor. Valores legados que já são URL http(s) são devolvidos como estão.
 */
function storage_url(?string $relativePath): ?string
{
    if ($relativePath === null || $relativePath === '') {
        return null;
    }
    if (preg_match('#^https?://#i', $relativePath)) {
        return $relativePath;
    }
    return url("storage/" . ltrim(str_replace('\\', '/', $relativePath), '/'));
}
