<script lang="ts">
  import type { PageProps } from './$types';
  import { m } from '$lib/paraglide/messages.js';
  import {
    ATTACK_INDEX_RECV,
    ATTACK_INDEX_SENT,
    GOLD_INDEX_STEAL,
    GOLD_INDEX_TRADE,
    GOLD_INDEX_WAR,
    GOLD_INDEX_WORK,
  } from 'openfront-client/src/core/StatsSchemas';

  let { data }: PageProps = $props();

  const formatNumber = (num: number | undefined) => {
    num = num ?? 0;

    if (num < 1000) return num;

    return Math.round(num / 1000) + 'k';
  };
</script>

<h1>Match {data.match.id}</h1>
<a href="https://openfront.io/join/{data.match.id}" target="_blank">View replay</a>
<p>Started: {data.match.startedAt}</p>

{#if 'mode' in data.match}
  <p>Map: {data.match.map}</p>
  <p>Mode: {data.match.mode}</p>

  <table>
    <thead>
      <tr>
        <th>Player</th>
        <th>(G) workers</th>
        <th>(G) conquering</th>
        <th>(T) Outgoing</th>
        <th>(T) Incoming</th>
      </tr>
    </thead>

    <tbody>
      {#each data.match.players as player}
        <tr>
          <td>{player.username}</td>
          <td>{formatNumber(player.stats?.gold?.[GOLD_INDEX_WORK])}</td>
          <td>{formatNumber(player.stats?.gold?.[GOLD_INDEX_WAR])}</td>
          <td>{formatNumber(player.stats?.attacks?.[ATTACK_INDEX_SENT])}</td>
          <td>{formatNumber(player.stats?.attacks?.[ATTACK_INDEX_RECV])}</td>
        </tr>
      {/each}
    </tbody>
  </table>
{:else}
  <p>In progress...</p>
{/if}
