<?php
/**
 * Kšírovka SPA – záložní vstupní bod pro hostingy s prioritou index.php
 * (WebSupport / webhosting.cz)
 *
 * Statické soubory (CSS, JS v /assets/) obslouží Apache přímo.
 * Ostatní URL vrátí index.html pro React Router.
 */
declare(strict_types=1);

$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$file = __DIR__ . $uri;

if ($uri !== '/' && is_file($file) && !is_dir($file)) {
    return false;
}

$index = __DIR__ . '/index.html';
if (!is_file($index)) {
    http_response_code(500);
    echo 'Chyba: chybí soubor index.html';
    exit;
}

header('Content-Type: text/html; charset=utf-8');
header('X-Powered-By: Ksirovka-SPA');
readfile($index);
