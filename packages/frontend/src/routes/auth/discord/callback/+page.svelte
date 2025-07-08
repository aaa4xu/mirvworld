<script lang="ts">
  import type { PageProps } from './$types';
  import { page } from '$app/state';

  let { data }: PageProps = $props();

  const selfxss = `async () => {
        try {
            if(location.host !== 'openfront.io') {
                throw new Error('Switch to openfront.io tab before clicking the bookmarklet');
            }

            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('You are not logged in');
            }

            const response = await fetch("https://api.openfront.io/users/@me", {
                headers: {
                    authorization: 'Bearer '+ token,
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch user info: status=' + response.status);
            }

            const user = await response.json();
            alert(user.player.publicId);
        } catch(err) {
            alert('Failed to fetch user info: ' + err)
        }
    }`;

  const selfxssLink = `javascript:(${selfxss})()`;
</script>

{#if data.error}
  <h1>Ошибка авторизации</h1>
  <div>Ошибка: {data.error}. Please <a href="/auth/discord/">try again</a>.</div>
{:else if data.user}
  <h1>Доступ к игровому профилю</h1>
  <div class="discord-user">
    <img src="https://cdn.discordapp.com/avatars/{data.user.id}/{data.user.avatar}.png" alt="Avatar" />
    {data.user.global_name}
  </div>

  Для получения внутриигровой статистики требуется указать public id своего профиля. К сожалению, удобных способов
  сделать это пока нет. Есть два варианта действий:

  <section>
    <h4>Через закладурку</h4>

    <ol>
      <li>Поместите данную ссылку на панель избранного: <a href={selfxssLink}>регистрация на mirv.world</a>.</li>
      <li>Перейдите на <a href="https://openfront.io">openfront.io</a>.</li>
      <li>Находясь на openfront.io, нажмите на "регистрация на mirv.world" на панели избранного.</li>
    </ol>
  </section>

  <section>
    <h4>Через консоль разработчика</h4>

    <ol>
      <li>Перейдите на <a href="https://openfront.io" target="_blank">openfront.io</a>.</li>
      <li>
        Находясь на openfront.io, откройте консоль разработчика (обычно, нажатием F12) и перейдите на вкладку Console.
      </li>
      <li>Найдите строку "Your player ID is XXXXXXXX" и скопируйте id.</li>
      <li>Вставьте в форму ниже.</li>
    </ol>

    <form>
      <input type="text" placeholder="Player id" />
      <button>Сохранить</button>
    </form>
  </section>
{/if}

<style>
  .discord-user {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .discord-user img {
    border-radius: 50%;
    width: 32px;
    height: 32px;
  }
</style>
