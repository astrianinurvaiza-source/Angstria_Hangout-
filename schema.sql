-- ====================================================================
-- Angstria Hangout - MySQL Database Export Script for phpMyAdmin
-- Desired Location: Pangkal Pinang Hangout Recommendations
-- ====================================================================

CREATE DATABASE IF NOT EXISTS `angstria_hangout` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `angstria_hangout`;

-- 1. Table Structure for `places`
DROP TABLE IF EXISTS `comments`;
DROP TABLE IF EXISTS `admin`;
DROP TABLE IF EXISTS `places`;

CREATE TABLE `places` (
  `id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `location` VARCHAR(255) NOT NULL,
  `lat` DECIMAL(10, 8) DEFAULT NULL,
  `lng` DECIMAL(11, 8) DEFAULT NULL,
  `openingHours` VARCHAR(100) DEFAULT NULL,
  `facilities` TEXT DEFAULT NULL, -- Stored as comma-separated or JSON string
  `priceRange` VARCHAR(10) DEFAULT NULL,
  `featured` TINYINT(1) DEFAULT 0,
  `tags` TEXT DEFAULT NULL, -- Stored as comma-separated or JSON string
  `image` LONGTEXT DEFAULT NULL,
  `images` LONGTEXT DEFAULT NULL, -- Stored as JSON array string
  `socials` LONGTEXT DEFAULT NULL, -- Stored as JSON object string
  `views` INT DEFAULT 0,
  `rating` DECIMAL(3, 1) DEFAULT 0.0,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Table Structure for `comments`
CREATE TABLE `comments` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `placeId` VARCHAR(50) NOT NULL,
  `username` VARCHAR(100) NOT NULL,
  `comment` TEXT NOT NULL,
  `rating` INT NOT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_comments_places` FOREIGN KEY (`placeId`) REFERENCES `places` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Table Structure for `admin`
CREATE TABLE `admin` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `username` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seeding Data for `admin`
INSERT INTO `admin` (`id`, `username`, `password`, `name`) VALUES
(1, 'admin', 'admin123', 'Administrator');

-- 4. Seeding Data for `places` (None, left clean for user database additions)

-- 5. Seeding Data for `comments` (None)

-- 6. Table Structure for `owners`
CREATE TABLE IF NOT EXISTS `owners` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `cafeId` VARCHAR(50) DEFAULT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Table Structure for `reservations`
CREATE TABLE IF NOT EXISTS `reservations` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `placeId` VARCHAR(50) NOT NULL,
  `customerName` VARCHAR(100) NOT NULL,
  `customerPhone` VARCHAR(50) NOT NULL,
  `bookingDate` VARCHAR(50) NOT NULL,
  `bookingTime` VARCHAR(50) NOT NULL,
  `guests` INT NOT NULL,
  `notes` TEXT DEFAULT NULL,
  `status` VARCHAR(20) DEFAULT 'pending',
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Table Structure for `payments`
CREATE TABLE IF NOT EXISTS `payments` (
  `id` VARCHAR(50) NOT NULL,
  `ownerEmail` VARCHAR(100) NOT NULL,
  `cafeId` VARCHAR(50) DEFAULT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `type` VARCHAR(50) NOT NULL, -- 'registration' or 'promotion'
  `method` VARCHAR(50) NOT NULL,
  `status` VARCHAR(20) DEFAULT 'success',
  `proof` LONGTEXT DEFAULT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Table Structure for `users`
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seeding Data for `users`
INSERT INTO `users` (`id`, `name`, `email`, `password`) VALUES
(1, 'Astriani', 'fitri@gmail.com', 'user123'),
(2, 'Agus Wisnu', 'agus@gmail.com', 'user123')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

