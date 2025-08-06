<script lang="ts">
  import type { PageServerData } from './$types';
  import GameResultsHeader from '$lib/components/GameResultsHeader.svelte';
  import GameNotParsedNotification from '$lib/components/GameNotParsedNotification.svelte';
  import GameResultsWithStatsPlayersTable from '$lib/components/GameResultsWithStatsPlayersTable.svelte';

  let { data }: { data: PageServerData } = $props();
  type GameLensPlayerStats = NonNullable<PageServerData['match']['players']>[number];

  const teams = $derived.by(() => {
    return Object.values(data.match.players).reduce((acc, player) => {
      const team = player.team ?? 'noteam';
      if (!acc.has(team)) {
        acc.set(team, [player]);
      } else {
        acc.get(team)!.push(player);
      }

      return acc;
    }, new Map<string, Array<GameLensPlayerStats>>());
  });

  const sortedTeams = $derived.by(() => {
    return Array.from(teams.entries()).sort(
      ([aid, a], [bid, b]) => Math.min(...a.map((p) => p.rank)) - Math.min(...b.map((p) => p.rank)),
    );
  });

  const duration = $derived(data.match.finishedAt.getTime() - data.match.startedAt.getTime());
  const padDate = (time: number) => time.toString().padStart(2, '0');
  const formatDate = (date: Date) =>
    `${padDate(date.getUTCHours())}:${padDate(date.getUTCMinutes())} ${padDate(date.getDate())}.${padDate(date.getUTCMonth() + 1)}.${date.getUTCFullYear()} (UTC)`;

  let winner = $derived.by(() => {
    if (data.match.players.length === 0) return 'unknown';

    if (data.match.mode === 'ffa') {
      return data.match.players.sort((a, b) => b.tiles - a.tiles)[0]?.name ?? 'unknown';
    }

    if (data.match.mode === 'teams') {
      console.log(sortedTeams);
      return sortedTeams?.[0]?.[0] ?? 'unknown';
    }

    return 'unknown';
  });

  $inspect(data.match);
</script>

<svelte:head>
  <title>{data.match.gameId} - Match results - MIRV.World</title>
  <meta property="og:title" content="Winner: {winner}" />
  <meta
    property="og:description"
    content="{data.match.players.length}/{data.match.maxPlayers} {data.match.mode} on {data.match.map} - Match {data
      .match.gameId}, {formatDate(data.match.startedAt)}"
  />
  <meta property="og:image" content="/matches/{data.match.gameId}.jpg" />
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
/>

{#if data.match.players.length === 0}
  <GameNotParsedNotification />
{:else if data.match.mode === 'ffa'}
  <GameResultsWithStatsPlayersTable players={data.match.players} {duration} />
{:else}
  {#each sortedTeams as [teamId, team] (teamId)}
    <GameResultsWithStatsPlayersTable players={team} team={teamId} {duration} />
  {/each}
{/if}

<style>
</style>
