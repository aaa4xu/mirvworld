<script lang="ts">
  import type { PageProps } from './$types';
  import { m } from '$lib/paraglide/messages.js';

  let { data }: PageProps = $props();
</script>

{#if data.error}
  <h1>Ошибка авторизации</h1>
  <div>Ошибка: {data.error}. Please <a href="/auth/discord/">try again</a>.</div>
{:else if data.user}
  <pre>
    {data.user}
  </pre>

  <!--<h1>Доступ к игровому профилю</h1>
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
  </section>-->
{/if}
