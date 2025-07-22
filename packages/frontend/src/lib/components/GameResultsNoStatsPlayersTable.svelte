<script lang="ts">
  import TroopIconWhite from '$lib/icons/TroopIconWhite.svelte';
  import GoldCoinIcon from '$lib/icons/GoldCoinIcon.svelte';
  import type { trpc } from '$lib/server/trpc';
  import GameNotParsedNotification from '$lib/components/GameNotParsedNotification.svelte';

  const {
    players,
    duration,
  }: {
    players: NonNullable<Awaited<ReturnType<(typeof trpc)['matches']['getByGameId']['query']>>>['players'];
    duration: number;
  } = $props();
</script>

<section>
  <div class="content">
    <h2>Overview</h2>

    <table>
      <thead>
        <tr>
          <th>Player</th>
          <!--        <th>Build order</th>-->
          <!--        <th><TroopIconWhite /> Terra</th>-->
          <!--        <th><TroopIconWhite /> Players</th>-->
          <!--        <th><GoldCoinIcon /> Workers</th>-->
          <!--        <th><GoldCoinIcon /> Trade</th>-->
          <!--        <th><GoldCoinIcon /> Captures</th>-->
          <!--        <th><GoldCoinIcon /> Kills</th>-->
          <!--        <th><GoldCoinIcon /> Total</th>-->
          <!--        <th>Max tiles</th>-->
        </tr>
      </thead>

      <tbody>
        {#each players as player (player.clientId)}
          <tr>
            <td>{player.name}</td>
            <!--          <td>{player.buildOrder.map((v) => v[0]).join('')}</td>-->
            <!--          <td>{player.attacksTerra / 1000n} k</td>-->
            <!--          <td>{player.attacksPlayers / 1000n} k</td>-->
            <!--          <td>{player.goldWorkers / 1000n} k</td>-->
            <!--          <td>{player.goldTrade / 1000n} k</td>-->
            <!--          <td>{player.goldSteal / 1000n} k</td>-->
            <!--          <td>{player.goldKills / 1000n} k</td>-->
            <!--          <td>{(player.goldWorkers + player.goldTrade + player.goldSteal + player.goldKills) / 1000n} k</td>-->
            <!--          <td>{player.maxTiles ? (player.maxTiles * 100).toFixed(2) : 0} %</td>-->
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
  }

  table {
    text-align: right;
    line-height: 0.75rem;
  }

  td,
  th {
    padding: 0.5rem;
  }
</style>
