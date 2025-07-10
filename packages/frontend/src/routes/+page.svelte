<script lang="ts">
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
</script>

<h2>Latest finished matches</h2>
<ul>
  {#each data.matches as match}
    {#if 'map' in match}
      <li>
        <a href="/match/{match.id}">{match.id}</a> - {match.map} / {match.mode} / {Math.floor(
          match.duration / 1000 / 60,
        )}min
      </li>
    {/if}
  {/each}
</ul>
