<script lang="ts">
  import type { PageProps } from './$types';
  import Search from '$lib/components/Search.svelte';

  let { data, form }: PageProps = $props();
</script>

<svelte:head>
  <title>MIRV.World</title>
</svelte:head>

<h1>MIRV.World</h1>

<section id="search">
  <Search action="?/search" />
</section>

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
