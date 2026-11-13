<script module lang="ts">
  /**
   * Glyphs drawn on more than one kind of badge, to render inside a Badge:
   * the skull (Necromancy, Necropolis) and the cannon (Artillery, war machines).
   */
  export { skull, cannon };
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
