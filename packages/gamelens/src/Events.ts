import z from 'zod/v4';

export const GamelensTurnEventSchema = z.object({
  type: z.string(),
  turn: z.number(),
  player: z.number(),
});

export const GamelensTerraAttackEventSchema = GamelensTurnEventSchema.extend({
  type: z.literal('attack.terra'),
  troops: z.bigint(),
});

export const GamelensPlayerAttackEventSchema = GamelensTerraAttackEventSchema.extend({
  type: z.literal('attack.player'),
  target: z.number(),
});

export const GamelensUnitBuildEventSchema = GamelensTurnEventSchema.extend({
  type: z.literal('unit.build'),
  unit: z.string(),
});

export const GamelensUnitCapturedEventSchema = GamelensTurnEventSchema.extend({
  type: z.literal('unit.captured'),
  unit: z.string(),
  from: z.number(),
});

export const GamelensUnitDestroyedEventSchema = GamelensUnitCapturedEventSchema.extend({
  type: z.literal('unit.destroyed'),
});

export const GamelensTradeDestroyedEventSchema = GamelensTurnEventSchema.extend({
  type: z.literal('trade.destroyed'),
  owner: z.number(),
});

export const GamelensTradeArrivedEventSchema = GamelensTurnEventSchema.extend({
  type: z.literal('trade.arrived'),
  owner: z.number(),
  gold: z.bigint(),
});

export const GamelensCapturedTradeArrivedEventSchema = GamelensTurnEventSchema.extend({
  type: z.literal('trade.captured'),
  owner: z.number(),
  gold: z.bigint(),
});

export const GamelensKillEventSchema = GamelensTurnEventSchema.extend({
  type: z.literal('kill'),
  target: z.number(),
  gold: z.bigint(),
});

export const GamelensDeathEventSchema = GamelensTurnEventSchema.extend({
  type: z.literal('death'),
});

export const GamelensBombLandedEventSchema = GamelensTurnEventSchema.extend({
  type: z.literal('bomb.landed'),
  target: z.number(),
  nukeType: z.string(),
});

export const GamelensSpawnEventSchema = GamelensTurnEventSchema.extend({
  type: z.literal('spawn'),
  x: z.number(),
  y: z.number(),
});

export const GamelensTilesEventSchema = z.object({
  type: z.literal('tiles'),
  turn: z.number(),
  players: z.record(z.number(), z.number()),
});

export const GamelensGoldFromWorkersEventSchema = z.object({
  type: z.literal('gold.workers'),
  turn: z.number(),
  players: z.record(z.number(), z.bigint()),
});

export const GamelensPlayersMappingEventSchema = z.object({
  type: z.literal('players.mapping'),
  turn: z.number(),
  players: z.record(z.string(), z.object({ id: z.number(), name: z.string(), type: z.string() })),
});

export const GamelensAttackEventSchema = z.discriminatedUnion('type', [
  GamelensTerraAttackEventSchema,
  GamelensPlayerAttackEventSchema,
]);

export const GamelensEventSchema = z.discriminatedUnion('type', [
  GamelensAttackEventSchema,
  GamelensUnitBuildEventSchema,
  GamelensUnitCapturedEventSchema,
  GamelensUnitDestroyedEventSchema,
  GamelensTradeDestroyedEventSchema,
  GamelensKillEventSchema,
  GamelensBombLandedEventSchema,
  GamelensDeathEventSchema,
  GamelensSpawnEventSchema,
  GamelensTradeArrivedEventSchema,
  GamelensCapturedTradeArrivedEventSchema,
  GamelensTilesEventSchema,
  GamelensGoldFromWorkersEventSchema,
  GamelensPlayersMappingEventSchema,
]);

export type GamelensEvent = z.infer<typeof GamelensEventSchema>;
export type GamelensAttackEvent = z.infer<typeof GamelensAttackEventSchema>;
