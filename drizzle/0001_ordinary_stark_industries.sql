CREATE TABLE `upload_consents` (
	`photo_id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`policy_version` text NOT NULL,
	`confirmed_at` integer NOT NULL,
	FOREIGN KEY (`photo_id`) REFERENCES `photos`(`id`) ON UPDATE no action ON DELETE cascade
);
