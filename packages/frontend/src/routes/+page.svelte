<script lang="ts">
  import type { PageProps } from './$types';
  import { enhance } from '$app/forms';
  import ImportMatchByLobbyIdForm from '$lib/components/ImportMatchByLobbyIdForm.svelte';

  let { data, form }: PageProps = $props();
  const matches = $derived(form && form.results ? form.results : data.matches);
</script>

<section>
  <div class="latest">
    <h1>Latest matches</h1>

    <form method="POST" action="?/search" use:enhance>
      <label>
        Search by player
        <input name="player" type="text" required />
      </label>
      <button>Search</button>
    </form>

    <ul>
      {#each matches as match (match.gameId)}
        <li>
          <a href="/matches/{match.gameId}.html"
            ><span class="gameid">{match.gameId}</span> - {match.mode} @ {match.map}</a
          >
        </li>
      {/each}
    </ul>
  </div>

  <pre>
    {JSON.stringify(form, null, 2)}
  </pre>
</section>

<section>
  <h2>Import private match</h2>
  <ImportMatchByLobbyIdForm action="?/importMatch" error={form?.importError} />
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
