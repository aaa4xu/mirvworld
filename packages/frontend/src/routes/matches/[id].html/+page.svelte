<script lang="ts">
  import type { PageServerData } from './$types';
  import GameResultsHeader from '$lib/components/GameResultsHeader.svelte';
  import GameNotParsedNotification from '$lib/components/GameNotParsedNotification.svelte';
  import GameResultsWithStatsPlayersTable from '$lib/components/GameResultsWithStatsPlayersTable.svelte';

  let { data }: { data: PageServerData } = $props();
  type GameLensPlayerStats = NonNullable<PageServerData['match']['stats']>['players'][string];

  const teams = $derived.by(() => {
    if (!data.match.stats) return new Map<string, Array<GameLensPlayerStats>>();

    return Object.values(data.match.stats.players).reduce((acc, player) => {
      const team = player.team ?? 'noteam';
      if (!acc.has(team)) {
        acc.set(team, []);
      }
      acc.get(team)!.push(player);
      return acc;
    }, new Map<string, Array<GameLensPlayerStats>>());
  });

  const duration = $derived(data.match.finishedAt.getTime() - data.match.startedAt.getTime());
  const padDate = (time: number) => time.toString().padStart(2, '0');
  const formatDate = (date: Date) =>
    `${padDate(date.getUTCHours())}:${padDate(date.getUTCMinutes())} ${padDate(date.getDate())}.${padDate(date.getUTCMonth() + 1)}.${date.getUTCFullYear()} (UTC)`;

  const noteam = $derived(teams.get('noteam'));
  const sortedTeams = $derived(
    Array.from(teams.entries()).sort(([, a], [, b]) => {
      const at = a.reduce((acc, player) => acc + (Object.values(player.tiles).pop() ?? 0), 0);
      const bt = b.reduce((acc, player) => acc + (Object.values(player.tiles).pop() ?? 0), 0);

      return bt - at;
    }),
  );

  let winner = $derived.by(() => {
    const winners = data.match.winner?.split(',');

    if (winners && winners.length > 1) {
      return winners[0];
    }

    if (winners && winners.length === 1) {
      return data.match.players.find((player) => player.clientId === winners[0])?.name ?? 'unknown';
    }

    return 'unknown';
  });
</script>

<svelte:head>
  <title>{data.match.gameId} - Match results - MIRV.World</title>
  <meta property="og:title" content="Winner: {winner}" />
  <meta
    property="og:description"
    content="{data.match.players.length}/{data.match.maxPlayers} {data.match.mode} on {data.match.map} - Match {data
      .match.gameId}, {formatDate(data.match.startedAt)}"
  />
  <meta property="og:image" content="/openfront/maps/{data.match.map.split(' ').join('')}Thumb.webp" />
  <meta name="twitter:card" content="summary_large_image" />
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
  <!--  <GameResultsNoStatsPlayersTable players={data.match.players} {duration} />-->
{:else if teams.size === 1 && noteam}
  <GameResultsWithStatsPlayersTable players={noteam} {duration} />
{:else}
  {#each sortedTeams as [teamId, team] (teamId)}
    <GameResultsWithStatsPlayersTable players={team} team={teamId} {duration} />
  {/each}
{/if}

<!--<main>

</main>

<h4>Players</h4>
<pre>{JSON.stringify(players, (key, value) => (typeof value === 'bigint' ? value.toString() : value), 2)}</pre>-->

<!--<h4>Data</h4>-->
<!--<pre>{JSON.stringify(data.match, (key, value) => (typeof value === 'bigint' ? value.toString() : value), 2)}</pre>-->

<style>
</style>
