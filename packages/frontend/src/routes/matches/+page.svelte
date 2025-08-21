<script lang="ts">
  import Game from '$lib/components/Game.svelte';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
  const matches = $derived(data.matches);
</script>

<svelte:head>
  <title>Matches - MIRV.World</title>
</svelte:head>

<section>
  <div class="latest">
    <h1>
      Latest matches{#if data.playerSearch}
        &nbsp;with {data.playerSearch}{/if}
    </h1>

    {#each matches as match (match.id)}
      <div class="game">
        <Game {match} />
      </div>
    {/each}
  </div>
</section>

<style>
  h1 {
    color: var(--accent-color2);
  }

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
