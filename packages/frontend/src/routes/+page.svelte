<script lang="ts">
  import type { PageProps } from './$types';
  import { enhance } from '$app/forms';
  import ImportMatchByLobbyIdForm from '$lib/components/ImportMatchByLobbyIdForm.svelte';
  import Game from '$lib/components/Game.svelte';
  import SearchByPlayerId from '$lib/components/SearchByPlayerId.svelte';

  let { data, form }: PageProps = $props();
</script>

<svelte:head>
  <title>MIRV.World</title>
</svelte:head>

<h1>MIRV.World</h1>

<section id="search">
  <SearchByPlayerId action="?/search" />
</section>

<!--<section>-->
<!--  <h2>Import private match</h2>-->
<!--  <ImportMatchByLobbyIdForm action="?/importMatch" error={form?.importError} />-->
<!--</section>-->

<style>
  h1 {
    text-align: center;
    font-size: 3rem;
    margin-top: 10rem;
    color: var(--accent-color2);
  }

  section {
    max-width: var(--content-max-width);
    margin: 0 auto;
    padding: 0 var(--content-padding);
    box-sizing: border-box;
  }

  #search {
    padding-top: 5rem;
  }
</style>
