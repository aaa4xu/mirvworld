<script lang="ts">
  const { seconds }: { seconds: number } = $props();

  const durationH = Math.floor(seconds / 3600 / 1000);
  const durationM = Math.floor((seconds / 60 / 1000) % 60);
  const durationS = Math.floor((seconds / 1000) % 60);
  const durationMS = ((seconds / 1000) % 60).toFixed(1);

  const toString = (value: number) => value.toString().padStart(2, '0');
</script>

<span title="{durationH > 0 ? durationH + ':' : ''}{toString(durationM)}:{durationMS}"
  >{#if durationH > 0}{durationH}:{/if}{toString(durationM)}:{toString(durationS)}</span
>
