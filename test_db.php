<?php
// test_db.php - Simple script to test MySQL connection
require_once 'db.php';

if ($conn->connect_error) {
    echo "Connection failed: " . $conn->connect_error;
} else {
    echo "Database connection successful!";
}
?>
