CREATE DATABASE IF NOT EXISTS hyloapp;
USE hyloapp;

CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE brands (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    logo LONGTEXT -- base64 image string
);

CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_name VARCHAR(255) NOT NULL,
    product_price FLOAT NOT NULL,
    product_discount FLOAT DEFAULT 0,
    product_moq INT DEFAULT 1,
    category_id INT NOT NULL,
    brand_id INT NOT NULL,
    product_description TEXT,
    product_image LONGTEXT, -- base64 image string
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
);

CREATE TABLE admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Default Admin User Password is 'admin123'
INSERT INTO admin_users (username, password_hash)
VALUES ('admin', PASSWORD('$2y$10$LfcDcLZCcrRPHvX92y5FO.oViDtslZI//Nt3.4Z6LqKRcKvJ1ZGie'));