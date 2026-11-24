<script module lang="ts">
  /**
   * Glyphs drawn on more than one kind of badge, to render inside a Badge: the skull
   * (Necromancy, Necropolis), the cannon (Artillery, war machines), the wall with a gate (the
   * Castle town, a fort) and the sailing ship (the Cove town, a shipyard); and the signs of town
   * buildings.
   */
  export {
    skull,
    cannon,
    wall,
    ship,
    townHall,
    mageGuild,
    tavern,
    anvil,
    scales,
    star,
    horde,
    grail,
    dwelling,
  };
</script>

{#snippet skull()}
  <path
    d="M12 2.5c-5 0-8.5 3.4-8.5 8 0 2.6 1.2 4.6 3 5.7V20.5h11v-4.3c1.8-1.1 3-3.1 3-5.7 0-4.6-3.5-8-8.5-8z"
    fill="currentColor"
  />
  <circle cx="8.6" cy="11" r="2.1" class="cut" />
  <circle cx="15.4" cy="11" r="2.1" class="cut" />
  <path d="M12 13.6l-1.2 2.2h2.4z" class="cut" />
  <path d="M10 18.2v2.3M12 18.2v2.3M14 18.2v2.3" stroke-width="1.1" class="cut-stroke" />
{/snippet}

{#snippet cannon()}
  <path
    d="M2.5 14.5 17 6.2l2.6 4.6L5.1 19.1zM17 6.2l2.3-1.3 2.6 4.6-2.3 1.3z"
    fill="currentColor"
  />
  <circle cx="10" cy="17" r="4.6" fill="currentColor" />
  <circle cx="10" cy="17" r="1.5" class="cut" />
{/snippet}

{#snippet wall()}
  <path
    d="M2.5 21V9h3V5.5h2.6V9h2.6V5.5h2.6V9h2.6V5.5h2.6V9h3v12h-7v-4.5a2.5 2.5 0 0 0-5 0V21z"
    fill="currentColor"
  />
{/snippet}

{#snippet ship()}
  <path d="M11.2 2.5v13" fill="none" stroke="currentColor" stroke-width="1.6" />
  <path
    d="M12.6 3.2 19.5 13.5h-6.9zM9.9 5.8 4.8 13.5h5.1zM2.5 15.5h19l-3.2 5.2H5.7z"
    fill="currentColor"
  />
{/snippet}

<!-- A pillared hall under a pediment -->
{#snippet townHall()}
  <path
    d="M12 2 2 8h20zM4 9.5h2.5V18H4zM8.5 9.5H11V18H8.5zM13 9.5h2.5V18H13zM17.5 9.5H20V18h-2.5zM2 19.5h20V22H2z"
    fill="currentColor"
  />
{/snippet}

<!-- A wand with a spark -->
{#snippet mageGuild()}
  <path
    d="M3.5 20.5 14 10"
    fill="none"
    stroke="currentColor"
    stroke-width="2.8"
    stroke-linecap="round"
  />
  <path d="M17.5 1.5l1.4 4.1 4.1 1.4-4.1 1.4-1.4 4.1-1.4-4.1L12 7l4.1-1.4z" fill="currentColor" />
{/snippet}

<!-- A mug of ale -->
{#snippet tavern()}
  <path
    d="M4 5h11v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM15 8h2.5a3 3 0 0 1 3 3v3a3 3 0 0 1-3 3H15v-2.4h2.3a.9.9 0 0 0 .9-.9v-2.4a.9.9 0 0 0-.9-.9H15z"
    fill="currentColor"
  />
  <path d="M4 2.5h11V5H4z" fill="currentColor" opacity=".55" />
{/snippet}

{#snippet anvil()}
  <path
    d="M2 7h14l6 2.5-6 2.5H13v3.5l3 2V20H6v-2.5l3-2V12H5c-1.7 0-3-1.3-3-3z"
    fill="currentColor"
  />
{/snippet}

<!-- Trade scales: the market and the resource silo -->
{#snippet scales()}
  <path
    d="M11 3h2v16h4v2.5H7V19h4zM3 7h18v1.6H3zM5 9 2 15a3 3 0 0 0 6 0zM19 9l-3 6a3 3 0 0 0 6 0z"
    fill="currentColor"
  />
{/snippet}

<!-- A town's own building -->
{#snippet star()}
  <path
    d="M12 2l2.9 6.9L22 9.5l-5.4 4.8L18.2 22 12 18.2 5.8 22l1.6-7.7L2 9.5l7.1-.6z"
    fill="currentColor"
  />
{/snippet}

<!-- Two houses and a plus: more creatures each week -->
{#snippet horde()}
  <path d="M3 21V11l5-4 5 4v10zM14 21v-7l3.5-3 3.5 3v7z" fill="currentColor" />
  <path d="M17.5 2v6M14.5 5h6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" />
{/snippet}

<!-- A cup on a foot -->
{#snippet grail()}
  <path
    d="M5 2h14c0 5-2.5 8.6-6 9.6V17h3.5v2.5h-9V17H11v-5.4C7.5 10.6 5 7 5 2z"
    fill="currentColor"
  />
  <path d="M5 22h14" stroke="currentColor" stroke-width="2" />
{/snippet}

<!-- A house with the dwelling level on it -->
{#snippet dwelling(level: number)}
  <path d="M12 2 2 10.5h2.5V22h15V10.5H22z" fill="currentColor" />
  <text x="12" y="19.5" text-anchor="middle" class="cut level">{level}</text>
{/snippet}

<style>
  .level {
    font:
      700 10px/1 system-ui,
      sans-serif;
  }
</style>
