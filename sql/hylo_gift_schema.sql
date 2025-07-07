-- hylo_gift_schema.sql
-- MySQL schema for HyLoApp with images as base64 (LONGTEXT)

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
