<script lang="ts">
  import type { trpc } from '$lib/server/trpc';
  import TroopIconWhite from '$lib/icons/TroopIconWhite.svelte';
  import GoldCoinIcon from '$lib/icons/GoldCoinIcon.svelte';

  const {
    stats,
    duration,
  }: {
    stats: NonNullable<NonNullable<Awaited<ReturnType<(typeof trpc)['matches']['getByGameId']['query']>>>['stats']>;
    duration: number;
  } = $props();

  const durationOfMatch = BigInt(Math.round(duration / 1000 / 60));
  const total = (v: Record<any, bigint>) => Object.values(v).reduce((acc, v) => acc + v, 0n);
  const formatK = (v: bigint) => (Number(v) / 1000).toFixed(1) + 'k';
  const players = Object.entries(stats.players).sort(([idl, l], [idr, r]) => {
    if (l.killed < 0 && r.killed >= 0) return -1;
    if (l.killed >= 0 && r.killed < 0) return 1;

    if (l.killed < 0 && r.killed < 0) {
      return Object.values(r.tiles).pop()! - Object.values(l.tiles).pop()!;
    } else {
      return r.killed - l.killed;
    }
  });
</script>

<section>
  <div class="content">
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Player</th>
          <th>First build</th>
          <th>Build order</th>
          <th><span><TroopIconWhite /> Sent/min</span></th>
          <th><span><TroopIconWhite /> Received/min</span></th>
          <th><span><GoldCoinIcon /> Gold/min</span></th>
          <th>Max tiles</th>
        </tr>
      </thead>

      <tbody>
        {#each players as [id, player], index (id)}
          {@const alive =
            player.killed < 0
              ? durationOfMatch
              : player.killed === 0
                ? 1n
                : BigInt(Math.round(player.killed / 10 / 60))}
          <tr>
            <td>{index + 1}</td>
            <td>{player.name}</td>
            <td>{player.firstBuild > 0 ? Math.round(player.firstBuild / 10) + 's' : '-'}</td>
            <td>{player.buildHistory.length > 0 ? player.buildHistory.slice(0, 4) : '-'}</td>
            <td>{formatK((player.terraAttacks + total(player.attacksSent)) / 10n / alive)}</td>
            <td>{formatK(total(player.attacksReceived) / 10n / alive)}</td>
            <td
              >{formatK(
                (player.goldFromWorkers +
                  total(player.goldFromTrade) +
                  total(player.goldFromPiracy) +
                  player.goldFromKills) /
                  alive,
              )}</td
            >
            <td>{(Math.max(0, ...Object.values(player.tiles)) * 100).toFixed(2)}%</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</section>

<style>
  .content {
    max-width: var(--content-max-width);
    margin: 0 auto;
    padding: 0 var(--content-padding);
    box-sizing: border-box;
    overflow-x: auto;
  }

  table {
    text-align: right;
    line-height: 0.75rem;
    min-width: 100%;
  }

  td,
  th {
    padding: 0.5rem;
  }

  th {
    line-height: 2rem;
  }

  tr:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  span {
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    align-items: center;
    gap: 0.35rem;
  }
</style>
