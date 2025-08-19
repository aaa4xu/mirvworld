<script lang="ts">
  import type { PageServerData } from './$types';

  let { data }: { data: PageServerData } = $props();
  const clans = $derived(data.clans.filter((c) => c.games > 20));
</script>

<svelte:head>
  <title>Leaderboard - MIRV.World</title>
</svelte:head>

<div class="content">
  <h1>Clans</h1>
  <p>
    This leaderboard ranks clans based on their performance in competitive team-based matches using the OpenSkill rating
    system. The score reflects a conservative estimate of skill, rewarding consistent participation and success over
    time. For a full breakdown of the rules and calculations, <a href="/about/clan-rating.html"
      >read our detailed explanation</a
    >.
  </p>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Clan tag</th>
        <th>Rating</th>
        <th>Games</th>
      </tr>
    </thead>

    <tbody>
      {#each clans as clan, index (clan.tag)}
        <tr>
          <td>{index + 1}</td>
          <td>{clan.tag}</td>
          <td>{Math.round(clan.score * 100)}</td>
          <td>{clan.games}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .content {
    max-width: var(--content-max-width);
    margin: 0 auto;
    padding: 0 var(--content-padding);
    box-sizing: border-box;
    overflow-x: auto;
  }

  h1 {
    color: var(--accent-color2);
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
</style>
