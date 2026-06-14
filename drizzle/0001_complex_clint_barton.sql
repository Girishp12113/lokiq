CREATE TABLE `bookings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingId` varchar(20) NOT NULL,
	`customerId` int NOT NULL,
	`serviceId` int NOT NULL,
	`providerId` int,
	`status` enum('pending','assigned','in_progress','completed','cancelled') NOT NULL DEFAULT 'pending',
	`address` text NOT NULL,
	`lat` decimal(10,7),
	`lng` decimal(10,7),
	`issueDescription` text NOT NULL,
	`preferredTime` varchar(100),
	`aiClassification` varchar(50),
	`adminNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`completedAt` timestamp,
	CONSTRAINT `bookings_id` PRIMARY KEY(`id`),
	CONSTRAINT `bookings_bookingId_unique` UNIQUE(`bookingId`)
);
--> statement-breakpoint
CREATE TABLE `provider_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`providerId` int NOT NULL,
	`documentType` varchar(50) NOT NULL,
	`fileUrl` text,
	`verified` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `provider_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `providers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`serviceId` int NOT NULL,
	`experienceYears` int DEFAULT 0,
	`aadhaarVerified` int DEFAULT 0,
	`isVerified` int DEFAULT 0,
	`rating` decimal(3,2) DEFAULT '0.00',
	`totalJobs` int DEFAULT 0,
	`completedJobs` int DEFAULT 0,
	`availability` enum('available','busy','offline') DEFAULT 'available',
	`bio` text,
	`city` varchar(100) DEFAULT 'Hyderabad',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `providers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingId` int NOT NULL,
	`customerId` int NOT NULL,
	`providerId` int NOT NULL,
	`rating` int NOT NULL,
	`reviewText` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `services` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`icon` varchar(50),
	`startingPrice` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `services_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','provider') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `address` text;--> statement-breakpoint
ALTER TABLE `users` ADD `city` varchar(100) DEFAULT 'Hyderabad';