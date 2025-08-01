CREATE TABLE `openfront_player_matches` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`player_id` int unsigned NOT NULL,
	`match_id` char(8) NOT NULL,
	`client_id` char(8) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `openfront_player_matches_id` PRIMARY KEY(`id`),
	CONSTRAINT `openfront_player_matches_match_id_client_id_unique` UNIQUE(`match_id`,`client_id`)
);
--> statement-breakpoint
CREATE TABLE `openfront_players` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`client_id` char(8) NOT NULL,
	`registered_at` timestamp NOT NULL,
	`updated_at` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `openfront_players_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `openfront_player_matches` ADD CONSTRAINT `openfront_player_matches_player_id_openfront_players_id_fk` FOREIGN KEY (`player_id`) REFERENCES `openfront_players`(`id`) ON DELETE cascade ON UPDATE cascade;