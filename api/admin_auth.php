<?php
// c:/xampp/htdocs/hylo-gift/api/admin_auth.php
session_start();
require_once 'db.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Login
    $input = json_decode(file_get_contents('php://input'), true);
    $username = $input['username'] ?? '';
    $password = $input['password'] ?? '';
    $stmt = $conn->prepare('SELECT * FROM admin_users WHERE username = ? LIMIT 1');
    $stmt->bind_param('s', $username);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();
    if ($user && password_verify($password, $user['password_hash'])) {
        $_SESSION['admin_logged_in'] = true;
        $_SESSION['admin_username'] = $username;
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Invalid credentials']);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    // Logout
    session_destroy();
    echo json_encode(['success' => true]);
    exit;
}

// Check login status
if (isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in']) {
    echo json_encode(['logged_in' => true, 'username' => $_SESSION['admin_username']]);
} else {
    echo json_encode(['logged_in' => false]);
}
