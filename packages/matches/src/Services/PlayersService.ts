import type { PlayersRepository } from '../mongodb/Repositories/PlayersRepository.ts';
import { OpenFrontPublicAPI } from '@mirvworld/openfront-api';
import type { MatchesService } from './MatchesService.ts';
import type { MatchPlayerInfo } from '../mongodb/Models/MatchPlayer.ts';

export class PlayersService {
  public constructor(
    private readonly repository: PlayersRepository,
    private readonly api: OpenFrontPublicAPI,
    private readonly matches: MatchesService,
  ) {}

  public async updateByPublicId(publicId: string) {
    const data = await this.api.player(publicId);

    const avatar =
      data.user?.avatar && data.user?.id
        ? `https://cdn.discordapp.com/avatars/${data.user.id}/${data.user.avatar}.webp`
        : null;

    // Save player
    const updateExistingMatches = await this.repository.upsert({
      publicId: publicId,
      name: data.user?.global_name ?? data.user?.username ?? publicId,
      avatar,
      registeredAt: new Date(data.createdAt),
    });

    const player = await this.repository.readByPublicId(publicId);
    if (!player) {
      throw new Error(`Player ${publicId} not found`);
    }

    const info: MatchPlayerInfo = {
      id: player._id,
      name: player.name,
      avatar: player.avatar,
    };

    // Update player info for old matches
    if (updateExistingMatches) {
      await this.matches.updateMatchPlayerInfo(player._id, info);
    }

    await Promise.all(data.games.map((game) => this.matches.setMatchPlayerInfo(game.gameId, game.clientId, info)));
  }

  public updateBatch() {
    return this.repository.updateBatch();
  }
}
