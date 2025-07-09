<script lang="ts">
  import type { PageProps } from './$types';
  import { m } from '$lib/paraglide/messages.js';

  let { data }: PageProps = $props();
</script>

{#if data.error}
  <h1>{m.login_failedHeader()}</h1>
  <div>Error: {data.error}. Please <a href="/auth/discord/">try again</a>.</div>
{/if}
