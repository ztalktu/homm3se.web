<script lang="ts">
  /** Mark for Magic Arrow and Visions: air, fire, earth and water quarters with their signs. */
  import { SCHOOL_GLYPHS } from './schoolGlyphs';

  interface Props {
    label: string;
  }

  let { label }: Props = $props();
</script>

<svg class="badge" viewBox="0 0 24 24" role="img" aria-label={label}>
  <title>{label}</title>
  <path d="M1 12V5a4 4 0 0 1 4-4h7v11z" style:fill="var(--color-school-air)" />
  <path d="M12 1h7a4 4 0 0 1 4 4v7H12z" style:fill="var(--color-school-fire)" />
  <path d="M1 12h11v11H5a4 4 0 0 1-4-4z" style:fill="var(--color-school-earth)" />
  <path d="M12 12h11v7a4 4 0 0 1-4 4h-7z" style:fill="var(--color-school-water)" />
  {#each Object.values(SCHOOL_GLYPHS) as glyph (glyph.d)}
    {#if glyph.stroke}
      <path d={glyph.d} fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round" />
    {:else}
      <path d={glyph.d} fill="#fff" />
    {/if}
  {/each}
  <path d="M12 1v22M1 12h22" stroke="#3a2608" stroke-width=".8" />
  <rect x="1" y="1" width="22" height="22" rx="4" fill="none" stroke="#b8922f" stroke-width="1.4" />
</svg>

<style>
  .badge {
    flex: none;
    width: 20px;
    height: 20px;
  }
</style>
