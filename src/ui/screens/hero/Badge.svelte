<script lang="ts">
  /**
   * Coloured square with a white glyph, shared by the spell purpose and artifact category badges.
   * The glyph is drawn in a 24×24 box; parts filled with `var(--badge)` cut holes in it.
   */
  import type { Snippet } from 'svelte';

  interface Props {
    /** CSS color, usually a theme token. */
    color: string;
    size: number;
    children: Snippet;
  }

  let { color, size, children }: Props = $props();
</script>

<span
  class="badge"
  style:--badge={color}
  style:width="{size}px"
  style:height="{size}px"
  aria-hidden="true"
>
  <svg viewBox="0 0 24 24">{@render children()}</svg>
</span>

<style>
  .badge {
    flex: none;
    display: grid;
    place-items: center;
    border: 1px solid var(--color-scene-shade);
    border-radius: var(--radius-small);
    background: var(--badge);
    color: var(--color-spell-on-color);
  }

  svg {
    width: 70%;
    height: 70%;
  }
</style>
