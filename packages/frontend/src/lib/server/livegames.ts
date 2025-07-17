import { ServerStartGameMessageSchema } from 'openfront/game/src/core/Schemas';
import type { LiveGameStatus } from '$lib/LiveGameStatus';
import { getRedis } from '$lib/server/redis';

export async function getListOfLiveGames() {
	const s = Date.now();
	try {
		const keys = await scanAllKeys('lurker:games:*:info');

		const pipeline = getRedis().pipeline();
		for (const key of keys) {
			pipeline.get(key);
		}

		for (const key of keys) {
			pipeline.llen(key.split(':').slice(0, -1).join(':') + ':turns');
		}

		const results = await pipeline.exec();

		const infos = results?.slice(0, keys.length) ?? [];
		const lengths = results?.slice(keys.length) ?? [];

		const games: LiveGameStatus[] = [];
		for (let i = 0; i < keys.length; i++) {
			const infoResult = infos[i];
			const turnsLengthResult = lengths[i];

			if (infoResult[0] || turnsLengthResult[0]) continue;

			const startGameEvent = ServerStartGameMessageSchema.safeParse(
				JSON.parse(infoResult[1] as string)
			);
			if (!startGameEvent.success) continue;

			const players = startGameEvent.data.gameStartInfo.players
				.map((p) => p.username)
				.filter((p) => p !== 'MIRVWorld').length;

			if (players < 2) continue;

			games.push({
				id: startGameEvent.data.gameStartInfo.gameID,
				map: startGameEvent.data.gameStartInfo.config.gameMap,
				mode: startGameEvent.data.gameStartInfo.config.gameMode,
				maxPlayers: startGameEvent.data.gameStartInfo.config.maxPlayers,
				players: startGameEvent.data.gameStartInfo.players.length,
				startedAt: Date.now() - (turnsLengthResult[1] as number) * 100
			});
		}

		return games;
	} catch (err) {
		console.error('Error updating live games list:', err);
		return [];
	} finally {
		console.log(`Updated live games list in ${Date.now() - s}ms`);
	}
}

async function scanAllKeys(pattern = '*', count = 1000) {
	try {
		const result = new Set<string>();
		let cursor = '0';
		do {
			const [nextCursor, keys] = await getRedis().scan(cursor, 'MATCH', pattern, 'COUNT', count);
			cursor = nextCursor;
			for (const key of keys) {
				result.add(key);
			}
		} while (cursor !== '0');

		return Array.from(result.values());
	} catch (err) {
		console.error('Error updating live games list:', err);
		return [];
	}
}
