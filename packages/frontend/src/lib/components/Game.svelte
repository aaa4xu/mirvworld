<script lang="ts">
  import type { MatchBlockInfo } from '$lib/MatchBlockInfo';

  const { match }: { match: MatchBlockInfo } = $props();

  const elapsed = $derived(Math.floor((match.finishedAt.getTime() - match.startedAt.getTime()) / 1000));
  const h = $derived(Math.floor(elapsed / 3600));
  const m = $derived(Math.floor((elapsed % 3600) / 60));
  const s = $derived(elapsed % 60);
</script>

<section style="background-image: url('/openfront/maps/{match.map.split(' ').join('')}Thumb.webp')">
  <div class="map-fade"></div>

  <header>
    <div class="icon">
      <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bi bi-play" viewBox="0 0 16 16">
        <path
          d="M10.804 8 5 4.633v6.734zm.792-.696a.802.802 0 0 1 0 1.392l-6.363 3.692C4.713 12.69 4 12.345 4 11.692V4.308c0-.653.713-.998 1.233-.696z"
        />
      </svg>
    </div>
    <div class="match-desc">
      <h3><a href="matches/{match.id}.html">{match.winner}</a></h3>
      <div>{match.id}</div>
    </div>
    <div class="status"><a href="https://openfront.io/#join={match.id}" target="_blank">Replay</a></div>
  </header>

  <div class="info-container">
    <div class="info">
      <div>Mode</div>
      <div class="info-value">{match.mode}</div>
    </div>

    <div class="info">
      <div>Map</div>
      <div class="info-value">{match.map}</div>
    </div>

    <div class="info">
      <div>Duration</div>
      <div class="info-value">
        {#if h > 0}{h.toString().padStart(2, '0')}:{/if}{m.toString().padStart(2, '0')}:{s.toString().padStart(2, '0')}
      </div>
    </div>

    <div class="info">
      <div>Players</div>
      <div class="info-value">
        {match.players}{#if match.maxPlayers}/{match.maxPlayers}{/if}
      </div>
    </div>
  </div>
</section>

<style>
  section {
    --game--header-height: 3rem;
    --game--border-color: #333;
    --game--outer-border-radius: 0.85rem;

    display: flex;
    flex-direction: column;
    background-color: #1a1a1a;
    border: 1px solid var(--game--border-color);
    border-radius: 1rem;
    padding: 1rem;
    min-width: 320px;

    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    position: relative;
    overflow: hidden;
  }

  header {
    display: flex;
    gap: 1rem;
    padding-bottom: 1rem;
    z-index: 1;
  }

  h3 {
    font-weight: 600;
    color: var(--accent-color2);
    padding: 0;
    margin: 0;
  }

  .icon {
    width: var(--game--header-height);
    height: var(--game--header-height);
    background: rgba(19, 255, 0, 0.3);
    border: 1px solid rgba(19, 255, 0, 0.35);
    color: rgba(19, 255, 0, 0.6);
    border-radius: var(--game--outer-border-radius);
    box-sizing: border-box;

    padding: 5px 4px 5px 6px;
  }

  .status {
    margin-left: auto;
    line-height: var(--game--header-height);
  }

  .info-container {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    gap: 1rem;
    align-items: stretch;
    container-type: inline-size;
    z-index: 1;
  }

  .info {
    padding: 1rem;
    border: 1px solid var(--game--border-color);
    background-color: #222;
    border-radius: var(--game--outer-border-radius);
    flex: 1;
  }

  .info-value {
    color: var(--accent-color2);
    font-weight: 600;
    font-size: 1.15rem;
  }

  .map-fade {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    backdrop-filter: blur(3px);
    background: linear-gradient(to right, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0.9) 50%, rgba(0, 0, 0, 0.7) 100%);
  }
</style>
