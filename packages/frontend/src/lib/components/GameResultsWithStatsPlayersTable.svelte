<script lang="ts">
  import type { trpc } from '$lib/server/trpc';
  import TroopIconWhite from '$lib/icons/TroopIconWhite.svelte';
  import GoldCoinIcon from '$lib/icons/GoldCoinIcon.svelte';
  import Duration from '$lib/components/Duration.svelte';

  const {
    players,
    duration,
    team,
  }: {
    players: Array<
      NonNullable<NonNullable<Awaited<ReturnType<(typeof trpc)['matches']['getByGameId']['query']>>>>['players'][number]
    >;
    duration: number;
    team?: string;
  } = $props();

  const sortedPlayers = players.sort((l, r) => l.rank - r.rank);
</script>

<section>
  <div class="content">
    {#if team}<h2>{team}</h2>{/if}
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Player</th>
          <th>First build</th>
          <th>Build order</th>
          <th><span><TroopIconWhite /> Out/min</span></th>
          <th><span><TroopIconWhite /> In/min</span></th>
          <th><span><GoldCoinIcon /> Gold/min</span></th>
          <th>Max tiles</th>
          <th>Survived time</th>
        </tr>
      </thead>

      <tbody>
        {#each sortedPlayers as player, index (index)}
          <tr>
            <td>{index + 1}</td>
            <td>{player.name}</td>
            <td>{player.firstBuild > 0 ? Math.round(player.firstBuild / 10) + 's' : '-'}</td>
            <td>{player.buildOrder.length > 0 ? player.buildOrder : '-'}</td>
            <td>{player.outgoingTroopsPerMinute}k</td>
            <td>{player.incomingTroopsPerMinute}k</td>
            <td>{player.goldPerMinute.toFixed(1)}k</td>
            <td>{(player.maxTiles * 100).toFixed(2)}%</td>
            <td
              >{#if player.death >= 0}<Duration seconds={Math.round((player.death / 10) * 1000)} />{:else}<Duration
                  seconds={Math.round(duration)}
                />{/if}</td
            >
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
    margin-top: 1rem;
    text-align: center;
    line-height: 0.85rem;
    min-width: 100%;
    border-collapse: collapse;
    background: #282830;
    border-radius: var(--border-radius);
  }

  thead {
    color: var(--accent-color2);
  }

  td,
  th {
    padding: 0.5rem;
  }

  th {
    line-height: 2rem;
  }

  tbody tr:hover {
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
