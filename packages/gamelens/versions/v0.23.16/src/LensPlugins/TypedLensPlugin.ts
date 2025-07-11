import { BaseLensPlugin } from '../../../../src/BaseLensPlugin.ts';
import { GameRunner } from '../../game/src/core/GameRunner.ts';
import { TurnSchema } from '../../game/src/core/Schemas.ts';
import * as z from 'zod';

export class TypedLensPlugin extends BaseLensPlugin<GameRunner, Turn> {}

export type Turn = z.infer<typeof TurnSchema>;
