<?php
// categories.php - RESTful API for categories
session_start();
header('Content-Type: application/json');
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

// Only allow POST, PUT, DELETE if admin is logged in
if (in_array($method, ['POST', 'PUT', 'DELETE'])) {
    if (!isset($_SESSION['admin_logged_in']) || !$_SESSION['admin_logged_in']) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        exit;
    }
}

switch ($method) {
    case 'GET':
        $sql = "SELECT * FROM categories ORDER BY name";
        $result = $conn->query($sql);
        $categories = [];
        while ($row = $result->fetch_assoc()) {
            $categories[] = $row;
        }
        echo json_encode(['data' => $categories]);
        break;
    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        $stmt = $conn->prepare("INSERT INTO categories (name) VALUES (?)");
        $stmt->bind_param('s', $input['name']);
        $success = $stmt->execute();
        echo json_encode(['success' => $success, 'id' => $conn->insert_id]);
        break;
    case 'PUT':
        $input = json_decode(file_get_contents('php://input'), true);
        $stmt = $conn->prepare("UPDATE categories SET name=? WHERE id=?");
        $stmt->bind_param('si', $input['name'], $input['id']);
        $success = $stmt->execute();
        echo json_encode(['success' => $success]);
        break;
    case 'DELETE':
        $input = json_decode(file_get_contents('php://input'), true);
        $id = $input['id'];
        $stmt = $conn->prepare("DELETE FROM categories WHERE id=?");
        $stmt->bind_param('i', $id);
        $success = $stmt->execute();
        echo json_encode(['success' => $success]);
        break;
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method Not Allowed']);
}
?>
