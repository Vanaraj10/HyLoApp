<?php
// db.php - Database connection for HyLoApp
$host = 'localhost';
$user = 'root'; // Change if needed
$pass = 'Vanarajisneutrino1!';    // Change if needed
$db   = 'hyloapp'; // Use your database name

$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) {
    http_response_code(500);
    die(json_encode(['error' => 'Database connection failed: ' . $conn->connect_error]));
}
?>