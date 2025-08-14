<script lang="ts">
  import type { PageProps } from './$types';
  import { enhance } from '$app/forms';
  import ImportMatchByLobbyIdForm from '$lib/components/ImportMatchByLobbyIdForm.svelte';
  import Game from '$lib/components/Game.svelte';

  let { data, form }: PageProps = $props();
  const matches = $derived(form && form.results ? form.results : data.matches);
</script>

<section>
  <div class="latest">
    <h1>Latest matches</h1>

    {#each matches as match (match.id)}
      <div class="game">
        <Game {match} />
      </div>
    {/each}
  </div>
</section>

<section>
  <form method="POST" action="?/search" use:enhance>
    <label>
      Search by player
      <input name="player" type="text" required />
    </label>
    <button>Search</button>
  </form>
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

  .game {
    padding-bottom: 2rem;
  }
</style>
