<script lang="ts">
  import DiscordLoginButton from '$lib/components/DiscordLoginButton.svelte';

  const { user }: { user?: { name: string; avatar: string } } = $props();
</script>

<div>
  {#if user}
    <img src={user.avatar} alt={user.name} />
    <a href="/auth/logout/?{Date.now()}">{user.name}</a>
  {:else}
    <DiscordLoginButton />
  {/if}
</div>

<style>
  div {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem 0;
    gap: 0.5rem;
    box-sizing: border-box;
  }

  img {
    border-radius: 50%;
    max-height: 100%;
  }
</style>
