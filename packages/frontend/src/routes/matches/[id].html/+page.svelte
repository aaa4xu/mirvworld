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
  const sortedTeams = $derived.by(() => {
    const deaths = new Map<string, number>();
    const tiles = new Map<string, number>();

    for (const player of data.match.players) {
      const playerTeam = player.team ?? 'noteam';
      // Turn of death
      deaths.set(
        playerTeam,
        Math.max(deaths.get(playerTeam) ?? 0, player.death >= 0 ? player.death : Number.POSITIVE_INFINITY),
      );
      // Tiles at the last turn
      if (!tiles.has(playerTeam)) {
        tiles.set(playerTeam, player.tiles);
      } else {
        tiles.set(playerTeam, tiles.get(playerTeam)! + player.tiles);
      }
    }

    return Array.from(teams.entries()).sort(([teamA], [teamB]) => {
      const sortByDeathTurn = (deaths.get(teamB) ?? 0) - (deaths.get(teamA) ?? 0);
      if (sortByDeathTurn !== 0) {
        return sortByDeathTurn;
      }

      return (tiles.get(teamA) ?? 0) - (tiles.get(teamB) ?? 0);
    });
  });

  let winner = $derived.by(() => {
    if (data.match.mode === 'ffa') {
      return data.match.players.sort((a, b) => b.tiles - a.tiles)[0]?.name ?? 'unknown';
    }

    if (data.match.mode === 'team') {
      const teams = new Map<string, number>();
      for (const player of data.match.players) {
        if (!player.team) continue;
        if (!teams.has(player.team)) {
          teams.set(player.team, player.tiles);
        } else {
          teams.set(player.team, teams.get(player.team)! + player.tiles);
        }
      }
      const winners = Array.from(teams.entries()).sort(([, a], [, b]) => b - a);
      return winners[0][0];
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
/>

{#if data.match.players.length === 0}
  <GameNotParsedNotification />
{:else if teams.size === 1 && noteam}
  <GameResultsWithStatsPlayersTable players={noteam} {duration} />
{:else}
  {#each sortedTeams as [teamId, team] (teamId)}
    <GameResultsWithStatsPlayersTable players={team} team={teamId} {duration} />
  {/each}
{/if}

<style>
</style>
