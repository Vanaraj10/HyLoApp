<?php
// products.php - RESTful API for products (base64 images)
session_start();
header('Content-Type: application/json');
require_once 'db.php'; // Contains DB connection $conn

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
        // Fetch all products (with category/brand names)
        $sql = "SELECT p.*, c.name AS category_name, b.name AS brand_name, b.logo AS brand_logo FROM products p
                LEFT JOIN categories c ON p.category_id = c.id
                LEFT JOIN brands b ON p.brand_id = b.id
                ORDER BY p.created_at DESC";
        $result = $conn->query($sql);
        $products = [];
        while ($row = $result->fetch_assoc()) {
            $products[] = $row;
        }
        echo json_encode(['data' => $products]);
        break;
    case 'POST':
        // Add new product
        $input = json_decode(file_get_contents('php://input'), true);
        $stmt = $conn->prepare("INSERT INTO products (product_name, price, mrp, product_discount, product_moq, category_id, brand_id, product_description, product_image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param('sddidiiss',
            $input['product_name'],
            $input['price'],
            $input['mrp'],
            $input['product_discount'],
            $input['product_moq'],
            $input['category_id'],
            $input['brand_id'],
            $input['product_description'],
            $input['product_image']
        );
        $success = $stmt->execute();
        echo json_encode(['success' => $success, 'id' => $conn->insert_id]);
        break;
    case 'PUT':
        // Update product
        $input = json_decode(file_get_contents('php://input'), true);
        $stmt = $conn->prepare("UPDATE products SET product_name=?, price=?, mrp=?, product_discount=?, product_moq=?, category_id=?, brand_id=?, product_description=?, product_image=? WHERE id=?");
        $stmt->bind_param('sddidiissi',
            $input['product_name'],
            $input['price'],
            $input['mrp'],
            $input['product_discount'],
            $input['product_moq'],
            $input['category_id'],
            $input['brand_id'],
            $input['product_description'],
            $input['product_image'],
            $input['id']
        );
        $success = $stmt->execute();
        echo json_encode(['success' => $success]);
        break;
    case 'DELETE':
        // Delete product
        $input = json_decode(file_get_contents('php://input'), true);
        $id = $input['id'];
        $stmt = $conn->prepare("DELETE FROM products WHERE id=?");
        $stmt->bind_param('i', $id);
        $success = $stmt->execute();
        echo json_encode(['success' => $success]);
        break;
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method Not Allowed']);
}
?>
