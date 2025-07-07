<?php
// Enable error reporting for debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// brands.php - RESTful API for brands (base64 logo)
header('Content-Type: application/json');
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

function send_json_error($message, $code = 500) {
    http_response_code($code);
    echo json_encode(['success' => false, 'error' => $message]);
    exit;
}

try {
    switch ($method) {
        case 'GET':
            $sql = "SELECT * FROM brands ORDER BY name";
            $result = $conn->query($sql);
            if (!$result) send_json_error($conn->error);
            $brands = [];
            while ($row = $result->fetch_assoc()) {
                $brands[] = $row;
            }
            echo json_encode(['data' => $brands]);
            break;
        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);
            if (!isset($input['name']) || !isset($input['logo'])) {
                send_json_error('Missing required fields: name or logo', 400);
            }
            $stmt = $conn->prepare("INSERT INTO brands (name, logo) VALUES (?, ?)");
            if (!$stmt) send_json_error($conn->error);
            $stmt->bind_param('ss', $input['name'], $input['logo']);
            $success = $stmt->execute();
            if (!$success) send_json_error($stmt->error);
            echo json_encode(['success' => $success, 'id' => $conn->insert_id]);
            break;
        case 'PUT':
            $input = json_decode(file_get_contents('php://input'), true);
            if (!isset($input['id']) || !isset($input['name']) || !isset($input['logo'])) {
                send_json_error('Missing required fields: id, name, or logo', 400);
            }
            $stmt = $conn->prepare("UPDATE brands SET name=?, logo=? WHERE id=?");
            if (!$stmt) send_json_error($conn->error);
            $stmt->bind_param('ssi', $input['name'], $input['logo'], $input['id']);
            $success = $stmt->execute();
            if (!$success) send_json_error($stmt->error);
            echo json_encode(['success' => $success]);
            break;
        case 'DELETE':
            $input = json_decode(file_get_contents('php://input'), true);
            if (!isset($input['id'])) {
                send_json_error('Missing required field: id', 400);
            }
            $id = $input['id'];
            $stmt = $conn->prepare("DELETE FROM brands WHERE id=?");
            if (!$stmt) send_json_error($conn->error);
            $stmt->bind_param('i', $id);
            $success = $stmt->execute();
            if (!$success) send_json_error($stmt->error);
            echo json_encode(['success' => $success]);
            break;
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method Not Allowed']);
    }
} catch (Throwable $e) {
    send_json_error($e->getMessage());
}
?>
