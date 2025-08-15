<script lang="ts">
  const version = '20250815';
  const heatmaps = [
    'Africa',
    'Asia',
    'Australia',
    'Baikal',
    'Between Two Seas',
    'Black Sea',
    'Britannia',
    'Deglaciated Antarctica',
    'East Asia',
    'Europe Classic',
    'Europe',
    'Falkland Islands',
    'Faroe Islands',
    'Gateway to the Atlantic',
    'Halkidiki',
    'Iceland',
    'Italia',
    'Mars',
    'Mena',
    'North America',
    'Pangaea',
    'South America',
    'Strait of Gibraltar',
    'World',
  ];
</script>

<svelte:head>
  <title>Maps - MIRV.World</title>
</svelte:head>

<section>
  <h1>Maps</h1>
  <p>
    These heatmaps visualize the average final rank of players based on their chosen spawn locations. To interpret the
    image, observe the color gradients: areas marked in green indicate locations where players, on average, achieved a
    good final standing in the match. Yellow areas represent spawn points that typically led to an average performance,
    while red signifies areas where players generally had a poor final rank. These maps were generated using data from
    over 700,000 players across numerous FFA matches.
  </p>
  {#each heatmaps as map}
    <div>
      <h2>{map}</h2>
      <img src="https://s3.mirv.world/heatmaps/{version}/{map}.avif" alt={map} />
    </div>
  {/each}
</section>

<style>
  section {
    max-width: var(--content-max-width);
    margin: 0 auto;
    padding: 0 var(--content-padding);
    box-sizing: border-box;
  }

  img {
    width: 100%;
  }

  h1 {
    color: var(--accent-color2);
  }
</style>
