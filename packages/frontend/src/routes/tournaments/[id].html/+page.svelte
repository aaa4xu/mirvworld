<script lang="ts">
  import type { PageServerData } from './$types';

  let { data }: { data: PageServerData } = $props();
  const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
</script>

<svelte:head>
  <title>{data.tournament.name} - Tournaments - MIRV.World</title>
</svelte:head>

<header>
  <div class="content">
    <h1>{data.tournament.name}</h1>
    <div class="status">
      <span>{dateFormatter.format(data.tournament.startAt)} - {dateFormatter.format(data.tournament.endAt)}</span>
      <span>•</span>
      <span>Mode: {data.tournament.mode}</span>
      <span>•</span>
      <span>Scoring: {data.tournament.rules.id}</span>
      <span>•</span>
      <span>Player: {data.tournament.leaderboard.length}</span>
      <span>•</span>
      <span>Matches: {data.tournament.matches.length}</span>
    </div>
  </div>
</header>

<div class="content">
  <div class="grid">
    <div class="content-left">
      {#if data.tournament.matches.length > 0}
        <table>
          <thead>
            <tr>
              <th class="rank">#</th>
              <th class="player">Player</th>
              <th class="score">Score</th>
              <th class="matches">Matches</th>
              <th class="average">Average</th>
            </tr>
          </thead>

          <tbody>
            {#each data.tournament.leaderboard as leaderboard, index (leaderboard.name)}
              <tr>
                <td class="rank">{index + 1}</td>
                <td class="player">{leaderboard.name}</td>
                <td class="score">{leaderboard.score}</td>
                <td class="matches">{leaderboard.matches}</td>
                <td class="average">{(leaderboard.score / leaderboard.matches).toFixed(1)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      {:else}
        <p>No matches yet.</p>
      {/if}
    </div>

    <div class="content-right">
      <div class="block community">
        <h3>Community</h3>
        <div class="block-content">
          {#each Object.entries(data.tournament.community) as [name, link] (link)}
            <a href={link} target="_blank">{name}</a>
          {/each}
        </div>
      </div>

      {#if data.tournament.matches.length > 0}
        <div class="block matches">
          <h3>Matches</h3>
          <div class="block-content">
            <ul>
              {#each Object.values(data.tournament.matchesData) as match (match.gameId)}
                <li>
                  <a href="/matches/{match.gameId}.html"
                    ><span class="gameid">{match.gameId}</span> - {match.mode} @ {match.map}</a
                  >
                </li>
              {/each}
            </ul>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  header {
    background: radial-gradient(
      1200px 400px at 50% -150px,
      color-mix(in oklab, var(--accent-color1), transparent 86%),
      transparent 65%
    );
    padding: 1rem 0;
  }

  h1 {
    color: var(--accent-color2);
    margin: 0;
    padding-bottom: 0.5rem;
  }

  .status {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem 1rem;
    align-items: center;
    color: var(--primary-text-color);
  }

  .content {
    max-width: var(--content-max-width);
    margin: 0 auto;
    padding: 0 var(--content-padding);
    box-sizing: border-box;
  }

  .community a {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.65rem 0.8rem;
    border-radius: var(--btn-radius);
    border: 1px solid var(--accent-color2);
    color: var(--accent-color2);
    width: 100%;
    box-sizing: border-box;
  }

  .grid {
    display: grid;
    grid-template-columns: 1.6fr 0.8fr;
    gap: 1rem;
    align-items: start;
  }

  .community .block-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .block {
    margin-bottom: 2rem;
  }

  .block h3 {
    color: var(--accent-color2);
    margin: 0 0 1rem 0;
  }

  table {
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

  .player,
  .rank {
    text-align: left;
  }

  .rank {
    width: 2rem;
  }

  .score,
  .matches,
  .average {
    width: 5rem;
  }

  .gameid {
    font-family: monospace;
  }

  .block.matches {
    width: 100%;
  }
</style>
