<?php
// c:/xampp/htdocs/hylo-gift/api/admin_change_password.php
session_start();
require_once 'db.php';
header('Content-Type: application/json');

if (!isset($_SESSION['admin_logged_in']) || !$_SESSION['admin_logged_in']) {
    echo json_encode(['success' => false, 'error' => 'Not authenticated']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$current_password = $input['current_password'] ?? '';
$new_password = $input['new_password'] ?? '';
$username = $_SESSION['admin_username'];

$stmt = $conn->prepare('SELECT * FROM admin_users WHERE username = ? LIMIT 1');
$stmt->bind_param('s', $username);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();

if (!$user || !password_verify($current_password, $user['password_hash'])) {
    echo json_encode(['success' => false, 'error' => 'Current password is incorrect']);
    exit;
}

if (strlen($new_password) < 6) {
    echo json_encode(['success' => false, 'error' => 'New password must be at least 6 characters']);
    exit;
}

$new_hash = password_hash($new_password, PASSWORD_DEFAULT);
$update = $conn->prepare('UPDATE admin_users SET password_hash = ? WHERE username = ?');
$update->bind_param('ss', $new_hash, $username);
$update->execute();
echo json_encode(['success' => true]);
