<?php
/**
 * Kontaktní formulář pro WebSupport / sdílený hosting.
 * POST JSON → e-mail přes mail().
 *
 * Očekávané JSON pole: firstName, lastName, email, phone?, message
 */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

$raw = file_get_contents('php://input') ?: '';
$data = json_decode($raw, true);

if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid JSON']);
    exit;
}

$firstName = trim((string) ($data['firstName'] ?? ''));
$lastName = trim((string) ($data['lastName'] ?? ''));
$email = trim((string) ($data['email'] ?? ''));
$phone = trim((string) ($data['phone'] ?? ''));
$message = trim((string) ($data['message'] ?? ''));

if ($firstName === '' || $lastName === '' || $email === '' || mb_strlen($message) < 10) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'Validation failed']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'Invalid email']);
    exit;
}

// Honeypot – bots often fill hidden fields
if (!empty($data['website'])) {
    echo json_encode(['ok' => true]);
    exit;
}

$to = getenv('KSIROVKA_CONTACT_TO') ?: 'info@ksirovka.cz';
$subject = 'Kontakt z webu – ' . $firstName . ' ' . $lastName;

$bodyLines = [
    'Nová zpráva z kontaktního formuláře na webu Kšírovka',
    '',
    'Jméno: ' . $firstName . ' ' . $lastName,
    'E-mail: ' . $email,
    'Telefon: ' . ($phone !== '' ? $phone : '—'),
    '',
    'Zpráva:',
    $message,
    '',
    '---',
    'IP: ' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'),
    'Čas: ' . date('c'),
];
$body = implode("\n", $bodyLines);

$encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
$headers = [
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'From: Ksirovka web <noreply@' . ($_SERVER['HTTP_HOST'] ?? 'ksirovka.cz') . '>',
    'Reply-To: ' . $email,
    'X-Mailer: Ksirovka-Contact/1.0',
];

$sent = @mail($to, $encodedSubject, $body, implode("\r\n", $headers));

if (!$sent) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Mail send failed']);
    exit;
}

echo json_encode(['ok' => true]);
