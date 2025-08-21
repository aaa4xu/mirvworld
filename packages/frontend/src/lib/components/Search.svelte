<script lang="ts">
  const { action }: { action: string } = $props();
  let value = $state('');

  function handleInputValue(event: Event) {
    const input = event.target as HTMLInputElement;

    const matches = input.value.trim().match(/https:\/\/openfront\.io\/#join=([A-Za-z0-9]{8})/);
    if (matches) {
      event.preventDefault();
      value = matches[1];
    }
  }
</script>

<form method="POST" {action}>
  <input
    name="search"
    type="text"
    placeholder="Match ID / Match link / Player name"
    minlength="1"
    onkeyup={handleInputValue}
    bind:value
    required
  />
  <button type="submit">Search</button>
</form>

<style>
  form {
    --search-by-playerid--height: 2rem;
    --search-by-playerid--btn-padding: 0.5rem;
    --search-by-playerid--radius: 0.25rem;
    --search-by-playerid--padding: 1rem;

    position: relative;
  }

  input {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    border: 0;
    border-radius: var(--search-by-playerid--radius);
    line-height: var(--search-by-playerid--height);
    padding: var(--search-by-playerid--padding);
    outline: 0;
    box-sizing: border-box;
  }

  button {
    position: absolute;
    top: var(--search-by-playerid--btn-padding);
    right: var(--search-by-playerid--padding);
    height: calc(
      var(--search-by-playerid--height) + 2 * var(--search-by-playerid--padding) - 2 *
        var(--search-by-playerid--btn-padding)
    );
    border: 0;
    border-radius: var(--search-by-playerid--radius);
    background: var(--accent-color1);
  }

  button:hover {
    background: color-mix(in oklab, var(--accent-color1), black 10%);
  }
</style>
