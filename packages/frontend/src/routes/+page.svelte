<script lang="ts">
	import type { PageServerData } from './$types';

	let { data }: { data: PageServerData } = $props();
</script>

<h1>Matches</h1>

<pre>
{JSON.stringify(data, null, 2)}
</pre>
