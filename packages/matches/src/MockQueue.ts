import z from 'zod/v4';
import { MinioPutEventSchema } from './Schema/MinioPutEvent.ts';

export class MockQueue {
  public constructor(private readonly event: z.infer<typeof MinioPutEventSchema>) {}

  public async next() {
    return this.event;
  }
}
