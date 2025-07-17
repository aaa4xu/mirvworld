import type { PageServerLoad } from './$types';
import { getListOfLiveGames } from '$lib/server/livegames';

export const load: PageServerLoad = async () => {
	return { games: await getListOfLiveGames() };
};
