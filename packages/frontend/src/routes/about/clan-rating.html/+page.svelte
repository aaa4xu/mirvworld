<script>
</script>

<svelte:head>
  <title>How the Clan Rating System Works - MIRV.World</title>
</svelte:head>

<article>
  <h1>How the Clan Rating System Works</h1>
  <p>
    Our clan rating system is an automated process designed to measure the relative skill of clans in team-based
    matches. It uses a modern rating algorithm called <a href="https://openskill.me/" target="_blank">OpenSkill</a>,
    which is similar to systems like TrueSkill used in games like Halo. The goal is to create a fair and competitive
    leaderboard that rewards skill and consistent participation.
  </p>

  <h2>1. Data Source</h2>
  <p>
    Everything starts with match replays. The system doesn't rely on manual submissions; it's fully automated and near
    real-time.
  </p>
  <ol>
    <li>
      Match replays are pulled from the official game API and saved. Each replay gives us the map, mode (FFA/Teams),
      start/end time, and the list of players.
    </li>
    <li>
      To gather detailed data, the system uses an analysis engine called Gamelens which re-simulates every match
      turn-by-turn from the replay file. This process allows us to capture advanced statistics like peak tiles
      controlled and precise death times, ensuring the final rating is based on a highly accurate picture of the game.
    </li>
    <li>
      Once the detailed stats are available, they are sent to our rating calculator, which begins the process described
      below.
    </li>
  </ol>

  <h2>2. Match Eligibility Rules</h2>
  <p>
    Not every match qualifies for a rating update. The system follows a strict set of rules to ensure the data is
    meaningful:
  </p>

  <ul>
    <li><b>Team Games Only</b>: The rating system only considers matches played in the teams game mode.</li>
    <li>
      <b>Identify Your Clan</b>: For your participation to count, players must have a clan tag in their name, formatted
      as
      <code>[TAG] PlayerName</code>
      . The tag must be 2-4 characters long.
    </li>
    <li>
      <b>Minimum Clan Presence</b>: A clan must have at least two players on a single team for their contribution to be
      counted in that match. A solo clan member on a team will not represent their clan in the rating calculation for
      that match.
    </li>
    <li>
      <b>Clan vs. Clan</b>: For a match to affect ratings, there must be at least two different, eligible clans playing
      against each other. A match where only one clan participates against a team of players without clan tags will be
      ignored.
    </li>
  </ul>

  <h2>3. The Calculation Process</h2>
  <p>If a match is eligible, the OpenSkill algorithm gets to work:</p>
  <ol>
    <li>
      The system looks at each team and identifies the participating clans. The more players a clan has on a team, the
      more they contribute to that team's strength. However, this has diminishing returns. Two players from a clan are
      much stronger than one, but four players are not twice as strong as two. This rewards coordination without making
      large stacks unbeatable.
    </li>
    <li>
      The system fetches the current rating for every clan involved. A clan's rating consists of two main values:
      <ul>
        <li>Mu (μ): Your estimated Skill Level. A higher number means the system thinks you're a better clan.</li>
        <li>
          Sigma (σ): The system's Confidence in your skill level. This is like an uncertainty value. When a clan is new,
          Sigma is high (low confidence). As you play more games, it drops, meaning the system is more certain of your
          true skill.
        </li>
      </ul>
    </li>
    <li>
      The algorithm compares the actual match result (which team ranked 1st, 2nd, etc.) with the expected result based
      on everyone's ratings before the match began.
    </li>
    <li>
      Rating Update:
      <ul>
        <li>
          If a lower-rated clan beats a higher-rated one, they will see a significant increase in their Skill Level
          (Mu), and the loser's rating will drop.
        </li>
        <li>If a high-rated clan wins as expected, their rating will only increase slightly.</li>
        <li>
          After every match, the system's Confidence in each participating clan's rating increases (the Sigma value gets
          smaller).
        </li>
      </ul>
    </li>
  </ol>

  <h2>4. How Ratings are Displayed</h2>
  <p>The final leaderboard you see is more than just a list of raw skill values.</p>
  <ul>
    <li>
      <b>The Score Formula</b>: Your displayed score is calculated using the formula:
      <code>Score = Skill (μ) - 3 * Uncertainty (σ)</code>. This is a "conservative" rating. It means a clan with many
      games played (and thus high confidence) is ranked more reliably than a new "pro" clan whose skill level is still
      uncertain. It ensures the top of the leaderboard is stable and represents consistent performance.
    </li>
    <li>
      <b>Qualification</b>: The leaderboard page only shows clans that have played more than 20 rated matches. This
      ensures that every clan on the board has proven its placement over a reasonable number of games and prevents new
      clans from appearing at the top after a few lucky wins.
    </li>
    <li>
      <b>Presentation</b>: The final score is multiplied by 100 and rounded to give a clean, whole number for easy
      comparison (e.g., a score of <code>28.45123</code> is displayed as <code>2845</code>).
    </li>
  </ul>

  <p>
    In summary, the system is designed to be a hands-off, fair, and accurate representation of clan skill over time,
    rewarding clans that consistently perform well in competitive, team-based matches.
  </p>
</article>

<style>
  article {
    max-width: var(--content-max-width);
    margin: 0 auto;
    padding: 0 var(--content-padding);
    box-sizing: border-box;
    overflow-x: auto;
  }

  h1,
  h2,
  b {
    color: var(--accent-color2);
  }
</style>
