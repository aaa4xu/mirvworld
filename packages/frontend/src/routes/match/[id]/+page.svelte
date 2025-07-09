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
  import { dev } from '$app/environment';
  import type { IncomingMessage } from '$lib/Workers/ReplayWorker';
  import { WebWorkerMessageListener } from '$lib/WebWorkerMessageListener';
  import type { ReplayWorkerInfoEvent } from '$lib/Workers/ReplayWorkerEvent';

  let { data }: PageProps = $props();
  let places: Record<string, number> = $state({});
  let showMore = $state(false);
  let progress = $state(0);

  const formatNumber = (num: bigint | undefined) => {
    num = num ?? 0n;

    if (num < 1000n) return num;

    return Math.round(Number(num / 1000n)) + 'k';
  };

  async function analyze() {
    showMore = true;
    const worker = new Worker(new URL('$lib/Workers/ReplayWorker', import.meta.url), {
      type: 'module',
    });

    const listener = new WebWorkerMessageListener<ReplayWorkerInfoEvent>(worker);

    try {
      worker.postMessage({
        url: dev ? `/replays/${data.match.id}.json` : `https://replays.mirv.world/${data.match.id}.json`,
      } satisfies IncomingMessage);
      // Listen for messages from the worker and yield them
      for await (const event of listener.listen()) {
        places[event.clientID] = event.index;
        progress = event.progress;
      }
    } catch (error) {
      console.error('Error iterating over messages from worker:', error);
    } finally {
      // Always terminate the worker when done or if an error occurs.
      worker.terminate();
    }
  }

  $inspect(places);
</script>

<h1>Match {data.match.id}</h1>
<a href="https://openfront.io/join/{data.match.id}" target="_blank">View replay</a>
<button onclick={analyze} disabled={showMore}>{showMore ? (progress * 100).toFixed(2) + '%' : 'Analyze'}</button>
<p>Started: {data.match.startedAt}</p>

{#if 'mode' in data.match}
  <p>Map: {data.match.map}</p>
  <p>Mode: {data.match.mode}</p>

  <table>
    <thead>
      <tr>
        {#if showMore}<th>#</th>{/if}
        <th>Player</th>
        <th>(G) workers</th>
        <th>(G) conquering</th>
        <th>(T) Outgoing</th>
        <th>(T) Incoming</th>
      </tr>
    </thead>

    <tbody>
      {#each data.match.players.sort( (a, b) => (showMore ? (places[a.clientID] ?? 999) - (places[b.clientID] ?? 999) : 0), ) as player}
        <tr>
          {#if showMore}<td>{places[player.clientID] ?? '-'}</td>{/if}
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
