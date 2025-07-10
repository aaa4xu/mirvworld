<script>
  import { setLocale } from '$lib/paraglide/runtime.js';
</script>

<div>
  <button onclick={() => setLocale('en')}>English</button>
  <button onclick={() => setLocale('ru')}>Русский</button>
</div>
