<script lang="ts">
  import { setLocale } from '$lib/paraglide/runtime';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { m } from '$lib/paraglide/messages.js';
  import DiscordLoginButton from '$lib/components/DiscordLoginButton.svelte';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
</script>

<h1>{m.hello_world({ name: 'SvelteKit User' })}</h1>
<div>
  <button onclick={() => setLocale('en')}>en</button>
  <button onclick={() => setLocale('ru')}>ru</button>
</div>
<p>
  If you use VSCode, install the <a
    href="https://marketplace.visualstudio.com/items?itemName=inlang.vs-code-extension"
    target="_blank">Sherlock i18n extension</a
  > for a better i18n experience.
</p>

<h2>Auth</h2>
<DiscordLoginButton />

<h2>Latest finished matches</h2>
<ul>
  {#each data.matches as match}
    {#if 'map' in match}
      <li>{match.id} - {match.mode} at {match.map} for {Math.floor(match.duration / 1000 / 60)}min</li>
    {:else}
      <li>{match.id} - (importing)</li>
    {/if}
  {/each}
</ul>
