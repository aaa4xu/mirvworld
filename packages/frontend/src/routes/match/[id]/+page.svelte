<script lang="ts">
  import type { PageProps } from './$types';
  import { m } from '$lib/paraglide/messages.js';

  let { data }: PageProps = $props();
</script>

<h1>Match {data.match.id}</h1>
<a href="https://openfront.io/join/{data.match.id}" target="_blank">View replay</a>
<p>Started: {data.match.startedAt}</p>

{#if 'mode' in data.match}
  <p>Map: {data.match.map}</p>
  <p>Mode: {data.match.mode}</p>
{:else}
  <p>In progress...</p>
{/if}
