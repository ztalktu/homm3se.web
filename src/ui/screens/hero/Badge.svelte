<script lang="ts">
  /**
   * Coloured square with a white glyph, shared by the spell purpose and artifact category badges.
   * The glyph is drawn in a 24×24 box; parts filled with `var(--badge)` cut holes in it.
   * Without a colour it is an empty dashed frame that keeps the place, e.g. for a free slot.
   */
  import type { Snippet } from 'svelte';

  interface Props {
    /** CSS color, usually a theme token; none for the empty frame. */
    color?: string | undefined;
    size: number;
    children?: Snippet | undefined;
  }

  let { color, size, children }: Props = $props();
</script>

<span
  class="badge"
  class:empty={color === undefined}
  style:--badge={color}
  style:width="{size}px"
  style:height="{size}px"
  aria-hidden="true"
>
  {#if color !== undefined && children}
    <svg viewBox="0 0 24 24">{@render children()}</svg>
  {/if}
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

  .empty {
    border: 1px dashed var(--color-frame-soft);
    background: transparent;
  }

  svg {
    width: 70%;
    height: 70%;
  }
</style>
