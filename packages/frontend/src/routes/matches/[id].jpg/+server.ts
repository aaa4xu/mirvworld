import { trpc } from '$lib/server/trpc';
import { error } from '@sveltejs/kit';
import { MatchResultImageGenerator } from '$lib/server/MatchResultImageGenerator';

const generator = new MatchResultImageGenerator('');

export async function GET({ params }) {
  const match = await trpc.matches.getByGameId.query(params.id);

  if (!match) {
    return error(404, {
      message: 'Match not found',
    });
  }

  const image = await generator.create(match.gameId, match.mode, match.map, 'unknown');

  return new Response(image, {
    headers: {
      'Content-Type': 'image/jpeg',
    },
  });
}
