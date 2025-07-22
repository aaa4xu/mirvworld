<script lang="ts">
  import type { PageServerData } from './$types';

  let { data }: { data: PageServerData } = $props();
</script>

<section>
  <div class="latest">
    <h1>Latest matches</h1>

    <ul>
      {#each data.matches as match (match.id)}
        <li>
          <a href="/matches/{match.gameId}.html"
            ><span class="gameid">{match.gameId}</span> - {match.mode} @ {match.map}</a
          >
        </li>
      {/each}
    </ul>
  </div>
</section>

<style>
  section {
    max-width: var(--content-max-width);
    margin: 0 auto;
    padding: 0 var(--content-padding);
    box-sizing: border-box;
  }

  .gameid {
    font-family: monospace;
  }
</style>
