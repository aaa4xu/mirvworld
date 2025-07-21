import {
  GameEndInfoSchema as GameGameEndInfoSchema,
  PlayerRecordSchema as GamePlayerRecordSchema,
  GameRecordSchema as GameGameRecordSchema,
} from '../game/src/core/Schemas.ts';
import z from 'zod/v4';

export const PlayerRecordSchema = GamePlayerRecordSchema.omit({
  persistentID: true,
});

export const GameEndInfoSchema = GameGameEndInfoSchema.extend({
  players: PlayerRecordSchema.array(),
});

export const GameRecordSchema = GameGameRecordSchema.extend({
  info: GameEndInfoSchema,
});

export const GitCommitSchema = z.string().regex(/^[0-9a-fA-F]{40}$/);

export const GenericReplaySchema = z.looseObject({
  gitCommit: GitCommitSchema,
});
