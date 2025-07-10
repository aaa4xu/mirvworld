<script lang="ts">
  import '../app.css';
  import LocaleSwitcher from '$lib/components/LocaleSwitcher.svelte';
  import type { LayoutProps } from './$types';
  import UserMiniprofile from '$lib/components/UserMiniprofile.svelte';

  let { data }: LayoutProps = $props();
</script>

<header>
  <a href="/">mirv.world</a>
  <nav>
    <ul>
      <li>Matches</li>
      <li>Leaderboard</li>
      <li>Stats</li>
    </ul>
  </nav>

  <div class="controls">
    <LocaleSwitcher />
    {#if data.user}
      <UserMiniprofile user={data.user} />
    {:else}
      <UserMiniprofile />
    {/if}
  </div>
</header>

<main>
  <slot />
</main>

<!--<footer><a href="https://github.com/aaa4xu/mirvworld" target="_blank">GitHub</a></footer>-->

<style>
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0;
    height: 4rem;
    background: #000000;
  }

  main,
  header,
  footer {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }

  ul {
    display: flex;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  li {
    margin-right: 1rem;
  }

  .controls {
    height: 100%;
    display: flex;
    align-items: center;
    gap: 1rem;
  }
</style>
