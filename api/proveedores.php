<?php
/**
 * API REST: Gestión y Sincronización de Proveedores
 * Sistema de Gestión Ivi — Conexión nativa con PostgreSQL (ivi_db)
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 1. Cargar configuración desde .env
$envFile = dirname(__DIR__) . DIRECTORY_SEPARATOR . '.env';
$env = [];
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#')) continue;
        if (str_contains($line, '=')) {
            [$k, $v] = explode('=', $line, 2);
            $env[trim($k)] = trim($v);
        }
    }
}

$dbHost = $env['DB_HOST'] ?? 'localhost';
$dbPort = $env['DB_PORT'] ?? '5432';
$dbName = $env['DB_NAME'] ?? 'ivi_db';
$dbUser = $env['DB_USER'] ?? 'postgres';
$dbPass = $env['DB_PASSWORD'] ?? 'IJVE9800';

/**
 * Función para ejecutar consultas en PostgreSQL (vía PDO si está activo, o vía psql nativo)
 */
function ejecutarConsultaPostgres($sql, $dbHost, $dbPort, $dbName, $dbUser, $dbPass) {
    if (extension_loaded('pdo_pgsql')) {
        try {
            $dsn = "pgsql:host={$dbHost};port={$dbPort};dbname={$dbName}";
            $pdo = new PDO($dsn, $dbUser, $dbPass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
            ]);
            $stmt = $pdo->query($sql);
            return $stmt->fetchAll();
        } catch (Exception $e) {
            // Continúa a fallback si falla
        }
    }

    // Fallback de alta velocidad: cliente oficial psql nativo
    putenv("PGPASSWORD={$dbPass}");
    putenv("PGCLIENTENCODING=UTF8");
    $psqlPath = 'C:\\Program Files\\PostgreSQL\\18\\bin\\psql.exe';
    if (!file_exists($psqlPath)) {
        $psqlPath = 'psql';
    }

    // Consulta con salida JSON nativa de Postgres usando CTE
    $escapedSql = str_replace('"', '\"', $sql);
    $cmd = "\"{$psqlPath}\" -h {$dbHost} -p {$dbPort} -U {$dbUser} -d {$dbName} -t -A -c \"WITH t AS ({$escapedSql}) SELECT json_agg(t) FROM t;\" 2>&1";
    $raw = shell_exec($cmd);

    if ($raw === null || trim($raw) === '' || trim($raw) === 'null') {
        return [];
    }

    $decoded = json_decode(trim($raw), true);
    return is_array($decoded) ? $decoded : [];
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        $sql = "SELECT id_proveedor AS id, nombre_comercial AS razon, contacto, telefono AS tel, email, direccion, cuit, estado FROM proveedores WHERE estado = TRUE ORDER BY id_proveedor ASC";
        $filas = ejecutarConsultaPostgres($sql, $dbHost, $dbPort, $dbName, $dbUser, $dbPass);

        // Formatear filas para que coincidan con la estructura del frontend
        $proveedores = array_map(function($f) {
            return [
                'id' => (int)$f['id'],
                'razon' => $f['razon'] ?? '',
                'contacto' => $f['contacto'] ?? '',
                'tel' => $f['tel'] ?? '',
                'email' => $f['email'] ?? '',
                'cuit' => $f['cuit'] ?? '',
                'direccion' => $f['direccion'] ?? ''
            ];
        }, $filas);

        echo json_encode([
            'ok' => true,
            'total' => count($proveedores),
            'proveedores' => $proveedores
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) {
            $input = $_POST;
        }

        $id = isset($input['id']) && $input['id'] !== '' ? intval($input['id']) : null;
        $razon = trim($input['razon'] ?? ($input['nombre_comercial'] ?? ''));
        $contacto = trim($input['contacto'] ?? '');
        $tel = trim($input['tel'] ?? ($input['telefono'] ?? ''));
        $email = trim($input['email'] ?? '');
        $cuit = trim($input['cuit'] ?? '');
        $direccion = trim($input['direccion'] ?? '');

        if ($razon === '') {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'La razón social o nombre comercial es obligatorio.'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $razonEsc = addslashes($razon);
        $contactoEsc = addslashes($contacto);
        $telEsc = addslashes($tel);
        $emailEsc = addslashes($email);
        $cuitEsc = addslashes($cuit);
        $direccionEsc = addslashes($direccion);

        if ($id && $id > 0) {
            // Actualizar proveedor existente
            $sql = "UPDATE proveedores SET 
                        nombre_comercial = '{$razonEsc}',
                        contacto = '{$contactoEsc}',
                        telefono = '{$telEsc}',
                        email = '{$emailEsc}',
                        cuit = '{$cuitEsc}',
                        direccion = '{$direccionEsc}'
                    WHERE id_proveedor = {$id}
                    RETURNING id_proveedor AS id, nombre_comercial AS razon, contacto, telefono AS tel, email, direccion, cuit";
            $res = ejecutarConsultaPostgres($sql, $dbHost, $dbPort, $dbName, $dbUser, $dbPass);
            $provRet = $res[0] ?? [
                'id' => $id,
                'razon' => $razon,
                'contacto' => $contacto,
                'tel' => $tel,
                'email' => $email
            ];
            echo json_encode([
                'ok' => true,
                'mensaje' => "Proveedor '{$razon}' actualizado en base de datos PostgreSQL.",
                'proveedor' => $provRet
            ], JSON_UNESCAPED_UNICODE);
            exit;
        } else {
            // Insertar nuevo proveedor
            $sql = "INSERT INTO proveedores (nombre_comercial, contacto, telefono, email, cuit, direccion, estado) 
                    VALUES ('{$razonEsc}', '{$contactoEsc}', '{$telEsc}', '{$emailEsc}', '{$cuitEsc}', '{$direccionEsc}', TRUE)
                    RETURNING id_proveedor AS id, nombre_comercial AS razon, contacto, telefono AS tel, email, direccion, cuit";
            $res = ejecutarConsultaPostgres($sql, $dbHost, $dbPort, $dbName, $dbUser, $dbPass);
            $nuevoId = isset($res[0]['id']) ? (int)$res[0]['id'] : null;
            $provRet = $res[0] ?? [
                'id' => $nuevoId,
                'razon' => $razon,
                'contacto' => $contacto,
                'tel' => $tel,
                'email' => $email
            ];
            echo json_encode([
                'ok' => true,
                'mensaje' => "Proveedor '{$razon}' registrado en base de datos PostgreSQL.",
                'proveedor' => $provRet
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }
    }

    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Método no permitido'], JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
