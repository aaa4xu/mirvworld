<script lang="ts">
  const { action, error }: { action: string; error?: string } = $props();

  function handleChange(e: KeyboardEvent) {
    if (!e.target || !(e.target instanceof HTMLInputElement)) return;

    if (e.target.value.length < 8) {
      return;
    }

    if (e.target.value.length === 8) {
      const id = e.target.value.match(/[A-Za-z0-9]{8}/);
      if (!id) {
        e.target.setCustomValidity('Incorrect lobby id');
      }
    }

    if (e.target.value.length > 8) {
      try {
        const url = new URL(e.target.value);
        const join = url.hash.match(/join=([A-Za-z0-9]{8})/);
        if (join) {
          e.target.value = join[1];
        } else {
          e.target.setCustomValidity('Incorrect lobby url');
        }
      } catch {
        e.target.setCustomValidity('Incorrect lobby url');
      }
    }
  }
</script>

<form method="POST" {action}>
  {#if error}
    <div class="error">
      Failed to import game by id: {error}
    </div>
  {/if}

  <label>
    Lobby:
    <input name="lobby" type="text" onkeyup={handleChange} minlength="8" required />
  </label>

  <button type="submit">Import</button>
</form>
