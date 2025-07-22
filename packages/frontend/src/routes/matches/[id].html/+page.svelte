<script lang="ts">
  import type { PageServerData } from './$types';
  import GoldCoinIcon from '$lib/icons/GoldCoinIcon.svelte';
  import TroopIconWhite from '$lib/icons/TroopIconWhite.svelte';
  import GameResultsHeader from '$lib/components/GameResultsHeader.svelte';
  import GameNotParsedNotification from '$lib/components/GameNotParsedNotification.svelte';
  import GameResultsNoStatsPlayersTable from '$lib/components/GameResultsNoStatsPlayersTable.svelte';
  import GameResultsWithStatsPlayersTable from '$lib/components/GameResultsWithStatsPlayersTable.svelte';

  let { data }: { data: PageServerData } = $props();

  const winner = $derived(data.match.players.find((p) => p.clientId === data.match.winner)?.name ?? '(unknown)');
  const duration = $derived(data.match.finishedAt.getTime() - data.match.startedAt.getTime());
</script>

<svelte:head>
  <title>{data.match.gameId} - Match results - MIRV.World</title>
</svelte:head>

<GameResultsHeader
  gameId={data.match.gameId}
  mode={data.match.mode}
  map={data.match.map}
  date={data.match.startedAt}
  {duration}
  {winner}
  players={data.match.players.length}
  maxPlayers={data.match.maxPlayers}
  id={data.match.gameId}
/>

{#if !data.match.stats}
  <GameNotParsedNotification />
  <GameResultsNoStatsPlayersTable players={data.match.players} {duration} />
{:else}
  <GameResultsWithStatsPlayersTable stats={data.match.stats} {duration} />
{/if}

<!--<main>

</main>

<h4>Players</h4>
<pre>{JSON.stringify(players, (key, value) => (typeof value === 'bigint' ? value.toString() : value), 2)}</pre>-->

<!--<h4>Data</h4>-->
<!--<pre>{JSON.stringify(data.match, (key, value) => (typeof value === 'bigint' ? value.toString() : value), 2)}</pre>-->

<style>
</style>
