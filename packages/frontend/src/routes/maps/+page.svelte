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

<section>
  <h1>Maps</h1>

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
</style>
