CREATE TABLE `match_players` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`match_id` int unsigned NOT NULL,
	`name` varchar(255) NOT NULL,
	`client_id` char(8) NOT NULL,
	CONSTRAINT `match_players_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `matches` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`game_id` char(8) NOT NULL,
	`map` varchar(255) NOT NULL,
	`mode` enum('team','ffa') NOT NULL,
	`version` char(40) NOT NULL,
	`players` tinyint unsigned NOT NULL,
	`max_players` tinyint unsigned NOT NULL,
	`winner` varchar(255),
	`started_at` timestamp NOT NULL,
	`finished_at` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `matches_id` PRIMARY KEY(`id`),
	CONSTRAINT `matches_game_id_unique` UNIQUE(`game_id`)
);
--> statement-breakpoint
ALTER TABLE `match_players` ADD CONSTRAINT `match_players_match_id_matches_id_fk` FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON DELETE cascade ON UPDATE cascade;