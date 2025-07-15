import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { EventEmitter } from 'node:events';
import { GameId } from './OpenFront/GameId.ts';
import { GameSession, SessionState } from './GameSession.ts';
import { ServerMessageSchema } from 'packages/openfront/game/src/core/Schemas.ts';
import z from 'zod';

describe('GameSession', () => {
  let conn: MockGameConnection;
  let server: ReturnType<typeof makeServerMock>;
  let abortCtrl: AbortController;
  let turnSpy = mock();
  let session: GameSession;
  const gameId = new GameId('aaaaaaaa', 20);

  async function createSession() {
    const session = new GameSession(gameId, conn as any, abortCtrl.signal, {
      pingInterval: 5,
    });
    session.on('turn', turnSpy);
    await session.start();
    conn.emit('open');
    return session;
  }

  beforeEach(async () => {
    conn = new MockGameConnection();
    server = makeServerMock();
    abortCtrl = new AbortController();
    turnSpy.mockReset();
    session = await createSession();
  });

  it('aborting the controller disposes session and connection', async () => {
    expect(session.state).toBe(SessionState.Running);
    abortCtrl.abort();
    expect(session.state).toBe(SessionState.Disposed);
    expect(conn.dispose).toHaveBeenCalled();
  });

  it('dispose() stops the ping loop and tears everything down', async () => {
    const sendsBefore = conn.send.mock.calls.length;
    session.dispose();

    expect(session.state).toBe(SessionState.Disposed);
    expect(conn.dispose).toHaveBeenCalled();

    await Bun.sleep(50);
    expect(conn.send).toHaveBeenCalledTimes(sendsBefore);
  });

  it('sends a join message on socket open and begins the ping loop', async () => {
    expect(conn.send).toHaveBeenCalledTimes(1);
    const joinPayload = JSON.parse(conn.send.mock.calls.at(0)?.at(0) as string);
    expect(joinPayload).toMatchObject({ type: 'join', gameID: gameId.toString(), lastTurn: 0 });
  });

  it('should emit turn event when receiving turn message', async () => {
    conn.emit('message', emptyTurn(0));
    conn.emit('message', emptyTurn(1));

    expect(turnSpy).toHaveBeenCalledTimes(2);
  });

  it('should only emit turn event once when receiving turns with same turn number', async () => {
    conn.emit('message', emptyTurn(0));
    conn.emit('message', emptyTurn(0));

    expect(turnSpy).toHaveBeenCalledTimes(1);
  });
});

class MockGameConnection extends EventEmitter {
  public connect = mock();
  public send = mock();
  public dispose = mock();
}

const makeServerMock = (exists = true) => ({
  gameExists: mock().mockResolvedValue(exists),
});

function emptyTurn(turnNumber: number) {
  return JSON.stringify({
    type: 'turn',
    turn: {
      turnNumber,
      intents: [],
    },
  } satisfies z.infer<typeof ServerMessageSchema>);
}
