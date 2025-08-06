import type { PlayersRepository } from '../mongodb/Repositories/PlayersRepository.ts';
import { OpenFrontPublicAPI } from '@mirvworld/openfront-api';
import type { MatchesService } from './MatchesService.ts';

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

    // Update player info for old matches
    if (updateExistingMatches) {
      await this.matches.updateMatchPlayerInfo(player._id, {
        id: player._id,
        name: player.name,
        avatar: player.avatar,
      });
    }
  }

  public updateBatch() {
    return this.repository.updateBatch();
  }
}
