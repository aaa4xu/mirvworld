<script lang="ts">
  import type { PageServerData } from './$types';
  import GoldCoinIcon from '$lib/icons/GoldCoinIcon.svelte';
  import TroopIconWhite from '$lib/icons/TroopIconWhite.svelte';

  let { data }: { data: PageServerData } = $props();

  const duration = $derived(Math.round((data.match.finishedAt.getTime() - data.match.startedAt.getTime()) / 1000));
  const mapping = $derived(
    Object.entries(data.match.stats?.players ?? []).reduce((acc, [clientId, { id }]) => {
      acc.set(clientId, id);
      return acc;
    }, new Map<string, number>()),
  );

  const smallId = (clientId: string) => {
    const stats = data.match.stats;
    if (!stats) return null;

    const player = stats.players[clientId];
    if (!player) return null;

    const id = player.id;
    if (id == null) return null;

    return id;
  };

  type StatTable<V = unknown> = Record<string, V>;
  type Players = Record<string, { id: number | null }>;

  type Stats = { players: Players }; // никаких индекс‑сигнатур!
  type TableKey<S> = {
    [K in keyof S]-?: S[K] extends StatTable<any> ? K : never;
  }[keyof S];
  type Cell<S, K extends TableKey<S>> = S[K] extends StatTable<infer V> ? V : never;

  function getStats<S extends Stats, K extends TableKey<S>>(
    data: { match: { stats: S | undefined } },
    clientId: keyof S['players'] & string,
    name: K,
  ): Cell<S, K> | null {
    const stats = data.match.stats;
    if (!stats) return null;

    const id = smallId(clientId);
    if (id == null) return null;

    /** Явно объявляем, что stats[name] — таблица нужного формата */
    const table = stats[name] as Record<string, Cell<S, K>>;

    return table[id.toString()] ?? null;
  }

  const tiles = $derived(
    (() => {
      const tiles = data.match.stats?.tiles;
      if (!tiles) return {};

      const last = Math.max(...Object.keys(tiles).map((v) => parseInt(v, 10)));
      return tiles[last.toString()];
    })(),
  );

  const maxTiles = $derived(
    (() => {
      const tiles = data.match.stats?.tiles;
      if (!tiles) return {};

      return Object.values(tiles).reduce(
        (acc, v) => {
          const sum = Object.values(v).reduce((acc, v) => acc + v, 0);
          for (const [id, tiles] of Object.entries(v)) {
            acc[id] = Math.max(acc[id] ?? 0, tiles / sum);
          }
          return acc;
        },
        {} as Record<string, number>,
      );
    })(),
  );

  const players = $derived(
    data.match.players
      .map((p) => {
        const sId = smallId(p.clientId);

        return {
          clientId: p.clientId,
          name: p.name,
          goldWorkers: getStats(data, p.clientId, 'goldWorkers') ?? 0n,
          goldTrade: Object.values(getStats(data, p.clientId, 'goldTrade') ?? {}).reduce((acc, v) => acc + v, 0n),
          goldSteal: Object.values(getStats(data, p.clientId, 'goldSteal') ?? {}).reduce((acc, v) => acc + v, 0n),
          goldKills: getStats(data, p.clientId, 'goldKills') ?? 0n,
          attacksTerra: getStats(data, p.clientId, 'terraAttacks') ?? 0n / 10n,
          attacksPlayers:
            Object.values(getStats(data, p.clientId, 'playersAttacks') ?? {}).reduce((acc, v) => acc + v, 0n) / 10n,
          index: sId === null ? -1 : (data.match.stats?.places ?? []).indexOf(sId),
          tiles: sId === null ? 0 : tiles[sId.toString()],
          buildOrder:
            sId === null ? [] : (data.match.stats?.build[sId.toString()] ?? []).map(([_, v]) => v).slice(0, 4),
          maxTiles: sId === null ? 0 : maxTiles[sId.toString()],
        };
      })
      .sort((a, b) => {
        const ai = a.index ?? -1;
        const bi = b.index ?? -1;

        const aIsNeg = ai < 0;
        const bIsNeg = bi < 0;

        // 1️⃣ группируем: сначала элементы с index < 0
        if (aIsNeg && !bIsNeg) return -1; // a идёт раньше
        if (!aIsNeg && bIsNeg) return 1; // b идёт раньше

        // 2️⃣ обе записи из «отрицательной» группы – сортируем по tiles ↓
        if (aIsNeg && bIsNeg) {
          return (b.tiles ?? 0) - (a.tiles ?? 0);
        }

        // 3️⃣ обе записи из «положительной» группы – сортируем по index ↓
        return bi - ai;
      }),
  );
</script>

<main>
  <header>
    <h1>Match results</h1>
    <p>Winner: {data.match.winner}</p>
    <a href="https://openfront.io/#join={data.match.gameId}" target="_blank">View replay</a>

    <div>
      Duration: {Math.round(duration / 60)}m
    </div>

    <div>Map: {data.match.map}</div>

    <div>Mode: {data.match.mode}</div>

    <div>Date: {data.match.startedAt}</div>
  </header>

  <section>
    <h2>Overview</h2>

    <table>
      <thead>
        <tr>
          <th>Player</th>
          <th>Build order</th>
          <th><TroopIconWhite /> Terra</th>
          <th><TroopIconWhite /> Players</th>
          <th><GoldCoinIcon /> Workers</th>
          <th><GoldCoinIcon /> Trade</th>
          <th><GoldCoinIcon /> Captures</th>
          <th><GoldCoinIcon /> Kills</th>
          <th><GoldCoinIcon /> Total</th>
          <th>Max tiles</th>
        </tr>
      </thead>

      <tbody>
        {#each players as player (player.clientId)}
          <tr>
            <td>{player.name}</td>
            <td>{player.buildOrder.map((v) => v[0]).join('')}</td>
            <td>{player.attacksTerra / 1000n} k</td>
            <td>{player.attacksPlayers / 1000n} k</td>
            <td>{player.goldWorkers / 1000n} k</td>
            <td>{player.goldTrade / 1000n} k</td>
            <td>{player.goldSteal / 1000n} k</td>
            <td>{player.goldKills / 1000n} k</td>
            <td>{(player.goldWorkers + player.goldTrade + player.goldSteal + player.goldKills) / 1000n} k</td>
            <td>{player.maxTiles ? (player.maxTiles * 100).toFixed(2) : 0} %</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </section>
</main>

<h4>Players</h4>
<pre>{JSON.stringify(players, (key, value) => (typeof value === 'bigint' ? value.toString() : value), 2)}</pre>

<h4>Data</h4>
<pre>{JSON.stringify(data.match, (key, value) => (typeof value === 'bigint' ? value.toString() : value), 2)}</pre>

<style>
  main {
    padding: 0 1rem;
  }

  table {
    text-align: right;
  }

  td,
  th {
    padding: 0 0.5rem;
  }
</style>
