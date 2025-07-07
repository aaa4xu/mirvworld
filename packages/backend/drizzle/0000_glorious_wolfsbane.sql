CREATE TABLE `matches` (
	`id` text PRIMARY KEY NOT NULL,
	`startedAt` integer NOT NULL,
	`lastFetchAt` integer,
	`importedAt` integer
);
