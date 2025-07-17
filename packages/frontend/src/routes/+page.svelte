<script lang="ts">
	import Game from '$lib/components/Game.svelte';
	import type { PageServerData } from './$types';

	let { data }: { data: PageServerData } = $props();
</script>

<div class="games">
	<h1>Matches</h1>

	<div class="list">
		{#each data.games as game (game.id)}
			<Game {game} />
		{/each}
	</div>
</div>

<style>
	.games {
		display: flex;
		flex-direction: column;
		flex-wrap: wrap;
		gap: 1rem;
		padding: 0 1rem;
	}

	.list {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		gap: 1rem;
		justify-content: center;
	}
</style>
