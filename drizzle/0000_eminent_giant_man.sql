CREATE TABLE `editors` (
	`user_id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`display_name` text NOT NULL,
	`role` text NOT NULL,
	`created_at` integer NOT NULL,
	CONSTRAINT "editors_valid_role" CHECK("editors"."role" IN ('owner', 'editor'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_editors_single_owner` ON `editors` (`role`) WHERE "editors"."role" = 'owner';--> statement-breakpoint
CREATE TABLE `gallery_meta` (
	`id` integer PRIMARY KEY NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	CONSTRAINT "gallery_meta_singleton" CHECK("gallery_meta"."id" = 1)
);
--> statement-breakpoint
CREATE TABLE `gallery_settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`subtitle` text NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "gallery_settings_singleton" CHECK("gallery_settings"."id" = 1)
);
--> statement-breakpoint
CREATE TABLE `photo_tags` (
	`photo_id` text NOT NULL,
	`tag` text NOT NULL,
	PRIMARY KEY(`photo_id`, `tag`),
	FOREIGN KEY (`photo_id`) REFERENCES `photos`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_photo_tags_tag` ON `photo_tags` (`tag`,`photo_id`);--> statement-breakpoint
CREATE TABLE `photos` (
	`id` text PRIMARY KEY NOT NULL,
	`object_key` text NOT NULL,
	`filename` text NOT NULL,
	`content_type` text NOT NULL,
	`byte_size` integer NOT NULL,
	`caption` text DEFAULT '' NOT NULL,
	`added_at` integer NOT NULL,
	`added_by` text NOT NULL,
	`position` integer NOT NULL,
	`deleted_at` integer,
	`version` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `photos_object_key_unique` ON `photos` (`object_key`);--> statement-breakpoint
CREATE INDEX `idx_photos_active_position` ON `photos` (`position`) WHERE "photos"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX `idx_photos_deleted_at` ON `photos` (`deleted_at`);--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`window_start` integer NOT NULL,
	`count` integer NOT NULL
);
