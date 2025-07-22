<script>
  import '../styles/app.css';
</script>

<header>
  <div class="header-wrapper">
    <nav>
      <a href="/">MIRV World</a>
      <!--      <a href="/matches/">Matches</a>-->
      <!--      <a href="#/players/">Players</a>-->
      <!--      <a href="#/meta/">Meta</a>-->
      <!--      <a href="#/stats/">Stats</a>-->
    </nav>

    <div class="user">
      <a href="#/login/discord/">Login with Discord</a>
    </div>
  </div>
</header>

<main>
  <slot />
</main>

<footer></footer>

<style>
  header {
    --header-gap: 1rem;

    height: var(--header-height);
    backdrop-filter: blur(16px);
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    background: rgba(255, 255, 255, 0.1);
    box-shadow: rgba(0, 0, 0, 0.23) 2px 2px 3px -2px;
  }

  .header-wrapper {
    max-width: var(--content-max-width);
    padding: 0 var(--content-padding);
    margin: 0 auto;
    box-sizing: border-box;
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 100%;
    gap: var(--header-gap);
    text-align: center;
  }

  nav {
    display: flex;
    align-items: center;
    gap: var(--header-gap);
  }

  main {
    padding-top: var(--header-height);
  }
</style>
