<?php
/**
 * API REST: Registro y Consulta de Contactos de WhatsApp
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
    $psqlPath = 'C:\\Program Files\\PostgreSQL\\18\\bin\\psql.exe';
    if (!file_exists($psqlPath)) {
        $psqlPath = 'psql';
    }

    // Consulta con salida JSON nativa de Postgres usando CTE (compatible con SELECT e INSERT RETURNING)
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
        $clienteId = isset($_GET['cliente_id']) ? intval($_GET['cliente_id']) : null;
        $tipo = isset($_GET['tipo']) ? trim($_GET['tipo']) : null;

        $where = [];
        if ($clienteId) $where[] = "cliente_id = {$clienteId}";
        if ($tipo) $where[] = "tipo = '" . addslashes($tipo) . "'";

        $whereClause = count($where) > 0 ? "WHERE " . implode(' AND ', $where) : "";
        $sql = "SELECT id_contacto_wa, cliente_id, tipo, fecha_contacto FROM contactos_whatsapp {$whereClause} ORDER BY fecha_contacto DESC LIMIT 100";

        $filas = ejecutarConsultaPostgres($sql, $dbHost, $dbPort, $dbName, $dbUser, $dbPass);
        echo json_encode([
            'ok' => true,
            'total' => count($filas),
            'contactos' => $filas
        ]);
        exit;
    }

    if ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) {
            $input = $_POST;
        }

        $clienteId = isset($input['cliente_id']) ? intval($input['cliente_id']) : 0;
        $tipo = isset($input['tipo']) ? trim($input['tipo']) : '';

        // Validaciones estrictas
        $tiposValidos = ['oferta_cumple', 'saludo_cumple', 'habitual'];
        if (!in_array($tipo, $tiposValidos, true)) {
            http_response_code(400);
            echo json_encode([
                'ok' => false,
                'error' => "Tipo de contacto inválido. Valores permitidos: " . implode(', ', $tiposValidos)
            ]);
            exit;
        }

        if ($clienteId <= 0) {
            http_response_code(400);
            echo json_encode([
                'ok' => false,
                'error' => "Se requiere un 'cliente_id' numérico válido."
            ]);
            exit;
        }

        // Reversión de contacto si se solicita
        if (isset($input['accion']) && $input['accion'] === 'revertir') {
            $sqlDelete = "DELETE FROM contactos_whatsapp WHERE id_contacto_wa IN (SELECT id_contacto_wa FROM contactos_whatsapp WHERE cliente_id = {$clienteId} AND tipo = '{$tipo}' ORDER BY fecha_contacto DESC LIMIT 1)";
            ejecutarConsultaPostgres($sqlDelete, $dbHost, $dbPort, $dbName, $dbUser, $dbPass);
            echo json_encode([
                'ok' => true,
                'mensaje' => "Contacto revertido exitosamente de la base de datos."
            ]);
            exit;
        }

        // Insertar en PostgreSQL
        $sqlInsert = "INSERT INTO contactos_whatsapp (cliente_id, tipo, fecha_contacto) VALUES ({$clienteId}, '{$tipo}', CURRENT_TIMESTAMP) RETURNING id_contacto_wa, cliente_id, tipo, fecha_contacto";
        $resultado = ejecutarConsultaPostgres($sqlInsert, $dbHost, $dbPort, $dbName, $dbUser, $dbPass);

        if (count($resultado) > 0) {
            http_response_code(201);
            echo json_encode([
                'ok' => true,
                'mensaje' => "Contacto de WhatsApp registrado exitosamente en base de datos PostgreSQL.",
                'contacto' => $resultado[0]
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                'ok' => false,
                'error' => "No se pudo insertar el registro en PostgreSQL."
            ]);
        }
        exit;
    }

    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Método no permitido']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => $e->getMessage()
    ]);
}
