<script lang="ts">
  import Crown from '$lib/icons/Crown.svelte';

  const {
    winner,
    gameId,
    duration,
    map,
    mode,
    date,
    players,
    maxPlayers,
    id,
  }: {
    winner: string;
    gameId: string;
    duration: number;
    map: string;
    mode: string;
    date: Date;
    players: number;
    maxPlayers: number;
    id: string;
  } = $props();

  const durationH = Math.floor(duration / 3600 / 1000);
  const durationM = Math.floor((duration / 60 / 1000) % 60);
  const durationS = Math.floor((duration / 1000) % 60);

  const dateString = (value: number) => value.toString().padStart(2, '0');
</script>

<section>
  <div class="content">
    <div class="header">
      <h1>Match results</h1>
      <a href="https://openfront.io/#join={gameId}" target="_blank">View replay</a>
    </div>

    <h2 class="winner"><Crown /> {winner}</h2>

    <div class="details">
      <div>
        <h5>Mode</h5>
        <p>{mode === 'ffa' ? 'Free For All' : mode}</p>
      </div>

      <div>
        <h5>Map</h5>
        <p>{map}</p>
      </div>

      <div>
        <h5>Duration</h5>
        <p>
          {#if durationH > 0}{durationH}:{/if}{durationM.toString().padStart(2, '0')}:{durationS
            .toString()
            .padStart(2, '0')}
        </p>
      </div>

      <div>
        <h5>Players</h5>
        <p>{players} / {maxPlayers}</p>
      </div>

      <div>
        <h5>Date</h5>
        <p>
          {dateString(date.getHours())}:{dateString(date.getMinutes())}
          {dateString(date.getDate())}.{dateString(date.getMonth() + 1)}.{date.getFullYear()}
        </p>
      </div>
    </div>
  </div>
</section>

<style>
  section {
    background: rgba(255, 255, 255, 0.05);
  }

  .content {
    max-width: var(--content-max-width);
    margin: 0 auto;
    padding: 0 var(--content-padding);
    box-sizing: border-box;
  }

  h2 {
    text-align: center;
    color: var(--accent-color2);
    margin: 0;
    font-size: 3rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    justify-content: center;
  }

  .header {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .details {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    gap: 1rem;
    padding: 1.5rem 0;
  }

  .details p {
    font-weight: 600;
    color: var(--accent-color2);
    margin: 0.25rem 0;
  }

  h5 {
    font-weight: inherit;
    margin: 0;
  }
</style>
